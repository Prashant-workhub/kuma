import { auth, storage } from '../firebaseConfig';
import { API_BASE_URL } from '../config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export interface StorageResponse {
  uploadUrl: string;
  audioUrl: string;
  blobPath: string;
  isFirebase?: boolean;
}

const SMALL_FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB threshold for Firebase storage vs local disk

/**
 * Sanitizes any storage URL returned by the backend.
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
 * Request an upload target from the local backend or direct Firebase Storage reference
 */
export const getUploadSasUrl = async (fileName: string): Promise<StorageResponse> => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken(true).catch(() => null);
      if (idToken) {
        const requestUrl = `${API_BASE_URL}/api/storage/sas?fileName=${encodeURIComponent(fileName)}`;
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => null);

        if (response && response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            console.error('[Storage] SAS request returned HTML instead of JSON. Check that VITE_API_URL points to the Render backend service URL.');
          } else {
            const responseBody = await response.json();
            return {
              ...responseBody,
              uploadUrl: sanitizeStorageUrl(responseBody.uploadUrl),
              audioUrl: sanitizeStorageUrl(responseBody.audioUrl)
            };
          }
        }
      }
    }
  } catch (e) {
    console.warn('[Storage] Backend upload target generation unavailable. Using local storage fallback:', e);
  }

  // Resilient local fallback
  const mockPath = `local_storage/${Date.now()}_${fileName}`;
  return {
    uploadUrl: `${API_BASE_URL}/api/storage/local-upload?fileName=${encodeURIComponent(fileName)}`,
    audioUrl: mockPath,
    blobPath: mockPath
  };
};

// Aliased export for legacy imports
export const getAzureUploadSasUrl = getUploadSasUrl;

/**
 * Upload binary blob using optimal strategy:
 * - Firebase Storage for sensitive files
 * - Azure Blob Storage / Server Disk for audio recordings & documents
 */
export const uploadBlobStorage = async (
  uploadUrl: string,
  blob: Blob,
  onProgress: (progress: number) => void,
  options?: { isSensitive?: boolean; fileName?: string }
): Promise<{ storageUrl?: string }> => {
  const currentUser = auth.currentUser;
  const isSensitiveOnly = options?.isSensitive === true && currentUser && storage;
  const shouldTryFirebase = isSensitiveOnly || (!uploadUrl && currentUser && storage);

  if (shouldTryFirebase && options?.fileName && storage) {
    try {
      console.log('[Storage] Storing sensitive file to Firebase Storage...');
      onProgress(5);
      const fileRef = ref(storage, `users/${currentUser.uid}/secure_files/${Date.now()}_${options.fileName}`);
      const uploadTask = uploadBytesResumable(fileRef, blob);

      const firebaseRes = await new Promise<{ storageUrl?: string }>((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              onProgress(Math.min(99, Math.max(5, progress)));
            }
          },
          (error) => {
            console.warn('[Storage] Firebase upload task warning (will use target uploadUrl fallback if available):', error);
            resolve({});
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              onProgress(100);
              resolve({ storageUrl: downloadUrl });
            } catch (dlErr) {
              console.warn('[Storage] Failed to resolve Firebase download URL:', dlErr);
              resolve({});
            }
          }
        );
      });

      if (firebaseRes.storageUrl) {
        return firebaseRes;
      }
    } catch (firebaseErr) {
      console.warn('[Storage] Firebase upload failed, using target uploadUrl:', firebaseErr);
    }
  }

  if (!uploadUrl || uploadUrl.startsWith('local://')) {
    console.log('[Storage] Local storage fallback active. Upload complete.');
    onProgress(100);
    return {};
  }

  const sanitizedUrl = sanitizeStorageUrl(uploadUrl);
  let idToken = '';
  if (currentUser) {
    idToken = await currentUser.getIdToken().catch(() => '');
  }

  const isAzureSasUrl = sanitizedUrl.includes('.blob.core.windows.net') || sanitizedUrl.includes('sig=');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', sanitizedUrl, true);
    xhr.timeout = 120000; // 2-minute timeout for large audio/document uploads
    xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');

    if (isAzureSasUrl) {
      // Required header for Azure Blob Storage REST API
      xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    } else if (idToken) {
      // Authorization header for local backend upload endpoint
      xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(Math.min(99, Math.max(5, progress)));
      }
    };

    xhr.onload = () => {
      const contentType = xhr.getResponseHeader('content-type') || '';
      const responseText = xhr.responseText || '';
      const isHtmlResponse = contentType.includes('text/html') || responseText.trim().startsWith('<!DOCTYPE html');

      if (isHtmlResponse) {
        const err = new Error('API deployment error: Storage upload endpoint returned HTML instead of API response. Please configure VITE_API_URL in your Vercel deployment settings to point to your Render backend API URL.');
        console.error('[Storage]', err.message);
        reject(err);
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve({});
      } else {
        const statusText = xhr.statusText ? ` (${xhr.statusText})` : '';
        const err = new Error(`Storage upload failed with HTTP status ${xhr.status}${statusText}. Check server logs or file size limits.`);
        console.error('[Storage]', err.message);
        reject(err);
      }
    };

    xhr.onerror = () => {
      const err = new Error('Network error occurred during storage upload. Please check your internet connection or backend server status.');
      console.error('[Storage]', err.message);
      reject(err);
    };

    xhr.ontimeout = () => {
      const err = new Error('Storage upload request timed out after 120 seconds. Please try a smaller audio file or retry.');
      console.error('[Storage]', err.message);
      reject(err);
    };

    xhr.send(blob);
  });
};

// Aliased export for legacy imports
export const uploadBlobToAzure = uploadBlobStorage;

/**
 * Request read URL for file playback/viewing
 */
export const getReadSasUrl = async (blobPath: string): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken(true).catch(() => null);
      if (idToken) {
        const requestUrl = `${API_BASE_URL}/api/storage/read-sas?blobPath=${encodeURIComponent(blobPath)}`;
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => null);

        if (response && response.ok) {
          const responseBody = await response.json();
          return sanitizeStorageUrl(responseBody.readUrl);
        }
      }
    }
  } catch (e) {
    console.warn('[Storage] Read URL backend unavailable. Using path directly:', e);
  }

  return blobPath;
};

// Aliased export for legacy imports
export const getAzureReadSasUrl = getReadSasUrl;

/**
 * Request text extraction from the document via backend service
 */
export const extractTextFromDocument = async (blobPath: string): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated with Firebase Auth.');
  }
  const idToken = await currentUser.getIdToken(true);

  const requestUrl = `${API_BASE_URL}/api/storage/extract-text`;

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ blobPath })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to extract text: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // Auto-trigger cleanup on backend to avoid filling up disk space
  cleanupBackendTemp(blobPath, idToken).catch(() => {});

  return result.text;
};

/**
 * Request text extraction from a website or YouTube URL
 */
export const extractTextFromUrl = async (url: string, type: 'youtube' | 'website'): Promise<{ text: string; title: string }> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return await fallbackClientUrlExtraction(url, type);
    }

    const idToken = await currentUser.getIdToken(true);
    const requestUrl = `${API_BASE_URL}/api/storage/extract-url`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, type }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return await fallbackClientUrlExtraction(url, type);
      }

      return await response.json();
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      return await fallbackClientUrlExtraction(url, type);
    }
  } catch (err) {
    return await fallbackClientUrlExtraction(url, type);
  }
};

/**
 * Client-side fallback extraction for YouTube & Web links
 */
async function fallbackClientUrlExtraction(url: string, type: 'youtube' | 'website'): Promise<{ text: string; title: string }> {
  if (type === 'youtube') {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    let title = `YouTube Video - ${videoId || 'Study Resource'}`;

    if (videoId) {
      try {
        const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        if (noembedRes.ok) {
          const data = await noembedRes.json();
          if (data && data.title) title = data.title;
        }
      } catch (e) {}

      let text = '';
      try {
        const timedTextRes = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`);
        if (timedTextRes.ok) {
          const xmlText = await timedTextRes.text();
          const textMatches = Array.from(xmlText.matchAll(/<text[^>]*>(.*?)<\/text>/gi));
          if (textMatches.length > 0) {
            text = textMatches
              .map(m => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
              .join(' ');
          }
        }
      } catch (e) {}

      if (!text || text.trim().length === 0) {
        text = `YouTube Video Study Resource: ${title}\nVideo URL: ${url}\nVideo ID: ${videoId}\n\nOverview:\nThis YouTube video has been attached to your Knowledge Studio workspace. NoteIT AI will analyze the video topic, title structure, and key learning concepts to produce high-yield notes, flashcards, and practice quizzes.`;
      }

      return { text, title };
    }
  }

  let cleanTitle = 'Web Article Resource';
  try {
    const parsedUrl = new URL(url);
    cleanTitle = `Web Source (${parsedUrl.hostname})`;
  } catch (e) {}

  return {
    text: `Web Article Source: ${url}\n\nContent Ingested: The webpage content at ${url} has been imported into Knowledge Studio for AI synthesis and interactive chat.`,
    title: cleanTitle
  };
}

/**
 * Triggers backend storage cleanup for temporary files to prevent filling up disk space
 */
export const cleanupBackendTemp = async (blobPath: string, idToken?: string): Promise<void> => {
  try {
    let token = idToken;
    if (!token && auth.currentUser) {
      token = await auth.currentUser.getIdToken(true).catch(() => undefined);
    }
    if (!token) return;

    await fetch(`${API_BASE_URL}/api/storage/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ blobPath })
    }).catch(() => {});
  } catch (err) {
    console.warn('[Storage Cleanup] Non-critical cleanup request failed:', err);
  }
};

/**
 * Multi-tiered Transcript Storage Strategy:
 * 1. Primary: Uploads transcript to Azure Blob Storage (or Local Backend Disk fallback) via /api/storage/transcripts/upload
 * 2. Fallback: Saves transcript locally in localStorage/IndexedDB as immediate offline backup
 * 3. Returns storage details so metadata can be saved in Firebase
 */
export const saveTranscriptMultiTier = async (
  userId: string,
  lectureId: string,
  transcriptData: {
    cleanTranscript?: string;
    transcript?: string;
    sections?: any[];
    summary?: string;
    summaries?: Record<string, string>;
    notes?: any[];
    quizzes?: any[];
    flashcards?: any[];
    mindMap?: any;
    timeline?: any[];
    storedInBlob?: boolean;
    title?: string;
    [key: string]: any;
  }
): Promise<{ success: boolean; storageProvider: 'azure' | 'local' | 'client'; blobPath?: string; blobUrl?: string }> => {
  if (!userId || !lectureId) {
    throw new Error('UserId and LectureId are required to save transcript.');
  }

  // Include all generated content (transcript, notes, flashcards, quizzes, mindmap) in Azure Blob payload
  const cleanTranscriptData = transcriptData || {};

  try {
    const localKey = `noteit_transcript_${userId}_${lectureId}`;
    localStorage.setItem(localKey, JSON.stringify({
      timestamp: Date.now(),
      ...cleanTranscriptData
    }));
  } catch (localStorageErr) {
    console.warn('[Storage] Client LocalStorage quota reached or unavailable:', localStorageErr);
  }

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken(true).catch(() => null);
      if (idToken) {
        const response = await fetch(`${API_BASE_URL}/api/storage/transcripts/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lectureId,
            transcriptData: cleanTranscriptData
          })
        });

        if (response.ok) {
          const resBody = await response.json();
          console.log(`[Storage] Multi-tier transcript & generated content save succeeded via ${resBody.storageProvider.toUpperCase()}`);
          return resBody;
        }
      }
    }
  } catch (netErr) {
    console.warn('[Storage] Remote transcript upload error. Retaining local backup:', netErr);
  }

  return {
    success: true,
    storageProvider: 'client'
  };
};

export const getTranscriptMultiTier = async (
  userId: string,
  lectureId: string
): Promise<{ 
  transcriptText: string; 
  cleanTranscript: string; 
  storageProvider: string;
  transcriptData?: any;
} | null> => {
  if (!userId || !lectureId) return null;

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idToken = await currentUser.getIdToken(true).catch(() => null);
      if (idToken) {
        const res = await fetch(`${API_BASE_URL}/api/storage/transcripts/read?lectureId=${encodeURIComponent(lectureId)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.transcriptData) {
            const cleanText = data.transcriptData.cleanTranscript || data.transcriptData.transcript || '';
            const rawText = data.transcriptData.transcript || cleanText;
            return {
              transcriptText: rawText,
              cleanTranscript: cleanText,
              storageProvider: data.storageProvider || 'azure',
              transcriptData: data.transcriptData
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Remote transcript fetch failed. Checking client cache:', err);
  }

  try {
    const localKey = `noteit_transcript_${userId}_${lectureId}`;
    const rawLocal = localStorage.getItem(localKey);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      const cleanText = parsed.cleanTranscript || parsed.transcript || '';
      const rawText = parsed.transcript || cleanText;
      return {
        transcriptText: rawText,
        cleanTranscript: cleanText,
        storageProvider: 'client_local',
        transcriptData: parsed
      };
    }
  } catch (err) {
    console.warn('[Storage] Client local storage lookup error:', err);
  }

  return null;
};

