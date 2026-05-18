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
    meta: { requiresAuth: true }
  },
  {
    path: '/total-point',
    name: 'TotalPoint',
    component: () => import('@/views/TotalPoint.vue'),
    meta: { requiresAuth: true }
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
    let user = JSON.parse(localStorage.getItem('loggedInUser'))
    if (!user) {
      user = JSON.parse(sessionStorage.getItem('loggedInUser'))
    }
    return user
  }

  const loggedInUser = getCurrentUser()
  const isAuthenticated = !!loggedInUser
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    if (loggedInUser.isAdmin) {
      next('/total-point')
    } else {
      next('/add-point')
    }
  } else {
    next()
  }
})

export default router
