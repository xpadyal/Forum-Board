import { supabase } from '../../config.js';
import { AppError } from '../utils/appError.js';
import { randomUUID } from 'crypto';
import path from 'path';

export const uploadFile = async (file) => {
    try {
      if (!file) throw new AppError('No file provided', 400);
  
      const ext = path.extname(file.originalname);
      const fileName = `${randomUUID()}${ext}`;
      const filePath = `Attachments/${fileName}`;
  
      const { error } = await supabase.storage
        .from('Attachments')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
  
      if (error) throw error;
  
      const { data } = supabase.storage
        .from('Attachments')
        .getPublicUrl(filePath);
  
      return {
        fileUrl: data.publicUrl,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new AppError(`File upload failed: ${error.message}`, 500);
    }
  };