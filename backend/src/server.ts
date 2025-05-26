// Core dependencies
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import path from 'path';
import fs from 'fs';

// Middleware packages
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { isValidObjectId } from 'mongoose';

// Application middleware
import { errorHandler, notFound, ApiError } from './middleware/error.middleware';

// Configuration
import { swaggerSpec } from './config/swagger';
import { CORS_CONFIG } from './config/app';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import certificationRoutes from './routes/certification.routes';
import uploadRoutes from './routes/upload.routes';
import categoryRoutes from './routes/category.routes';
import locationRoutes from './routes/location.routes';
import reviewRoutes from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';

// Ensure uploads directory exists with proper permissions
const uploadsDir = path.join(__dirname, '../uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const certificationsDir = path.join(uploadsDir, 'certifications');
const productsDir = path.join(uploadsDir, 'products');

// Create directories if they don't exist
[uploadsDir, profilesDir, certificationsDir, productsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[Server] Created directory: ${dir}`);
    } catch (err) {
      console.error(`[Server] Failed to create directory: ${dir}`, err);
    }
  } else {
    console.log(`[Server] Directory already exists: ${dir}`);
  }
});

// Log permissions for debugging
try {
  fs.accessSync(uploadsDir, fs.constants.W_OK);
  console.log(`[Server] Write access confirmed for: ${uploadsDir}`);
  fs.accessSync(productsDir, fs.constants.W_OK);
  console.log(`[Server] Write access confirmed for: ${productsDir}`);
} catch (err) {
  console.error(`[Server] Permission check failed:`, err);
}

/**
 * Middleware para manejar errores específicos de CORS
 */
const corsErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.name === 'CORSError' || (err.message && err.message.includes('CORS'))) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Cross-Origin Request Blocked: The request was blocked due to CORS policy.',
        details: {
          suggestion: 'Ensure your request has the correct headers and that the server is configured to accept requests from your origin.'
        }
      }
    });
    return;
  }
  next(err);
};

/**
 * Configura y crea la aplicación Express
 *
 * @returns La aplicación Express configurada
 */
export function createApp(): Express {
  // Initialize Express
  const app: Express = express();

  // Middlewares for security and parsing
  app.use(cors(CORS_CONFIG));
  
  // Configuración menos restrictiva de Helmet para Swagger
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Enhanced static file service options
  const staticOptions = {
    setHeaders: (res: Response, filePath: string) => {
      // Permitir acceso desde cualquier origen
      res.set('Access-Control-Allow-Origin', '*');
      
      // Establecer el tipo de contenido correcto basado en la extensión del archivo
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.set('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.png')) {
        res.set('Content-Type', 'image/png');
      } else if (filePath.endsWith('.gif')) {
        res.set('Content-Type', 'image/gif');
      } else if (filePath.endsWith('.webp')) {
        res.set('Content-Type', 'image/webp');
      } else if (filePath.endsWith('.svg')) {
        res.set('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('.pdf')) {
        res.set('Content-Type', 'application/pdf');
      } else {
        // For files with unknown extension, try to get the mime type
        const ext = path.extname(filePath).toLowerCase();
        console.log(`[Server] Serving file with extension: ${ext} from path: ${filePath}`);
      }
      
      // Modify cache control for images - cache for 1 hour in production
      if (process.env.NODE_ENV === 'production' && 
          (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i))) {
        res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
      } else {
        // Disable caching for development
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }
    }
  };
  
  // Explicitly serve upload directories
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));
  app.use('/uploads/certifications', express.static(path.join(__dirname, '../uploads/certifications'), staticOptions));
  app.use('/uploads/profiles', express.static(path.join(__dirname, '../uploads/profiles'), staticOptions));
  app.use('/uploads/products', express.static(path.join(__dirname, '../uploads/products'), staticOptions));
  
  // Add a direct route handler for product images to aid in debugging
  app.get('/uploads/products/:filename', (req, res, next) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/products', filename);
    
    console.log(`[Server] Image request received for: ${filename}`);
    console.log(`[Server] Checking file at path: ${filePath}`);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      console.log(`[Server] File exists at: ${filePath}`);
      
      // Determine content type
      let contentType = 'application/octet-stream';
      if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (filename.endsWith('.png')) {
        contentType = 'image/png';
      } else if (filename.endsWith('.gif')) {
        contentType = 'image/gif';
      } else if (filename.endsWith('.webp')) {
        contentType = 'image/webp';
      }
      
      console.log(`[Server] Serving file with content-type: ${contentType}`);
      
      // Serve the file
      res.set('Content-Type', contentType);
      res.set('Access-Control-Allow-Origin', '*');
      res.sendFile(filePath);
    } else {
      console.log(`[Server] File NOT found at: ${filePath}`);
      next(); // Continue to next handler (will result in 404 if none found)
    }
  });
  
  // Log upload paths for debugging
  
  // Middleware para manejar preflight OPTIONS requests
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
      res.status(200).send();
      return;
    }
    next();
  });

  // Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/certifications', certificationRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Root route
  app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Agricoventas API' });
  });

  // Manejador de errores CORS específico
  app.use(corsErrorHandler);
  
  // Error handling middleware - siempre al final
  app.use(notFound);
  app.use(errorHandler);

  // Handle uncaught exceptions to prevent app crash
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  return app;
}
