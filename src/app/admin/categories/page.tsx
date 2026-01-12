'use client';

import { useEffect, useState } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Category } from '@/types/index';
import { brandConfig } from '@/config/brand';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesRef = collection(db, 'CATEGORIES');
      const snapshot = await getDocs(categoriesRef);
      
      const categoriesData: Category[] = [];
      snapshot.forEach((docSnap) => {
        categoriesData.push({
          ...docSnap.data(),
          category_id: docSnap.id,
        } as Category);
      });

      // Sort alphabetically by name
      categoriesData.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      showNotification('error', 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Los productos que la usen quedarán sin categoría.')) return;

    try {
      await deleteDoc(doc(db, 'CATEGORIES', categoryId));
      showNotification('success', 'Categoría eliminada');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showNotification('error', 'Error al eliminar categoría');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleFormSuccess = () => {
    showNotification('success', editingCategory ? 'Categoría actualizada' : 'Categoría creada');
    handleFormClose();
    loadCategories();
  };

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
              📂 Gestión de Categorías
            </h1>
            <p className="text-gray-600 text-lg">
              {categories.length} categorías configuradas
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            style={{
              background: brandConfig.gradients.accent,
              color: 'white',
            }}
          >
            + Nueva Categoría
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-xl ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {/* Categories Table */}
      {loading ? (
        <CategoriesSkeleton />
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: brandConfig.kds.table.headerBg }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase" style={{ color: brandConfig.kds.table.headerText }}>
                    Imagen
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase" style={{ color: brandConfig.kds.table.headerText }}>
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase" style={{ color: brandConfig.kds.table.headerText }}>
                    ID
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase" style={{ color: brandConfig.kds.table.headerText }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <CategoryRow
                    key={category.category_id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          existingOrders={categories.map(c => c.display_order || 0)}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

function CategoryRow({ category, onEdit, onDelete }: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%239ca3af'%3E📂%3C/text%3E%3C/svg%3E";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Image */}
      <td className="px-6 py-4">
        <img
          src={imgError ? placeholderImage : (category.image_url || placeholderImage)}
          alt={category.name}
          className="w-16 h-16 object-cover rounded-lg"
          onError={() => setImgError(true)}
        />
      </td>

      {/* Category Name */}
      <td className="px-6 py-4">
        <div className="font-bold text-lg text-gray-900">{category.name}</div>
      </td>

      {/* ID */}
      <td className="px-6 py-4">
        <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {category.category_id}
        </code>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => onEdit(category)}
            className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-lg"
            style={{
              background: brandConfig.gradients.primary,
              color: 'white',
            }}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(category.category_id)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all"
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function CategoryForm({ category, existingOrders, onClose, onSuccess }: {
  category: Category | null;
  existingOrders: number[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    image_url: category?.image_url || '',
    display_order: category?.display_order?.toString() || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.image_url.trim()) newErrors.image_url = 'La URL de imagen es requerida';
    
    const order = parseInt(formData.display_order);
    if (formData.display_order && (isNaN(order) || order < 0)) {
      newErrors.display_order = 'El orden debe ser un número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSaving(true);

      const categoryData = {
        name: formData.name.trim(),
        image_url: formData.image_url.trim(),
        display_order: formData.display_order ? parseInt(formData.display_order) : undefined,
      };

      if (category) {
        // Update
        await updateDoc(doc(db, 'CATEGORIES', category.category_id), categoryData);
      } else {
        // Create - use name as ID (lowercase, with hyphens)
        const categoryId = formData.name.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
          .replace(/\s+/g, '-'); // Replace spaces with hyphens

        await addDoc(collection(db, 'CATEGORIES'), {
          ...categoryData,
          category_id: categoryId,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-3xl font-bold" style={{ color: brandConfig.colors.primary[600] }}>
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Ej: Arroces"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              URL de Imagen *
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com/category-image.jpg"
            />
            {errors.image_url && <p className="text-red-600 text-sm mt-1">{errors.image_url}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Tamaño recomendado: 400x300px
            </p>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Orden de visualización
            </label>
            <input
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="1, 2, 3..."
            />
            {errors.display_order && <p className="text-red-600 text-sm mt-1">{errors.display_order}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Orden en que aparecerá en los listados (menor número = primero)
            </p>
          </div>

          {/* Preview */}
          {formData.image_url && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Vista previa
              </label>
              <img
                src={formData.image_url}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg font-bold text-white"
              style={{ background: brandConfig.gradients.accent }}
              disabled={saving}
            >
              {saving ? 'Guardando...' : (category ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
