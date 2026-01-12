# 📦 Delivery Console - Guía de Uso

## Descripción

La **Consola de Despacho** (`/admin/delivery`) es la interfaz para el personal de barra que entrega los pedidos a los clientes.

## 🌐 Acceso

```
http://localhost:3000/admin/delivery
```

## 🎯 Función

Completar el ciclo de vida del pedido marcándolo como `DELIVERED` cuando se entrega al cliente.

## 📊 Características

### Suscripción en Tiempo Real

- Escucha pedidos con estado `READY`
- Ordenados por `ready_at` (ascendente)
- Los pedidos más antiguos aparecen primero

### Tarjetas de Pedido

Cada tarjeta muestra:

1. **Header (Verde)**:

   - Avatar del cliente
   - Nombre y teléfono
   - ID del pedido

2. **Tiempo de Espera**:

   - Cuánto tiempo lleva el pedido listo
   - Destacado en verde
   - Actualización automática

3. **Contenido del Pedido**:

   - Lista de items con cantidades
   - Modificadores (si los hay)
   - Formato claro y legible

4. **Hora de Entrega**:

   - Slot reservado por el cliente

5. **Botón de Entrega**:
   - Grande (h-20)
   - Verde con gradiente
   - Texto: "📦 Entregar Pedido"

### Acción de Entrega

Al hacer clic en "Entregar Pedido":

1. Llama a `orderService.updateOrderStatus(orderId, 'DELIVERED')`
2. El pedido desaparece de la consola
3. El pedido desaparece de la pantalla de recogida
4. Se registra `delivered_at` en Firestore

## 🎨 Diseño

### Colores

- **Header**: Gradiente verde (accent)
- **Borde**: Verde vibrante
- **Tiempo**: Verde destacado
- **Botón**: Gradiente verde

### Touch-Friendly

- Botones extra grandes (h-20)
- Espaciado generoso
- Tarjetas grandes
- Fácil de usar con manos ocupadas

## 🔄 Flujo Completo

```
1. Cocina marca pedido como "Listo" (KDS)
   ↓
2. Pedido aparece en:
   - Pantalla de Recogida (cliente)
   - Consola de Despacho (barra)
   ↓
3. Cliente ve su pedido listo
   ↓
4. Personal de barra prepara el pedido
   ↓
5. Click en "Entregar Pedido"
   ↓
6. Pedido marcado como DELIVERED
   ↓
7. Pedido desaparece de ambas pantallas ✅
```

## 📱 Uso Recomendado

### Hardware

- **Dispositivo**: Tablet o monitor en barra
- **Tamaño**: 10" mínimo
- **Ubicación**: Área de despacho

### Personal

- Personal de barra
- Encargados de entrega
- Cualquier persona que entregue pedidos

## ⏱️ Tiempo de Espera

### Cálculo

```typescript
Tiempo actual - workflow.ready_at
```

### Formato

- "Recién listo" (< 1 minuto)
- "1 minuto"
- "X minutos"

### Importancia

- Priorizar pedidos con más tiempo de espera
- Ordenamiento automático (más antiguos primero)

## ✅ Checklist de Verificación

### Funcionalidad

- [ ] Los pedidos aparecen cuando están READY
- [ ] Ordenados por antigüedad (más viejos primero)
- [ ] Tiempo de espera se actualiza
- [ ] Botón de entrega funciona
- [ ] Pedido desaparece al entregar
- [ ] Se actualiza en Firestore

### Usabilidad

- [ ] Botones grandes y fáciles de presionar
- [ ] Información clara y legible
- [ ] Colores distinguibles
- [ ] Responsive en tablet

## 🔧 Integración

### Con KDS (Cocina)

```
KDS marca "Listo" → Aparece en Delivery Console
```

### Con Customer Display

```
Ambas pantallas muestran el mismo pedido
Delivery Console entrega → Desaparece de ambas
```

### Con Firestore

```
Estado: READY → DELIVERED
Campo: delivered_at se registra
```

## 🎯 Personalización

### Cambiar Orden

Edita la query en `src/app/admin/delivery/page.tsx`:

```typescript
orderBy("workflow.ready_at", "desc"); // Más recientes primero
```

### Ajustar Tamaño de Botón

```typescript
className = "w-full h-24"; // Más grande
```

### Cambiar Colores

Usa `brandConfig`:

```typescript
style={{ background: brandConfig.gradients.secondary }}
```

## 🐛 Troubleshooting

### Los pedidos no aparecen

- **Verificar**: Estado es `READY`
- **Verificar**: Conexión a Firebase
- **Solución**: Revisar consola del navegador

### Error al entregar

- **Causa**: Problema con `orderService`
- **Verificar**: Permisos de Firestore
- **Solución**: Ver logs en consola

### Orden incorrecto

- **Causa**: Falta índice en Firestore
- **Solución**: Crear índice para `ready_at`

## 📊 Estadísticas

### Capacidad

- **Pedidos simultáneos**: Sin límite
- **Actualización**: Instantánea
- **Rendimiento**: Óptimo hasta 50 pedidos

### Métricas

- Tiempo promedio de espera
- Pedidos entregados por hora
- Eficiencia del personal

## 🔐 Seguridad

### Acceso

- Ruta protegida: `/admin/delivery`
- Requiere autenticación (futuro)
- Solo personal autorizado

### Permisos Firestore

```javascript
allow update: if request.auth != null
  && request.resource.data.workflow.status == 'DELIVERED';
```

## 📞 Soporte

Documentación relacionada:

- `KDS_GUIDE.md` - Sistema de cocina
- `CUSTOMER_DISPLAY_GUIDE.md` - Pantalla de recogida
- `BRAND_CONFIG.md` - Configuración de marca
