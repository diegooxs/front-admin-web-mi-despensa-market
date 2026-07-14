<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import storeLogo from '../assets/login/store-logo.png'
import { clearSession, getStoredProfile } from '../services/auth'

const router = useRouter()
const route = useRoute()
const user = computed(() => getStoredProfile())
const initials = computed(() => (user.value?.nombre || 'Administrador').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase())
const pageTitle = computed(() => route.meta.title || 'Resumen')
const navigation = [
  { to: '/', label: 'Resumen', icon: 'dashboard' },
  { to: '/productos', label: 'Productos', icon: 'products' },
  { to: '/categorias', label: 'Categorías', icon: 'categories' },
  { to: '/inventario', label: 'Inventario', icon: 'inventory' },
  { to: '/pedidos', label: 'Pedidos', icon: 'orders' },
  { to: '/pagos', label: 'Pagos', icon: 'payments' },
  { to: '/usuarios', label: 'Usuarios', icon: 'users' },
]

function logout() {
  clearSession()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-brand">
        <img :src="storeLogo" alt="Mi Despensa Market" />
        <div><strong>Mi Despensa</strong><span>Admin Panel</span></div>
      </div>

      <nav class="admin-nav" aria-label="Navegación principal">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="admin-nav-link">
          <AppIcon :name="item.icon" /><span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="admin-sidebar-foot">
        <div class="sidebar-profile"><span class="avatar avatar-small">{{ initials }}</span><div><strong>{{ user?.nombre || 'Administrador' }}</strong><small>{{ user?.correo }}</small></div></div>
        <button class="admin-nav-link logout-button" type="button" @click="logout"><AppIcon name="logout" /><span>Cerrar sesión</span></button>
      </div>
    </aside>

    <header class="admin-topbar">
      <div class="global-search"><AppIcon name="search" /><input :placeholder="`Buscar en ${pageTitle.toLowerCase()}...`" /></div>
      <div class="topbar-profile"><div><strong>{{ user?.nombre || 'Administrador' }}</strong><span>Administrador</span></div><span class="avatar">{{ initials }}</span></div>
    </header>

    <main class="admin-content"><RouterView /></main>
  </div>
</template>
