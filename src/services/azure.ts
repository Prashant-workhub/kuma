// Local storage fallback for Azure Blob storage
export const saveTranscriptMultiTier = async (...args: any[]) => {
  const lectureId = args[1] || args[0] || 'default';
  const transcript = args[2] || args[1] || '';
  try {
    localStorage.setItem(`transcript_${lectureId}`, JSON.stringify({ transcript }));
    return { success: true, tier: 'local', storageProvider: 'client', blobPath: `local/${lectureId}` };
  } catch (e) {
    console.warn('Local storage error:', e);
    return { success: false, tier: 'none', storageProvider: 'client', blobPath: '' };
  }
};

export const getTranscriptMultiTier = async (...args: any[]) => {
  const lectureId = args[1] || args[0] || 'default';
  try {
    const data = localStorage.getItem(`transcript_${lectureId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading local transcript:', e);
  }
  return null;
};

export const getAzureUploadSasUrl = async (...args: any[]) => {
  const blobName = args[0] || 'blob';
  return { uploadUrl: '', sasUrl: '', blobPath: `local/${blobName}`, audioUrl: '' };
};

export const uploadBlobToAzure = async (...args: any[]) => {
  return { success: true };
};
