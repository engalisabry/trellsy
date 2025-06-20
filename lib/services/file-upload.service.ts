import { withAuth } from '@/lib/auth/middleware';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/utils/error-handling';

export const uploadFile = async (
  file: File,
  path: string,
  fileName?: string,
): Promise<string | false> => {
  return withAuth(async (userId) => {
    try {
      const supabase = await createClient();
      if (!file) {
        return handleError(new Error('No file provided'), {
          defaultMessage: 'No file provided',
          showToast: true,
          context: { action: 'uploadFile', path },
        }) as never;
      }

      const actualFileName =
        fileName || `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

      const bucketName = 'organization-logo';
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`${path}/${actualFileName}`, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        return handleError(error, {
          defaultMessage: 'Failed to upload file',
          showToast: true,
          context: { action: 'uploadFile', path, fileName: actualFileName },
        }) as never;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${path}/${actualFileName}`);

      return publicUrl;
    } catch (error) {
      return handleError(error, {
        defaultMessage: 'Unexpected error uploading file',
        showToast: true,
        context: { action: 'uploadFile', path },
      }) as never;
    }
  });
}
