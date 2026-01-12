/**
 * Script de prueba para generar un ticket de cocina
 * 
 * Uso: tsx src/scripts/testTicket.ts
 */

import { createKitchenTicket } from '../services/ticketService';
import type { Order } from '../types/index';

async function testTicketGeneration() {
  console.log('🧪 Iniciando prueba de generación de ticket...\n');

  // Crear un pedido de prueba
  const testOrder: Order = {
    order_id: 'test_' + Date.now(),
    customer: {
      uid: 'test-user-id',
      display_name: 'Juan Pérez',
      phone: '+34600123456',
    },
    items: [
      {
        product_id: 'pizza_margarita',
        name: 'Pizza Margarita',
        qty: 2,
        unit_price: 1200,
        subtotal: 2400,
        modifiers: [
          { type: 'Tamaño', value: 'Mediana' },
          { type: 'Extras', value: 'Extra queso' },
        ],
      },
      {
        product_id: 'cerveza',
        name: 'Cerveza',
        qty: 1,
        unit_price: 300,
        subtotal: 300,
        modifiers: [
          { type: 'Tipo', value: 'Lager' },
        ],
      },
    ],
    logistics: {
      order_date: '2026-01-12',
      slot_id: '13:15',
      type: 'PICKUP' as any,
    },
    workflow: {
      status: 'PAID' as any,
      created_at: new Date(),
      updated_at: new Date(),
      ready_at: null,
      delivered_at: null,
    },
    payment: {
      status: 'COMPLETED' as any,
      stripe_session_id: 'test_session_123',
      total_amount: 2970,
      currency: 'EUR',
    },
    metadata: {
      source: 'DASHBOARD' as any,
      wa_notified: false,
    },
  };

  try {
    // Generar el ticket
    const filepath = await createKitchenTicket(testOrder);
    
    console.log('\n✅ Ticket generado exitosamente!');
    console.log(`📁 Ubicación: ${filepath}`);
    console.log('\n📄 Para ver el contenido:');
    console.log(`   cat ${filepath}`);
    
  } catch (error) {
    console.error('\n❌ Error al generar ticket:', error);
    process.exit(1);
  }
}

// Ejecutar prueba
testTicketGeneration();
