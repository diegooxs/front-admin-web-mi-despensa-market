<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../services/api'
import AppDrawer from '../components/AppDrawer.vue'

const users = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const editingId = ref(null)
const drawerOpen = ref(false)
const search = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const confirmPassword = ref('')
const filtered = computed(() => users.value.filter((user) => {
  const term = search.value.toLowerCase()
  return (!term || user.nombre.toLowerCase().includes(term) || user.correo.toLowerCase().includes(term)) && (!roleFilter.value || user.rol === roleFilter.value) && (!statusFilter.value || String(user.activo) === statusFilter.value)
}))
const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
const date = (value) => value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value)) : 'Sin fecha'

const form = reactive({
  nombre: '',
  correo: '',
  password: '',
  rol: 'usuario',
  activo: true,
})

function resetForm() {
  form.nombre = ''
  form.correo = ''
  form.password = ''
  form.rol = 'usuario'
  form.activo = true
  editingId.value = null
  confirmPassword.value = ''
}

function editUser(user) {
  editingId.value = user.id
  form.nombre = user.nombre
  form.correo = user.correo
  form.password = ''
  form.rol = user.rol
  form.activo = user.activo ?? true
  error.value = ''
  success.value = ''
  drawerOpen.value = true
}

function newUser() { resetForm(); drawerOpen.value = true }

async function loadUsers() {
  loading.value = true
  error.value = ''

  try {
    users.value = await api.get('/usuarios/')
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
    const payload = {
      nombre: form.nombre,
      correo: form.correo,
      rol: form.rol,
      activo: form.activo,
    }

    if (form.password) {
      if (!editingId.value && form.password !== confirmPassword.value) throw new Error('Las contraseñas no coinciden.')
      payload.password = form.password
    }

    if (editingId.value) {
      await api.patch(`/usuarios/${editingId.value}/`, payload)
      success.value = 'Usuario actualizado.'
    } else {
      if (!payload.password) {
        throw new Error('La contraseña es obligatoria al crear usuarios.')
      }
      await api.post('/usuarios/', payload)
      success.value = 'Usuario creado.'
    }

    resetForm()
    drawerOpen.value = false
    await loadUsers()
  } catch (err) {
    error.value = err.message
  }
}

async function removeUser(id) {
  if (!window.confirm('¿Eliminar este usuario?')) return

  error.value = ''
  success.value = ''

  try {
    await api.delete(`/usuarios/${id}/`)
    success.value = 'Usuario eliminado.'
    await loadUsers()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadUsers)
</script>

<template>
  <section class="admin-page">
    <header class="page-heading"><div><h1>Usuarios</h1><p>Administra las cuentas y permisos de acceso al sistema.</p></div><button class="button-primary" @click="newUser">+ Nuevo usuario</button></header>

    <div v-if="error" class="feedback error">{{ error }}</div>
    <div v-if="success" class="feedback success">{{ success }}</div>

    <div class="table-toolbar"><div class="search-input"><span>⌕</span><input v-model="search" placeholder="Buscar por nombre o correo" /></div><select v-model="roleFilter" class="compact-select"><option value="">Todos los roles</option><option value="admin">Administrador</option><option value="usuario">Cliente</option></select><select v-model="statusFilter" class="compact-select"><option value="">Todos los estados</option><option value="true">Activo</option><option value="false">Inactivo</option></select></div>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Fecha de registro</th><th>Acciones</th></tr></thead><tbody><tr v-if="loading"><td colspan="6">Cargando usuarios...</td></tr><tr v-for="user in filtered" :key="user.id"><td><div class="user-cell"><span class="avatar avatar-small">{{ initials(user.nombre) }}</span><strong>{{ user.nombre }}</strong></div></td><td>{{ user.correo }}</td><td>{{ user.rol === 'admin' ? 'Administrador' : 'Cliente' }}</td><td><span class="status-badge" :class="user.activo ? 'success' : 'danger'">{{ user.activo ? 'Activo' : 'Inactivo' }}</span></td><td>{{ date(user.creado_en) }}</td><td><div class="row-actions"><button class="table-action" @click="editUser(user)">Editar</button><button class="icon-button danger-icon" @click="removeUser(user.id)">×</button></div></td></tr><tr v-if="!loading && !filtered.length"><td colspan="6">No hay usuarios registrados.</td></tr></tbody></table></div>
    <AppDrawer :open="drawerOpen" :title="editingId ? 'Editar usuario' : 'Nuevo usuario'" @close="drawerOpen = false">
      <div v-if="!editingId" class="notice success-notice">La cuenta quedará disponible inmediatamente con las credenciales establecidas.</div>
        <form id="user-form" @submit.prevent="submit">
          <div class="field">
            <label for="user-name">Nombre</label>
            <input id="user-name" v-model.trim="form.nombre" required />
          </div>

          <div class="field">
            <label for="user-email">Correo</label>
            <input id="user-email" v-model.trim="form.correo" type="email" required />
          </div>

          <div class="field">
            <label for="user-password">Contraseña {{ editingId ? '(opcional para actualizar)' : '' }}</label>
            <input id="user-password" v-model="form.password" type="password" :required="!editingId" />
          </div>
          <div v-if="!editingId" class="field"><label for="user-confirm">Confirmar contraseña</label><input id="user-confirm" v-model="confirmPassword" type="password" required /></div>

          <div class="field">
            <label for="user-role">Rol</label>
            <select id="user-role" v-model="form.rol">
              <option value="usuario">Cliente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div class="field">
            <label for="user-active">Activo</label>
            <select id="user-active" v-model="form.activo">
              <option :value="true">Sí</option>
              <option :value="false">No</option>
            </select>
          </div>

        </form>
      <template #footer><button class="button-secondary" @click="drawerOpen = false">Cancelar</button><button class="button-primary" form="user-form">{{ editingId ? 'Guardar cambios' : 'Crear usuario' }}</button></template>
    </AppDrawer>
  </section>
</template>
