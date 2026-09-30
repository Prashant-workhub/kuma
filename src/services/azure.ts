/**
 * Project Kuma - Azure Blob Storage Client Exports
 * Delegates all storage operations to storageService.ts via Azure Blob SAS REST API endpoints.
 */

import {
  requestUploadUrl,
  uploadBlobToSasUrl,
  confirmUpload,
  getReadUrl,
  uploadLearningResource
} from './storageService';

export const saveTranscriptMultiTier = async () => {
  return { success: false, error: 'Use real Azure Blob storage upload via storageService.uploadLearningResource' };
};

export const getTranscriptMultiTier = async () => {
  return null;
};

export const getAzureUploadSasUrl = async (params: { courseId: string; moduleId: string; fileName: string; contentType: string; size: number }) => {
  return requestUploadUrl(params);
};

export const uploadBlobToAzure = uploadBlobToSasUrl;
export { confirmUpload, getReadUrl, uploadLearningResource };
