/**
 * Script de Inicialización (Seed) - Masa & Cuchara
 * 
 * Este script puebla Firestore con datos iniciales:
 * 1. SETTINGS/global - Configuración del sistema
 * 2. CATALOG - 5 productos de ejemplo
 * 3. DAILY_OPERATION - Apertura del día actual
 * 
 * Ejecución: npm run seed
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection,
  Timestamp 
} from 'firebase/firestore';
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
 * Genera un UUID simple (para product_id)
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================================================
// PASO 1: CREAR SETTINGS/global
// ============================================================================

async function seedSettings() {
  console.log('📝 Paso 1: Creando configuración global (SETTINGS/global)...');
  
  const settingsData = {
    id: 'global',
    max_orders_per_slot: 5,
    slot_interval_minutes: 15,
    service_hours: {
      start: '12:00',
      end: '22:00'
    },
    max_booking_days: 7,
    cutoff_time: '22:00'
  };

  await setDoc(doc(db, 'SETTINGS', 'global'), settingsData);
  console.log('   ✅ Configuración global creada');
}

// ============================================================================
// PASO 2: CREAR PRODUCTOS EN CATALOG
// ============================================================================

async function seedCatalog() {
  console.log('📝 Paso 2: Insertando productos en CATALOG...');
  
  const products = [
    {
      product_id: generateUUID(),
      name: 'Pizza Margarita',
      base_price: 1200, // 12.00€ en céntimos
      category: 'Pizzas',
      modifiers_schema: [
        {
          type: 'size',
          label: 'Tamaño',
          options: ['Pequeña', 'Mediana', 'Grande'],
          required: true
        }
      ],
      is_active: true,
      description: 'Pizza clásica con tomate, mozzarella y albahaca',
      image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
      allergens: ['gluten', 'lactosa']
    },
    {
      product_id: generateUUID(),
      name: 'Pizza Pepperoni',
      base_price: 1450, // 14.50€ en céntimos
      category: 'Pizzas',
      modifiers_schema: [
        {
          type: 'size',
          label: 'Tamaño',
          options: ['Pequeña', 'Mediana', 'Grande'],
          required: true
        }
      ],
      is_active: true,
      description: 'Pizza con salsa de tomate, mozzarella y pepperoni',
      image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
      allergens: ['gluten', 'lactosa']
    },
    {
      product_id: generateUUID(),
      name: 'Pizza Cuatro Quesos',
      base_price: 1600, // 16.00€ en céntimos
      category: 'Pizzas',
      modifiers_schema: [
        {
          type: 'size',
          label: 'Tamaño',
          options: ['Pequeña', 'Mediana', 'Grande'],
          required: true
        }
      ],
      is_active: true,
      description: 'Pizza con mozzarella, gorgonzola, parmesano y queso de cabra',
      image_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400',
      allergens: ['gluten', 'lactosa']
    },
    {
      product_id: generateUUID(),
      name: 'Agua Mineral',
      base_price: 200, // 2.00€ en céntimos
      category: 'Bebidas',
      modifiers_schema: [],
      is_active: true,
      description: 'Agua mineral natural 500ml',
      image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
      allergens: []
    },
    {
      product_id: generateUUID(),
      name: 'Cerveza',
      base_price: 350, // 3.50€ en céntimos
      category: 'Bebidas',
      modifiers_schema: [
        {
          type: 'type',
          label: 'Tipo',
          options: ['Lager', 'IPA', 'Sin Alcohol'],
          required: true
        }
      ],
      is_active: true,
      description: 'Cerveza artesanal 330ml',
      allergens: ['gluten']
    }
  ];

  for (const product of products) {
    await setDoc(doc(db, 'CATALOG', product.product_id), product);
    console.log(`   ✅ Producto creado: ${product.name} (${product.base_price} céntimos)`);
  }

  return products;
}

// ============================================================================
// PASO 3: CREAR DAILY_OPERATION PARA HOY
// ============================================================================

async function seedDailyOperation(products: any[]) {
  console.log('📝 Paso 3: Creando operación diaria (DAILY_OPERATION)...');
  
  const today = getCurrentDate();
  console.log(`   📅 Fecha: ${today}`);

  // Crear products_snapshot con stock inicial
  const productsSnapshot: Record<string, any> = {};
  
  for (const product of products) {
    productsSnapshot[product.product_id] = {
      product_id: product.product_id,
      name: product.name,
      base_price: product.base_price,
      category: product.category,
      available_stock: 50, // Stock inicial de 50 unidades por producto
      is_available: true,
      modifiers_schema: product.modifiers_schema
    };
  }

  const dailyOperationData = {
    date_id: today,
    products_snapshot: productsSnapshot,
    time_slots_occupancy: {}, // Mapa vacío de slots
    version: 1,
    is_closed: false,
    cutoff_time: '22:00',
    created_at: Timestamp.now(),
    updated_at: Timestamp.now()
  };

  await setDoc(doc(db, 'DAILY_OPERATION', today), dailyOperationData);
  console.log(`   ✅ Operación diaria creada para ${today}`);
  console.log(`   📦 ${Object.keys(productsSnapshot).length} productos en snapshot con stock inicial de 50 unidades`);
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log('🚀 Iniciando seed de la base de datos Firestore...\n');
  
  try {
    // Paso 1: Settings
    await seedSettings();
    console.log('');

    // Paso 2: Catalog
    const products = await seedCatalog();
    console.log('');

    // Paso 3: Daily Operation
    await seedDailyOperation(products);
    console.log('');

    console.log('✅ Base de datos poblada exitosamente');
    console.log('\n📊 Resumen:');
    console.log('   - SETTINGS/global: Configuración creada');
    console.log(`   - CATALOG: ${products.length} productos insertados`);
    console.log(`   - DAILY_OPERATION/${getCurrentDate()}: Operación diaria creada`);
    
    // Forzar salida del proceso
    setTimeout(() => process.exit(0), 1000);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    setTimeout(() => process.exit(1), 1000);
  }
}

// Ejecutar
main();
