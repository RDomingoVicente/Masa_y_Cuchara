# 📚 Guía del Dashboard de Administración

## Descripción

El Dashboard de Administración de Masa & Cuchara permite gestionar el catálogo de productos y las operaciones diarias del restaurante.

## 🎯 Funcionalidades

### 1. Gestión de Catálogo (`/admin/products`)

Panel para administrar todos los productos del restaurante.

#### Características:

- ✅ Vista de tabla con miniaturas
- ✅ Crear nuevos productos
- ✅ Editar productos existentes
- ✅ Eliminar productos
- ✅ Activar/desactivar productos
- ✅ Soporte para imágenes
- ✅ Validación de formularios

#### Acceso:

```
http://localhost:3000/admin/products
```

---

### 2. Gestión de Operación Diaria (`/admin/operations`)

Panel para configurar el inventario y slots de entrega para cada día.

#### Características:

- ✅ Selector de fecha
- ✅ Importar catálogo activo
- ✅ Control de stock por producto
- ✅ Visualización de slots de tiempo
- ✅ Actualización en tiempo real

#### Acceso:

```
http://localhost:3000/admin/operations
```

---

## 📦 Gestión de Productos

### Crear un Producto

1. **Accede a** `/admin/products`
2. **Haz clic** en "Nuevo Producto"
3. **Completa el formulario:**
   - **Nombre\*** (ej: Pizza Margarita)
   - **Descripción** (opcional)
   - **Categoría\*** (ej: Pizzas, Pupusas, Bebidas)
   - **Precio (€)\*** (ej: 12.50)
   - **URL de Imagen\*** (URL completa de la imagen)
   - **URL de Miniatura** (opcional, para thumbnails)
   - **Producto activo** (checkbox)
4. **Haz clic** en "Crear"

### Editar un Producto

1. En la tabla de productos, **haz clic** en "Editar"
2. **Modifica** los campos necesarios
3. **Haz clic** en "Actualizar"

### Eliminar un Producto

1. En la tabla de productos, **haz clic** en "Eliminar"
2. **Confirma** la eliminación

> ⚠️ **Advertencia:** Eliminar un producto es permanente

### Activar/Desactivar Productos

- **Activo**: El producto aparece en el catálogo y puede ser importado a operaciones diarias
- **Inactivo**: El producto no está disponible para venta

---

## 📅 Gestión de Operación Diaria

### Configurar un Nuevo Día

1. **Accede a** `/admin/operations`
2. **Selecciona la fecha** usando el selector
3. **Haz clic** en "📦 Importar Catálogo"
4. **Confirma** la importación

Esto creará una operación diaria con:

- Todos los productos activos del catálogo
- Stock inicial de 50 unidades por producto
- Slots de tiempo vacíos

### Ajustar Stock

1. En la sección "Control de Stock"
2. **Modifica** la cantidad disponible de cada producto
3. **Haz clic** en el botón "✓" para guardar

### Visualizar Slots

La sección "Configuración de Slots" muestra:

- **Hora del slot** (ej: 13:00, 13:30)
- **Pedidos actuales** en ese slot
- **Capacidad máxima** (configurada en SETTINGS)

---

## 🎨 Interfaz de Usuario

### Tabla de Productos

| Columna       | Descripción            |
| ------------- | ---------------------- |
| **Imagen**    | Miniatura del producto |
| **Producto**  | Nombre y descripción   |
| **Categoría** | Categoría del producto |
| **Precio**    | Precio en euros        |
| **Estado**    | Activo/Inactivo        |
| **Acciones**  | Editar/Eliminar        |

### Formulario de Producto

**Campos obligatorios (\*):**

- Nombre
- Categoría
- Precio
- URL de Imagen

**Campos opcionales:**

- Descripción
- URL de Miniatura

**Validaciones:**

- Nombre no puede estar vacío
- Categoría no puede estar vacía
- Precio debe ser mayor a 0
- URL de imagen es requerida

---

## 💾 Estructura de Datos

### Producto en CATALOG

```typescript
{
  product_id: string,
  name: string,
  base_price: number,        // En céntimos (1250 = €12.50)
  category: string,
  modifiers_schema: [],
  is_active: boolean,
  description?: string,
  image_url: string,
  thumbnail_url?: string,
  allergens?: string[]
}
```

### Producto en DAILY_OPERATION

```typescript
{
  product_id: string,
  name: string,
  base_price: number,
  category: string,
  available_stock: number,
  is_available: boolean,
  modifiers_schema: []
}
```

---

## 🔄 Flujo de Trabajo Recomendado

### Configuración Inicial

1. **Crear productos** en `/admin/products`
2. **Activar** los productos que se venderán
3. **Configurar imágenes** para cada producto

### Operación Diaria

1. **Cada mañana**, acceder a `/admin/operations`
2. **Seleccionar la fecha** del día
3. **Importar catálogo** para crear la operación
4. **Ajustar stock** según disponibilidad real
5. **Monitorear** durante el día

### Actualización de Catálogo

1. **Agregar nuevos productos** cuando sea necesario
2. **Desactivar productos** temporalmente no disponibles
3. **Actualizar precios** cuando cambien
4. **Actualizar imágenes** para mejorar presentación

---

## 🖼️ Gestión de Imágenes

### URLs de Imagen Recomendadas

**Servicios sugeridos:**

- **Unsplash** (https://unsplash.com) - Imágenes gratuitas de alta calidad
- **Cloudinary** - Hosting de imágenes con CDN
- **Firebase Storage** - Almacenamiento integrado

### Formato Recomendado

- **Imagen principal**: 800x800px o mayor
- **Miniatura**: 200x200px
- **Formato**: JPG o PNG
- **Peso**: < 500KB para carga rápida

### Ejemplo de URLs

```
Imagen principal:
https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800

Miniatura:
https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200
```

---

## 📊 Slots de Tiempo

### Configuración Predeterminada

**Horario:** 12:00 - 21:00
**Intervalos:** Cada 30 minutos

**Slots disponibles:**

- 12:00, 12:30
- 13:00, 13:30
- 14:00, 14:30
- ... hasta 21:00

### Capacidad

La capacidad máxima por slot se configura en:

```
SETTINGS/global
{
  max_orders_per_slot: 5
}
```

---

## ⚠️ Consideraciones Importantes

### Productos

- ❌ **No eliminar** productos con pedidos activos
- ✅ **Desactivar** en lugar de eliminar
- ✅ **Mantener** imágenes actualizadas
- ✅ **Revisar** precios regularmente

### Operaciones Diarias

- ⚠️ **Importar catálogo** solo una vez por día
- ⚠️ **Ajustar stock** antes de abrir
- ⚠️ **Monitorear** stock durante el día
- ⚠️ **No modificar** operaciones de días pasados

### Stock

- Stock se consume automáticamente con cada pedido
- Stock = 0 → Producto no disponible para ese día
- Ajustar stock manualmente si hay cambios

---

## 🐛 Solución de Problemas

### No puedo crear un producto

**Verificar:**

- ✅ Todos los campos obligatorios están completos
- ✅ El precio es mayor a 0
- ✅ La URL de imagen es válida

### La imagen no se muestra

**Verificar:**

- ✅ La URL es accesible públicamente
- ✅ La URL comienza con `https://`
- ✅ El formato es JPG o PNG

### No aparecen productos en operación diaria

**Verificar:**

- ✅ Los productos están marcados como "Activo"
- ✅ Se importó el catálogo correctamente
- ✅ La fecha seleccionada es correcta

### El stock no se actualiza

**Verificar:**

- ✅ Se hizo clic en el botón "✓" después de cambiar el número
- ✅ La conexión a Firebase está activa
- ✅ No hay errores en la consola del navegador

---

## 🎯 Mejores Prácticas

### Gestión de Catálogo

1. **Organizar por categorías** claras
2. **Usar nombres descriptivos**
3. **Incluir descripciones** detalladas
4. **Mantener imágenes** de alta calidad
5. **Revisar precios** mensualmente

### Operación Diaria

1. **Configurar** cada mañana antes de abrir
2. **Ajustar stock** según inventario real
3. **Monitorear** durante el día
4. **No modificar** días pasados

### Imágenes

1. **Usar imágenes** profesionales
2. **Optimizar** tamaño de archivo
3. **Mantener** consistencia visual
4. **Actualizar** cuando cambien productos

---

## 📞 Soporte

Para más información, consulta:

- `ARQUITECTURA_DETALLADA.md` - Arquitectura del sistema
- `docs/walkthrough.md` - Documentación técnica
- `KDS_GUIDE.md` - Guía del sistema de cocina

---

**¡El dashboard está listo para gestionar tu restaurante!** 🎉
