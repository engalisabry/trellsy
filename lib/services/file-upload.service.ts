import { withSupabase } from './api';

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param path The storage path (e.g., 'organization-logos')
 * @param fileName Optional custom file name
 * @returns The URL of the uploaded file
 */

export const uploadFile = async (
  file: File,
  path: string,
  fileName?: string,
): Promise<string> => {
  return withSupabase(async (supabase, userId) => {
    if (!file) throw new Error('No file provided');

    const actualFileName =
      fileName || `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    // Use the existing bucket 'organization-logo'
    const bucketName = 'organization-logo';
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`${path}/${actualFileName}`, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('File upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`${path}/${actualFileName}`);

    return publicUrl;
  });
};
