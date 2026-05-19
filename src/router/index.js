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
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/classifica-proiezione',
    name: 'ClassificaProiezione',
    component: () => import('@/views/ClassificaProiezione.vue'),
    meta: { requiresAuth: true, requiresClassifica: true }
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
  const isClassifica = loggedInUser?.isClassifica === true

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && isAuthenticated && !isAdmin) {
    next(isClassifica ? '/classifica-proiezione' : '/add-point')
  } else if (to.meta.requiresClassifica && isAuthenticated && !isClassifica && !isAdmin) {
    next('/add-point')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    if (isAdmin) next('/total-point')
    else if (isClassifica) next('/classifica-proiezione')
    else next('/add-point')
  } else {
    next()
  }
})

export default router
