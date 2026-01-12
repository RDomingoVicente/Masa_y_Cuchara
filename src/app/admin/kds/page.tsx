'use client';

import { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Order, OrderStatus as OrderStatusType } from '@/types/index';
import { brandConfig } from '@/config/brand';

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 Iniciando suscripción a pedidos...');
    
    const ordersRef = collection(db, 'ORDERS');
    const q = query(
      ordersRef,
      where('workflow.status', 'in', ['PAID', 'PREPARING'])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`📦 Recibidos ${snapshot.size} pedidos`);
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
          return a.logistics.slot_id.localeCompare(b.logistics.slot_id);
        });

        console.log('✅ Pedidos procesados:', ordersData.length);
        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Error en suscripción de pedidos:', err);
        console.error('Detalles del error:', err.message);
        setError(`Error al cargar pedidos: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatusType) => {
    try {
      const orderRef = doc(db, 'ORDERS', orderId);
      
      await updateDoc(orderRef, {
        'workflow.status': newStatus,
        'workflow.updated_at': serverTimestamp(),
      });
      
      console.log(`✅ Pedido ${orderId} actualizado a ${newStatus}`);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar el estado del pedido');
    }
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
              🍽️ Cocina - {brandConfig.brand.name}
            </h1>
            <p className="text-gray-600 text-lg">
              {orders.length} {orders.length === 1 ? 'pedido activo' : 'pedidos activos'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Actualización en tiempo real</div>
            <div className="flex items-center gap-2" style={{ color: brandConfig.colors.accent[500] }}>
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: brandConfig.colors.accent[500] }}></div>
              <span className="font-semibold">Conectado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table View */}
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-gray-600 text-3xl mb-2 font-semibold">No hay pedidos activos</p>
          <p className="text-gray-400 text-xl">Los nuevos pedidos aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: brandConfig.kds.table.headerBg }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                    Entrega
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                    Pagado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                    Pedido
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider" style={{ color: brandConfig.kds.table.headerText }}>
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <OrderRow
                    key={order.order_id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatusType) => void;
}) {
  const isPaid = order.workflow.status === 'PAID';
  const isPreparing = order.workflow.status === 'PREPARING';

  const statusConfig = isPaid ? brandConfig.kds.statusColors.new : brandConfig.kds.statusColors.preparing;

  // Formatear fecha y hora
  const formatDateTime = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`,
    };
  };

  const createdAt = formatDateTime(order.workflow.created_at);

  return (
    <tr className="transition-colors" style={{ 
      backgroundColor: statusConfig.bg,
    }}>
      {/* Estado */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap" style={{
            backgroundColor: statusConfig.badge,
            color: statusConfig.text,
          }}>
            <span className="text-lg">{isPaid ? '🆕' : '👨‍🍳'}</span>
            {isPaid ? 'NUEVO' : 'PREPARANDO'}
          </span>
          <span className="text-gray-500 text-xs font-mono">
            #{order.order_id.slice(-6).toUpperCase()}
          </span>
        </div>
      </td>

      {/* Entrega - Fecha y Hora */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span className="text-gray-700 font-semibold text-sm">
              {order.logistics.order_date}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🕐</span>
            <span className="text-3xl font-bold" style={{ color: brandConfig.colors.primary[500] }}>
              {order.logistics.slot_id}
            </span>
          </div>
        </div>
      </td>

      {/* Pagado - Fecha y Hora */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <span className="text-gray-600 text-sm">
              {createdAt.date}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🕐</span>
            <span className="text-gray-900 font-bold text-base">
              {createdAt.time}
            </span>
          </div>
        </div>
      </td>

      {/* Cliente */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{
            background: brandConfig.gradients.primary,
          }}>
            {order.customer.display_name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <div className="text-gray-900 font-bold text-base">
              {order.customer.display_name || 'Cliente'}
            </div>
            <div className="text-gray-500 text-sm">
              {order.customer.phone}
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

      {/* Acción */}
      <td className="px-6 py-4">
        <div className="flex justify-center">
          {isPaid && (
            <button
              onClick={() => onStatusChange(order.order_id, 'PREPARING' as OrderStatusType)}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
              style={{
                background: brandConfig.gradients.secondary,
                color: brandConfig.components.button.secondary.text,
              }}
            >
              👨‍🍳 Comenzar
            </button>
          )}
          {isPreparing && (
            <button
              onClick={() => onStatusChange(order.order_id, 'READY' as OrderStatusType)}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
              style={{
                background: brandConfig.gradients.accent,
                color: brandConfig.components.button.success.text,
              }}
            >
              ✅ Listo
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
