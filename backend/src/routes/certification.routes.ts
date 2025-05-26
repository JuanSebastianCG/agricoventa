import express from 'express';
import { CertificationController } from '../controllers/certification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateRequest, validateQuery } from '../middleware/validation.middleware';
import { 
  createUserCertificationSchema, 
  verifyCertificationSchema, 
  certificationQuerySchema 
} from '../schemas/certification.schema';
import { handleCertificationUpload, UploadController } from '../controllers/upload.controller';

const router = express.Router();
const certificationController = new CertificationController();
const uploadController = new UploadController();

// All routes require authentication
router.use(authenticate);

// User certification routes
router.post('/upload', handleCertificationUpload, uploadController.uploadCertificationDocument.bind(uploadController));
router.get('/user/:userId', certificationController.getUserCertifications.bind(certificationController));
router.get('/verify/:userId', certificationController.verifyUserCertifications.bind(certificationController));
// New route for required certification details
router.get('/user/:userId/required-status', certificationController.getRequiredCertificationDetails.bind(certificationController));

// Admin-only routes
router.get('/admin', authorize(['ADMIN']), validateQuery(certificationQuerySchema), certificationController.getAllCertificationsAdmin.bind(certificationController));
router.put('/approve/:certificationId', authorize(['ADMIN']), validateRequest(verifyCertificationSchema), certificationController.approveCertification.bind(certificationController));
router.put('/reject/:certificationId', authorize(['ADMIN']), validateRequest(verifyCertificationSchema), certificationController.rejectCertification.bind(certificationController));

// Get a single certification by ID - DEBE IR AL FINAL para no interceptar otras rutas
router.get('/:certificationId', certificationController.getCertificationById.bind(certificationController));

export default router; 