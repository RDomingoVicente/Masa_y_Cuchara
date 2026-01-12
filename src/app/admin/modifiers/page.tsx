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
import type { ModifierGroup, ModifierOption } from '@/types/index';
import { brandConfig } from '@/config/brand';

export default function ModifiersManagementPage() {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadModifierGroups();
  }, []);

  const loadModifierGroups = async () => {
    try {
      setLoading(true);
      const modifiersRef = collection(db, 'MODIFIERS');
      const snapshot = await getDocs(modifiersRef);
      
      const groupsData: ModifierGroup[] = [];
      snapshot.forEach((docSnap) => {
        groupsData.push({
          ...docSnap.data(),
          group_id: docSnap.id,
        } as ModifierGroup);
      });

      setModifierGroups(groupsData);
    } catch (error) {
      console.error('Error loading modifier groups:', error);
      showNotification('error', 'Error al cargar grupos de modificadores');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEdit = (group: ModifierGroup) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('¿Estás seguro de eliminar este grupo? Los productos que lo usen perderán esta opción.')) return;

    try {
      await deleteDoc(doc(db, 'MODIFIERS', groupId));
      showNotification('success', 'Grupo eliminado');
      loadModifierGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      showNotification('error', 'Error al eliminar grupo');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGroup(null);
  };

  const handleFormSuccess = () => {
    showNotification('success', editingGroup ? 'Grupo actualizado' : 'Grupo creado');
    handleFormClose();
    loadModifierGroups();
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
              🔧 Gestión de Modificadores
            </h1>
            <p className="text-gray-600 text-lg">
              {modifierGroups.length} grupos de modificadores configurados
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
            + Nuevo Grupo
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-xl ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {/* Modifier Groups List */}
      {loading ? (
        <ModifiersSkeleton />
      ) : (
        <div className="space-y-6">
          {modifierGroups.map((group) => (
            <ModifierGroupCard
              key={group.group_id}
              group={group}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modifier Form Modal */}
      {showForm && (
        <ModifierGroupForm
          group={editingGroup}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

function ModifierGroupCard({ group, onEdit, onDelete }: {
  group: ModifierGroup;
  onEdit: (group: ModifierGroup) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h3>
          <div className="flex gap-4 text-sm">
            <span className={`px-3 py-1 rounded-full font-semibold ${
              group.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {group.required ? 'Requerido' : 'Opcional'}
            </span>
            {group.max_selections && (
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                Máx: {group.max_selections} selecciones
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-semibold">
              {group.options.length} opciones
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(group)}
            className="px-4 py-2 rounded-lg font-semibold transition-all hover:shadow-lg"
            style={{
              background: brandConfig.gradients.primary,
              color: 'white',
            }}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(group.group_id)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Options List */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {group.options.map((option) => (
          <div key={option.option_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-semibold text-gray-900">{option.name}</span>
            <span className="text-sm font-bold" style={{ color: brandConfig.colors.primary[600] }}>
              {option.price_extra === 0 ? 'Gratis' : `+€${(option.price_extra / 100).toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModifierGroupForm({ group, onClose, onSuccess }: {
  group: ModifierGroup | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    required: group?.required ?? false,
    max_selections: group?.max_selections?.toString() || '1',
  });
  const [options, setOptions] = useState<ModifierOption[]>(group?.options || []);
  const [newOption, setNewOption] = useState({ name: '', price_extra: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (options.length === 0) newErrors.options = 'Debe agregar al menos una opción';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addOption = () => {
    if (!newOption.name.trim()) return;

    const option: ModifierOption = {
      option_id: newOption.name.toLowerCase().replace(/\s+/g, '-'),
      name: newOption.name.trim(),
      price_extra: Math.round(parseFloat(newOption.price_extra || '0') * 100),
    };

    setOptions([...options, option]);
    setNewOption({ name: '', price_extra: '' });
  };

  const removeOption = (optionId: string) => {
    setOptions(options.filter(opt => opt.option_id !== optionId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSaving(true);

      const groupData = {
        name: formData.name.trim(),
        required: formData.required,
        max_selections: parseInt(formData.max_selections) || 1,
        options: options,
      };

      if (group) {
        await updateDoc(doc(db, 'MODIFIERS', group.group_id), groupData);
      } else {
        const groupId = formData.name.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');

        await addDoc(collection(db, 'MODIFIERS'), {
          ...groupData,
          group_id: groupId,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving modifier group:', error);
      alert('Error al guardar el grupo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-3xl font-bold" style={{ color: brandConfig.colors.primary[600] }}>
            {group ? 'Editar Grupo de Modificadores' : 'Nuevo Grupo de Modificadores'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Nombre del Grupo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Ej: Tamaño, Extras, Punto de Carne"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Required & Max Selections */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="required"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="required" className="text-sm font-bold text-gray-700">
                Requerido
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Máx. selecciones
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_selections}
                onChange={(e) => setFormData({ ...formData, max_selections: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Opciones *
            </label>
            
            {/* Add Option Form */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newOption.name}
                onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg"
                placeholder="Nombre de la opción"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
              />
              <input
                type="number"
                step="0.01"
                value={newOption.price_extra}
                onChange={(e) => setNewOption({ ...newOption, price_extra: e.target.value })}
                className="w-32 px-4 py-2 border rounded-lg"
                placeholder="Precio €"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
              />
              <button
                type="button"
                onClick={addOption}
                className="px-6 py-2 rounded-lg font-bold text-white"
                style={{ background: brandConfig.gradients.accent }}
              >
                + Agregar
              </button>
            </div>

            {/* Options List */}
            <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
              {options.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No hay opciones agregadas</p>
              ) : (
                options.map((option) => (
                  <div key={option.option_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-semibold">{option.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ color: brandConfig.colors.primary[600] }}>
                        {option.price_extra === 0 ? 'Gratis' : `+€${(option.price_extra / 100).toFixed(2)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOption(option.option_id)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {errors.options && <p className="text-red-600 text-sm mt-1">{errors.options}</p>}
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
              {saving ? 'Guardando...' : (group ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModifiersSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div key={j} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
