import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/add-point',
    name: 'AddPoint',
    component: () => import('@/views/AddPoint.vue'),
    meta: { requiresAuth: true, requiresNonAdmin: false }
  },
  {
    path: '/total-point',
    name: 'TotalPoint',
    component: () => import('@/views/TotalPoint.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export const logout = () => {
  localStorage.removeItem('loggedInUser')
  sessionStorage.removeItem('loggedInUser')
  router.push('/login')
}

router.beforeEach((to, from, next) => {
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('loggedInUser')) || JSON.parse(sessionStorage.getItem('loggedInUser'))
    } catch { return null }
  }

  const loggedInUser = getCurrentUser()
  const isAuthenticated = !!loggedInUser
  const isAdmin = loggedInUser?.isAdmin === true

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Non loggato → login
    next('/login')
  } else if (to.meta.requiresAdmin && isAuthenticated && !isAdmin) {
    // Tenta di accedere a una rotta admin senza essere admin → rimanda ad add-point
    next('/add-point')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    // Già loggato → redirige alla pagina giusta
    next(isAdmin ? '/total-point' : '/add-point')
  } else {
    next()
  }
})

export default router
