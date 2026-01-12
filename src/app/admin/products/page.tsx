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
import type { Product, Category, ModifierGroup } from '@/types/index';
import { brandConfig } from '@/config/brand';
import { uploadImage, validateImageFile } from '@/services/uploadService';

export default function ProductsManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadModifierGroups(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const productsRef = collection(db, 'CATALOG');
    const snapshot = await getDocs(productsRef);
    
    const productsData: Product[] = [];
    snapshot.forEach((docSnap) => {
      productsData.push({
        ...docSnap.data(),
        product_id: docSnap.id,
      } as Product);
    });

    setProducts(productsData);
  };

  const loadCategories = async () => {
    const categoriesRef = collection(db, 'CATEGORIES');
    const snapshot = await getDocs(categoriesRef);
    
    const categoriesData: Category[] = [];
    snapshot.forEach((docSnap) => {
      categoriesData.push({
        ...docSnap.data(),
        category_id: docSnap.id,
      } as Category);
    });

    // Sort by display_order
    categoriesData.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    setCategories(categoriesData);
  };

  const loadModifierGroups = async () => {
    const modifiersRef = collection(db, 'MODIFIERS');
    const snapshot = await getDocs(modifiersRef);
    
    const modifiersData: ModifierGroup[] = [];
    snapshot.forEach((docSnap) => {
      modifiersData.push({
        ...docSnap.data(),
        group_id: docSnap.id,
      } as ModifierGroup);
    });

    setModifierGroups(modifiersData);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await deleteDoc(doc(db, 'CATALOG', productId));
      showNotification('success', 'Producto eliminado');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('error', 'Error al eliminar producto');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    showNotification('success', editingProduct ? 'Producto actualizado' : 'Producto creado');
    handleFormClose();
    loadProducts();
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.category_id === categoryId);
    return category?.name || categoryId;
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
              📦 Gestión de Productos
            </h1>
            <p className="text-gray-600 text-lg">
              {products.length} productos en catálogo
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
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-xl ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <ProductsSkeleton />
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
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase" style={{ color: brandConfig.kds.table.headerText }}>
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase" style={{ color: brandConfig.kds.table.headerText }}>
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase" style={{ color: brandConfig.kds.table.headerText }}>
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase" style={{ color: brandConfig.kds.table.headerText }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <ProductRow
                    key={product.product_id}
                    product={product}
                    categoryName={getCategoryName(product.category_id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          modifierGroups={modifierGroups}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

function ProductRow({ product, categoryName, onEdit, onDelete }: {
  product: Product;
  categoryName: string;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}) {
  const priceInEuros = (product.base_price / 100).toFixed(2);
  const [imgError, setImgError] = useState(false);

  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%239ca3af'%3E📦%3C/text%3E%3C/svg%3E";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <img
          src={imgError ? placeholderImage : (product.thumbnail_url || product.image_url || placeholderImage)}
          alt={product.name}
          className="w-16 h-16 object-cover rounded-lg"
          onError={() => setImgError(true)}
        />
      </td>

      <td className="px-6 py-4">
        <div className="font-bold text-lg text-gray-900">{product.name}</div>
        {product.description && (
          <div className="text-sm text-gray-500 mt-1">{product.description}</div>
        )}
      </td>

      <td className="px-6 py-4">
        <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{
          backgroundColor: brandConfig.colors.primary[100],
          color: brandConfig.colors.primary[700],
        }}>
          {categoryName}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="text-2xl font-bold" style={{ color: brandConfig.colors.primary[600] }}>
          €{priceInEuros}
        </div>
      </td>

      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {product.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => onEdit(product)}
            className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-lg"
            style={{
              background: brandConfig.gradients.primary,
              color: 'white',
            }}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(product.product_id)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all"
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductForm({ product, categories, modifierGroups, onClose, onSuccess }: {
  product: Product | null;
  categories: Category[];
  modifierGroups: ModifierGroup[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    price: product ? (product.base_price / 100).toString() : '',
    image_url: product?.image_url || '',
    thumbnail_url: product?.thumbnail_url || '',
    is_active: product?.is_active ?? true,
    allowed_modifier_groups: product?.allowed_modifier_groups || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors({ ...errors, image: validation.error || 'Error de validación' });
      return;
    }

    try {
      setUploading(true);
      setErrors({ ...errors, image: '' });

      // Upload to Firebase Storage
      const imageUrl = await uploadImage(file, 'products');

      // Update form data
      setFormData({ ...formData, image_url: imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors({ ...errors, image: 'Error al subir la imagen' });
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.category_id) newErrors.category_id = 'La categoría es requerida';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'El precio debe ser mayor a 0';
    if (!formData.image_url.trim()) newErrors.image_url = 'La URL de imagen es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSaving(true);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        allowed_modifier_groups: formData.allowed_modifier_groups,
        base_price: Math.round(parseFloat(formData.price) * 100),
        image_url: formData.image_url.trim(),
        thumbnail_url: formData.thumbnail_url.trim() || undefined,
        is_active: formData.is_active,
        allergens: product?.allergens || [],
      };

      if (product) {
        await updateDoc(doc(db, 'CATALOG', product.product_id), productData);
      } else {
        await addDoc(collection(db, 'CATALOG'), productData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const toggleModifierGroup = (groupId: string) => {
    const current = formData.allowed_modifier_groups;
    if (current.includes(groupId)) {
      setFormData({
        ...formData,
        allowed_modifier_groups: current.filter(id => id !== groupId),
      });
    } else {
      setFormData({
        ...formData,
        allowed_modifier_groups: [...current, groupId],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-3xl font-bold" style={{ color: brandConfig.colors.primary[600] }}>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
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
              placeholder="Ej: Paella Valenciana"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Descripción del producto"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-red-600 text-sm mt-1">{errors.category_id}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Precio (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="12.50"
            />
            {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
          </div>

          {/* Modifier Groups */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Grupos de Modificadores
            </label>
            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
              {modifierGroups.map((group) => (
                <label key={group.group_id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowed_modifier_groups.includes(group.group_id)}
                    onChange={() => toggleModifierGroup(group.group_id)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{group.name}</div>
                    <div className="text-xs text-gray-500">
                      {group.options.length} opciones • {group.required ? 'Requerido' : 'Opcional'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona los modificadores que se pueden aplicar a este producto
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Subir Imagen *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading || saving}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {uploading && (
              <p className="text-blue-600 text-sm mt-1">⏳ Subiendo imagen...</p>
            )}
            {errors.image && <p className="text-red-600 text-sm mt-1">{errors.image}</p>}
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, WEBP o GIF. Máximo 5MB.
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              URL de Imagen {formData.image_url && '✓'}
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com/image.jpg"
              readOnly={uploading}
            />
            {errors.image_url && <p className="text-red-600 text-sm mt-1">{errors.image_url}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Se completa automáticamente al subir una imagen
            </p>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              URL de Miniatura (opcional)
            </label>
            <input
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5"
            />
            <label htmlFor="is_active" className="text-sm font-bold text-gray-700">
              Producto activo
            </label>
          </div>

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
              {saving ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductsSkeleton() {
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
