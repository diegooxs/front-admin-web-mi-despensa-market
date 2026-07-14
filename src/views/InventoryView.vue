<script setup>
import { computed, onMounted, ref } from 'vue'
import AppDrawer from '../components/AppDrawer.vue'
import { api } from '../services/api'

const products = ref([])
const loading = ref(true)
const error = ref('')
const selected = ref(null)
const newStock = ref(0)
const search = ref('')

const filtered = computed(() => products.value.filter((product) => product.nombre.toLowerCase().includes(search.value.toLowerCase())))
const lowStock = computed(() => products.value.filter((product) => product.stock > 0 && product.stock <= 10).length)
const soldOut = computed(() => products.value.filter((product) => product.stock === 0).length)

function stockStatus(product) {
  if (product.stock === 0) return ['Agotado', 'danger']
  if (product.stock <= 10) return ['Poco stock', 'warning']
  return ['Disponible', 'success']
}

async function load() {
  loading.value = true
  try { products.value = await api.get('/productos/') } catch (err) { error.value = err.message } finally { loading.value = false }
}

function openAdjust(product) {
  selected.value = product
  newStock.value = product.stock
}

async function updateStock() {
  try {
    await api.patch(`/productos/${selected.value.id}/`, { stock: Number(newStock.value) })
    selected.value = null
    await load()
  } catch (err) { error.value = err.message }
}

onMounted(load)
</script>

<template>
  <section class="admin-page">
    <header class="page-heading"><div><h1>Inventario</h1><p>Consulta existencias y actualiza la disponibilidad de los productos.</p></div></header>
    <div class="metric-grid metric-grid-3"><article class="metric"><span>Total de productos</span><strong>{{ products.length }}</strong></article><article class="metric warning"><span>Poco stock</span><strong>{{ lowStock }}</strong></article><article class="metric danger"><span>Agotados</span><strong>{{ soldOut }}</strong></article></div>
    <div class="table-toolbar"><div class="search-input"><span>⌕</span><input v-model="search" placeholder="Buscar producto" /></div></div>
    <div v-if="error" class="feedback error">{{ error }}</div>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Imagen</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock actual</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      <tr v-if="loading"><td colspan="7">Cargando inventario...</td></tr>
      <tr v-for="product in filtered" :key="product.id"><td><div class="table-image"><img v-if="product.imagen_url" :src="product.imagen_url" :alt="product.nombre" /></div></td><td><strong>{{ product.nombre }}</strong></td><td>{{ product.categoria_nombre }}</td><td>${{ Number(product.precio).toFixed(2) }}</td><td>{{ product.stock }}</td><td><span class="status-badge" :class="stockStatus(product)[1]">{{ stockStatus(product)[0] }}</span></td><td><button class="table-action" @click="openAdjust(product)">Ajustar stock</button></td></tr>
    </tbody></table></div>

    <AppDrawer :open="Boolean(selected)" title="Ajustar stock" @close="selected = null">
      <div v-if="selected" class="drawer-stack"><div class="drawer-entity"><div class="table-image large"><img v-if="selected.imagen_url" :src="selected.imagen_url" /></div><div><strong>{{ selected.nombre }}</strong><span>{{ selected.categoria_nombre }}</span></div></div><div class="drawer-summary"><div><span>Stock actual</span><strong>{{ selected.stock }}</strong></div><div><span>Estado actual</span><b class="status-badge" :class="stockStatus(selected)[1]">{{ stockStatus(selected)[0] }}</b></div></div><div class="field"><label for="new-stock">Nuevo stock</label><input id="new-stock" v-model="newStock" min="0" type="number" /></div><div class="change-preview"><span>Vista previa del cambio</span><strong>{{ Number(newStock) === 0 ? 'Agotado' : Number(newStock) <= 10 ? 'Poco stock' : 'Disponible' }}</strong><small>Nuevo stock: {{ newStock }}</small></div></div>
      <template #footer><button class="button-secondary" @click="selected = null">Cancelar</button><button class="button-primary" @click="updateStock">Actualizar stock</button></template>
    </AppDrawer>
  </section>
</template>
