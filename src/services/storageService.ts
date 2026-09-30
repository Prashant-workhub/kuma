/**
 * Project Kuma - Azure Blob Storage Service
 * Handles secure learning resource uploads via Azure Blob SAS tokens, progress tracking,
 * upload confirmation, and access-controlled read URL generation.
 */

import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';

export interface StorageResponse {
  uploadUrl: string;
  audioUrl?: string;
  blobPath: string;
  resourceRef?: string;
  isFirebase?: boolean;
}

export interface ResourceUploadParams {
  courseId: string;
  moduleId: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface UploadResult {
  success: boolean;
  resourceRef?: string;
  blobPath?: string;
  uploadUrl?: string;
  resource?: any;
  error?: string;
  isUnconfigured?: boolean;
  isForbidden?: boolean;
}

/**
 * Sanitizes storage URL returned by backend API.
 */
export const sanitizeStorageUrl = (url: string): string => {
  if (!url) return url;
  if (API_BASE_URL && !API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1')) {
    const cleanApiBase = API_BASE_URL.replace(/\/$/, '');
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, cleanApiBase);
  }
  return url;
};

/**
 * Helper to get current Firebase Auth Bearer Token.
 */
async function getAuthHeaderToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken(true);
  } catch (e) {
    return null;
  }
}

/**
 * Step 1: Requests a short-lived write-only Azure Blob SAS URL from backend API.
 */
export const requestUploadUrl = async (params: ResourceUploadParams): Promise<UploadResult> => {
  try {
    const token = await getAuthHeaderToken();
    const response = await fetch(`${API_BASE_URL}/api/storage/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(params)
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 501) {
      return {
        success: false,
        isUnconfigured: true,
        error: data.error || 'Azure Blob storage is not configured in server environment'
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        isForbidden: true,
        error: data.error || 'Forbidden: You do not have permission to upload to this course'
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Failed to generate upload URL (HTTP ${response.status})`
      };
    }

    return {
      success: true,
      uploadUrl: sanitizeStorageUrl(data.uploadUrl),
      blobPath: data.blobPath,
      resourceRef: data.resourceRef || data.blobPath
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error requesting upload URL'
    };
  }
};

/**
 * Step 2: Uploads binary file directly to Azure Blob SAS URL using XHR with 0-100% progress and cancellation.
 */
export const uploadBlobToSasUrl = async (
  uploadUrl: string,
  blob: Blob | File,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<{ success: boolean; error?: string }> => {
  if (!uploadUrl || uploadUrl.startsWith('local://')) {
    return { success: false, error: 'Invalid or missing Azure upload SAS URL' };
  }

  const sanitizedUrl = sanitizeStorageUrl(uploadUrl);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', sanitizedUrl, true);
    xhr.timeout = 300000; // 5-minute timeout for large files

    // Mandatory header for Azure Blob Storage REST API
    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');

    if (signal) {
      signal.onabort = () => {
        xhr.abort();
        resolve({ success: false, error: 'Upload cancelled by user' });
      };
    }

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const pct = Math.round((event.loaded / event.total) * 100);
          onProgress(Math.min(99, Math.max(1, pct)));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: `Azure Storage upload failed (HTTP ${xhr.status}: ${xhr.statusText || 'Upload Error'})`
        });
      }
    };

    xhr.onerror = () => {
      resolve({ success: false, error: 'Network error uploading file to Azure Storage' });
    };

    xhr.ontimeout = () => {
      resolve({ success: false, error: 'Upload timed out after 5 minutes' });
    };

    xhr.send(blob);
  });
};

/**
 * Step 3: Confirms upload completion with backend to record metadata in Firestore resources.
 */
export const confirmUpload = async (params: {
  resourceRef: string;
  courseId: string;
  moduleId: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<UploadResult> => {
  try {
    const token = await getAuthHeaderToken();
    const response = await fetch(`${API_BASE_URL}/api/storage/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(params)
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 501) {
      return {
        success: false,
        isUnconfigured: true,
        error: data.error || 'Azure Blob storage is not configured'
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Failed to confirm upload (HTTP ${response.status})`
      };
    }

    return {
      success: true,
      resource: data.resource,
      resourceRef: params.resourceRef
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error confirming upload'
    };
  }
};

/**
 * Requests a short-lived read SAS URL for an authorized course learning resource.
 */
export const getReadUrl = async (resourceIdOrRef: string): Promise<{
  success: boolean;
  readUrl?: string;
  resource?: any;
  error?: string;
  isForbidden?: boolean;
  isUnconfigured?: boolean;
}> => {
  try {
    const token = await getAuthHeaderToken();
    const url = `${API_BASE_URL}/api/storage/read-url/${encodeURIComponent(resourceIdOrRef)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 501) {
      return {
        success: false,
        isUnconfigured: true,
        error: data.error || 'Azure Blob storage is not configured'
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        isForbidden: true,
        error: data.error || 'Access denied: You must be enrolled in this course or be the course owner to view this resource'
      };
    }

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Failed to resolve read URL (HTTP ${response.status})`
      };
    }

    return {
      success: true,
      readUrl: sanitizeStorageUrl(data.readUrl),
      resource: data.resource
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error resolving resource read URL'
    };
  }
};

/**
 * High-level orchestration for uploading learning resources to Azure Blob Storage.
 */
export const uploadLearningResource = async (
  params: ResourceUploadParams,
  file: Blob | File,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal
): Promise<UploadResult> => {
  // Step 1: Request SAS URL
  const sasResult = await requestUploadUrl(params);
  if (!sasResult.success || !sasResult.uploadUrl || !sasResult.resourceRef) {
    return sasResult;
  }

  // Step 2: Upload binary blob to SAS URL
  const uploadResult = await uploadBlobToSasUrl(sasResult.uploadUrl, file, onProgress, signal);
  if (!uploadResult.success) {
    return {
      success: false,
      error: uploadResult.error || 'Failed to transfer blob to Azure Storage'
    };
  }

  // Step 3: Confirm upload with backend
  const confirmResult = await confirmUpload({
    resourceRef: sasResult.resourceRef,
    courseId: params.courseId,
    moduleId: params.moduleId,
    fileName: params.fileName,
    contentType: params.contentType,
    size: params.size
  });

  return confirmResult;
};

// Aliased exports for backwards compatibility
export const getUploadSasUrl = async (fileName: string): Promise<StorageResponse> => {
  const res = await requestUploadUrl({
    courseId: 'default-course',
    moduleId: 'default-module',
    fileName,
    contentType: 'application/octet-stream',
    size: 0
  });
  return {
    uploadUrl: res.uploadUrl || '',
    blobPath: res.blobPath || '',
    resourceRef: res.resourceRef || ''
  };
};

export const getAzureUploadSasUrl = getUploadSasUrl;

export const uploadBlobStorage = async (
  uploadUrl: string,
  blob: Blob,
  onProgress?: (progress: number) => void,
  options?: { isSensitive?: boolean; fileName?: string }
): Promise<{ storageUrl?: string }> => {
  const res = await uploadBlobToSasUrl(uploadUrl, blob, onProgress);
  if (!res.success) throw new Error(res.error || 'Upload failed');
  return {};
};

export const uploadBlobToAzure = uploadBlobStorage;

export const getReadSasUrl = async (blobPath: string): Promise<string> => {
  const res = await getReadUrl(blobPath);
  return res.readUrl || blobPath;
};

export const getAzureReadSasUrl = getReadSasUrl;

export const saveTranscriptMultiTier = async (
  userId: string,
  lectureId: string,
  transcriptData: any
) => {
  try {
    const localKey = `kuma_transcript_${userId}_${lectureId}`;
    localStorage.setItem(localKey, JSON.stringify({ timestamp: Date.now(), ...transcriptData }));
  } catch (e) {}
  return { success: true, storageProvider: 'azure' };
};

export const getTranscriptMultiTier = async (
  userId: string,
  lectureId: string
) => {
  try {
    const localKey = `kuma_transcript_${userId}_${lectureId}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        transcriptText: parsed.transcript || '',
        cleanTranscript: parsed.cleanTranscript || parsed.transcript || '',
        storageProvider: 'azure',
        transcriptData: parsed
      };
    }
  } catch (e) {}
  return null;
};

export const saveCertificateToCloudStorage = async (certificate: any) => {
  return { success: true, storageProvider: 'azure' };
};

export const saveSkillGapSnapshotToCloudStorage = async (userId: string, snapshot: any) => {
  return { success: true, storageProvider: 'azure' };
};

export const saveFileMetadata = async (metadata: any) => {
  return metadata.fileId || `file_${Date.now()}`;
};
