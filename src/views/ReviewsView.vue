<script setup>
import { computed, onMounted, ref } from 'vue'
import AppDrawer from '../components/AppDrawer.vue'
import { api } from '../services/api'

const reviews = ref([])
const products = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const search = ref('')
const productFilter = ref('')
const ratingFilter = ref('')
const selected = ref(null)

const averageRating = computed(() => {
  if (!reviews.value.length) return 0
  const total = reviews.value.reduce((sum, review) => sum + Number(review.calificacion || 0), 0)
  return total / reviews.value.length
})

const fiveStarCount = computed(() => reviews.value.filter((review) => Number(review.calificacion) === 5).length)
const productWithMostReviews = computed(() => {
  const counts = reviews.value.reduce((acc, review) => {
    const key = review.producto_id
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const [productId, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || []
  const product = products.value.find((item) => item.id === productId)
  return productId ? { name: product?.nombre || 'Producto', count } : null
})

const filteredReviews = computed(() => {
  const term = search.value.trim().toLowerCase()

  return reviews.value.filter((review) => {
    const matchesTerm = !term || [
      review.producto_nombre,
      review.usuario_nombre,
      review.comentario,
    ].filter(Boolean).some((value) => value.toLowerCase().includes(term))
    const matchesProduct = !productFilter.value || review.producto_id === productFilter.value
    const matchesRating = !ratingFilter.value || Number(review.calificacion) === Number(ratingFilter.value)

    return matchesTerm && matchesProduct && matchesRating
  })
})

function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function stars(rating) {
  return '★'.repeat(Number(rating || 0)).padEnd(5, '☆')
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    const [reviewsPayload, productsPayload] = await Promise.all([
      api.get('/resenas/'),
      api.get('/productos/'),
    ])

    reviews.value = reviewsPayload
    products.value = productsPayload
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function open(review) {
  selected.value = review
}

async function removeReview(review) {
  if (!window.confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return

  error.value = ''
  success.value = ''

  try {
    await api.delete(`/resenas/${review.id}/`)
    success.value = 'Reseña eliminada.'
    selected.value = null
    await load()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(load)
</script>

<template>
  <section class="admin-page">
    <header class="page-heading">
      <div>
        <h1>Reseñas</h1>
        <p>Consulta las opiniones que los clientes han dejado sobre los productos.</p>
      </div>
    </header>

    <div class="metric-grid">
      <article class="metric">
        <span>Reseñas registradas</span>
        <strong>{{ reviews.length }}</strong>
      </article>
      <article class="metric">
        <span>Calificación promedio</span>
        <strong>{{ averageRating.toFixed(1) }}/5</strong>
      </article>
      <article class="metric">
        <span>Reseñas de 5 estrellas</span>
        <strong>{{ fiveStarCount }}</strong>
      </article>
      <article class="metric warning">
        <span>Producto más reseñado</span>
        <strong>{{ productWithMostReviews?.count || 0 }}</strong>
        <small>{{ productWithMostReviews?.name || 'Sin datos' }}</small>
      </article>
    </div>

    <div v-if="error" class="feedback error">{{ error }}</div>
    <div v-if="success" class="feedback success">{{ success }}</div>

    <div class="table-toolbar">
      <div class="search-input">
        <span>⌕</span>
        <input v-model="search" placeholder="Producto, cliente o comentario" />
      </div>
      <select v-model="productFilter" class="compact-select">
        <option value="">Todos los productos</option>
        <option v-for="product in products" :key="product.id" :value="product.id">
          {{ product.nombre }}
        </option>
      </select>
      <select v-model="ratingFilter" class="compact-select">
        <option value="">Todas las calificaciones</option>
        <option v-for="rating in [5, 4, 3, 2, 1]" :key="rating" :value="rating">
          {{ rating }} estrellas
        </option>
      </select>
    </div>

    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cliente</th>
            <th>Calificación</th>
            <th>Comentario</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6">Cargando reseñas...</td>
          </tr>
          <tr v-for="review in filteredReviews" :key="review.id">
            <td>
              <strong>{{ review.producto_nombre }}</strong>
              <small>{{ review.producto_id }}</small>
            </td>
            <td>{{ review.usuario_nombre }}</td>
            <td><span class="review-stars">{{ stars(review.calificacion) }}</span></td>
            <td><span class="review-comment">{{ review.comentario }}</span></td>
            <td>{{ formatDate(review.creado_en) }}</td>
            <td>
              <div class="row-actions">
                <button class="table-action" type="button" @click="open(review)">Ver detalle</button>
                <button class="icon-button danger-icon" title="Eliminar" type="button" @click="removeReview(review)">×</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !filteredReviews.length">
            <td colspan="6">No hay reseñas que coincidan.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppDrawer :open="Boolean(selected)" title="Detalle de reseña" @close="selected = null">
      <div v-if="selected" class="drawer-stack">
        <section class="detail-section">
          <h3>Producto</h3>
          <strong>{{ selected.producto_nombre }}</strong>
          <p>{{ selected.producto_id }}</p>
        </section>

        <section class="detail-section">
          <h3>Cliente</h3>
          <strong>{{ selected.usuario_nombre }}</strong>
          <p>{{ selected.usuario_id }}</p>
        </section>

        <div class="detail-grid">
          <div>
            <span>Calificación</span>
            <strong class="review-stars">{{ stars(selected.calificacion) }}</strong>
          </div>
          <div>
            <span>Fecha</span>
            <strong>{{ formatDate(selected.creado_en) }}</strong>
          </div>
        </div>

        <section class="detail-section">
          <h3>Comentario</h3>
          <p class="review-detail-comment">{{ selected.comentario }}</p>
        </section>

        <div class="notice">
          El administrador puede eliminar reseñas ofensivas, duplicadas o que no correspondan al producto.
        </div>
      </div>

      <template #footer>
        <button class="button-secondary" type="button" @click="selected = null">Cerrar</button>
        <button class="button-danger" type="button" @click="removeReview(selected)">Eliminar reseña</button>
      </template>
    </AppDrawer>
  </section>
</template>
