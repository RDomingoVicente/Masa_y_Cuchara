# 🎨 Guía de Configuración de Marca

## Descripción

El archivo `src/config/brand.ts` centraliza toda la configuración visual de la aplicación, permitiendo ajustar fácilmente colores, logos y estilos corporativos desde un solo lugar.

## 📁 Ubicación

```
src/config/brand.ts
```

## 🎯 Uso Rápido

### Cambiar Colores Corporativos

Edita el objeto `colors` en `brand.ts`:

```typescript
colors: {
  primary: {
    500: '#7c3aed',  // 👈 Cambia este color principal
  },
  secondary: {
    400: '#f59e0b',  // 👈 Cambia este color secundario
  },
  accent: {
    500: '#10b981',  // 👈 Cambia este color de acento
  },
}
```

### Cambiar Logos

1. **Coloca tus logos** en `public/images/`:

   - `logo.png` - Logo principal
   - `logo-small.png` - Logo pequeño
   - `app-icon.png` - Icono de la app

2. **Actualiza las rutas** en `brand.ts`:

```typescript
assets: {
  logo: '/images/logo.png',
  logoSmall: '/images/logo-small.png',
  appIcon: '/images/app-icon.png',
}
```

### Cambiar Nombre de la Marca

```typescript
brand: {
  name: 'Tu Nombre Aquí',  // 👈 Cambia el nombre
  tagline: 'Tu Tagline',
}
```

## 📋 Secciones Disponibles

### 1. Información de la Marca

```typescript
brand: {
  name: string,
  tagline: string,
  description: string,
}
```

### 2. Logos y Recursos

```typescript
assets: {
  logo: string,
  logoSmall: string,
  appIcon: string,
  backgroundImage: string | null,
}
```

### 3. Paleta de Colores

Cada color tiene 10 tonos (50-900):

```typescript
colors: {
  primary: { 50...900 },
  secondary: { 50...900 },
  accent: { 50...900 },
  status: { new, preparing, ready, delivered, cancelled },
  background: { primary, secondary, tertiary, gradient },
  text: { primary, secondary, tertiary, inverse },
  border: { light, medium, dark },
}
```

### 4. Gradientes

```typescript
gradients: {
  primary: string,
  secondary: string,
  accent: string,
  background: string,
}
```

### 5. Tipografía

```typescript
typography: {
  fontFamily: { primary, secondary, mono },
  fontSize: { xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl },
  fontWeight: { normal, medium, semibold, bold, extrabold },
}
```

### 6. Espaciado

```typescript
spacing: {
  unit: string,
  borderRadius: { sm, md, lg, xl, 2xl, full },
  shadow: { sm, md, lg, xl, 2xl },
}
```

### 7. Componentes

```typescript
components: {
  button: { primary, secondary, success },
  card: { bg, border, shadow, borderRadius },
  header: { bg, text, shadow },
}
```

### 8. KDS (Kitchen Display)

```typescript
kds: {
  statusColors: { new, preparing },
  table: { headerBg, headerText, rowHoverNew, rowHoverPreparing },
}
```

## 🔧 Cómo Usar en Componentes

### Importar la configuración

```typescript
import { brandConfig } from "@/config/brand";
```

### Usar colores

```typescript
// En estilos inline
<div style={{ color: brandConfig.colors.primary[500] }}>
  Texto
</div>

// En gradientes
<div style={{ background: brandConfig.gradients.primary }}>
  Contenido
</div>
```

### Usar helpers

```typescript
import { getColor, getGradient, getAsset } from "@/config/brand";

const primaryColor = getColor("primary.500");
const gradient = getGradient("primary");
const logo = getAsset("logo");
```

## 🎨 Paleta de Colores Actual

### Colores Principales

- **Primary (Púrpura)**: `#7c3aed` - Color principal de la marca
- **Secondary (Naranja)**: `#f59e0b` - Color complementario
- **Accent (Verde)**: `#10b981` - Color de acento para CTAs

### Estados de Pedidos

- **Nuevo**: `#f59e0b` (Naranja)
- **Preparando**: `#eab308` (Amarillo)
- **Listo**: `#10b981` (Verde)
- **Entregado**: `#6b7280` (Gris)
- **Cancelado**: `#ef4444` (Rojo)

## 📝 Ejemplos de Personalización

### Ejemplo 1: Cambiar a Tema Azul

```typescript
colors: {
  primary: {
    500: '#3b82f6',  // Azul
  },
  secondary: {
    400: '#06b6d4',  // Cyan
  },
}

gradients: {
  primary: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
}
```

### Ejemplo 2: Cambiar a Tema Verde

```typescript
colors: {
  primary: {
    500: '#10b981',  // Verde
  },
  secondary: {
    400: '#84cc16',  // Lima
  },
}

gradients: {
  primary: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
}
```

### Ejemplo 3: Tema Oscuro

```typescript
colors: {
  background: {
    primary: '#1f2937',
    secondary: '#111827',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#d1d5db',
  },
}
```

## 🚀 Aplicar Cambios

1. **Edita** `src/config/brand.ts`
2. **Guarda** el archivo
3. **Recarga** la aplicación en el navegador
4. Los cambios se aplicarán automáticamente

## ⚠️ Notas Importantes

- Los colores deben estar en formato hexadecimal (`#RRGGBB`)
- Los gradientes usan sintaxis CSS estándar
- Las rutas de imágenes son relativas a `public/`
- Mantén consistencia en los tonos de color (50-900)

## 🎯 Componentes que Usan la Configuración

- ✅ **KDS (Kitchen Display System)** - Usa colores de estado, gradientes y tipografía
- 🔜 **Menú de Cliente** - Próximamente
- 🔜 **Checkout** - Próximamente
- 🔜 **Admin Panel** - Próximamente

## 📞 Soporte

Si necesitas ayuda para personalizar los colores o el diseño, consulta la documentación de Tailwind CSS para referencia de colores y estilos.
