/**
 * Project Kuma Backend Server for Render Deployment
 * Express + Firebase Admin SDK REST API
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Firebase Admin Initialization
let firebaseAdminApp = null;
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    console.log('[Kuma Backend] Firebase Admin initialized with service account.');
  } else {
    firebaseAdminApp = admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'kuma-capacity-connect'
    });
    console.log('[Kuma Backend] Firebase Admin initialized in default mode.');
  }
} catch (err) {
  console.warn('[Kuma Backend] Firebase Admin initialization warning:', err.message);
}

const db = firebaseAdminApp ? admin.firestore() : null;

// ============================================================================
// REST API ROUTES
// ============================================================================

// Health check endpoint (for Render automated ping)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Kuma Capacity Connect Backend',
    timestamp: new Date().toISOString(),
    firebaseAdminConnected: !!db
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', version: '1.0.0' });
});

// Centralized Competency Catalog API
app.get('/api/competencies', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('competencyCatalog').get();
      const catalog = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, count: catalog.length, catalog });
    }
    return res.json({
      success: true,
      message: 'Running in standalone fallback mode',
      catalog: [
        { id: 'cat-comp-1', name: 'Python Programming', category: 'Technical', isActive: true },
        { id: 'cat-comp-2', name: 'Data Analysis & Insights', category: 'Technical', isActive: true },
        { id: 'cat-comp-9', name: 'Digital Literacy & Tech Adoption', category: 'Digital', isActive: true }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Competency Assessment Attempts API
app.post('/api/assessments/attempts', async (req, res) => {
  try {
    const { userId, quizId, quizTitle, competencyId, competencyName, scorePercentage, assessedLevel } = req.body;
    if (!userId || !quizId) {
      return res.status(400).json({ success: false, error: 'userId and quizId are required' });
    }

    const attemptRecord = {
      ...req.body,
      createdAt: admin.firestore.FieldValue ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (db) {
      const docRef = await db.collection('assessmentAttempts').add(attemptRecord);
      return res.json({ success: true, attemptId: docRef.id });
    }

    return res.json({ success: true, attemptId: `attempt-local-${Date.now()}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static build if dist directory exists
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.use((req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({ message: 'Kuma Backend API Service is Running. Frontend dist bundle not served.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Kuma Capacity Connect Server listening on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});
