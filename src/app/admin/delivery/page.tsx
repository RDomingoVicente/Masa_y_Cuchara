'use client';

import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateOrderStatus } from '@/services/orderService';
import type { Order } from '@/types/index';
import { brandConfig } from '@/config/brand';

export default function DeliveryConsolePage() {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'ready' | 'delivered'>('ready');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to READY orders
  useEffect(() => {
    console.log('🚚 Iniciando consola de despacho (READY)...');
    
    const ordersRef = collection(db, 'ORDERS');
    const q = query(
      ordersRef,
      where('workflow.status', '==', 'READY')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`📦 ${snapshot.size} pedidos listos para entregar`);
        const ordersData: Order[] = [];
        
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          
          const order: Order = {
            ...data,
            order_id: docSnap.id,
            workflow: {
              ...data.workflow,
              created_at: data.workflow.created_at instanceof Timestamp 
                ? data.workflow.created_at.toDate() 
                : new Date(data.workflow.created_at),
              updated_at: data.workflow.updated_at instanceof Timestamp
                ? data.workflow.updated_at.toDate()
                : new Date(data.workflow.updated_at),
              ready_at: data.workflow.ready_at instanceof Timestamp
                ? data.workflow.ready_at.toDate()
                : data.workflow.ready_at ? new Date(data.workflow.ready_at) : null,
              delivered_at: data.workflow.delivered_at instanceof Timestamp
                ? data.workflow.delivered_at.toDate()
                : data.workflow.delivered_at ? new Date(data.workflow.delivered_at) : null,
            },
          } as Order;
          
          ordersData.push(order);
        });

        ordersData.sort((a, b) => {
          if (!a.workflow.ready_at) return 1;
          if (!b.workflow.ready_at) return -1;
          return a.workflow.ready_at.getTime() - b.workflow.ready_at.getTime();
        });

        setReadyOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Error en consola de despacho:', err);
        setError(`Error al cargar pedidos: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to DELIVERED orders
  useEffect(() => {
    console.log('📦 Suscribiendo a pedidos entregados...');
    
    const ordersRef = collection(db, 'ORDERS');
    const q = query(
      ordersRef,
      where('workflow.status', '==', 'DELIVERED')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`✅ ${snapshot.size} pedidos entregados`);
        const ordersData: Order[] = [];
        
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          
          const order: Order = {
            ...data,
            order_id: docSnap.id,
            workflow: {
              ...data.workflow,
              created_at: data.workflow.created_at instanceof Timestamp 
                ? data.workflow.created_at.toDate() 
                : new Date(data.workflow.created_at),
              updated_at: data.workflow.updated_at instanceof Timestamp
                ? data.workflow.updated_at.toDate()
                : new Date(data.workflow.updated_at),
              ready_at: data.workflow.ready_at instanceof Timestamp
                ? data.workflow.ready_at.toDate()
                : data.workflow.ready_at ? new Date(data.workflow.ready_at) : null,
              delivered_at: data.workflow.delivered_at instanceof Timestamp
                ? data.workflow.delivered_at.toDate()
                : data.workflow.delivered_at ? new Date(data.workflow.delivered_at) : null,
            },
          } as Order;
          
          ordersData.push(order);
        });

        // Sort by delivered_at (most recent first)
        ordersData.sort((a, b) => {
          if (!a.workflow.delivered_at) return 1;
          if (!b.workflow.delivered_at) return -1;
          return b.workflow.delivered_at.getTime() - a.workflow.delivered_at.getTime();
        });

        setDeliveredOrders(ordersData);
      },
      (err) => {
        console.error('❌ Error al cargar pedidos entregados:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDeliverOrder = async (orderId: string) => {
    try {
      console.log(`📦 Entregando pedido ${orderId}...`);
      await updateOrderStatus(orderId, 'DELIVERED' as any);
      console.log(`✅ Pedido ${orderId} entregado`);
    } catch (err) {
      console.error('Error al entregar pedido:', err);
      alert('Error al marcar el pedido como entregado');
    }
  };

  const handleArchiveOrder = async (orderId: string) => {
    if (!confirm('¿Archivar este pedido? Se eliminará de la base de datos.')) return;
    
    try {
      console.log(`🗄️ Archivando pedido ${orderId}...`);
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'ORDERS', orderId));
      console.log(`✅ Pedido ${orderId} archivado`);
    } catch (err) {
      console.error('Error al archivar pedido:', err);
      alert('Error al archivar el pedido');
    }
  };

  const getWaitTime = (readyAt: Date | null) => {
    if (!readyAt) return 'N/A';
    
    const now = new Date();
    const diffMs = now.getTime() - readyAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Recién listo';
    if (diffMins === 1) return '1 min';
    return `${diffMins} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-xl font-semibold">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8">
          <p className="text-red-600 text-2xl mb-4 font-bold">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 shadow-lg transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: brandConfig.gradients.background }}>
      {/* Header */}
      <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{
              background: brandConfig.gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              📦 Consola de Despacho - {brandConfig.brand.name}
            </h1>
            <p className="text-gray-600 text-lg">
              {activeTab === 'ready' 
                ? `${readyOrders.length} ${readyOrders.length === 1 ? 'pedido listo' : 'pedidos listos'} para entregar`
                : `${deliveredOrders.length} ${deliveredOrders.length === 1 ? 'pedido entregado' : 'pedidos entregados'}`
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Actualización en tiempo real</div>
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold">Conectado</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setActiveTab('ready')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'ready'
                ? 'shadow-lg scale-105'
                : 'hover:bg-gray-100'
            }`}
            style={activeTab === 'ready' ? {
              background: brandConfig.gradients.primary,
              color: 'white',
            } : {
              color: brandConfig.colors.primary[700],
            }}
          >
            📦 Listos ({readyOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'delivered'
                ? 'shadow-lg scale-105'
                : 'hover:bg-gray-100'
            }`}
            style={activeTab === 'delivered' ? {
              background: brandConfig.gradients.secondary,
              color: 'white',
            } : {
              color: brandConfig.colors.secondary[700],
            }}
          >
            ✅ Entregados ({deliveredOrders.length})
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'ready' ? (
        readyOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-gray-600 text-3xl mb-2 font-semibold">No hay pedidos listos</p>
            <p className="text-gray-400 text-xl">Los pedidos aparecerán aquí cuando estén listos para entregar</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: brandConfig.kds.table.headerBg }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                      Pedido
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                      Hora Entrega
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                      Tiempo Esperando
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {readyOrders.map((order) => (
                    <DeliveryRow
                      key={order.order_id}
                      order={order}
                      waitTime={getWaitTime(order.workflow.ready_at)}
                      onDeliver={handleDeliverOrder}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        deliveredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-3xl mb-2 font-semibold">No hay pedidos entregados</p>
            <p className="text-gray-400 text-xl">Los pedidos entregados aparecerán aquí</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: brandConfig.kds.table.headerBg }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                      Pedido
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                      Entregado
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deliveredOrders.map((order) => (
                    <DeliveredRow
                      key={order.order_id}
                      order={order}
                      onArchive={handleArchiveOrder}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function DeliveryRow({
  order,
  waitTime,
  onDeliver,
}: {
  order: Order;
  waitTime: string;
  onDeliver: (orderId: string) => void;
}) {
  return (
    <tr className="transition-colors" style={{ 
      backgroundColor: `${brandConfig.colors.accent[50]}`,
    }}>
      {/* Cliente */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{
            background: brandConfig.gradients.primary,
          }}>
            {order.customer.display_name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <div className="text-gray-900 font-bold text-lg">
              {order.customer.display_name || 'Cliente'}
            </div>
            <div className="text-gray-500 text-sm">
              {order.customer.phone}
            </div>
            <div className="text-gray-400 text-xs font-mono mt-1">
              #{order.order_id.slice(-6).toUpperCase()}
            </div>
          </div>
        </div>
      </td>

      {/* Pedido */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-white font-bold px-2 py-1 rounded text-xs min-w-[2.5rem] text-center flex-shrink-0" style={{
                backgroundColor: brandConfig.colors.primary[600],
              }}>
                {item.qty}x
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-gray-900 font-semibold text-sm block">
                  {item.name}
                </span>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.modifiers.map((mod, i) => (
                      <span key={i} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {mod.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </td>

      {/* Hora Entrega */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🕐</span>
          <span className="text-3xl font-bold" style={{ color: brandConfig.colors.primary[500] }}>
            {order.logistics.slot_id}
          </span>
        </div>
      </td>

      {/* Tiempo Esperando */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏱️</span>
          <span className="text-2xl font-bold" style={{ color: brandConfig.colors.status.ready }}>
            {waitTime}
          </span>
        </div>
      </td>

      {/* Acción */}
      <td className="px-6 py-4">
        <div className="flex justify-center">
          <button
            onClick={() => onDeliver(order.order_id)}
            className="px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
            style={{
              background: brandConfig.gradients.accent,
              color: 'white',
            }}
          >
            📦 Entregar
          </button>
        </div>
      </td>
    </tr>
  );
}

function DeliveredRow({
  order,
  onArchive,
}: {
  order: Order;
  onArchive: (orderId: string) => void;
}) {
  const deliveredTime = order.workflow.delivered_at 
    ? order.workflow.delivered_at.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <tr className="transition-colors bg-green-50">
      {/* Cliente */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{
            background: brandConfig.gradients.secondary,
          }}>
            {order.customer.display_name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <div className="text-gray-900 font-bold text-lg">
              {order.customer.display_name || 'Cliente'}
            </div>
            <div className="text-gray-500 text-sm">
              {order.customer.phone}
            </div>
            <div className="text-gray-400 text-xs font-mono mt-1">
              #{order.order_id.slice(-6).toUpperCase()}
            </div>
          </div>
        </div>
      </td>

      {/* Pedido */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-white font-bold px-2 py-1 rounded text-xs min-w-[2.5rem] text-center flex-shrink-0" style={{
                backgroundColor: brandConfig.colors.secondary[600],
              }}>
                {item.qty}x
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-gray-900 font-semibold text-sm block">
                  {item.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </td>

      {/* Entregado */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <span className="text-2xl font-bold text-green-600">
            {deliveredTime}
          </span>
        </div>
      </td>

      {/* Acción */}
      <td className="px-6 py-4">
        <div className="flex justify-center">
          <button
            onClick={() => onArchive(order.order_id)}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 bg-red-500 text-white hover:bg-red-600"
          >
            🗄️ Archivar
          </button>
        </div>
      </td>
    </tr>
  );
}
