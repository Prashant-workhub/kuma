import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config';
import { Lecture } from '../types';
import { getAzureUploadSasUrl, uploadBlobToAzure } from '../services/azure';

export function useLectures(userId: string | undefined) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLectures([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const lecturesRef = collection(db, 'users', userId, 'lectures');
    const q = query(lecturesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lectureList: Lecture[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let formattedAddedAt = 'Just now';
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            const date = data.createdAt.toDate();
            formattedAddedAt = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          } else if (data.addedAt) {
            formattedAddedAt = data.addedAt;
          }

          const rawTranscript = data.transcript || data.cleanTranscript || data.transcriptText || data.text || '';

          lectureList.push({
            id: docSnap.id,
            ...data,
            title: data.title || '',
            subject: data.subject || '',
            status: data.status || 'transcribing',
            transcriptionStatus: data.transcriptionStatus || (rawTranscript ? 'completed' : 'pending'),
            transcript: rawTranscript,
            cleanTranscript: data.cleanTranscript || rawTranscript,
            type: data.type || 'recording',
            addedAt: formattedAddedAt,
          });
        });
        setLectures(lectureList);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching lectures:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addLecture = async (lectureData: {
    title: string;
    subject: string;
    duration?: string;
    type: 'recording' | 'pdf' | 'ppt' | 'text';
    status: Lecture['status'];
    transcriptionEngine?: string;
    browserLiveTranscript?: string;
    pages?: number;
    addedAt?: string;
  }) => {
    if (!userId) throw new Error('User not authenticated');
    const lecturesRef = collection(db, 'users', userId, 'lectures');
    const {
      transcript,
      cleanTranscript,
      content,
      text,
      notes,
      quizzes,
      flashcards,
      mindMap,
      summary,
      summaries,
      ...lightweightMetadata
    } = lectureData as any;
    const docRef = await addDoc(lecturesRef, {
      ...lightweightMetadata,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateLecture = async (id: string, data: Partial<Lecture>) => {
    if (!userId) throw new Error('User not authenticated');
    const lectureRef = doc(db, 'users', userId, 'lectures', id);
    const {
      transcript,
      cleanTranscript,
      content,
      text,
      notes,
      quizzes,
      flashcards,
      mindMap,
      summary,
      summaries,
      ...lightweightMetadata
    } = data as any;
    await updateDoc(lectureRef, {
      ...lightweightMetadata,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteLecture = async (id: string) => {
    if (!userId) throw new Error('User not authenticated');
    const lectureRef = doc(db, 'users', userId, 'lectures', id);
    
    try {
      const snap = await getDoc(lectureRef);
      if (snap.exists()) {
        const data = snap.data();
        const blobPath = data?.blobPath || data?.audioUrl;
        if (blobPath) {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const idToken = await currentUser.getIdToken(true).catch(() => null);
            if (idToken) {
              await fetch(`${API_BASE_URL}/api/storage/cleanup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ blobPath })
              }).catch((e) => console.warn('Storage cleanup warning:', e));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Pre-deletion snapshot read warning:', e);
    }

    await deleteDoc(lectureRef);
  };

  const uploadLectureAudio = async (
    lectureId: string, 
    audioBlob: Blob, 
    onProgress: (progress: number) => void
  ): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');

    const timestamp = Math.floor(Date.now() / 1000);
    const fileName = `${timestamp}.webm`;

    // 1. Get Upload Target URL from Backend (Azure priority, Local fallback)
    const sasData = await getAzureUploadSasUrl(fileName);

    // 2. Upload binary file
    await uploadBlobToAzure(sasData.uploadUrl, audioBlob, onProgress, { fileName });

    const providerName = (sasData as any).isAzure ? 'azure' : 'local';

    // 3. Update the Firestore lecture document
    await updateLecture(lectureId, {
      status: 'uploaded',
      audioUrl: sasData.audioUrl,
      blobPath: sasData.blobPath,
      storageProvider: providerName,
      storageVersion: 1,
      uploadedAt: serverTimestamp()
    });

    return sasData.audioUrl;
  };

  const uploadLectureDocument = async (
    lectureId: string, 
    file: File, 
    onProgress: (progress: number) => void
  ): Promise<{ audioUrl: string; blobPath: string }> => {
    if (!userId) throw new Error('User not authenticated');

    const timestamp = Math.floor(Date.now() / 1000);
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const fileName = `${timestamp}.${fileExtension}`;

    // 1. Get Upload Target URL from Backend (Azure priority, Local fallback)
    const sasData = await getAzureUploadSasUrl(fileName);

    // 2. Upload binary file
    await uploadBlobToAzure(sasData.uploadUrl, file, onProgress, { fileName });

    const providerName = (sasData as any).isAzure ? 'azure' : 'local';

    // 3. Update the Firestore lecture document
    await updateLecture(lectureId, {
      status: 'uploaded',
      audioUrl: sasData.audioUrl,
      blobPath: sasData.blobPath,
      storageProvider: providerName,
      storageVersion: 1,
      uploadedAt: serverTimestamp()
    });

    return { audioUrl: sasData.audioUrl, blobPath: sasData.blobPath };
  };

  return { 
    lectures, 
    isLoading, 
    error, 
    addLecture, 
    updateLecture, 
    deleteLecture, 
    uploadLectureAudio,
    uploadLectureDocument
  };
}

