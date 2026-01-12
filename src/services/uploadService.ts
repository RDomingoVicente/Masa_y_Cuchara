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

/**
 * Crea una miniatura de una imagen
 * 
 * @param file - Archivo de imagen original
 * @param maxWidth - Ancho máximo de la miniatura (default: 200)
 * @param maxHeight - Alto máximo de la miniatura (default: 200)
 * @returns Promise con el archivo de la miniatura
 */
export async function createThumbnail(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calcular dimensiones manteniendo aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Crear canvas y redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto del canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir canvas a blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo crear la miniatura'));
              return;
            }
            
            // Crear archivo con nombre modificado
            const thumbnailFile = new File(
              [blob],
              `thumb_${file.name}`,
              { type: file.type }
            );
            
            resolve(thumbnailFile);
          },
          file.type,
          0.85 // Calidad de compresión
        );
      };
      
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}
