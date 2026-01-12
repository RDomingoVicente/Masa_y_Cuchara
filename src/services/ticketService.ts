/**
 * Ticket Service - Generación de Tickets de Cocina
 * 
 * Este servicio genera tickets de cocina en formato texto (80mm thermal printer)
 * y los almacena en el sistema de archivos.
 * 
 * CARACTERÍSTICAS:
 * - Formato ASCII para impresoras térmicas de 80mm
 * - Resalta información crítica (SLOT, PRODUCTOS)
 * - Almacenamiento en /orders_archive/tickets/
 */

import type { Order } from '@/types/index';

// ============================================================================
// CONSTANTES
// ============================================================================

const TICKET_WIDTH = 48; // Caracteres para 80mm
const SEPARATOR = '='.repeat(TICKET_WIDTH);
const THIN_SEPARATOR = '-'.repeat(TICKET_WIDTH);

// ============================================================================
// FUNCIONES DE FORMATO
// ============================================================================

/**
 * Centra un texto en el ancho del ticket
 */
function centerText(text: string): string {
  const padding = Math.max(0, Math.floor((TICKET_WIDTH - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Formatea una línea con texto a la izquierda y derecha
 */
function formatLine(left: string, right: string): string {
  const spaces = Math.max(1, TICKET_WIDTH - left.length - right.length);
  return left + ' '.repeat(spaces) + right;
}

/**
 * Formatea fecha y hora
 */
function formatDateTime(date: Date | any): string {
  // Convertir Timestamp de Firestore a Date si es necesario
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (date && typeof date.toDate === 'function') {
    // Es un Timestamp de Firestore
    dateObj = date.toDate();
  } else if (date && typeof date === 'object' && date.seconds) {
    // Es un objeto con seconds (Timestamp serializado)
    dateObj = new Date(date.seconds * 1000);
  } else {
    // Fallback: intentar crear Date
    dateObj = new Date(date);
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// ============================================================================
// GENERACIÓN DE TICKET
// ============================================================================

/**
 * Genera un ticket de cocina en formato texto
 */
export function generateKitchenTicket(order: Order): string {
  const lines: string[] = [];
  
  // Header
  lines.push(SEPARATOR);
  lines.push(centerText('MASA & CUCHARA'));
  lines.push(centerText('TICKET DE COCINA'));
  lines.push(SEPARATOR);
  lines.push('');
  
  // Order Info
  lines.push(formatLine('PEDIDO:', `#${order.order_id.slice(-6).toUpperCase()}`));
  lines.push(formatLine('FECHA:', formatDateTime(order.workflow.created_at)));
  lines.push('');
  
  // Customer Info
  lines.push(THIN_SEPARATOR);
  lines.push('CLIENTE:');
  lines.push(`  ${order.customer.display_name || 'Sin nombre'}`);
  lines.push(`  Tel: ${order.customer.phone}`);
  lines.push(THIN_SEPARATOR);
  lines.push('');
  
  // SLOT DE ENTREGA (DESTACADO)
  lines.push(SEPARATOR);
  lines.push(centerText('*** HORA DE ENTREGA ***'));
  lines.push(centerText(`${order.logistics.slot_id}`));
  lines.push(centerText(`Fecha: ${order.logistics.order_date}`));
  lines.push(SEPARATOR);
  lines.push('');
  
  // PRODUCTOS
  lines.push(centerText('*** PRODUCTOS ***'));
  lines.push('');
  
  order.items.forEach((item, index) => {
    // Cantidad y nombre
    lines.push(`${item.qty}x ${item.name}`);
    
    // Modificadores
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach(mod => {
        lines.push(`   + ${mod.value}`);
      });
    }
    
    if (index < order.items.length - 1) {
      lines.push('');
    }
  });
  
  lines.push('');
  lines.push(THIN_SEPARATOR);
  
  // Total de items
  const totalItems = order.items.reduce((sum, item) => sum + item.qty, 0);
  lines.push(formatLine('TOTAL ITEMS:', totalItems.toString()));
  
  lines.push(SEPARATOR);
  lines.push('');
  
  // Footer
  lines.push(centerText('¡Buen provecho!'));
  lines.push('');
  lines.push(SEPARATOR);
  
  return lines.join('\n');
}

// ============================================================================
// ALMACENAMIENTO (Server-side only)
// ============================================================================

/**
 * Guarda el ticket en el sistema de archivos
 * NOTA: Esta función solo funciona en el servidor (API routes)
 */
export async function saveTicketToFile(orderId: string, ticketContent: string): Promise<string> {
  try {
    // Importación dinámica de módulos de Node.js (solo disponibles en servidor)
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Crear directorio si no existe
    const ticketsDir = path.join(process.cwd(), 'orders_archive', 'tickets');
    await fs.mkdir(ticketsDir, { recursive: true });
    
    // Nombre del archivo
    const filename = `ticket_${orderId}.txt`;
    const filepath = path.join(ticketsDir, filename);
    
    // Guardar archivo
    await fs.writeFile(filepath, ticketContent, 'utf-8');
    
    console.log(`🖨️ Ticket guardado: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('❌ Error al guardar ticket:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

/**
 * Genera y guarda un ticket de cocina
 */
export async function createKitchenTicket(order: Order): Promise<string> {
  console.log(`🖨️ Generando ticket de cocina para pedido ${order.order_id}...`);
  
  // Generar contenido del ticket
  const ticketContent = generateKitchenTicket(order);
  
  // Guardar en archivo
  const filepath = await saveTicketToFile(order.order_id, ticketContent);
  
  console.log(`✅ Ticket de cocina generado para pedido ${order.order_id}`);
  
  return filepath;
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default {
  generateKitchenTicket,
  saveTicketToFile,
  createKitchenTicket,
};
