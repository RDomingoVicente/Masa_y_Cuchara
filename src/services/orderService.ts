/**
 * Order Service - Gestión de Pedidos
 * 
 * Este servicio maneja la creación y gestión del ciclo de vida de los pedidos.
 * 
 * REGLAS CRÍTICAS:
 * - SIEMPRE reservar stock ANTES de crear el pedido
 * - Si falla la reserva, NO crear el pedido
 * - Si falla la creación, liberar el stock reservado
 * - Usar tipos estrictos de src/types/index.ts
 */

import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type {
  Order,
  OrderStatus,
  OrderItem,
  OrderLogistics
} from '@/types/index';
import { reserveStock, releaseStock, StockError } from './stockService';

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Datos para crear un pedido (sin order_id que se genera automáticamente)
 */
export type CreateOrderData = Omit<Order, 'order_id'>;

/**
 * Resultado de la creación de pedido
 */
export interface CreateOrderResult {
  success: boolean;
  order_id: string;
  message: string;
}

/**
 * Error personalizado para operaciones de pedidos
 */
export class OrderError extends Error {
  constructor(
    message: string,
    public code: 'STOCK_RESERVATION_FAILED' | 'ORDER_CREATION_FAILED' | 'ORDER_NOT_FOUND' | 'INVALID_STATUS_TRANSITION',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OrderError';
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL: CREATE ORDER
// ============================================================================

/**
 * Crea un nuevo pedido en Firestore.
 * 
 * FLUJO CRÍTICO (Sección 11.2 de ARQUITECTURA_DETALLADA.md):
 * 1. Reservar stock usando stockService.reserveStock()
 * 2. Si la reserva es exitosa, crear documento en ORDERS
 * 3. Si falla la creación, liberar el stock reservado
 * 
 * El pedido se crea con estado PENDING_PAYMENT y debe ser actualizado
 * a PAID cuando se confirme el pago en Stripe.
 * 
 * @param orderData - Datos del pedido (sin order_id)
 * @returns Resultado con el ID del pedido creado
 * 
 * @throws {OrderError} Si falla la reserva de stock o la creación del pedido
 * @throws {StockError} Si hay problemas con el inventario
 * 
 * @example
 * const orderData = {
 *   customer: { uid: 'user123', phone: '+34600000000', display_name: 'Juan' },
 *   items: [{ product_id: 'pizza-1', name: 'Pizza Margarita', qty: 1, unit_price: 1250, subtotal: 1250, modifiers: [] }],
 *   logistics: { slot_id: '13:15', order_date: '2026-01-10', type: OrderType.PICKUP },
 *   payment: { status: PaymentStatus.PENDING, stripe_session_id: '', total_amount: 1250, currency: 'EUR' },
 *   workflow: { status: OrderStatus.PENDING_PAYMENT, created_at: new Date(), updated_at: new Date(), ready_at: null, delivered_at: null },
 *   metadata: { source: OrderSource.PWA_IA, wa_notified: false }
 * };
 * 
 * const result = await createOrder(orderData);
 * console.log('Pedido creado:', result.order_id);
 */
export async function createOrder(
  orderData: CreateOrderData
): Promise<CreateOrderResult> {
  // Paso 1: Validar datos básicos
  if (!orderData.items || orderData.items.length === 0) {
    throw new OrderError(
      'El pedido debe contener al menos un item',
      'ORDER_CREATION_FAILED',
      { items: orderData.items }
    );
  }

  if (!orderData.logistics.order_date || !orderData.logistics.slot_id) {
    throw new OrderError(
      'El pedido debe tener fecha y slot definidos',
      'ORDER_CREATION_FAILED',
      { logistics: orderData.logistics }
    );
  }

  // Paso 2: Reservar stock (CRÍTICO - debe hacerse ANTES de crear el pedido)
  try {
    console.log('[OrderService] Reservando stock...', {
      date: orderData.logistics.order_date,
      slot: orderData.logistics.slot_id,
      itemCount: orderData.items.length
    });

    const reservationResult = await reserveStock(
      orderData.logistics.order_date,
      orderData.logistics.slot_id,
      orderData.items
    );

    if (!reservationResult.success) {
      throw new OrderError(
        'No se pudo reservar el stock',
        'STOCK_RESERVATION_FAILED',
        { reservationResult }
      );
    }

    console.log('[OrderService] Stock reservado exitosamente');

  } catch (error) {
    // Si es un StockError, re-lanzarlo con contexto adicional
    if (error instanceof StockError) {
      throw new OrderError(
        `Error al reservar stock: ${error.message}`,
        'STOCK_RESERVATION_FAILED',
        {
          stockErrorCode: error.code,
          stockErrorDetails: error.details
        }
      );
    }
    throw error;
  }

  // Paso 3: Crear el documento del pedido en Firestore
  try {
    console.log('[OrderService] Creando pedido en Firestore...');

    // Preparar el documento del pedido
    const orderDocument = {
      customer: orderData.customer,
      items: orderData.items,
      logistics: orderData.logistics,
      payment: orderData.payment,
      workflow: {
        status: orderData.workflow.status,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        ready_at: null,
        delivered_at: null
      },
      metadata: orderData.metadata
    };

    // Crear el documento en la colección ORDERS
    const ordersCollection = collection(db, 'ORDERS');
    const docRef = await addDoc(ordersCollection, orderDocument);

    console.log('[OrderService] Pedido creado exitosamente:', docRef.id);

    return {
      success: true,
      order_id: docRef.id,
      message: `Pedido ${docRef.id} creado exitosamente`
    };

  } catch (error) {
    // Si falla la creación del pedido, DEBEMOS liberar el stock reservado
    console.error('[OrderService] Error al crear pedido, liberando stock...', error);

    try {
      await releaseStock(
        orderData.logistics.order_date,
        orderData.logistics.slot_id,
        orderData.items
      );
      console.log('[OrderService] Stock liberado exitosamente');
    } catch (releaseError) {
      console.error('[OrderService] ERROR CRÍTICO: No se pudo liberar el stock', releaseError);
      // Este es un caso crítico que debería ser monitoreado
    }

    throw new OrderError(
      'Error al crear el pedido en Firestore',
      'ORDER_CREATION_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene un pedido por su ID
 * 
 * @param orderId - ID del pedido
 * @returns El pedido completo
 * @throws {OrderError} Si el pedido no existe
 */
export async function getOrder(orderId: string): Promise<Order> {
  try {
    const orderRef = doc(db, 'ORDERS', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new OrderError(
        `Pedido ${orderId} no encontrado`,
        'ORDER_NOT_FOUND',
        { orderId }
      );
    }

    const data = orderSnap.data();
    
    // Convertir Timestamps de Firestore a Date
    return {
      order_id: orderSnap.id,
      customer: data.customer,
      items: data.items,
      logistics: data.logistics,
      payment: data.payment,
      workflow: {
        status: data.workflow.status,
        created_at: data.workflow.created_at instanceof Timestamp 
          ? data.workflow.created_at.toDate() 
          : data.workflow.created_at,
        updated_at: data.workflow.updated_at instanceof Timestamp 
          ? data.workflow.updated_at.toDate() 
          : data.workflow.updated_at,
        ready_at: data.workflow.ready_at instanceof Timestamp 
          ? data.workflow.ready_at.toDate() 
          : data.workflow.ready_at,
        delivered_at: data.workflow.delivered_at instanceof Timestamp 
          ? data.workflow.delivered_at.toDate() 
          : data.workflow.delivered_at
      },
      metadata: data.metadata
    } as Order;

  } catch (error) {
    if (error instanceof OrderError) {
      throw error;
    }
    throw new OrderError(
      'Error al obtener el pedido',
      'ORDER_NOT_FOUND',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Actualiza el estado de un pedido
 * 
 * @param orderId - ID del pedido
 * @param newStatus - Nuevo estado del pedido
 * @param additionalData - Datos adicionales a actualizar (opcional)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  additionalData?: Partial<Order>
): Promise<void> {
  try {
    const orderRef = doc(db, 'ORDERS', orderId);
    
    const updateData: Record<string, unknown> = {
      'workflow.status': newStatus,
      'workflow.updated_at': serverTimestamp()
    };

    // Agregar timestamps específicos según el estado
    if (newStatus === 'READY') {
      updateData['workflow.ready_at'] = serverTimestamp();
    } else if (newStatus === 'DELIVERED') {
      updateData['workflow.delivered_at'] = serverTimestamp();
    }

    // Agregar datos adicionales si se proporcionan
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    await updateDoc(orderRef, updateData);

    console.log(`[OrderService] Pedido ${orderId} actualizado a estado ${newStatus}`);

  } catch (error) {
    throw new OrderError(
      'Error al actualizar el estado del pedido',
      'ORDER_CREATION_FAILED',
      { 
        orderId, 
        newStatus,
        originalError: error instanceof Error ? error.message : String(error) 
      }
    );
  }
}
