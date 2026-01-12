'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { brandConfig } from '@/config/brand';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    preparing: 0,
    ready: 0,
  });

  useEffect(() => {
    // Load products count
    const loadProducts = async () => {
      try {
        const catalogRef = collection(db, 'CATALOG');
        const snapshot = await getDocs(catalogRef);
        setStats(prev => ({ ...prev, products: snapshot.size }));
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();

    // Subscribe to PREPARING orders
    const preparingRef = collection(db, 'ORDERS');
    const preparingQuery = query(preparingRef, where('workflow.status', '==', 'PREPARING'));
    const unsubPreparing = onSnapshot(preparingQuery, (snapshot) => {
      setStats(prev => ({ ...prev, preparing: snapshot.size }));
    });

    // Subscribe to READY orders
    const readyQuery = query(preparingRef, where('workflow.status', '==', 'READY'));
    const unsubReady = onSnapshot(readyQuery, (snapshot) => {
      setStats(prev => ({ ...prev, ready: snapshot.size }));
    });

    return () => {
      unsubPreparing();
      unsubReady();
    };
  }, []);
  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{
          background: brandConfig.gradients.primary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Bienvenido al Panel de Administración
        </h1>
        <p className="text-xl text-gray-600">
          Gestiona tu negocio take-away desde aquí
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon="📦"
          title="Productos"
          value={stats.products.toString()}
          subtitle="En catálogo"
          gradient={brandConfig.gradients.primary}
        />
        <StatCard
          icon="📅"
          title="Operación"
          value="Hoy"
          subtitle="Configurada"
          gradient={brandConfig.gradients.secondary}
        />
        <StatCard
          icon="👨‍🍳"
          title="Pedidos"
          value={stats.preparing.toString()}
          subtitle="En cocina"
          gradient={brandConfig.gradients.accent}
        />
        <StatCard
          icon="🚚"
          title="Listos"
          value={stats.ready.toString()}
          subtitle="Para entregar"
          gradient={brandConfig.gradients.primary}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4" style={{ color: brandConfig.colors.primary[700] }}>
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionButton
            icon="📦"
            label="Nuevo Producto"
            description="Agregar al catálogo"
            href="/admin/products"
          />
          <QuickActionButton
            icon="📅"
            label="Abrir Día"
            description="Configurar operación"
            href="/admin/operations"
          />
          <QuickActionButton
            icon="👨‍🍳"
            label="Ver Cocina"
            description="Monitor en tiempo real"
            href="/admin/kds"
          />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard
          title="🎯 Próximos Pasos"
          items={[
            'Configurar productos en el catálogo',
            'Abrir la operación del día',
            'Monitorear pedidos en el KDS',
            'Gestionar entregas desde la consola',
          ]}
        />
        <InfoCard
          title="📊 Estado del Sistema"
          items={[
            '✅ Catálogo: Activo',
            '✅ Pagos: Configurado',
            '✅ KDS: Operativo',
            '✅ Tickets: Funcionando',
          ]}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, gradient }: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4" style={{ background: gradient }}>
        <div className="text-4xl text-center">{icon}</div>
      </div>
      <div className="p-4">
        <div className="text-sm text-gray-500 mb-1">{title}</div>
        <div className="text-3xl font-bold mb-1" style={{ color: brandConfig.colors.primary[600] }}>
          {value}
        </div>
        <div className="text-xs text-gray-400">{subtitle}</div>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, description, href }: {
  icon: string;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all"
    >
      <div className="text-3xl">{icon}</div>
      <div className="text-left">
        <div className="font-bold text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </Link>
  );
}

function InfoCard({ title, items }: {
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4" style={{ color: brandConfig.colors.primary[700] }}>
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-purple-500 mt-1">•</span>
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
