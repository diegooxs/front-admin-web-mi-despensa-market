<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { api } from '../services/api'
import AppDrawer from '../components/AppDrawer.vue'

const products = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const search = ref('')
const editingId = ref(null)
const imageInput = ref(null)
const imageFile = ref(null)
const imagePreview = ref('')
const currentImageUrl = ref('')
const drawerOpen = ref(false)
const categoryFilter = ref('')
const availabilityFilter = ref('')
let objectUrl = ''

const form = reactive({
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  categoria_id: '',
  disponible: true,
})

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  return products.value.filter((product) => {
    const matchesTerm = !term || [product.nombre, product.descripcion, product.categoria_nombre]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term))
    const matchesCategory = !categoryFilter.value || product.categoria_id === categoryFilter.value
    const matchesAvailability = availabilityFilter.value === '' || product.disponible === (availabilityFilter.value === 'true')
    return matchesTerm && matchesCategory && matchesAvailability
  })
})

function resetForm() {
  form.nombre = ''
  form.descripcion = ''
  form.precio = ''
  form.stock = ''
  form.categoria_id = categories.value[0]?.id || ''
  form.disponible = true
  imageFile.value = null
  imagePreview.value = ''
  currentImageUrl.value = ''
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
  if (imageInput.value) imageInput.value.value = ''
  editingId.value = null
}

function editProduct(product) {
  editingId.value = product.id
  form.nombre = product.nombre
  form.descripcion = product.descripcion
  form.precio = String(product.precio)
  form.stock = String(product.stock)
  form.categoria_id = product.categoria_id
  form.disponible = product.disponible
  imageFile.value = null
  imagePreview.value = ''
  currentImageUrl.value = product.imagen_url || ''
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
  if (imageInput.value) imageInput.value.value = ''
  error.value = ''
  success.value = ''
  drawerOpen.value = true
}

function newProduct() {
  resetForm()
  drawerOpen.value = true
}

function productStatus(product) {
  if (!product.disponible || product.stock === 0) return ['Agotado', 'danger']
  if (product.stock <= 10) return ['Poco stock', 'warning']
  return ['Disponible', 'success']
}

function selectImage(event) {
  const file = event.target.files?.[0] || null
  imageFile.value = file

  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = file ? URL.createObjectURL(file) : ''
  imagePreview.value = objectUrl
}

function clearSelectedImage() {
  imageFile.value = null
  imagePreview.value = ''

  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''

  if (imageInput.value) imageInput.value.value = ''
}

async function loadDependencies() {
  loading.value = true
  error.value = ''

  try {
    const [productsPayload, categoriesPayload] = await Promise.all([
      api.get('/productos/'),
      api.get('/categorias/'),
    ])

    products.value = productsPayload
    categories.value = categoriesPayload

    if (!form.categoria_id && categories.value.length) {
      form.categoria_id = categories.value[0].id
    }
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
    if (!editingId.value && !imageFile.value) {
      throw new Error('Selecciona una imagen para el producto.')
    }

    const payload = new FormData()
    payload.append('nombre', form.nombre)
    payload.append('descripcion', form.descripcion)
    payload.append('precio', String(Number(form.precio)))
    payload.append('stock', String(Number(form.stock)))
    payload.append('categoria_id', form.categoria_id)
    payload.append('disponible', String(form.disponible))
    if (imageFile.value) payload.append('imagen', imageFile.value)

    if (editingId.value) {
      await api.patch(`/productos/${editingId.value}/`, payload)
      success.value = 'Producto actualizado.'
    } else {
      await api.post('/productos/', payload)
      success.value = 'Producto creado.'
    }

    resetForm()
    drawerOpen.value = false
    await loadDependencies()
  } catch (err) {
    error.value = err.message
  }
}

async function removeProduct(id) {
  if (!window.confirm('¿Eliminar este producto?')) return

  error.value = ''
  success.value = ''

  try {
    await api.delete(`/productos/${id}/`)
    success.value = 'Producto eliminado.'
    await loadDependencies()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadDependencies)
onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})
</script>

<template>
  <section class="admin-page">
    <header class="page-heading"><div><h1>Productos</h1><p>Gestiona tu inventario, precios y disponibilidad de stock.</p></div><button class="button-primary accent-button" type="button" @click="newProduct">+ Nuevo producto</button></header>

    <div v-if="error" class="feedback error">{{ error }}</div>
    <div v-if="success" class="feedback success">{{ success }}</div>
    <div class="table-toolbar"><div class="search-input"><span>⌕</span><input id="product-search" v-model="search" placeholder="Nombre, descripción o categoría" /></div><select v-model="categoryFilter" class="compact-select"><option value="">Todas las categorías</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.nombre }}</option></select><select v-model="availabilityFilter" class="compact-select"><option value="">Cualquier estado</option><option value="true">Disponible</option><option value="false">No disponible</option></select></div>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Imagen</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead><tbody><tr v-if="loading"><td colspan="7">Cargando productos...</td></tr><tr v-for="product in filteredProducts" :key="product.id"><td><div class="table-image"><img v-if="product.imagen_url" :src="product.imagen_url" :alt="product.nombre" /></div></td><td><strong>{{ product.nombre }}</strong><small>{{ product.descripcion }}</small></td><td>{{ product.categoria_nombre }}</td><td><strong>${{ Number(product.precio).toFixed(2) }}</strong></td><td>{{ product.stock }} ud</td><td><span class="status-badge" :class="productStatus(product)[1]">{{ productStatus(product)[0] }}</span></td><td><div class="row-actions"><button class="table-action" @click="editProduct(product)">Editar</button><button class="icon-button danger-icon" title="Eliminar" @click="removeProduct(product.id)">×</button></div></td></tr><tr v-if="!loading && !filteredProducts.length"><td colspan="7">No hay productos que coincidan.</td></tr></tbody></table></div>

    <AppDrawer :open="drawerOpen" :title="editingId ? 'Editar producto' : 'Nuevo producto'" @close="drawerOpen = false">
      <form id="product-form" @submit.prevent="submit">
          <div class="field">
            <label for="prod-image">
              Imagen {{ editingId ? '(elige otra para reemplazarla)' : '' }}
            </label>
            <label class="image-picker" for="prod-image">
              <img
                v-if="imagePreview || currentImageUrl"
                :src="imagePreview || currentImageUrl"
                alt="Vista previa del producto"
              />
              <span v-else>
                <strong>Seleccionar imagen</strong>
                JPG, PNG o WebP, máximo 5 MB
              </span>
            </label>
            <input
              id="prod-image"
              ref="imageInput"
              class="file-input"
              type="file"
              accept="image/jpeg,image/jfif,image/png,image/webp,.jpg,.jpeg,.jfif,.png,.webp"
              :required="!editingId"
              @change="selectImage"
            />
            <button
              v-if="imagePreview"
              class="button-secondary image-clear-button"
              type="button"
              @click="clearSelectedImage"
            >
              Quitar imagen seleccionada
            </button>
          </div>

          <div class="field">
            <label for="prod-name">Nombre</label>
            <input id="prod-name" v-model.trim="form.nombre" required />
          </div>

          <div class="field">
            <label for="prod-desc">Descripción</label>
            <textarea id="prod-desc" v-model="form.descripcion" required />
          </div>

          <div class="field">
            <label for="prod-price">Precio</label>
            <input id="prod-price" v-model="form.precio" min="0.01" step="0.01" type="number" required />
          </div>

          <div class="field">
            <label for="prod-stock">Stock</label>
            <input id="prod-stock" v-model="form.stock" min="0" type="number" required />
          </div>

          <div class="field">
            <label for="prod-category">Categoría</label>
            <select id="prod-category" v-model="form.categoria_id" required>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.nombre }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="prod-available">Disponible</label>
            <select id="prod-available" v-model="form.disponible">
              <option :value="true">Sí</option>
              <option :value="false">No</option>
            </select>
          </div>

      </form>
      <template #footer><button class="button-secondary" type="button" @click="drawerOpen = false">Cancelar</button><button class="button-primary" form="product-form" type="submit">{{ editingId ? 'Guardar cambios' : 'Crear producto' }}</button></template>
    </AppDrawer>
  </section>
</template>
