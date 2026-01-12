'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { brandConfig } from '@/config/brand';

interface GlobalSettings {
  max_orders_per_slot: number;
  cutoff_time: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Form state
  const [maxOrders, setMaxOrders] = useState(5);
  const [cutoffTime, setCutoffTime] = useState('22:00');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'SETTINGS', 'global');
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data() as GlobalSettings;
        setSettings(data);
        setMaxOrders(data.max_orders_per_slot);
        setCutoffTime(data.cutoff_time);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification('error', 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const settingsRef = doc(db, 'SETTINGS', 'global');
      
      await updateDoc(settingsRef, {
        max_orders_per_slot: maxOrders,
        cutoff_time: cutoffTime,
      });

      setSettings({
        max_orders_per_slot: maxOrders,
        cutoff_time: cutoffTime,
      });

      showNotification('success', 'Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('error', 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{
          background: brandConfig.gradients.primary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          ⚙️ Configuración del Sistema
        </h1>
        <p className="text-xl text-gray-600">
          Ajusta los parámetros globales de operación
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-xl ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <div className="max-w-3xl">
          {/* Settings Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: brandConfig.colors.primary[700] }}>
              Configuración Global
            </h2>

            <div className="space-y-6">
              {/* Max Orders Per Slot */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Pedidos Máximos por Slot
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Número máximo de pedidos que se pueden aceptar en cada intervalo de tiempo
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxOrders}
                    onChange={(e) => setMaxOrders(parseInt(e.target.value) || 1)}
                    className="w-32 px-4 py-3 border-2 rounded-lg text-lg font-bold text-center"
                    style={{ borderColor: brandConfig.colors.primary[300] }}
                  />
                  <span className="text-gray-600">pedidos por slot</span>
                </div>
              </div>

              {/* Cutoff Time */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hora de Cierre de Pedidos
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Hora límite hasta la cual se aceptan pedidos para el día
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="time"
                    value={cutoffTime}
                    onChange={(e) => setCutoffTime(e.target.value)}
                    className="px-4 py-3 border-2 rounded-lg text-lg font-semibold"
                    style={{ borderColor: brandConfig.colors.primary[300] }}
                  />
                  <span className="text-gray-600">formato 24h</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                style={{ background: brandConfig.gradients.accent }}
              >
                {saving ? 'Guardando...' : '💾 Guardar Configuración'}
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              title="📊 Valores Actuales"
              items={[
                `Pedidos por slot: ${settings?.max_orders_per_slot || '-'}`,
                `Hora de cierre: ${settings?.cutoff_time || '-'}`,
              ]}
            />
            <InfoCard
              title="ℹ️ Información"
              items={[
                'Los cambios se aplican inmediatamente',
                'Afecta a todos los días de operación',
                'Los slots se generan de 12:00 a 21:00',
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, items }: {
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold mb-4" style={{ color: brandConfig.colors.primary[700] }}>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}
