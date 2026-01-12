/**
 * Configuración de Marca - Masa & Cuchara
 * 
 * Este archivo centraliza todos los colores corporativos, logos y estilos
 * para facilitar el ajuste del look & feel de toda la aplicación.
 */

export const brandConfig = {
  // ============================================
  // INFORMACIÓN DE LA MARCA
  // ============================================
  brand: {
    name: 'Masa & Cuchara',
    tagline: 'Pupusas y Cocina de Burgos',
    description: 'Sistema de pedidos online',
  },

  // ============================================
  // LOGOS Y RECURSOS VISUALES
  // ============================================
  assets: {
    // Logo principal (para header, emails, etc.)
    logo: '/images/logo.png',
    
    // Logo pequeño (favicon, iconos)
    logoSmall: '/images/logo-small.png',
    
    // Icono de la app (PWA)
    appIcon: '/images/app-icon.png',
    
    // Imagen de fondo (opcional)
    backgroundImage: null,
  },

  // ============================================
  // PALETA DE COLORES CORPORATIVOS
  // ============================================
  colors: {
    // Color primario (principal de la marca)
    primary: {
      50: '#ede9fe',
      100: '#ddd6fe',
      200: '#c4b5fd',
      300: '#a78bfa',
      400: '#8b5cf6',
      500: '#7c3aed',  // Color principal
      600: '#6d28d9',
      700: '#5b21b6',
      800: '#4c1d95',
      900: '#3b0764',
    },

    // Color secundario (complementario)
    secondary: {
      50: '#fef3c7',
      100: '#fde68a',
      200: '#fcd34d',
      300: '#fbbf24',
      400: '#f59e0b',  // Color secundario
      500: '#d97706',
      600: '#b45309',
      700: '#92400e',
      800: '#78350f',
      900: '#451a03',
    },

    // Color de acento (para CTAs, botones importantes)
    accent: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',  // Color de acento
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },

    // Estados de pedidos
    status: {
      new: '#f59e0b',        // Naranja - Pedido nuevo (PAID)
      preparing: '#eab308',  // Amarillo - En preparación
      ready: '#10b981',      // Verde - Listo
      delivered: '#6b7280',  // Gris - Entregado
      cancelled: '#ef4444',  // Rojo - Cancelado
    },

    // Colores de fondo
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },

    // Colores de texto
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
    },

    // Colores de borde
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
      dark: '#9ca3af',
    },
  },

  // ============================================
  // GRADIENTES CORPORATIVOS
  // ============================================
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    accent: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%)',
  },

  // ============================================
  // TIPOGRAFÍA
  // ============================================
  typography: {
    // Fuente principal
    fontFamily: {
      primary: 'Inter, system-ui, -apple-system, sans-serif',
      secondary: 'Georgia, serif',
      mono: 'Menlo, Monaco, monospace',
    },

    // Tamaños de fuente
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },

    // Pesos de fuente
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // ============================================
  // ESPACIADO Y DIMENSIONES
  // ============================================
  spacing: {
    // Espaciado base (multiplicar por estos valores)
    unit: '0.25rem', // 4px

    // Radios de borde
    borderRadius: {
      sm: '0.375rem',   // 6px
      md: '0.5rem',     // 8px
      lg: '0.75rem',    // 12px
      xl: '1rem',       // 16px
      '2xl': '1.5rem',  // 24px
      full: '9999px',
    },

    // Sombras
    shadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
  },

  // ============================================
  // CONFIGURACIÓN DE COMPONENTES
  // ============================================
  components: {
    // Botones
    button: {
      primary: {
        bg: '#7c3aed',
        bgHover: '#6d28d9',
        text: '#ffffff',
      },
      secondary: {
        bg: '#f59e0b',
        bgHover: '#d97706',
        text: '#111827',
      },
      success: {
        bg: '#10b981',
        bgHover: '#059669',
        text: '#ffffff',
      },
    },

    // Tarjetas
    card: {
      bg: '#ffffff',
      border: '#e5e7eb',
      shadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      borderRadius: '1rem',
    },

    // Header
    header: {
      bg: '#ffffff',
      text: '#111827',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
  },

  // ============================================
  // CONFIGURACIÓN DE KDS (Kitchen Display System)
  // ============================================
  kds: {
    // Colores de estado en KDS
    statusColors: {
      new: {
        bg: '#fff7ed',
        border: '#f59e0b',
        badge: '#f59e0b',
        text: '#111827',
      },
      preparing: {
        bg: '#fefce8',
        border: '#eab308',
        badge: '#eab308',
        text: '#111827',
      },
    },

    // Configuración de tabla
    table: {
      headerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      headerText: '#ffffff',
      rowHoverNew: '#fff7ed',
      rowHoverPreparing: '#fefce8',
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtiene un color de la paleta
 */
export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = brandConfig.colors;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return '#000000';
  }
  
  return value;
}

/**
 * Obtiene un gradiente
 */
export function getGradient(name: keyof typeof brandConfig.gradients): string {
  return brandConfig.gradients[name];
}

/**
 * Obtiene la ruta de un asset
 */
export function getAsset(name: keyof typeof brandConfig.assets): string | null {
  return brandConfig.assets[name];
}

export default brandConfig;
