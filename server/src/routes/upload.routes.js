import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadFile } from '../service/upload.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory before sending to Supabase

router.post('/', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const result = await uploadFile(req.file);
    res.status(201).json({
      status: 'success',
      message: 'File uploaded successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
