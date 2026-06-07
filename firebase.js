import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIZj4hMczDuWPiMJ27D5zRM_KLIH40LD0",
  authDomain: "queuetrack-management-system.firebaseapp.com",
  projectId: "queuetrack-management-system",
  storageBucket: "queuetrack-management-system.firebasestorage.app",
  messagingSenderId: "853289159849",
  appId: "1:853289159849:web:8065a3c2bf68cdd1ceadb8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
