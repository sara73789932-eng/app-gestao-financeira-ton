import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAPb40tiURzusWckJewjj1wGmZZfDkJcgY",
  authDomain: "app-gestao-financeira-ton.firebaseapp.com",
  projectId: "app-gestao-financeira-ton",
  storageBucket: "app-gestao-financeira-ton.firebasestorage.app",
  messagingSenderId: "258176522814",
  appId: "1:258176522814:web:ec36dcfa9d53050c938f6f"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export default appss