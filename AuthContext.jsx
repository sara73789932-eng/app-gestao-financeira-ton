import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

// Gera (ou recupera) um ID único e estável para este navegador/dispositivo
function getDeviceId() {
  let id = localStorage.getItem('tomfin_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('tomfin_device_id', id)
  }
  return id
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [perfil, setPerfil] = useState(null) // documento em /usuarios/{uid}
  const [loading, setLoading] = useState(true)
  const [erroAcesso, setErroAcesso] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setErroAcesso('')
      if (!user) {
        setFirebaseUser(null)
        setPerfil(null)
        setLoading(false)
        return
      }

      const ref = doc(db, 'usuarios', user.uid)
      const snap = await getDoc(ref)

      if (!snap.exists()) {
        setErroAcesso('Este e-mail não está cadastrado. Fale com o administrador para liberar seu acesso.')
        await signOut(auth)
        setFirebaseUser(null)
        setPerfil(null)
        setLoading(false)
        return
      }

      const dados = snap.data()

      if (dados.status !== 'ativo') {
        setErroAcesso('Seu acesso está bloqueado. Fale com o administrador.')
        await signOut(auth)
        setFirebaseUser(null)
        setPerfil(null)
        setLoading(false)
        return
      }

      const deviceId = getDeviceId()

      // Primeiro acesso: vincula este dispositivo ao usuário
      if (!dados.deviceId) {
        await setDoc(ref, { deviceId, ultimoAcesso: serverTimestamp() }, { merge: true })
      } else if (dados.deviceId !== deviceId) {
        // Dispositivo diferente do vinculado -> bloqueia
        setErroAcesso('Seu acesso é individual e intransferível. Este login já está vinculado a outro dispositivo. Peça ao administrador para liberar a troca de dispositivo.')
        await signOut(auth)
        setFirebaseUser(null)
        setPerfil(null)
        setLoading(false)
        return
      } else {
        await setDoc(ref, { ultimoAcesso: serverTimestamp() }, { merge: true })
      }

      setFirebaseUser(user)
      setPerfil({ ...dados, uid: user.uid })
      setLoading(false)
    })

    return () => unsub()
  }, [])

  async function login(email, senha) {
    setErroAcesso('')
    await signInWithEmailAndPassword(auth, email, senha)
  }

  async function logout() {
    await signOut(auth)
  }

  const value = {
    firebaseUser,
    perfil,
    isAdmin: perfil?.role === 'admin',
    loading,
    erroAcesso,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
