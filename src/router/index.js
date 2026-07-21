import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../views/AdminLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import ProductsView from '../views/ProductsView.vue'
import UsersView from '../views/UsersView.vue'
import InventoryView from '../views/InventoryView.vue'
import OrdersView from '../views/OrdersView.vue'
import PaymentsView from '../views/PaymentsView.vue'
import ReviewsView from '../views/ReviewsView.vue'
import { getAccessToken } from '../services/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: DashboardView, meta: { title: 'Resumen' } },
      { path: 'categorias', name: 'categories', component: CategoriesView, meta: { title: 'Categorías' } },
      { path: 'productos', name: 'products', component: ProductsView, meta: { title: 'Productos' } },
      { path: 'inventario', name: 'inventory', component: InventoryView, meta: { title: 'Inventario' } },
      { path: 'pedidos', name: 'orders', component: OrdersView, meta: { title: 'Pedidos' } },
      { path: 'pagos', name: 'payments', component: PaymentsView, meta: { title: 'Pagos' } },
      { path: 'resenas', name: 'reviews', component: ReviewsView, meta: { title: 'Reseñas' } },
      { path: 'usuarios', name: 'users', component: UsersView, meta: { title: 'Usuarios' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = getAccessToken()

  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }

  if (to.name === 'login' && token) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
