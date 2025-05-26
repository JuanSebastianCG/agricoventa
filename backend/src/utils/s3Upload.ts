import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import crypto from 'crypto';

// Acceder a las variables de entorno que el usuario proporcionó
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const S3_UPLOADS_BUCKET = process.env.AWS_S3_UPLOADS_BUCKET || 'images-agricoventa';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Verificar que las variables esenciales estén definidas
if (!S3_UPLOADS_BUCKET) {
  console.error("Error: La variable de entorno AWS_S3_UPLOADS_BUCKET no está configurada.");
}

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error("Advertencia: AWS_ACCESS_KEY_ID o AWS_SECRET_ACCESS_KEY no están configuradas. Se utilizará el rol IAM de la instancia si está disponible.");
}

// Configurar el cliente S3 con las credenciales proporcionadas
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  } : undefined // Si no hay credenciales, se usará el rol IAM
});

// Log para depuración
console.log(`Configurando S3 con bucket: ${S3_UPLOADS_BUCKET}, región: ${AWS_REGION}`);

// Función para generar nombres de archivo únicos
const generateFilename = (originalname: string): string => {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const extension = path.extname(originalname);
  const basename = path.basename(originalname, extension);
  return `${basename}-${randomBytes}${extension}`;
};

// Función para crear middleware de subida según el tipo de archivo
export const createS3Upload = (folderName: string, allowedMimeTypes: RegExp) => {
  if (!S3_UPLOADS_BUCKET) {
    console.error(`Error: S3_UPLOADS_BUCKET no configurado al intentar crear uploader para ${folderName}`);
    // Configuración de emergencia si falló el S3
    return multer({
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        cb(new Error("S3 bucket no está configurado correctamente. No se pueden subir archivos."));
      }
    });
  }

  return multer({
    storage: multerS3({
      s3: s3Client,
      bucket: S3_UPLOADS_BUCKET,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const filename = generateFilename(file.originalname);
        const fullPath = `${folderName}/${filename}`;
        console.log(`Generando clave S3: ${fullPath}`);
        cb(null, fullPath);
      },
    }),
    fileFilter: (req, file, cb) => {
      console.log(`Verificando tipo MIME: ${file.mimetype} contra patrón: ${allowedMimeTypes}`);
      if (allowedMimeTypes.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Por favor, sube un tipo de archivo válido.`));
      }
    },
    limits: {
      fileSize: 1024 * 1024 * 10, // Límite de 10MB
    },
  });
};

// Función para obtener la URL completa de un objeto S3
export const getS3ObjectUrl = (key: string): string => {
  if (!S3_UPLOADS_BUCKET) return '';
  return `https://${S3_UPLOADS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
};

// Función para extraer la clave de S3 de una URL
export const getS3KeyFromUrl = (url: string): string | null => {
  if (!S3_UPLOADS_BUCKET || !url) return null;
  
  const regex = new RegExp(`https://${S3_UPLOADS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/(.*)`);
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Podrías añadir una función para borrar objetos si es necesario
// import { DeleteObjectCommand } from "@aws-sdk/client-s3";
// export const deleteS3Object = async (key: string) => {
//   if (!S3_UPLOADS_BUCKET) throw new Error("Bucket no configurado");
//   const deleteParams = {
//     Bucket: S3_UPLOADS_BUCKET,
//     Key: key,
//   };
//   try {
//     await s3Client.send(new DeleteObjectCommand(deleteParams));
//     console.log(`Objeto ${key} eliminado de S3.`);
//   } catch (error) {
//     console.error(`Error eliminando objeto ${key} de S3:`, error);
//     throw error;
//   }
// }; 