/**
 * Sistema de Tipos - Masa & Cuchara
 * Basado en ARQUITECTURA_DETALLADA.md (Secciones 2 y 11)
 * 
 * REGLAS CRÍTICAS:
 * - Precios SIEMPRE en céntimos (enteros)
 * - TypeScript estricto (sin 'any')
 * - Estados de pedido según máquina de estados (Sección 6)
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Estados del pedido según la máquina de estados (Sección 6)
 * Flujo: PENDING_PAYMENT -> PAID -> PREPARING -> READY -> DELIVERED
 * También puede ir a CANCELLED desde PENDING_PAYMENT
 */
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

/**
 * Estado del pago en Stripe
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED'
}

/**
 * Tipo de pedido
 */
export enum OrderType {
  PICKUP = 'PICKUP',
  DINE_IN = 'DINE_IN'
}

/**
 * Fuente del pedido
 */
export enum OrderSource {
  PWA_IA = 'PWA_IA',
  DASHBOARD = 'DASHBOARD'
}

// ============================================================================
// INTERFACES - PRODUCTO (Sección 2 y 11)
// ============================================================================

/**
 * Esquema de modificador (para compatibilidad con código existente)
 */
export interface ModifierSchema {
  type: string;
  label: string;
  options: string[];
  required: boolean;
}

// ============================================================================
// INTERFACES - CATÁLOGO ESTRUCTURADO
// ============================================================================

/**
 * Categoría de productos
 */
export interface Category {
  category_id: string;
  name: string;
  image_url: string;
  display_order?: number;
}

/**
 * Opción dentro de un grupo de modificadores
 */
export interface ModifierOption {
  option_id: string;
  name: string;
  price_extra: number; // En céntimos
}

/**
 * Grupo de modificadores (ej: Tamaño, Extras, Tipo)
 */
export interface ModifierGroup {
  group_id: string;
  name: string;
  options: ModifierOption[];
  required: boolean;
  max_selections?: number; // Para grupos multi-selección
}

// ============================================================================
// INTERFACES - PRODUCTO
// ============================================================================

/**
 * Producto en el catálogo maestro (CATALOG)
 */
export interface Product {
  product_id: string;
  name: string;
  base_price: number; // IMPORTANTE: En céntimos (ej: 1250 = 12.50€)
  category_id: string; // Referencia a CATEGORIES
  allowed_modifier_groups: string[]; // Referencias a MODIFIERS
  is_active: boolean;
  description?: string;
  image_url: string; // URL de la imagen principal
  thumbnail_url?: string; // URL de la miniatura (opcional)
  allergens?: string[];
  // DEPRECATED: modifiers_schema (usar allowed_modifier_groups)
  modifiers_schema?: ModifierSchema[]; // Mantener para compatibilidad
}

/**
 * Snapshot de producto en el inventario diario
 */
export interface DailyProductSnapshot {
  product_id: string;
  name: string;
  base_price: number; // En céntimos
  category_id: string; // Actualizado para usar category_id
  available_stock: number;
  is_available: boolean;
  modifiers_schema: ModifierSchema[]; // Mantener para compatibilidad
}

// ============================================================================
// INTERFACES - PEDIDO (Sección 11.1)
// ============================================================================

/**
 * Modificador aplicado a un item del pedido
 */
export interface ItemModifier {
  type: string;
  value: string;
}

/**
 * Item individual en un pedido
 */
export interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  unit_price: number; // En céntimos
  subtotal: number; // En céntimos
  modifiers: ItemModifier[];
}

/**
 * Datos del cliente
 */
export interface CustomerData {
  uid: string; // Firebase Auth UID
  phone: string; // Formato E.164 (ej: +34600000000)
  display_name: string;
}

/**
 * Información logística del pedido
 */
export interface OrderLogistics {
  slot_id: string; // Formato HH:mm (ej: "13:15")
  order_date: string; // Formato ISO 8601: YYYY-MM-DD
  type: OrderType;
}

/**
 * Información de pago
 */
export interface OrderPayment {
  status: PaymentStatus;
  stripe_session_id: string;
  total_amount: number; // En céntimos
  currency: string; // Ej: "EUR"
}

/**
 * Estado del flujo de trabajo del pedido
 */
export interface OrderWorkflow {
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
  ready_at: Date | null;
  delivered_at: Date | null;
}

/**
 * Metadatos del pedido
 */
export interface OrderMetadata {
  source: OrderSource;
  wa_notified: boolean;
  stripe_event_id?: string; // Para idempotencia del webhook
}

/**
 * Pedido completo (ORDERS collection)
 * Basado en el esquema de la Sección 11.1
 */
export interface Order {
  order_id: string; // UUID o Stripe PaymentIntent ID
  customer: CustomerData;
  items: OrderItem[];
  logistics: OrderLogistics;
  payment: OrderPayment;
  workflow: OrderWorkflow;
  metadata: OrderMetadata;
}

// ============================================================================
// INTERFACES - OPERACIÓN DIARIA (Sección 2)
// ============================================================================

/**
 * Ocupación de un slot temporal
 */
export interface SlotOccupancy {
  [slotId: string]: number; // slotId (HH:mm) -> número de pedidos
}

/**
 * Documento de operación diaria (DAILY_OPERATION)
 * ID del documento: YYYY-MM-DD
 */
export interface DailyOperation {
  date_id: string; // YYYY-MM-DD
  products_snapshot: {
    [productId: string]: DailyProductSnapshot;
  };
  time_slots_occupancy: SlotOccupancy;
  version: number; // Para optimistic locking
  is_closed: boolean;
  cutoff_time?: string; // HH:mm - Hora límite para pedidos del mismo día
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// INTERFACES - CONFIGURACIÓN (Sección 2)
// ============================================================================

/**
 * Horario de servicio
 */
export interface ServiceHours {
  start: string; // HH:mm
  end: string; // HH:mm
}

/**
 * Configuración global del sistema (SETTINGS)
 */
export interface Settings {
  id: string;
  max_orders_per_slot: number;
  slot_interval_minutes: number;
  service_hours: ServiceHours;
  max_booking_days: number; // Horizonte de reserva permitido
  cutoff_time: string; // HH:mm - Hora límite para pedidos del mismo día
}

// ============================================================================
// INTERFACES - LOGS Y AUDITORÍA (Sección 2)
// ============================================================================

/**
 * Nivel de log
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Tipo de evento
 */
export enum EventType {
  STRIPE_WEBHOOK = 'STRIPE_WEBHOOK',
  WA_SENT = 'WA_SENT',
  STOCK_ERROR = 'STOCK_ERROR',
  TIMEOUT_REVERSION = 'TIMEOUT_REVERSION',
  PRICE_CHANGE = 'PRICE_CHANGE',
  SETTLEMENT = 'SETTLEMENT'
}

/**
 * Entrada de log (LOGS collection)
 */
export interface LogEntry {
  log_id: string;
  created_at: Date;
  level: LogLevel;
  event_type: EventType;
  reference_id: string; // OrderId o ProductId
  metadata: Record<string, unknown>; // Detalle técnico del evento
}

// ============================================================================
// INTERFACES - LIQUIDACIÓN DIARIA (Sección 7.3)
// ============================================================================

/**
 * KPIs de venta
 */
export interface SalesKPIs {
  total_gross: number; // En céntimos
  total_net: number; // En céntimos (sin comisiones)
  average_ticket: number; // En céntimos
  total_orders: number;
}

/**
 * Desglose de producto vendido
 */
export interface ProductBreakdown {
  product_id: string;
  name: string;
  quantity_sold: number;
  revenue: number; // En céntimos
}

/**
 * Log de conciliación financiera
 */
export interface ReconciliationLog {
  db_total: number; // En céntimos
  stripe_total: number; // En céntimos
  discrepancy: number; // En céntimos
  notes: string;
}

/**
 * Métricas operativas
 */
export interface OperationalMetrics {
  avg_preparation_time: number; // En minutos
  slot_occupancy_rate: number; // Porcentaje (0-100)
  peak_hour: string; // HH:mm
}

/**
 * Documento de liquidación diaria (SETTLEMENTS)
 * ID del documento: YYYY-MM-DD
 */
export interface DailySettlement {
  date_id: string; // YYYY-MM-DD
  kpis: SalesKPIs;
  product_breakdown: ProductBreakdown[];
  reconciliation_log: ReconciliationLog;
  ops_metrics: OperationalMetrics;
  created_at: Date;
  finalized_by: string; // UID del admin que cerró
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un estado de pedido es válido
 */
export function isValidOrderStatus(status: string): status is OrderStatus {
  return Object.values(OrderStatus).includes(status as OrderStatus);
}

/**
 * Verifica si una transición de estado es válida
 */
export function isValidStatusTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PREPARING],
    [OrderStatus.PREPARING]: [OrderStatus.READY],
    [OrderStatus.READY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: []
  };

  return validTransitions[from]?.includes(to) ?? false;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Convierte euros a céntimos
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convierte céntimos a euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Formatea céntimos como string de euros
 */
export function formatCentsAsEuros(cents: number): string {
  return `${centsToEuros(cents).toFixed(2)}€`;
}
