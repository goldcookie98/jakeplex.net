import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

let db = null;
let requestsCollection = null;
let knownDevicesCollection = null;
let customUsersCollection = null;

let firebaseInitError = null;

// Ensure all required variables are present
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  firebaseInitError = `Missing Env Vars: ID=${!!process.env.FIREBASE_PROJECT_ID}, EMAIL=${!!process.env.FIREBASE_CLIENT_EMAIL}, PKEY=${!!process.env.FIREBASE_PRIVATE_KEY}`;
  console.warn("⚠️ Firebase Admin credentials not found in env variables.");
} else {
  try {
    let rawKey = process.env.FIREBASE_PRIVATE_KEY.trim();
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.slice(1, -1);
    }
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID.trim(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
      privateKey: rawKey.replace(/\\n/g, '\n')
    };
    initializeApp({ credential: cert(serviceAccount) });
    db = getFirestore();
    requestsCollection = db.collection('requests');
    knownDevicesCollection = db.collection('known_devices');
    customUsersCollection = db.collection('custom_users');
  } catch (e) {
    firebaseInitError = e.message;
    console.error("Firebase Admin Initialization Error:", e);
  }
}

// Add a new request
export const addRequest = async (data) => {
  if (!requestsCollection) throw new Error("Database not connected.");
  const docRef = await requestsCollection.add({
    tmdb_id: data.tmdb_id,
    media_type: data.media_type,
    title: data.title,
    poster_path: data.poster_path || null,
    backdrop_path: data.backdrop_path || null,
    overview: data.overview || null,
    year: data.year || null,
    requested_by: data.requested_by || 'Anonymous',
    device_info: data.device_info || null,
    ip_address: data.ip_address || null,
    location_info: data.location_info || null,
    estimated_user: data.estimated_user || null,
    plex_email: data.plex_email || null,
    plex_thumb: data.plex_thumb || null,
    requested_at: new Date().toISOString(),
    status: 'pending'
  });
  return { id: docRef.id, ...data };
};

// Get all requests
export const getRequests = async () => {
  if (!requestsCollection) throw new Error(`Database not connected. Details: ${firebaseInitError}`);
  const snapshot = await requestsCollection.orderBy('requested_at', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get requests by user
export const getRequestsByUser = async (username) => {
  if (!requestsCollection) throw new Error("Database not connected.");
  const snapshot = await requestsCollection
    .where('requested_by', '==', username)
    .get();
    
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort manually to avoid requiring a Firestore composite index
  return docs.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
};

// Get a request by TMDB ID
export const getRequestByTmdbId = async (tmdbId, mediaType) => {
  if (!requestsCollection) throw new Error("Database not connected.");
  const snapshot = await requestsCollection
    .where('tmdb_id', '==', tmdbId)
    .where('media_type', '==', mediaType)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Update request status
export const updateRequestStatus = async (id, status) => {
  if (!requestsCollection) throw new Error("Database not connected.");
  if (!['pending', 'approved', 'declined'].includes(status)) {
    throw new Error('Invalid status');
  }
  await requestsCollection.doc(id).update({ status });
  return { success: true };
};

// Delete a request
export const deleteRequest = async (id) => {
  if (!requestsCollection) throw new Error("Database not connected.");
  await requestsCollection.doc(id).delete();
  return { success: true };
};

export const updateRequestEstimatedUser = async (id, estimated_user) => {
  if (!requestsCollection) throw new Error("Database not connected.");
  await requestsCollection.doc(id).update({ estimated_user });
  return { success: true };
};

export const assignKnownDevice = async (name, ipAddress, userAgent) => {
  if (!knownDevicesCollection) throw new Error("Database not connected.");
  // check if already exists
  const snapshot = await knownDevicesCollection
    .where('ip_address', '==', ipAddress)
    .where('user_agent', '==', userAgent)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    await knownDevicesCollection.add({
      assigned_user: name,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } else {
    // update existing
    await knownDevicesCollection.doc(snapshot.docs[0].id).update({ assigned_user: name });
  }
  return { success: true };
};

export const findKnownDevice = async (ipAddress, userAgent) => {
  if (!knownDevicesCollection) throw new Error("Database not connected.");
  if (!ipAddress || !userAgent) return null;
  const snapshot = await knownDevicesCollection
    .where('ip_address', '==', ipAddress)
    .where('user_agent', '==', userAgent)
    .limit(1)
    .get();
    
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
};

export const createCustomUser = async (username, password) => {
  if (!customUsersCollection) throw new Error("Database not connected.");
  const existing = await customUsersCollection.where('username', '==', username).limit(1).get();
  if (!existing.empty) throw new Error("Username already exists");
  const password_hash = await bcrypt.hash(password, 10);
  const docRef = await customUsersCollection.add({ username, password_hash, password, created_at: new Date().toISOString() });
  return { id: docRef.id, username };
};

export const getCustomUsers = async () => {
  if (!customUsersCollection) throw new Error("Database not connected.");
  const snapshot = await customUsersCollection.orderBy('created_at', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, username: doc.data().username, password: doc.data().password, created_at: doc.data().created_at }));
};

export const deleteCustomUser = async (id) => {
  if (!customUsersCollection) throw new Error("Database not connected.");
  await customUsersCollection.doc(id).delete();
  return { success: true };
};

export const findCustomUserByUsername = async (username) => {
  if (!customUsersCollection) throw new Error("Database not connected.");
  const snapshot = await customUsersCollection.where('username', '==', username).limit(1).get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};
