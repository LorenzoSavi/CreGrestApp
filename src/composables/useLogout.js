import { useRouter } from 'vue-router'

export const useLogout = () => {
  const router = useRouter()

  const logout = () => {
    // Rimuovi i dati dell'utente da entrambi i storage
    localStorage.removeItem('loggedInUser')
    sessionStorage.removeItem('loggedInUser')
    
    // Reindirizza al login
    router.push('/login')
  }

  return {
    logout
  }
}
