import * as admin from 'firebase-admin';

// Initialize Firebase Admin for verifying ID tokens.
// Service Account is only needed for accessing services (like Firestore/Storage)
// For verifyIdToken, projectId is sufficient as it fetches public certs from Google.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'offerwise-57d08'
  });
}

export { admin };
