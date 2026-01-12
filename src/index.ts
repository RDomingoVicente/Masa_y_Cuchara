/**
 * Punto de entrada principal - Masa & Cuchara
 * 
 * Este archivo sirve como punto de entrada para el servidor de desarrollo.
 * Aquí puedes importar y probar tus servicios.
 */

import { createOrder, getOrder } from './services/orderService.js';
import { createCheckoutSession } from './services/paymentService.js';

console.log('🚀 Masa & Cuchara - Servidor de desarrollo iniciado');
console.log('');
console.log('📦 Servicios disponibles:');
console.log('   - orderService: createOrder, getOrder, updateOrderStatus');
console.log('   - paymentService: createCheckoutSession, getCheckoutSession, verifyWebhookSignature');
console.log('   - stockService: checkAvailability, reserveStock, releaseStock');
console.log('');
console.log('💡 Para probar el flujo de pagos, ejecuta:');
console.log('   npm run test:payment');
console.log('');
console.log('🔥 Modo watch activo - Los cambios se recargarán automáticamente');
