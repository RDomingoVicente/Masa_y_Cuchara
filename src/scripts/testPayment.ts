/**
 * Script de Prueba de Pagos - Masa & Cuchara
 * 
 * Este script prueba el flujo completo de creación de pedidos y sesiones de pago:
 * 1. Crea un pedido ficticio con productos del catálogo
 * 2. Llama a orderService.createOrder()
 * 3. Llama a paymentService.createCheckoutSession()
 * 4. Imprime la URL de pago de Stripe
 * 
 * Ejecución: npx tsx src/scripts/testPayment.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Cargar variables de entorno desde .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

// ============================================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validar configuración
if (!firebaseConfig.projectId) {
  console.error('❌ Error: Variables de entorno de Firebase no configuradas');
  console.error('Asegúrate de que .env.local existe y contiene las credenciales de Firebase');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================================
// IMPORTAR SERVICIOS
// ============================================================================

// Importar servicios usando rutas relativas
import { createOrder, getOrder } from '../services/orderService.js';
import { createCheckoutSession } from '../services/paymentService.js';

// Importar tipos
import type { CreateOrderData } from '../services/orderService.js';
import { 
  OrderStatus, 
  PaymentStatus, 
  OrderType, 
  OrderSource 
} from '../types/index.js';

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene productos del snapshot de la operación diaria
 */
async function getProductsFromDailyOperation(date: string): Promise<any[]> {
  const { doc, getDoc } = await import('firebase/firestore');
  
  const dailyOpRef = doc(db, 'DAILY_OPERATION', date);
  const dailyOpSnap = await getDoc(dailyOpRef);
  
  if (!dailyOpSnap.exists()) {
    throw new Error(`No existe operación diaria para la fecha ${date}`);
  }
  
  const dailyOp = dailyOpSnap.data();
  const productsSnapshot = dailyOp.products_snapshot;
  
  // Convertir el mapa de productos a un array
  const products = Object.values(productsSnapshot);
  
  return products;
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log('🧪 Iniciando prueba de flujo de pagos...\n');

  try {
    // ========================================================================
    // PASO 0: Obtener productos del snapshot de la operación diaria
    // ========================================================================
    
    console.log('📝 Paso 0: Obteniendo productos de la operación diaria...');
    
    const today = getCurrentDate();
    console.log(`   📅 Fecha: ${today}`);
    
    const products = await getProductsFromDailyOperation(today);
    
    console.log(`   ✅ ${products.length} productos encontrados en el snapshot`);
    
    // Buscar Pizza Margarita y Cerveza (o los primeros 2 productos disponibles)
    let pizzaMargarita = products.find((p: any) => p.name === 'Pizza Margarita');
    let cerveza = products.find((p: any) => p.name === 'Cerveza');
    
    // Si no se encuentran por nombre, usar los primeros productos disponibles
    if (!pizzaMargarita) {
      pizzaMargarita = products.find((p: any) => p.category === 'Pizzas' && p.is_available);
      console.log(`   ⚠️  Pizza Margarita no encontrada, usando: ${pizzaMargarita?.name}`);
    }
    
    if (!cerveza) {
      cerveza = products.find((p: any) => p.category === 'Bebidas' && p.is_available);
      console.log(`   ⚠️  Cerveza no encontrada, usando: ${cerveza?.name}`);
    }
    
    if (!pizzaMargarita || !cerveza) {
      throw new Error('No se encontraron suficientes productos en el snapshot');
    }
    
    console.log(`   ✅ Producto 1: ${pizzaMargarita.name} - ID: ${pizzaMargarita.product_id} - Stock: ${pizzaMargarita.available_stock}`);
    console.log(`   ✅ Producto 2: ${cerveza.name} - ID: ${cerveza.product_id} - Stock: ${cerveza.available_stock}`);
    console.log('');
    
    // ========================================================================
    // PASO 1: Crear datos del pedido ficticio
    // ========================================================================
    
    console.log('📝 Paso 1: Creando datos del pedido ficticio...');
    
    const slotId = '13:15'; // Slot de ejemplo
    
    // Calcular totales usando precios reales del catálogo
    const pizzaSubtotal = pizzaMargarita.base_price * 2; // 2 pizzas
    const cervezaSubtotal = cerveza.base_price * 1;      // 1 cerveza
    const totalAmount = pizzaSubtotal + cervezaSubtotal;
    
    const orderData: CreateOrderData = {
      customer: {
        uid: 'test-user-123',
        phone: '+34600000000',
        display_name: 'Usuario de Prueba'
      },
      items: [
        {
          product_id: pizzaMargarita.product_id,
          name: pizzaMargarita.name,
          qty: 2,
          unit_price: pizzaMargarita.base_price,
          subtotal: pizzaSubtotal,
          modifiers: [
            {
              type: 'size',
              value: 'Mediana'
            }
          ]
        },
        {
          product_id: cerveza.product_id,
          name: cerveza.name,
          qty: 1,
          unit_price: cerveza.base_price,
          subtotal: cervezaSubtotal,
          modifiers: [
            {
              type: 'type',
              value: 'Lager'
            }
          ]
        }
      ],
      logistics: {
        slot_id: slotId,
        order_date: today,
        type: OrderType.PICKUP
      },
      payment: {
        status: PaymentStatus.PENDING,
        stripe_session_id: '',
        total_amount: totalAmount,
        currency: 'EUR'
      },
      workflow: {
        status: OrderStatus.PENDING_PAYMENT,
        created_at: new Date(),
        updated_at: new Date(),
        ready_at: null,
        delivered_at: null
      },
      metadata: {
        source: OrderSource.PWA_IA,
        wa_notified: false
      }
    };

    console.log('   ✅ Datos del pedido creados:');
    console.log(`      - Cliente: ${orderData.customer.display_name}`);
    console.log(`      - Items: ${orderData.items.length}`);
    console.log(`      - Total: ${orderData.payment.total_amount} céntimos (${(orderData.payment.total_amount / 100).toFixed(2)}€)`);
    console.log(`      - Fecha: ${orderData.logistics.order_date}`);
    console.log(`      - Slot: ${orderData.logistics.slot_id}`);
    console.log('');

    // ========================================================================
    // PASO 2: Crear el pedido en Firestore
    // ========================================================================
    
    console.log('📝 Paso 2: Creando pedido en Firestore...');
    
    const createResult = await createOrder(orderData);
    
    if (!createResult.success) {
      throw new Error('Error al crear el pedido');
    }
    
    console.log(`   ✅ Pedido creado exitosamente`);
    console.log(`      - Order ID: ${createResult.order_id}`);
    console.log(`      - Mensaje: ${createResult.message}`);
    console.log('');

    // ========================================================================
    // PASO 3: Obtener el pedido completo
    // ========================================================================
    
    console.log('📝 Paso 3: Obteniendo pedido completo de Firestore...');
    
    const order = await getOrder(createResult.order_id);
    
    console.log(`   ✅ Pedido obtenido`);
    console.log(`      - Estado: ${order.workflow.status}`);
    console.log(`      - Items: ${order.items.length}`);
    console.log('');

    // ========================================================================
    // PASO 4: Crear sesión de pago en Stripe
    // ========================================================================
    
    console.log('📝 Paso 4: Creando sesión de pago en Stripe...');
    
    const session = await createCheckoutSession(order);
    
    if (!session.success) {
      throw new Error('Error al crear la sesión de Stripe');
    }
    
    console.log(`   ✅ Sesión de Stripe creada exitosamente`);
    console.log(`      - Session ID: ${session.session_id}`);
    console.log(`      - Mensaje: ${session.message}`);
    console.log('');

    // ========================================================================
    // PASO 5: Mostrar URL de pago
    // ========================================================================
    
    console.log('🎉 ¡Prueba completada exitosamente!\n');
    console.log('═'.repeat(80));
    console.log('🔗 URL DE PAGO DE STRIPE:');
    console.log('═'.repeat(80));
    console.log('');
    console.log(session.url);
    console.log('');
    console.log('═'.repeat(80));
    console.log('');
    console.log('📋 Instrucciones:');
    console.log('   1. Copia la URL de arriba');
    console.log('   2. Ábrela en tu navegador');
    console.log('   3. Usa la tarjeta de prueba: 4242 4242 4242 4242');
    console.log('   4. Fecha de expiración: Cualquier fecha futura');
    console.log('   5. CVC: Cualquier 3 dígitos');
    console.log('');
    console.log('📊 Resumen del pedido:');
    console.log(`   - Order ID: ${createResult.order_id}`);
    console.log(`   - Total: ${order.payment.total_amount} céntimos (${(order.payment.total_amount / 100).toFixed(2)}€)`);
    console.log(`   - Items:`);
    order.items.forEach(item => {
      console.log(`      • ${item.qty}x ${item.name} - ${item.subtotal} céntimos (${(item.subtotal / 100).toFixed(2)}€)`);
    });
    console.log('');

    // Forzar salida del proceso
    setTimeout(() => process.exit(0), 1000);

  } catch (error) {
    console.error('');
    console.error('❌ Error durante la prueba:', error);
    console.error('');
    
    if (error instanceof Error) {
      console.error('Detalles del error:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    setTimeout(() => process.exit(1), 1000);
  }
}

// Ejecutar
main();
