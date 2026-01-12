'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Order } from '@/types/index';
import { brandConfig } from '@/config/brand';

export default function CustomerDisplayPage() {
  const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const previousReadyIds = useRef<Set<string>>(new Set());

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Suscripción a pedidos en tiempo real
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const ordersRef = collection(db, 'ORDERS');
    const q = query(
      ordersRef,
      where('logistics.order_date', '==', today),
      where('workflow.status', 'in', ['PREPARING', 'READY'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const preparing: Order[] = [];
      const ready: Order[] = [];
      
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

        if (order.workflow.status === 'PREPARING') {
          preparing.push(order);
        } else if (order.workflow.status === 'READY') {
          ready.push(order);
        }
      });

      // Detectar nuevos pedidos listos y reproducir sonido
      const currentReadyIds = new Set(ready.map(o => o.order_id));
      const newReadyOrders = ready.filter(o => !previousReadyIds.current.has(o.order_id));
      
      if (newReadyOrders.length > 0) {
        playNotificationSound();
      }
      
      previousReadyIds.current = currentReadyIds;

      setPreparingOrders(preparing);
      setReadyOrders(ready);
    });

    return () => unsubscribe();
  }, []);

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = () => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dayName = days[currentTime.getDay()];
    const day = currentTime.getDate();
    const month = months[currentTime.getMonth()];
    const year = currentTime.getFullYear();
    
    return `${dayName}, ${day} de ${month} de ${year}`;
  };

  const getOrderDisplay = (order: Order) => {
    return order.customer.display_name || `#${order.order_id.slice(-6).toUpperCase()}`;
  };

  return (
    <div className="min-h-screen p-6" style={{ background: brandConfig.gradients.background }}>
      {/* Header - Similar al KDS */}
      <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{
              background: brandConfig.gradients.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              🍽️ {brandConfig.brand.name} - Pantalla de Recogida
            </h1>
            <p className="text-gray-600 text-lg">{formatDate()}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Hora actual</div>
            <div className="text-5xl font-bold" style={{ color: brandConfig.colors.primary[600] }}>
              {formatTime()}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout - Similar al KDS */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - PREPARING */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header Table Style */}
          <div className="px-6 py-4" style={{ background: brandConfig.gradients.secondary }}>
            <h2 className="text-3xl font-bold text-center" style={{ color: brandConfig.components.button.secondary.text }}>
              👨‍🍳 PREPARANDO
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-gray-600 text-2xl font-semibold">No hay pedidos en preparación</p>
              </div>
            ) : (
              <div className="space-y-4">
                {preparingOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="p-6 rounded-xl transition-all"
                    style={{ 
                      backgroundColor: brandConfig.kds.statusColors.preparing.bg,
                      border: `3px solid ${brandConfig.kds.statusColors.preparing.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-bold mb-2" style={{ color: brandConfig.colors.text.primary }}>
                          {getOrderDisplay(order)}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          #{order.order_id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Entrega:</div>
                        <div className="text-3xl font-bold" style={{ color: brandConfig.colors.primary[500] }}>
                          {order.logistics.slot_id}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - READY */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header Table Style */}
          <div className="px-6 py-4" style={{ background: brandConfig.gradients.accent }}>
            <h2 className="text-3xl font-bold text-center text-white">
              ✅ ¡LISTO PARA RECOGER!
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            {readyOrders.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-gray-600 text-2xl font-semibold">No hay pedidos listos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {readyOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="p-8 rounded-xl animate-pulse-slow transition-all"
                    style={{ 
                      background: `linear-gradient(135deg, ${brandConfig.colors.accent[50]} 0%, ${brandConfig.colors.accent[100]} 100%)`,
                      border: `4px solid ${brandConfig.colors.status.ready}`,
                      boxShadow: `0 0 30px ${brandConfig.colors.status.ready}40`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-6xl font-extrabold mb-2" style={{ 
                          color: brandConfig.colors.status.ready,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                        }}>
                          {getOrderDisplay(order)}
                        </div>
                        <div className="text-lg text-gray-600 font-mono">
                          Pedido #{order.order_id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{
                          background: brandConfig.gradients.accent,
                        }}>
                          ✅
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.95;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
