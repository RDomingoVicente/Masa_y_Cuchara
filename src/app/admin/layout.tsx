'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', icon: '🏠', label: 'Dashboard', exact: true },
    { href: '/admin/products', icon: '📦', label: 'Productos' },
    { href: '/admin/categories', icon: '📂', label: 'Categorías' },
    { href: '/admin/modifiers', icon: '🔧', label: 'Modificadores' },
    { href: '/admin/operations', icon: '📅', label: 'Operación Diaria' },
    { href: '/admin/kds', icon: '👨‍🍳', label: 'Cocina (KDS)' },
    { href: '/admin/delivery', icon: '🚚', label: 'Despacho' },
    { href: '/admin/settings', icon: '⚙️', label: 'Configuración' },
    { href: '/display', icon: '📺', label: 'Pantalla Clientes' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex min-h-screen" style={{ background: brandConfig.gradients.background }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-2xl flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-1" style={{
            background: brandConfig.gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Masa & Cuchara
          </h1>
          <p className="text-sm text-gray-500">Panel Admin</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            
            // Special handling for display (opens in new tab)
            if (item.href === '/display') {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold hover:bg-gray-50 hover:scale-102"
                  style={{ color: brandConfig.colors.primary[700] }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm flex-1">{item.label}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200 font-semibold
                  ${active 
                    ? 'shadow-lg scale-105' 
                    : 'hover:bg-gray-50 hover:scale-102'
                  }
                `}
                style={active ? {
                  background: brandConfig.gradients.primary,
                  color: 'white',
                } : {
                  color: brandConfig.colors.primary[700],
                }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="text-xs text-gray-400 text-center">
            v1.0.0 • Sistema de Gestión
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
