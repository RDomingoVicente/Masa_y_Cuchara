/**
 * Script para poblar colecciones CATEGORIES y MODIFIERS
 * Ejecutar con: npm run seed:catalog
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================================
// CATEGORÍAS (26 categorías)
// ============================================================================

const categories = [
  { category_id: 'raciones', name: 'Raciones', display_order: 1 },
  { category_id: 'arroces', name: 'Arroces', display_order: 2 },
  { category_id: 'legumbres', name: 'Legumbres', display_order: 3 },
  { category_id: 'patatas', name: 'Patatas', display_order: 4 },
  { category_id: 'pastas-cereales', name: 'Pastas y Cereales', display_order: 5 },
  { category_id: 'setas', name: 'Setas', display_order: 6 },
  { category_id: 'carnes', name: 'Carnes', display_order: 7 },
  { category_id: 'aves', name: 'Aves', display_order: 8 },
  { category_id: 'pescados-mariscos', name: 'Pescados y Mariscos', display_order: 9 },
  { category_id: 'salsas-guarniciones', name: 'Salsas y Guarniciones', display_order: 10 },
  { category_id: 'aderezos', name: 'Aderezos', display_order: 11 },
  { category_id: 'ensaladas', name: 'Ensaladas', display_order: 12 },
  { category_id: 'ensaladillas', name: 'Ensaladillas', display_order: 13 },
  { category_id: 'ceviches', name: 'Ceviches', display_order: 14 },
  { category_id: 'tartares', name: 'Tartares', display_order: 15 },
  { category_id: 'masas-panes', name: 'Masas y Panes', display_order: 16 },
  { category_id: 'sopas-cremas', name: 'Sopas y Cremas', display_order: 17 },
  { category_id: 'sopas-frias', name: 'Sopas frías', display_order: 18 },
  { category_id: 'guisos', name: 'Guisos', display_order: 19 },
  { category_id: 'estofados', name: 'Estofados', display_order: 20 },
  { category_id: 'asados', name: 'Asados', display_order: 21 },
  { category_id: 'bocadillos', name: 'Bocadillos', display_order: 22 },
  { category_id: 'hamburguesas', name: 'Hamburguesas', display_order: 23 },
  { category_id: 'pizzas', name: 'Pizzas', display_order: 24 },
  { category_id: 'platos-combinados', name: 'Platos Combinados', display_order: 25 },
  { category_id: 'postres', name: 'Postres', display_order: 26 },
];

// ============================================================================
// GRUPOS DE MODIFICADORES
// ============================================================================

const modifierGroups = [
  {
    group_id: 'tamano',
    name: 'Tamaño',
    required: true,
    max_selections: 1,
    options: [
      { option_id: 'pequena', name: 'Pequeña', price_extra: 0 },
      { option_id: 'mediana', name: 'Mediana', price_extra: 200 }, // +€2
      { option_id: 'grande', name: 'Grande', price_extra: 400 }, // +€4
    ],
  },
  {
    group_id: 'punto-carne',
    name: 'Punto de Carne',
    required: true,
    max_selections: 1,
    options: [
      { option_id: 'poco-hecho', name: 'Poco hecho', price_extra: 0 },
      { option_id: 'al-punto', name: 'Al punto', price_extra: 0 },
      { option_id: 'bien-hecho', name: 'Bien hecho', price_extra: 0 },
    ],
  },
  {
    group_id: 'extras',
    name: 'Extras',
    required: false,
    max_selections: 5,
    options: [
      { option_id: 'queso-extra', name: 'Queso extra', price_extra: 100 }, // +€1
      { option_id: 'bacon', name: 'Bacon', price_extra: 150 }, // +€1.50
      { option_id: 'huevo', name: 'Huevo', price_extra: 100 }, // +€1
      { option_id: 'aguacate', name: 'Aguacate', price_extra: 200 }, // +€2
      { option_id: 'champinones', name: 'Champiñones', price_extra: 150 }, // +€1.50
    ],
  },
  {
    group_id: 'guarnicion',
    name: 'Guarnición',
    required: false,
    max_selections: 1,
    options: [
      { option_id: 'patatas-fritas', name: 'Patatas fritas', price_extra: 0 },
      { option_id: 'ensalada', name: 'Ensalada', price_extra: 0 },
      { option_id: 'arroz', name: 'Arroz', price_extra: 0 },
      { option_id: 'verduras', name: 'Verduras', price_extra: 0 },
    ],
  },
  {
    group_id: 'tipo-pan',
    name: 'Tipo de Pan',
    required: false,
    max_selections: 1,
    options: [
      { option_id: 'blanco', name: 'Pan blanco', price_extra: 0 },
      { option_id: 'integral', name: 'Pan integral', price_extra: 50 }, // +€0.50
      { option_id: 'sin-gluten', name: 'Pan sin gluten', price_extra: 100 }, // +€1
    ],
  },
  {
    group_id: 'bebida',
    name: 'Bebida',
    required: false,
    max_selections: 1,
    options: [
      { option_id: 'agua', name: 'Agua', price_extra: 150 }, // +€1.50
      { option_id: 'refresco', name: 'Refresco', price_extra: 200 }, // +€2
      { option_id: 'cerveza', name: 'Cerveza', price_extra: 250 }, // +€2.50
      { option_id: 'vino', name: 'Copa de vino', price_extra: 300 }, // +€3
    ],
  },
];

// ============================================================================
// FUNCIONES DE SEED
// ============================================================================

async function seedCategories() {
  console.log('📂 Creando categorías...');
  
  for (const category of categories) {
    const categoryRef = doc(db, 'CATEGORIES', category.category_id);
    await setDoc(categoryRef, {
      name: category.name,
      image_url: `https://via.placeholder.com/400x300?text=${encodeURIComponent(category.name)}`,
      display_order: category.display_order,
    });
    console.log(`  ✅ ${category.name}`);
  }
  
  console.log(`✅ ${categories.length} categorías creadas\n`);
}

async function seedModifierGroups() {
  console.log('🔧 Creando grupos de modificadores...');
  
  for (const group of modifierGroups) {
    const groupRef = doc(db, 'MODIFIERS', group.group_id);
    await setDoc(groupRef, {
      name: group.name,
      required: group.required,
      max_selections: group.max_selections,
      options: group.options,
    });
    console.log(`  ✅ ${group.name} (${group.options.length} opciones)`);
  }
  
  console.log(`✅ ${modifierGroups.length} grupos de modificadores creados\n`);
}

// ============================================================================
// EJECUCIÓN
// ============================================================================

async function main() {
  console.log('🚀 Iniciando seed de catálogo...\n');
  
  try {
    await seedCategories();
    await seedModifierGroups();
    
    console.log('✅ Seed de catálogo completado exitosamente!');
    console.log('\n📝 Próximo paso: Actualizar productos existentes con category_id');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

main();
