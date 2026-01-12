/**
 * Stock Service - Gestión de Inventario y Disponibilidad
 * 
 * Este servicio implementa el "corazón" del sistema de disponibilidad.
 * Usa transacciones atómicas de Firestore para prevenir condiciones de carrera
 * y garantizar la integridad del inventario.
 * 
 * REGLAS CRÍTICAS (Sección 11.5 de ARQUITECTURA_DETALLADA.md):
 * - SIEMPRE usar runTransaction() para modificar stock
 * - NUNCA actualizar DAILY_OPERATION sin bloquear la transacción
 * - Validar pre-condiciones dentro de la transacción (Optimistic Locking)
 */

import { db } from '@/lib/firebase/config';
import {
  doc,
  getDoc,
  runTransaction,
  DocumentReference,
  Transaction
} from 'firebase/firestore';
import type {
  DailyOperation,
  OrderItem,
  Settings
} from '@/types/index';

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Resultado de la validación de disponibilidad
 */
export interface AvailabilityResult {
  available: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Resultado de la reserva de stock
 */
export interface ReservationResult {
  success: boolean;
  message: string;
  reservedItems?: OrderItem[];
}

/**
 * Error personalizado para problemas de stock
 */
export class StockError extends Error {
  constructor(
    message: string,
    public code: 'OUT_OF_STOCK' | 'SLOT_FULL' | 'RESTAURANT_CLOSED' | 'INVALID_DATE' | 'TRANSACTION_FAILED',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StockError';
  }
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Valida el formato de fecha YYYY-MM-DD
 */
function isValidDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  // Validar que sea una fecha real
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Valida el formato de slot HH:mm
 */
function isValidSlotFormat(slot: string): boolean {
  const slotRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return slotRegex.test(slot);
}

// ============================================================================
// FUNCIÓN 1: CHECK AVAILABILITY (Validación sin modificar datos)
// ============================================================================

/**
 * Verifica la disponibilidad de productos y slots sin modificar la base de datos.
 * 
 * Esta función es idempotente y puede llamarse múltiples veces sin efectos secundarios.
 * Se usa antes de crear la sesión de pago en Stripe.
 * 
 * @param date - Fecha en formato YYYY-MM-DD
 * @param requestedSlot - Slot horario en formato HH:mm
 * @param items - Array de items a validar
 * @returns Resultado de disponibilidad con errores si los hay
 * 
 * @example
 * const result = await checkAvailability('2026-01-10', '13:15', items);
 * if (!result.available) {
 *   console.error('No disponible:', result.errors);
 * }
 */
export async function checkAvailability(
  date: string,
  requestedSlot: string,
  items: OrderItem[]
): Promise<AvailabilityResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validación 1: Formato de fecha
  if (!isValidDateFormat(date)) {
    errors.push(`Formato de fecha inválido: ${date}. Debe ser YYYY-MM-DD`);
    return { available: false, errors, warnings };
  }

  // Validación 2: Formato de slot
  if (!isValidSlotFormat(requestedSlot)) {
    errors.push(`Formato de slot inválido: ${requestedSlot}. Debe ser HH:mm`);
    return { available: false, errors, warnings };
  }

  // Validación 3: Items no vacíos
  if (!items || items.length === 0) {
    errors.push('El pedido debe contener al menos un item');
    return { available: false, errors, warnings };
  }

  try {
    // Obtener documento de operación diaria
    const dailyOpRef = doc(db, 'DAILY_OPERATION', date);
    const dailyOpSnap = await getDoc(dailyOpRef);

    // Validación 4: Existencia del documento
    if (!dailyOpSnap.exists()) {
      errors.push(`No hay operación configurada para la fecha ${date}`);
      return { available: false, errors, warnings };
    }

    const dailyOp = dailyOpSnap.data() as DailyOperation;

    // Validación 5: Restaurante abierto
    if (dailyOp.is_closed) {
      errors.push('El restaurante está cerrado para esta fecha');
      return { available: false, errors, warnings };
    }

    // Validación 6: Cutoff time (si aplica)
    if (dailyOp.cutoff_time) {
      const now = new Date();
      const todayDate = now.toISOString().split('T')[0];
      
      if (date === todayDate) {
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime > dailyOp.cutoff_time) {
          errors.push(`Ya pasó la hora límite de pedidos (${dailyOp.cutoff_time}) para hoy`);
          return { available: false, errors, warnings };
        }
      }
    }

    // Validación 7: Capacidad del slot
    // Necesitamos obtener la configuración global para saber el límite
    const settingsRef = doc(db, 'SETTINGS', 'global');
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      const settings = settingsSnap.data() as Settings;
      const currentSlotOccupancy = dailyOp.time_slots_occupancy[requestedSlot] || 0;
      
      if (currentSlotOccupancy >= settings.max_orders_per_slot) {
        errors.push(`El slot ${requestedSlot} está completo (${currentSlotOccupancy}/${settings.max_orders_per_slot})`);
        return { available: false, errors, warnings };
      }

      // Warning si está cerca del límite
      if (currentSlotOccupancy >= settings.max_orders_per_slot * 0.8) {
        warnings.push(`El slot ${requestedSlot} está casi lleno (${currentSlotOccupancy}/${settings.max_orders_per_slot})`);
      }
    }

    // Validación 8: Stock individual de cada item
    for (const item of items) {
      const productSnapshot = dailyOp.products_snapshot[item.product_id];
      
      if (!productSnapshot) {
        errors.push(`Producto no encontrado en el menú del día: ${item.name}`);
        continue;
      }

      if (!productSnapshot.is_available) {
        errors.push(`Producto no disponible: ${item.name}`);
        continue;
      }

      if (productSnapshot.available_stock < item.qty) {
        errors.push(
          `Stock insuficiente para ${item.name}. ` +
          `Solicitado: ${item.qty}, Disponible: ${productSnapshot.available_stock}`
        );
      }
    }

    // Resultado final
    return {
      available: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    console.error('Error en checkAvailability:', error);
    errors.push('Error al verificar disponibilidad. Intente nuevamente.');
    return { available: false, errors, warnings };
  }
}

// ============================================================================
// FUNCIÓN 2: RESERVE STOCK (Transacción Atómica CRÍTICA)
// ============================================================================

/**
 * Reserva stock y slot usando una transacción atómica de Firestore.
 * 
 * CRÍTICO: Esta función implementa el protocolo de concurrencia de la Sección 11.5.
 * 
 * Garantías:
 * - Atomicidad: O se reserva todo o no se reserva nada
 * - Consistencia: El stock nunca será negativo
 * - Aislamiento: Previene condiciones de carrera
 * - Durabilidad: Los cambios son permanentes una vez confirmados
 * 
 * @param date - Fecha en formato YYYY-MM-DD
 * @param requestedSlot - Slot horario en formato HH:mm
 * @param items - Array de items a reservar
 * @returns Resultado de la reserva
 * 
 * @throws {StockError} Si la reserva falla por cualquier motivo
 * 
 * @example
 * try {
 *   const result = await reserveStock('2026-01-10', '13:15', items);
 *   console.log('Reserva exitosa:', result.message);
 * } catch (error) {
 *   if (error instanceof StockError) {
 *     console.error(`Error ${error.code}:`, error.message);
 *   }
 * }
 */
export async function reserveStock(
  date: string,
  requestedSlot: string,
  items: OrderItem[]
): Promise<ReservationResult> {
  // Pre-validaciones (fail-fast)
  if (!isValidDateFormat(date)) {
    throw new StockError(
      `Formato de fecha inválido: ${date}`,
      'INVALID_DATE',
      { date }
    );
  }

  if (!isValidSlotFormat(requestedSlot)) {
    throw new StockError(
      `Formato de slot inválido: ${requestedSlot}`,
      'INVALID_DATE',
      { slot: requestedSlot }
    );
  }

  if (!items || items.length === 0) {
    throw new StockError(
      'El pedido debe contener al menos un item',
      'TRANSACTION_FAILED'
    );
  }

  try {
    // TRANSACCIÓN ATÓMICA
    const result = await runTransaction(db, async (transaction: Transaction) => {
      // Paso 1: Leer el documento de operación diaria
      const dailyOpRef: DocumentReference = doc(db, 'DAILY_OPERATION', date);
      const dailyOpSnap = await transaction.get(dailyOpRef);

      if (!dailyOpSnap.exists()) {
        throw new StockError(
          `No existe operación para la fecha ${date}`,
          'INVALID_DATE',
          { date }
        );
      }

      const dailyOp = dailyOpSnap.data() as DailyOperation;

      // Paso 2: Validar que el restaurante esté abierto (dentro de la transacción)
      if (dailyOp.is_closed) {
        throw new StockError(
          'El restaurante está cerrado',
          'RESTAURANT_CLOSED',
          { date }
        );
      }

      // Paso 3: Leer configuración global para límite de slots
      const settingsRef: DocumentReference = doc(db, 'SETTINGS', 'global');
      const settingsSnap = await transaction.get(settingsRef);

      if (!settingsSnap.exists()) {
        throw new StockError(
          'Configuración del sistema no encontrada',
          'TRANSACTION_FAILED'
        );
      }

      const settings = settingsSnap.data() as Settings;

      // Paso 4: Validar capacidad del slot (Optimistic Locking)
      const currentSlotOccupancy = dailyOp.time_slots_occupancy[requestedSlot] || 0;
      
      if (currentSlotOccupancy >= settings.max_orders_per_slot) {
        throw new StockError(
          `Slot ${requestedSlot} completo`,
          'SLOT_FULL',
          {
            slot: requestedSlot,
            current: currentSlotOccupancy,
            max: settings.max_orders_per_slot
          }
        );
      }

      // Paso 5: Validar stock de cada item (Optimistic Locking)
      const updatedProducts = { ...dailyOp.products_snapshot };
      
      for (const item of items) {
        const product = updatedProducts[item.product_id];
        
        if (!product) {
          throw new StockError(
            `Producto no encontrado: ${item.name}`,
            'OUT_OF_STOCK',
            { productId: item.product_id }
          );
        }

        if (!product.is_available) {
          throw new StockError(
            `Producto no disponible: ${item.name}`,
            'OUT_OF_STOCK',
            { productId: item.product_id }
          );
        }

        if (product.available_stock < item.qty) {
          throw new StockError(
            `Stock insuficiente para ${item.name}`,
            'OUT_OF_STOCK',
            {
              productId: item.product_id,
              requested: item.qty,
              available: product.available_stock
            }
          );
        }

        // Restar stock (preparar para escritura)
        updatedProducts[item.product_id] = {
          ...product,
          available_stock: product.available_stock - item.qty
        };
      }

      // Paso 6: Incrementar contador del slot
      const updatedSlots = { ...dailyOp.time_slots_occupancy };
      updatedSlots[requestedSlot] = currentSlotOccupancy + 1;

      // Paso 7: COMMIT - Escribir cambios de forma atómica
      transaction.update(dailyOpRef, {
        products_snapshot: updatedProducts,
        time_slots_occupancy: updatedSlots,
        version: dailyOp.version + 1, // Incrementar versión (Optimistic Locking)
        updated_at: new Date()
      });

      // Retornar datos de la reserva exitosa
      return {
        success: true,
        message: `Stock reservado exitosamente para ${items.length} item(s) en slot ${requestedSlot}`,
        reservedItems: items
      };
    });

    return result;

  } catch (error) {
    // Si es un StockError, re-lanzarlo
    if (error instanceof StockError) {
      throw error;
    }

    // Si es un error de Firestore, envolverlo
    console.error('Error en transacción de reserveStock:', error);
    throw new StockError(
      'Error al reservar stock. La transacción falló.',
      'TRANSACTION_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// ============================================================================
// FUNCIÓN 3: RELEASE STOCK (Reversión de Reserva)
// ============================================================================

/**
 * Libera stock y slot previamente reservados.
 * 
 * Se usa cuando:
 * - Un pedido expira (timeout de 15 minutos)
 * - Un pedido es cancelado manualmente
 * - Falla el pago en Stripe
 * 
 * También usa transacción atómica para garantizar consistencia.
 * 
 * @param date - Fecha en formato YYYY-MM-DD
 * @param slot - Slot horario en formato HH:mm
 * @param items - Array de items a liberar
 * @returns Resultado de la liberación
 */
export async function releaseStock(
  date: string,
  slot: string,
  items: OrderItem[]
): Promise<ReservationResult> {
  try {
    const result = await runTransaction(db, async (transaction: Transaction) => {
      // Leer documento de operación diaria
      const dailyOpRef: DocumentReference = doc(db, 'DAILY_OPERATION', date);
      const dailyOpSnap = await transaction.get(dailyOpRef);

      if (!dailyOpSnap.exists()) {
        throw new StockError(
          `No existe operación para la fecha ${date}`,
          'INVALID_DATE',
          { date }
        );
      }

      const dailyOp = dailyOpSnap.data() as DailyOperation;

      // Restaurar stock de cada item
      const updatedProducts = { ...dailyOp.products_snapshot };
      
      for (const item of items) {
        const product = updatedProducts[item.product_id];
        
        if (product) {
          // Incrementar stock (devolver unidades)
          updatedProducts[item.product_id] = {
            ...product,
            available_stock: product.available_stock + item.qty
          };
        }
      }

      // Decrementar contador del slot
      const updatedSlots = { ...dailyOp.time_slots_occupancy };
      const currentOccupancy = updatedSlots[slot] || 0;
      updatedSlots[slot] = Math.max(0, currentOccupancy - 1);

      // Escribir cambios
      transaction.update(dailyOpRef, {
        products_snapshot: updatedProducts,
        time_slots_occupancy: updatedSlots,
        version: dailyOp.version + 1,
        updated_at: new Date()
      });

      return {
        success: true,
        message: `Stock liberado exitosamente para ${items.length} item(s)`,
        reservedItems: items
      };
    });

    return result;

  } catch (error) {
    if (error instanceof StockError) {
      throw error;
    }

    console.error('Error en releaseStock:', error);
    throw new StockError(
      'Error al liberar stock',
      'TRANSACTION_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
