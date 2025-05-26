import express from 'express';
import { UploadController, handleProfileImageUpload, handleCertificationUpload } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { sendSuccessResponse } from '../utils/responseHandler';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const uploadController = new UploadController();

// All upload routes require authentication
router.use(authenticate);

// Add a debug endpoint at the beginning of the file
router.get('/debug-uploads', (req, res) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const certificationsDir = path.join(uploadsDir, 'certifications');
  
  // Check if directories exist
  const uploadsExists = fs.existsSync(uploadsDir);
  const certificationsExists = fs.existsSync(certificationsDir);
  
  // Get list of files in certifications directory
  let certificationFiles = [];
  if (certificationsExists) {
    try {
      certificationFiles = fs.readdirSync(certificationsDir);
    } catch (error) {
      console.error('Error reading certifications directory:', error);
    }
  }
  
  // Try to create directories if they don't exist
  if (!uploadsExists) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Created uploads directory: ${uploadsDir}`);
    } catch (error) {
      console.error('Failed to create uploads directory:', error);
    }
  }
  
  if (!certificationsExists) {
    try {
      fs.mkdirSync(certificationsDir, { recursive: true });
      console.log(`Created certifications directory: ${certificationsDir}`);
    } catch (error) {
      console.error('Failed to create certifications directory:', error);
    }
  }
  
  // Check permissions
  let uploadsWritable = false;
  let certificationsWritable = false;
  
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    uploadsWritable = true;
  } catch (error) {
    console.error('Uploads directory is not writable:', error);
  }
  
  try {
    fs.accessSync(certificationsDir, fs.constants.W_OK);
    certificationsWritable = true;
  } catch (error) {
    console.error('Certifications directory is not writable:', error);
  }
  
  res.json({
    success: true,
    message: 'Debug information',
    paths: {
      uploadsDir,
      certificationsDir
    },
    exists: {
      uploadsDir: uploadsExists,
      certificationsDir: certificationsExists
    },
    writable: {
      uploadsDir: uploadsWritable,
      certificationsDir: certificationsWritable
    },
    files: {
      certifications: certificationFiles
    }
  });
});

// Debug endpoint to check folders
router.get('/debug', (req, res) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const certificationsDir = path.join(uploadsDir, 'certifications');
  
  // Check if directories exist
  const uploadsExists = fs.existsSync(uploadsDir);
  const certificationsExists = fs.existsSync(certificationsDir);
  
  // Get list of files in certifications directory
  let certificationFiles = [];
  if (certificationsExists) {
    try {
      certificationFiles = fs.readdirSync(certificationsDir);
    } catch (error) {
      console.error('Error reading certifications directory:', error);
    }
  }
  
  sendSuccessResponse(res, {
    message: 'Debug information',
    paths: {
      uploadsDir,
      certificationsDir
    },
    exists: {
      uploadsDir: uploadsExists,
      certificationsDir: certificationsExists
    },
    files: {
      certifications: certificationFiles
    }
  });
});

// Upload profile image
router.post('/profile', handleProfileImageUpload, (req, res) => uploadController.uploadProfileImage(req, res));

// Upload certification document
router.post('/certifications', handleCertificationUpload, (req, res) => uploadController.uploadCertificationDocument(req, res));

export default router; 