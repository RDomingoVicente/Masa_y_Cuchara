/**
 * Servicio de subida de imágenes a Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

/**
 * Sube una imagen a Firebase Storage y devuelve la URL pública
 * 
 * @param file - Archivo de imagen a subir
 * @param folder - Carpeta destino en Storage (ej: 'products', 'categories')
 * @returns URL pública de descarga de la imagen
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  try {
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${folder}/${fileName}`;

    // Crear referencia en Storage
    const storageRef = ref(storage, filePath);

    // Subir archivo
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Error al subir la imagen. Por favor, intenta de nuevo.');
  }
}

/**
 * Valida que el archivo sea una imagen válida
 * 
 * @param file - Archivo a validar
 * @returns true si es válido, false si no
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato no válido. Usa JPG, PNG, WEBP o GIF.',
    };
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB en bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'La imagen es demasiado grande. Máximo 5MB.',
    };
  }

  return { valid: true };
}
