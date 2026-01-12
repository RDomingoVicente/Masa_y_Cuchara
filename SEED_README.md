# Script de Inicialización (Seed) - Masa & Cuchara

## Descripción

Este script puebla la base de datos Firestore con datos iniciales necesarios para que el sistema sea funcional:

1. **SETTINGS/global** - Configuración del sistema
2. **CATALOG** - 5 productos de ejemplo
3. **DAILY_OPERATION** - Apertura del día actual

## Requisitos Previos

- Node.js instalado (v18 o superior)
- Archivo `.env.local` configurado con las credenciales de Firebase
- Firestore en "Modo Prueba"

## Instalación

Primero, instala las dependencias del proyecto:

```bash
npm install
```

## Ejecución

Para ejecutar el script de inicialización:

```bash
npm run seed
```

## Qué hace el script

### Paso 1: Configuración Global (SETTINGS/global)

Crea el documento de configuración con:

- `max_orders_per_slot`: 5
- `slot_interval_minutes`: 15
- `service_hours`: 12:00 - 22:00
- `max_booking_days`: 7
- `cutoff_time`: "22:00"

### Paso 2: Catálogo de Productos (CATALOG)

Inserta 5 productos de ejemplo:

| Producto            | Precio (céntimos) | Categoría |
| ------------------- | ----------------- | --------- |
| Pizza Margarita     | 1200 (12.00€)     | Pizzas    |
| Pizza Pepperoni     | 1450 (14.50€)     | Pizzas    |
| Pizza Cuatro Quesos | 1600 (16.00€)     | Pizzas    |
| Agua Mineral        | 200 (2.00€)       | Bebidas   |
| Cerveza             | 350 (3.50€)       | Bebidas   |

Cada producto incluye:

- `product_id` (UUID generado)
- `name`
- `base_price` (en céntimos)
- `category`
- `modifiers_schema` (opciones de personalización)
- `is_active: true`
- `description`
- `allergens`

### Paso 3: Operación Diaria (DAILY_OPERATION)

Crea el documento para la fecha actual (formato YYYY-MM-DD) con:

- `products_snapshot`: Snapshot de todos los productos con stock inicial de 50 unidades
- `time_slots_occupancy`: Mapa vacío de slots
- `version`: 1
- `is_closed`: false
- `cutoff_time`: "22:00"
- Timestamps de creación y actualización

## Salida Esperada

Al ejecutar el script exitosamente, verás:

```
🚀 Iniciando seed de la base de datos Firestore...

📝 Paso 1: Creando configuración global (SETTINGS/global)...
   ✅ Configuración global creada

📝 Paso 2: Insertando productos en CATALOG...
   ✅ Producto creado: Pizza Margarita (1200 céntimos)
   ✅ Producto creado: Pizza Pepperoni (1450 céntimos)
   ✅ Producto creado: Pizza Cuatro Quesos (1600 céntimos)
   ✅ Producto creado: Agua Mineral (200 céntimos)
   ✅ Producto creado: Cerveza (350 céntimos)

📝 Paso 3: Creando operación diaria (DAILY_OPERATION)...
   📅 Fecha: 2026-01-10
   ✅ Operación diaria creada para 2026-01-10
   📦 5 productos en snapshot con stock inicial de 50 unidades

✅ Base de datos poblada exitosamente

📊 Resumen:
   - SETTINGS/global: Configuración creada
   - CATALOG: 5 productos insertados
   - DAILY_OPERATION/2026-01-10: Operación diaria creada
```

## Verificación

Después de ejecutar el script, puedes verificar en la consola de Firebase que:

1. La colección `SETTINGS` contiene el documento `global`
2. La colección `CATALOG` contiene 5 documentos de productos
3. La colección `DAILY_OPERATION` contiene un documento con la fecha actual

## Solución de Problemas

### Error: Variables de entorno no configuradas

Si ves el error:

```
❌ Error: Variables de entorno de Firebase no configuradas
```

Asegúrate de que el archivo `.env.local` existe en la raíz del proyecto y contiene:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="tu-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-proyecto-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu-proyecto.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="tu-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="tu-app-id"
```

### Error de permisos en Firestore

Si ves errores de permisos, verifica que Firestore esté en "Modo Prueba" o que las reglas de seguridad permitan escritura.

## Notas Importantes

- **Precios en céntimos**: Todos los precios se almacenan en céntimos (ej: 1200 = 12.00€)
- **Idempotencia**: El script sobrescribe los datos existentes. Si ejecutas el script múltiples veces, los datos se reemplazarán.
- **Fecha actual**: El script siempre crea/actualiza la operación diaria para la fecha actual del sistema.

## Archivos Relacionados

- `src/scripts/seed.ts` - Script principal
- `src/types/index.ts` - Definiciones de tipos TypeScript
- `src/lib/firebase/config.ts` - Configuración de Firebase
- `.env.local` - Variables de entorno (no incluido en el repositorio)
