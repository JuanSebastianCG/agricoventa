import * as fs from 'fs';
import * as path from 'path';

// Configuración
const IMAGE_DIRS = [
  'uploads/products',
  'uploads/certifications',
  'uploads/profiles'
];

// Imágenes de muestra para cada categoría
const SAMPLE_IMAGES = [
  { filename: 'fruits.jpg', url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=600' },
  { filename: 'vegetables.jpg', url: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=600' },
  { filename: 'grains.jpg', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600' },
  { filename: 'coffee.jpg', url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=600' },
  { filename: 'dairy.jpg', url: 'https://images.unsplash.com/photo-1628689469838-524a4a973b8e?q=80&w=600' },
  { filename: 'herbs.jpg', url: 'https://images.unsplash.com/photo-1600508696361-3165634e938b?q=80&w=600' },
  { filename: 'honey.jpg', url: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?q=80&w=600' },
  { filename: 'default.jpg', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600' },
  { filename: 'additional.jpg', url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=600' }
];

/**
 * Crea los directorios necesarios si no existen
 */
function createDirectories() {
  console.log('🗂️ Creando directorios necesarios...');
  
  IMAGE_DIRS.forEach(dir => {
    const dirPath = path.resolve(process.cwd(), dir);
    
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Directorio creado: ${dirPath}`);
      } catch (error) {
        console.error(`❌ Error al crear directorio ${dirPath}:`, error);
      }
    } else {
      console.log(`ℹ️ El directorio ya existe: ${dirPath}`);
    }
  });
}

/**
 * Descarga una imagen desde una URL
 * @param url URL de la imagen
 * @param outputPath Ruta donde guardar la imagen
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  try {
    // Verificar si la imagen ya existe
    if (fs.existsSync(outputPath)) {
      console.log(`ℹ️ La imagen ya existe: ${outputPath}`);
      return;
    }
    
    console.log(`📥 Descargando imagen desde ${url}...`);
    
    // Descargar la imagen usando fetch
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error al descargar imagen: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    
    console.log(`✅ Imagen guardada en: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error al descargar imagen ${url}:`, error);
    
    // Si la descarga falla, crear una imagen de marcador de posición simple
    try {
      createPlaceholderImage(outputPath);
    } catch (placeholderError) {
      console.error(`❌ No se pudo crear imagen de marcador de posición:`, placeholderError);
    }
  }
}

/**
 * Crea una imagen de marcador de posición simple si la descarga falla
 * @param outputPath Ruta donde guardar la imagen
 */
function createPlaceholderImage(outputPath: string): void {
  const placeholderContent = `
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#666">
        Imagen de muestra
      </text>
    </svg>
  `;
  
  fs.writeFileSync(outputPath, placeholderContent);
  console.log(`ℹ️ Imagen de marcador de posición creada en: ${outputPath}`);
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🌱 Iniciando configuración de imágenes para productos...');
    
    // Crear directorios necesarios
    createDirectories();
    
    // Descargar imágenes de muestra
    console.log('🖼️ Descargando imágenes de muestra...');
    
    const productImagesDir = path.resolve(process.cwd(), 'uploads/products');
    
    for (const image of SAMPLE_IMAGES) {
      const outputPath = path.join(productImagesDir, image.filename);
      await downloadImage(image.url, outputPath);
    }
    
    console.log('🎉 Configuración de imágenes completada');
  } catch (error) {
    console.error('❌ Error en la configuración de imágenes:', error);
  }
}

// Ejecutar la función principal
main()
  .then(() => console.log('✅ Script de configuración de imágenes completado'))
  .catch(e => console.error('💥 Error en script de configuración de imágenes:', e)); 