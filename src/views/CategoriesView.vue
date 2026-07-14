<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../services/api'
import AppDrawer from '../components/AppDrawer.vue'

const categories = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const editingId = ref(null)
const products = ref([])
const search = ref('')
const drawerOpen = ref(false)
const filtered = computed(() => categories.value.filter((category) => [category.nombre, category.descripcion].some((value) => (value || '').toLowerCase().includes(search.value.toLowerCase()))))
const productCount = (id) => products.value.filter((product) => product.categoria_id === id).length

const form = reactive({
  nombre: '',
  descripcion: '',
})

function resetForm() {
  form.nombre = ''
  form.descripcion = ''
  editingId.value = null
}

function editCategory(category) {
  editingId.value = category.id
  form.nombre = category.nombre
  form.descripcion = category.descripcion || ''
  success.value = ''
  error.value = ''
  drawerOpen.value = true
}

function newCategory() { resetForm(); drawerOpen.value = true }

async function loadCategories() {
  loading.value = true
  error.value = ''

  try {
    ;[categories.value, products.value] = await Promise.all([api.get('/categorias/'), api.get('/productos/')])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function submit() {
  error.value = ''
  success.value = ''

  try {
    if (editingId.value) {
      await api.patch(`/categorias/${editingId.value}/`, form)
      success.value = 'Categoría actualizada.'
    } else {
      await api.post('/categorias/', form)
      success.value = 'Categoría creada.'
    }

    resetForm()
    drawerOpen.value = false
    await loadCategories()
  } catch (err) {
    error.value = err.message
  }
}

async function removeCategory(id) {
  if (!window.confirm('¿Eliminar esta categoría?')) return

  error.value = ''
  success.value = ''

  try {
    await api.delete(`/categorias/${id}/`)
    success.value = 'Categoría eliminada.'
    await loadCategories()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadCategories)
</script>

<template>
  <section class="admin-page">
    <header class="page-heading"><div><h1>Categorías</h1><p>Organiza los productos para facilitar la búsqueda y el control del catálogo.</p></div><button class="button-primary" @click="newCategory">+ Nueva categoría</button></header>

    <div v-if="error" class="feedback error">{{ error }}</div>
    <div v-if="success" class="feedback success">{{ success }}</div>

    <div class="table-toolbar"><div class="search-input"><span>⌕</span><input v-model="search" placeholder="Buscar categoría" /></div></div>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Categoría</th><th>Descripción</th><th>Productos</th><th>Estado</th><th>Acciones</th></tr></thead><tbody><tr v-if="loading"><td colspan="5">Cargando categorías...</td></tr><tr v-for="category in filtered" :key="category.id"><td><strong>{{ category.nombre }}</strong></td><td>{{ category.descripcion || 'Sin descripción' }}</td><td>{{ productCount(category.id) }} productos</td><td><span class="status-badge" :class="productCount(category.id) ? 'success' : ''">{{ productCount(category.id) ? 'Activa' : 'Sin productos' }}</span></td><td><div class="row-actions"><button class="table-action" @click="editCategory(category)">Editar</button><button class="icon-button danger-icon" :disabled="productCount(category.id) > 0" title="Eliminar" @click="removeCategory(category.id)">×</button></div></td></tr><tr v-if="!loading && !filtered.length"><td colspan="5">No hay categorías registradas.</td></tr></tbody></table></div>
    <AppDrawer :open="drawerOpen" :title="editingId ? 'Editar categoría' : 'Nueva categoría'" @close="drawerOpen = false">
        <form id="category-form" @submit.prevent="submit">
          <div class="field">
            <label for="cat-name">Nombre</label>
            <input id="cat-name" v-model.trim="form.nombre" required />
          </div>

          <div class="field">
            <label for="cat-desc">Descripción</label>
            <textarea id="cat-desc" v-model="form.descripcion" />
          </div>

          <div class="category-preview"><span>Vista previa</span><strong>{{ form.nombre || 'Nombre categoría' }}</strong><small>{{ editingId ? productCount(editingId) : 0 }} productos asociados</small></div>
        </form>
      <template #footer><button class="button-secondary" @click="drawerOpen = false">Cancelar</button><button class="button-primary" form="category-form">{{ editingId ? 'Guardar cambios' : 'Crear categoría' }}</button></template>
    </AppDrawer>
  </section>
</template>
