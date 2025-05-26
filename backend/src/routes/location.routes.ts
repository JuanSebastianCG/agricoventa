import express from 'express';
import { locationController } from '../controllers/location.controller';
import { authenticate } 
    from '../middleware/auth.middleware'; 
// import { validateRequest, validateParams } from "../middleware/validation.middleware"; 
// import { createLocationSchema } from "../schemas/location.schema"; 

const router = express.Router();

router.use(authenticate); 

router.get(
    '/user/:userId',
    (req, res) => locationController.getLocationsByUserId(req, res)
);

// Create a new location for the authenticated user
router.post(
    '/',
    // validateRequest(createLocationSchema), // TODO: Add Zod validation schema for location creation
    (req, res) => locationController.createLocation(req, res)
);

export default router; 