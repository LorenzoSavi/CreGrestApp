import { ref, computed } from 'vue'
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import { auth } from '@/firebase/config'

const user = ref(null)
const loading = ref(true)
const error = ref(null)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value)

  const login = async (email, password, rememberMe = false) => {
    try {
      loading.value = true
      error.value = null

      // Imposta la persistenza in base al checkbox "Ricordami"
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user

      return { success: true, user: userCredential.user }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  const initAuth = () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        user.value = firebaseUser
        loading.value = false
        resolve(firebaseUser)
        unsubscribe()
      })
    })
  }

  return {
    user: computed(() => user.value),
    isAuthenticated,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    login,
    logout,
    initAuth
  }
}
