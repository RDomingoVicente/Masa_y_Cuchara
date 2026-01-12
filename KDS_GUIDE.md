# Kitchen Display System (KDS) - Guía de Uso

## 🍽️ Acceso al Sistema

**URL:** `http://localhost:3000/admin/kds`

## 📋 Funcionalidades

### Vista en Tiempo Real

El KDS se actualiza automáticamente cuando:

- ✅ Un nuevo pedido es pagado (aparece inmediatamente)
- ✅ Un pedido cambia de estado
- ✅ Un pedido se marca como listo (desaparece de la vista)

### Estados de Pedidos

El KDS muestra solo pedidos en estos estados:

| Estado           | Color       | Descripción                        |
| ---------------- | ----------- | ---------------------------------- |
| 🆕 **PAID**      | 🟠 Naranja  | Pedido pagado, listo para preparar |
| 👨‍🍳 **PREPARING** | 🟡 Amarillo | Pedido en preparación              |

Los pedidos en estado `READY` o `DELIVERED` **no** se muestran.

### Información Mostrada

Cada tarjeta de pedido muestra:

1. **ID del Pedido** - Últimos 6 caracteres en mayúsculas
2. **Nombre del Cliente** - Para identificación
3. **Hora de Entrega** - Slot de recogida (formato HH:mm)
4. **Fecha** - Día del pedido
5. **Items** - Lista completa con:
   - Cantidad
   - Nombre del producto
   - Modificadores (tamaño, tipo, etc.)

### Acciones Disponibles

#### Para pedidos PAID (🟠 Naranja):

```
Botón: "👨‍🍳 Comenzar Preparación"
Acción: Cambia el estado a PREPARING
```

#### Para pedidos PREPARING (🟡 Amarillo):

```
Botón: "✅ Marcar como Listo"
Acción: Cambia el estado a READY (desaparece del KDS)
```

## 🎨 Diseño

### Modo Oscuro

El KDS usa un esquema de colores oscuro optimizado para cocina:

- **Fondo Principal**: `#1a1a1a` (Negro suave)
- **Tarjetas**: `#2d2d2d` (Gris oscuro)
- **Texto**: Blanco de alto contraste
- **Bordes**: Colores vibrantes según estado

### Touch-Friendly

- ✅ Botones de 64px de altura
- ✅ Espaciado amplio entre elementos
- ✅ Fuentes grandes y legibles
- ✅ Áreas de toque generosas

## 🔄 Flujo de Trabajo

```
1. Cliente paga → Pedido aparece en KDS (🟠 PAID)
   ↓
2. Cocinero presiona "Comenzar Preparación"
   ↓
3. Tarjeta cambia a amarillo (🟡 PREPARING)
   ↓
4. Cocinero termina y presiona "Marcar como Listo"
   ↓
5. Pedido desaparece del KDS (ahora está READY)
```

## 🧪 Pruebas

### Probar el Sistema

1. **Iniciar Next.js:**

   ```bash
   npm run dev
   ```

2. **Abrir KDS:**

   ```
   http://localhost:3000/admin/kds
   ```

3. **Crear un pedido de prueba:**

   ```bash
   npm run test:payment
   ```

4. **Completar el pago en Stripe**

5. **Verificar que el pedido aparece automáticamente en el KDS**

### Checklist de Verificación

- [ ] ¿Los pedidos aparecen sin refrescar la página?
- [ ] ¿El estado cambia al presionar los botones?
- [ ] ¿Los items se muestran correctamente?
- [ ] ¿Los modificadores aparecen debajo de cada item?
- [ ] ¿La hora de entrega es visible y destacada?
- [ ] ¿Los botones son fáciles de presionar (táctil)?
- [ ] ¿El modo oscuro es cómodo para la vista?
- [ ] ¿Los colores de estado son claramente distinguibles?

## 🔧 Solución de Problemas

### Los pedidos no aparecen

1. Verificar que Next.js está corriendo
2. Verificar que hay pedidos en estado `PAID` o `PREPARING` en Firestore
3. Revisar la consola del navegador para errores
4. Verificar que Firebase está configurado correctamente

### Error de permisos de Firestore

Si ves errores de permisos, verifica las reglas de Firestore:

```javascript
// Reglas de Firestore (para desarrollo)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ORDERS/{orderId} {
      allow read, write: if true; // ⚠️ Solo para desarrollo
    }
  }
}
```

### Los cambios de estado no se guardan

1. Verificar que `orderService.updateOrderStatus` está importado correctamente
2. Revisar la consola para errores
3. Verificar permisos de escritura en Firestore

## 🚀 Mejoras Futuras

- [ ] Autenticación de usuarios (solo staff de cocina)
- [ ] Notificación sonora para nuevos pedidos
- [ ] Temporizador de tiempo de preparación
- [ ] Filtro por estación de cocina
- [ ] Vista de historial de pedidos completados
- [ ] Estadísticas en tiempo real

## 📱 Uso en Tablet

El KDS está optimizado para tablets en cocina:

1. **Abrir en navegador de tablet**
2. **Agregar a pantalla de inicio** (PWA)
3. **Usar en modo pantalla completa**
4. **Mantener conectado a WiFi**

### Recomendaciones

- Usar tablet de al menos 10 pulgadas
- Mantener brillo alto para visibilidad
- Limpiar pantalla regularmente
- Usar funda protectora resistente al agua
