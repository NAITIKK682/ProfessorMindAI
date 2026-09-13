import api from './api';
import type { UploadResponse } from '../types/api';

export async function uploadPdf(
  notebookId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post<UploadResponse>(
      `/api/notebooks/${encodeURIComponent(notebookId)}/upload-pdf`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Upload error details:', {
      notebookId,
      fileName: file.name,
      fileSize: file.size,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}