<script setup>
import { computed, onMounted, ref } from 'vue'
import AppDrawer from '../components/AppDrawer.vue'
import { api } from '../services/api'

const orders = ref([])
const users = ref([])
const addresses = ref([])
const loading = ref(true)
const error = ref('')
const selected = ref(null)
const nextStatus = ref('pagado')
const filter = ref('')
const states = { pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado' }
const visibleOrders = computed(() => filter.value ? orders.value.filter((order) => order.estado === filter.value) : orders.value)
const userFor = (id) => users.value.find((user) => user.id === id)
const addressFor = (id) => addresses.value.find((address) => address.id === id)
const shortId = (id) => `#PED-${String(id).slice(-4).toUpperCase()}`
const date = (value) => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value))

async function load() {
  loading.value = true
  try {
    const [orderData, userData, addressData] = await Promise.all([api.get('/pedidos/'), api.get('/usuarios/'), api.get('/direcciones/')])
    orders.value = orderData; users.value = userData; addresses.value = addressData
  } catch (err) { error.value = err.message } finally { loading.value = false }
}
function open(order) { selected.value = order; nextStatus.value = order.estado }
async function saveStatus() { try { await api.patch(`/pedidos/${selected.value.id}/`, { estado: nextStatus.value }); selected.value = null; await load() } catch (err) { error.value = err.message } }
onMounted(load)
</script>

<template><section class="admin-page"><header class="page-heading"><div><h1>Pedidos</h1><p>Consulta las compras realizadas y actualiza su estado.</p></div><select v-model="filter" class="compact-select"><option value="">Todos los estados</option><option v-for="(label, value) in states" :key="value" :value="value">{{ label }}</option></select></header>
  <div v-if="error" class="feedback error">{{ error }}</div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Folio</th><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody><tr v-if="loading"><td colspan="7">Cargando pedidos...</td></tr><tr v-for="order in visibleOrders" :key="order.id"><td><strong class="folio">{{ shortId(order.id) }}</strong></td><td><strong>{{ userFor(order.usuario_id)?.nombre || 'Cliente' }}</strong><small>{{ userFor(order.usuario_id)?.correo }}</small></td><td>{{ date(order.creado_en) }}</td><td>{{ order.items.length }} artículos</td><td><strong>${{ Number(order.total).toFixed(2) }}</strong></td><td><span class="status-badge" :class="order.estado">{{ states[order.estado] }}</span></td><td><button class="table-action" @click="open(order)">Ver detalle</button></td></tr></tbody></table></div>
  <AppDrawer :open="Boolean(selected)" :title="selected ? `Detalle ${shortId(selected.id)}` : 'Detalle'" wide @close="selected = null"><div v-if="selected" class="drawer-stack"><div class="detail-grid"><div><span>Fecha</span><strong>{{ date(selected.creado_en) }}</strong></div><div><span>Estado actual</span><b class="status-badge" :class="selected.estado">{{ states[selected.estado] }}</b></div></div><section class="detail-section"><h3>Datos del cliente</h3><strong>{{ userFor(selected.usuario_id)?.nombre }}</strong><p>{{ userFor(selected.usuario_id)?.correo }}</p><p v-if="addressFor(selected.direccion_id)">{{ addressFor(selected.direccion_id).calle }} {{ addressFor(selected.direccion_id).numero }}, {{ addressFor(selected.direccion_id).colonia }}, {{ addressFor(selected.direccion_id).ciudad }}</p></section><section class="detail-section"><h3>Productos</h3><div v-for="item in selected.items" :key="item.producto_id" class="order-item"><div><strong>{{ item.nombre }}</strong><span>${{ item.precio }} × {{ item.cantidad }}</span></div><b>${{ Number(item.subtotal).toFixed(2) }}</b></div></section><div class="order-total"><span>Total</span><strong>${{ Number(selected.total).toFixed(2) }}</strong></div><div class="field"><label>Actualizar estado</label><select v-model="nextStatus"><option v-for="(label, value) in states" :key="value" :value="value">{{ label }}</option></select></div></div><template #footer><button class="button-secondary" @click="selected = null">Cerrar</button><button class="button-primary" @click="saveStatus">Guardar estado</button></template></AppDrawer>
</section></template>
