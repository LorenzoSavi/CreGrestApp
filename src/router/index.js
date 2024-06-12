import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue';
import AddPoint from '../views/AddPoint.vue';
import TotalPoint from '../views/TotalPoint.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/add-point',
    name: 'AddPoint',
    component: AddPoint
  },
  {
    path: '/total-point',
    name: 'TotalPoint',
    component: TotalPoint,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  const specialUsers = ['FraVita', 'savi', 'NicolaL.1004', 'r.ferrari'];
  if (to.matched.some(record => record.meta.requiresAuth) && (!loggedInUser || !specialUsers.includes(loggedInUser.username))) {
    next('/');
  } else {
    next();
  }
});

export default router
