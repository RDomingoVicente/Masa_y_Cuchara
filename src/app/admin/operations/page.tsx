'use client';

import { useEffect, useState } from 'react';
import { 
  collection, 
  getDocs, 
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product, DailyOperation } from '@/types/index';
import { brandConfig } from '@/config/brand';

export default function OperationsManagementPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [products, setProducts] = useState<Product[]>([]);
  const [dailyOp, setDailyOp] = useState<DailyOperation | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadDailyOperation();
  }, [selectedDate]);

  const loadDailyOperation = async () => {
    try {
      setLoading(true);
      const opRef = doc(db, 'DAILY_OPERATION', selectedDate);
      const opSnap = await getDoc(opRef);

      if (opSnap.exists()) {
        setDailyOp(opSnap.data() as DailyOperation);
      } else {
        setDailyOp(null);
      }
    } catch (error) {
      console.error('Error loading daily operation:', error);
      showNotification('error', 'Error al cargar operación diaria');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const catalogRef = collection(db, 'CATALOG');
      const snapshot = await getDocs(catalogRef);
      
      const productsData: Product[] = [];
      snapshot.forEach((docSnap) => {
        const product = {
          ...docSnap.data(),
          product_id: docSnap.id,
        } as Product;
        
        // Only active products
        if (product.is_active) {
          productsData.push(product);
        }
      });

      setProducts(productsData);
      return productsData;
    } catch (error) {
      console.error('Error loading catalog:', error);
      showNotification('error', 'Error al cargar catálogo');
      return [];
    }
  };

  const handleImportCatalog = async () => {
    if (!confirm('¿Importar catálogo activo para este día?')) return;

    try {
      setLoading(true);
      const catalogProducts = await loadCatalog();

      if (catalogProducts.length === 0) {
        showNotification('error', 'No hay productos activos en el catálogo');
        return;
      }

      // Create products_snapshot
      const productsSnapshot: Record<string, any> = {};
      catalogProducts.forEach(product => {
        productsSnapshot[product.product_id] = {
          product_id: product.product_id,
          name: product.name,
          base_price: product.base_price,
          category_id: product.category_id, // Updated to use category_id
          available_stock: 50, // Default stock
          is_available: true,
          modifiers_schema: product.modifiers_schema || [], // Fallback for compatibility
        };
      });

      // Create or update daily operation
      const opRef = doc(db, 'DAILY_OPERATION', selectedDate);
      const newDailyOp = {
        products_snapshot: productsSnapshot,
        time_slots_occupancy: dailyOp?.time_slots_occupancy || {},
      };

      await setDoc(opRef, newDailyOp);
      
      showNotification('success', `Catálogo importado: ${catalogProducts.length} productos`);
      loadDailyOperation();
    } catch (error) {
      console.error('Error importing catalog:', error);
      showNotification('error', 'Error al importar catálogo');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId: string, newStock: number) => {
    if (!dailyOp) return;

    try {
      const opRef = doc(db, 'DAILY_OPERATION', selectedDate);
      await updateDoc(opRef, {
        [`products_snapshot.${productId}.available_stock`]: newStock,
      });

      // Update local state
      setDailyOp({
        ...dailyOp,
        products_snapshot: {
          ...dailyOp.products_snapshot,
          [productId]: {
            ...dailyOp.products_snapshot[productId],
            available_stock: newStock,
          },
        },
      });

      showNotification('success', 'Stock actualizado');
    } catch (error) {
      console.error('Error updating stock:', error);
      showNotification('error', 'Error al actualizar stock');
    }
  };

  const handleSlotUpdate = async (slotId: string, maxOrders: number) => {
    if (!dailyOp) return;

    try {
      const opRef = doc(db, 'DAILY_OPERATION', selectedDate);
      const currentOccupancy = dailyOp.time_slots_occupancy[slotId] || 0;

      await updateDoc(opRef, {
        [`time_slots_occupancy.${slotId}`]: currentOccupancy,
      });

      // Note: max_orders is stored in SETTINGS, not in DAILY_OPERATION
      // This is just for display purposes
      showNotification('success', 'Configuración de slot actualizada');
    } catch (error) {
      console.error('Error updating slot:', error);
      showNotification('error', 'Error al actualizar slot');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const productsList = dailyOp ? Object.entries(dailyOp.products_snapshot) : [];

  return (
    <div className="min-h-screen p-6" style={{ background: brandConfig.gradients.background }}>
      {/* Header */}
      <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-4xl font-bold mb-4" style={{
          background: brandConfig.gradients.primary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          📅 Gestión de Operación Diaria
        </h1>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Fecha de Operación
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 border-2 rounded-lg text-lg font-semibold"
              style={{ borderColor: brandConfig.colors.primary[300] }}
            />
          </div>

          <div className="flex-1"></div>

          <button
            onClick={handleImportCatalog}
            disabled={loading}
            className="px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            style={{
              background: brandConfig.gradients.accent,
              color: 'white',
            }}
          >
            📦 Importar Catálogo
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-xl ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {loading ? (
        <OperationsSkeleton />
      ) : !dailyOp ? (
        <div className="bg-white rounded-2xl shadow-lg p-20 text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 text-2xl mb-4 font-semibold">
            No hay operación configurada para {selectedDate}
          </p>
          <p className="text-gray-400 text-lg mb-6">
            Importa el catálogo para comenzar
          </p>
          <button
            onClick={handleImportCatalog}
            className="px-8 py-4 rounded-xl font-bold text-lg"
            style={{
              background: brandConfig.gradients.accent,
              color: 'white',
            }}
          >
            📦 Importar Catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stock Management */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4" style={{ background: brandConfig.gradients.primary }}>
              <h2 className="text-2xl font-bold text-white">
                📊 Control de Stock
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productsList.map(([productId, productData]) => (
                  <StockCard
                    key={productId}
                    productId={productId}
                    productData={productData}
                    onUpdate={handleStockUpdate}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4" style={{ background: brandConfig.gradients.secondary }}>
              <h2 className="text-2xl font-bold text-white">
                🕐 Configuración de Slots
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generateTimeSlots().map((slot) => (
                  <SlotCard
                    key={slot}
                    slotId={slot}
                    occupancy={dailyOp.time_slots_occupancy[slot] || 0}
                    onUpdate={handleSlotUpdate}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StockCard({ productId, productData, onUpdate }: {
  productId: string;
  productData: any;
  onUpdate: (productId: string, stock: number) => void;
}) {
  const [stock, setStock] = useState(productData.available_stock || 0);

  const handleSave = () => {
    onUpdate(productId, stock);
  };

  return (
    <div className="border-2 rounded-xl p-4" style={{ borderColor: brandConfig.colors.primary[200] }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{productData.name}</h3>
          <p className="text-sm text-gray-500">{productData.category}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(parseInt(e.target.value) || 0)}
          className="flex-1 px-3 py-2 border rounded-lg text-center font-bold text-lg"
        />
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg font-semibold text-white"
          style={{ background: brandConfig.gradients.accent }}
        >
          ✓
        </button>
      </div>
    </div>
  );
}

function SlotCard({ slotId, occupancy, onUpdate }: {
  slotId: string;
  occupancy: number;
  onUpdate: (slotId: string, maxOrders: number) => void;
}) {
  return (
    <div className="border-2 rounded-xl p-4 text-center" style={{ borderColor: brandConfig.colors.secondary[200] }}>
      <div className="text-2xl font-bold mb-2" style={{ color: brandConfig.colors.primary[600] }}>
        {slotId}
      </div>
      <div className="text-sm text-gray-600 mb-2">
        Pedidos: {occupancy}
      </div>
      <div className="text-xs text-gray-400">
        Capacidad configurada en SETTINGS
      </div>
    </div>
  );
}

function OperationsSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 12; hour <= 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 21) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
}
