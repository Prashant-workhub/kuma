import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { BlobServiceClient } from '@azure/storage-blob';

dotenv.config();

async function resetAllData() {
  console.log('---------------------------------------------------------');
  console.log('🚀 STARTING COMPLETE DATA PURGE & DATABASE RESET');
  console.log('---------------------------------------------------------');

  // 1. Initialize Firebase Admin
  let adminApp;
  const serviceAccountPath = path.resolve('noteit-3bb0f-firebase-adminsdk-fbsvc-da3b34008c.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    adminApp = initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized using service account file.');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    adminApp = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log('✅ Firebase Admin initialized using project ID env.');
  } else {
    throw new Error('Firebase Admin credentials not found.');
  }

  const auth = getAuth(adminApp);
  const db = getFirestore(adminApp);

  // 2. Delete all Firebase Auth Users
  console.log('\n--- 1. DELETING FIREBASE AUTH USERS ---');
  let authUserCount = 0;
  try {
    let pageToken: string | undefined = undefined;
    do {
      const listUsersResult = await auth.listUsers(1000, pageToken);
      const uids = listUsersResult.users.map(u => u.uid);
      if (uids.length > 0) {
        const deleteResult = await auth.deleteUsers(uids);
        authUserCount += deleteResult.successCount;
        console.log(`Deleted batch of ${deleteResult.successCount} users from Firebase Auth.`);
        if (deleteResult.failureCount > 0) {
          console.warn(`Failed to delete ${deleteResult.failureCount} users.`);
        }
      }
      pageToken = listUsersResult.pageToken;
    } while (pageToken);
    console.log(`✅ Successfully deleted ${authUserCount} users from Firebase Auth.`);
  } catch (err) {
    console.error('❌ Error deleting Auth users:', err);
  }

  // 3. Delete all Firestore Collections & Documents
  console.log('\n--- 2. DELETING FIRESTORE COLLECTIONS & DOCUMENTS ---');
  try {
    const collections = await db.listCollections();
    console.log(`Found ${collections.length} root collections: ${collections.map(c => c.id).join(', ') || 'None'}`);

    for (const col of collections) {
      console.log(`Clearing collection: "${col.id}"...`);
      const snapshot = await col.get();
      let docCount = 0;
      const batch = db.batch();

      for (const docSnap of snapshot.docs) {
        // Recursively delete subcollections if any
        const subcols = await docSnap.ref.listCollections();
        for (const subcol of subcols) {
          const subSnap = await subcol.get();
          for (const subDoc of subSnap.docs) {
            batch.delete(subDoc.ref);
          }
        }
        batch.delete(docSnap.ref);
        docCount++;
      }

      await batch.commit();
      console.log(`✅ Deleted ${docCount} documents from collection "${col.id}".`);
    }
    console.log('✅ All Firestore collections purged successfully.');
  } catch (err) {
    console.error('❌ Error deleting Firestore documents:', err);
  }

  // 4. Delete all Azure Blob Storage Blobs
  console.log('\n--- 3. DELETING AZURE BLOB STORAGE FILES ---');
  const azureConnString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (azureConnString) {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(azureConnString);
      let containerCount = 0;
      let totalBlobCount = 0;

      for await (const container of blobServiceClient.listContainers()) {
        containerCount++;
        console.log(`Inspecting Azure container: "${container.name}"...`);
        const containerClient = blobServiceClient.getContainerClient(container.name);
        
        let containerBlobCount = 0;
        for await (const blob of containerClient.listBlobsFlat()) {
          await containerClient.deleteBlob(blob.name);
          containerBlobCount++;
          totalBlobCount++;
        }
        console.log(`✅ Deleted ${containerBlobCount} blobs from Azure container "${container.name}".`);
      }
      console.log(`✅ Azure Blob Storage purge complete! Total blobs deleted: ${totalBlobCount} across ${containerCount} containers.`);
    } catch (err) {
      console.error('❌ Error purging Azure Blob Storage:', err);
    }
  } else {
    console.log('⚠️ AZURE_STORAGE_CONNECTION_STRING not set in .env; skipping Azure Blob purge.');
  }

  // 5. Clean local uploads directory
  console.log('\n--- 4. CLEANING LOCAL UPLOADS FOLDER ---');
  try {
    const uploadsDir = path.resolve('uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedCount = 0;
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          deletedCount++;
        }
      }
      console.log(`✅ Cleaned ${deletedCount} local files from uploads/ folder.`);
    }
  } catch (err) {
    console.error('❌ Error cleaning local uploads directory:', err);
  }

  console.log('\n---------------------------------------------------------');
  console.log('🎉 COMPLETE FRESH START DATA RESET FINISHED SUCCESSFULLY!');
  console.log('---------------------------------------------------------');
}

resetAllData().catch(err => {
  console.error('❌ Fatal error running data reset script:', err);
  process.exit(1);
});
