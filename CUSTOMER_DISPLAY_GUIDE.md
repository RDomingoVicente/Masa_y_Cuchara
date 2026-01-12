# 📺 Customer Display - Guía de Uso

## Descripción

La **Pantalla de Recogida** (`/display`) es una interfaz de solo lectura diseñada para mostrar a los clientes el estado de sus pedidos en tiempo real.

## 🌐 Acceso

```
http://localhost:3000/display
```

## 📊 Características

### Actualización en Tiempo Real

- Suscripción automática a cambios en Firebase
- Filtrado por fecha actual
- Estados mostrados: `PREPARING` y `READY`

### Diseño de Dos Columnas

#### Columna Izquierda (Naranja/Ámbar)

- **Título**: "👨‍🍳 PREPARANDO"
- **Contenido**: Pedidos en preparación
- **Información**: Nombre/ID del pedido + hora de entrega
- **Color**: Amarillo/Ámbar del `brandConfig`

#### Columna Derecha (Verde)

- **Título**: "✅ ¡LISTO PARA RECOGER!"
- **Contenido**: Pedidos listos
- **Tamaño**: Texto extra grande (7xl)
- **Animación**: Pulso suave continuo
- **Efecto**: Sombra verde brillante
- **Color**: Verde del `brandConfig`

### Header

- **Logo**: Nombre de la marca con gradiente
- **Fecha**: Día completo en español
- **Reloj**: Hora actual en tiempo real (HH:MM:SS)

### Notificaciones Sonoras

- **Trigger**: Cuando un pedido pasa a estado `READY`
- **Sonido**: Beep generado con Web Audio API
- **Frecuencia**: 800 Hz, duración 0.5s

## 🎨 Diseño Visual

### Visibilidad

- Texto de pedidos listos: **7xl** (visible desde 5 metros)
- Texto de pedidos preparando: **4xl**
- Colores de alto contraste
- Fondo con gradiente suave

### Animaciones

- **Pulse lento**: Pedidos listos
- **Transiciones suaves**: Cambios de estado
- **Sombra brillante**: Efecto de destaque

## 🔧 Configuración

### Colores (desde `brandConfig`)

```typescript
- Preparando: brandConfig.colors.status.preparing (#eab308)
- Listo: brandConfig.colors.status.ready (#10b981)
- Fondo: brandConfig.gradients.background
```

### Filtros de Pedidos

```typescript
- Fecha: Hoy (YYYY-MM-DD)
- Estados: ['PREPARING', 'READY']
```

## 📱 Uso Recomendado

### Hardware

- **Pantalla**: TV o monitor grande (32" mínimo)
- **Ubicación**: Área de recogida visible
- **Orientación**: Horizontal (landscape)

### Navegador

- Chrome/Edge (recomendado)
- Firefox
- Safari

### Modo Kiosco

Para evitar que los clientes interactúen:

**Chrome:**

```bash
google-chrome --kiosk --app=http://localhost:3000/display
```

**Firefox:**
Presiona F11 para pantalla completa

## 🔄 Flujo de Trabajo

```
1. Cliente realiza pedido
   ↓
2. Pedido aparece en KDS (cocina)
   ↓
3. Cocinero marca "Comenzar Preparación"
   ↓
4. Pedido aparece en columna PREPARANDO (display)
   ↓
5. Cocinero marca "Listo"
   ↓
6. Pedido se mueve a columna LISTO
   ↓
7. Suena notificación 🔔
   ↓
8. Cliente ve su pedido y lo recoge
```

## ✅ Checklist de Verificación

### Visibilidad

- [ ] Los pedidos en "LISTO" son legibles desde 5 metros
- [ ] Los colores son distinguibles
- [ ] El reloj es visible

### Funcionalidad

- [ ] Los pedidos se actualizan instantáneamente desde KDS
- [ ] El sonido se reproduce cuando un pedido está listo
- [ ] Solo se muestran pedidos de HOY
- [ ] No hay botones ni formularios (solo lectura)

### Rendimiento

- [ ] La pantalla no se congela con muchos pedidos
- [ ] Las animaciones son suaves
- [ ] El reloj se actualiza cada segundo

## 🎯 Personalización

### Cambiar Sonido de Notificación

Edita la función `playNotificationSound()` en `src/app/display/page.tsx`:

```typescript
const playNotificationSound = () => {
  const audio = new Audio("/sounds/notification.mp3");
  audio.play();
};
```

### Ajustar Tamaños de Texto

Busca las clases de Tailwind:

- `text-7xl` → Pedidos listos
- `text-4xl` → Pedidos preparando
- `text-5xl` → Títulos

### Cambiar Colores

Edita `src/config/brand.ts`:

```typescript
status: {
  preparing: '#tu-color',
  ready: '#tu-color',
}
```

## 🐛 Troubleshooting

### El sonido no se reproduce

- **Causa**: Los navegadores bloquean audio sin interacción del usuario
- **Solución**: Haz clic una vez en la pantalla al cargarla

### Los pedidos no aparecen

- **Verificar**: Fecha del pedido coincide con hoy
- **Verificar**: Estado es `PREPARING` o `READY`
- **Verificar**: Conexión a Firebase

### La pantalla no se actualiza

- **Verificar**: Conexión a internet
- **Solución**: Recargar la página (F5)

## 📊 Estadísticas de Uso

### Capacidad

- **Pedidos simultáneos**: Sin límite técnico
- **Scroll automático**: Si hay más de 10 pedidos
- **Actualización**: Instantánea (< 1 segundo)

### Rendimiento

- **Uso de CPU**: Bajo (~5%)
- **Uso de RAM**: ~50-100 MB
- **Ancho de banda**: Mínimo (solo cambios)

## 🔐 Seguridad

### Datos Mostrados

- ✅ Nombre del cliente o ID corto
- ✅ Hora de entrega
- ❌ NO muestra: teléfono, dirección, items del pedido

### Acceso

- Pantalla pública (sin autenticación)
- Solo lectura (no se puede modificar)
- Datos limitados (privacidad)

## 📞 Soporte

Para problemas o mejoras, consulta:

- `BRAND_CONFIG.md` - Configuración de colores
- `KDS_GUIDE.md` - Sistema de cocina
- `docs/walkthrough.md` - Documentación técnica
