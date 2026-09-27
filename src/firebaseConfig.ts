// Mock Firebase configuration for standalone client-side execution

export const app = { options: {} };
export const auth = {
  currentUser: {
    uid: 'local-user-123',
    email: 'user@example.com',
    displayName: 'Student User',
    photoURL: '',
    getIdToken: async (_forceRefresh?: boolean) => 'mock-local-token-123'
  }
};

export const db = {};
export const storage = {};

export default app;
