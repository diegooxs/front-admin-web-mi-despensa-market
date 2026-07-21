<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../services/api'

const products = ref([])
const orders = ref([])
const payments = ref([])
const users = ref([])
const loading = ref(true)
const error = ref('')

const paidTotal = computed(() =>
  payments.value
    .filter((payment) => payment.estado === 'pagado')
    .reduce((sum, payment) => sum + Number(payment.total), 0),
)

const lowStock = computed(() =>
  products.value
    .filter((product) => product.stock <= 10)
    .sort((a, b) => a.stock - b.stock),
)

const recentOrders = computed(() =>
  [...orders.value]
    .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
    .slice(0, 5),
)

const soldProducts = computed(() => {
  const soldMap = new Map()

  orders.value
    .filter((order) => order.estado !== 'cancelado')
    .forEach((order) => {
      order.items?.forEach((item) => {
        const productId = item.producto_id
        const current = soldMap.get(productId) || {
          id: productId,
          nombre: item.nombre,
          unidades: 0,
          total: 0,
        }

        current.unidades += Number(item.cantidad) || 0
        current.total += Number(item.subtotal) || 0
        soldMap.set(productId, current)
      })
    })

  return [...soldMap.values()]
    .sort((a, b) => b.unidades - a.unidades || b.total - a.total)
    .slice(0, 6)
})

const maxSoldUnits = computed(() =>
  soldProducts.value.reduce((max, product) => Math.max(max, product.unidades), 0),
)

const topBuyers = computed(() => {
  const buyerMap = new Map()

  orders.value
    .filter((order) => order.estado !== 'cancelado')
    .forEach((order) => {
      const buyerId = order.usuario_id
      const buyer = userFor(buyerId)
      const current = buyerMap.get(buyerId) || {
        id: buyerId,
        nombre: buyer?.nombre || 'Cliente',
        correo: buyer?.correo || '',
        pedidos: 0,
        unidades: 0,
        total: 0,
        productos: new Map(),
      }

      current.pedidos += 1
      current.total += Number(order.total) || 0

      order.items?.forEach((item) => {
        const productName = item.nombre
        const units = Number(item.cantidad) || 0
        current.unidades += units
        current.productos.set(productName, (current.productos.get(productName) || 0) + units)
      })

      buyerMap.set(buyerId, current)
    })

  return [...buyerMap.values()]
    .map((buyer) => ({
      ...buyer,
      productosTexto: [...buyer.productos.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, units]) => `${name} (${units})`)
        .join(', '),
    }))
    .sort((a, b) => b.total - a.total || b.unidades - a.unidades)
    .slice(0, 5)
})

const maxBuyerTotal = computed(() =>
  topBuyers.value.reduce((max, buyer) => Math.max(max, buyer.total), 0),
)

const userFor = (id) => users.value.find((user) => user.id === id)
const shortId = (id) => `#PED-${String(id).slice(-4).toUpperCase()}`
const states = { pendiente: 'Pendiente', pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado' }
const date = (value) => new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(new Date(value))
const chartHeight = (units) => `${Math.max((units / Math.max(maxSoldUnits.value, 1)) * 100, 12)}%`
const buyerBarWidth = (total) => `${Math.max((total / Math.max(maxBuyerTotal.value, 1)) * 100, 10)}%`

onMounted(async () => {
  try {
    ;[products.value, orders.value, payments.value, users.value] = await Promise.all([
      api.get('/productos/'),
      api.get('/pedidos/'),
      api.get('/pagos/'),
      api.get('/usuarios/'),
    ])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="admin-page">
    <header class="page-heading">
      <div>
        <h1>Resumen del negocio</h1>
        <p>Consulta el estado general de la tienda y las tareas que requieren atención.</p>
      </div>
    </header>

    <div v-if="error" class="feedback error">{{ error }}</div>

    <div class="metric-grid">
      <article class="metric">
        <span>Total cobrado</span>
        <strong>{{ loading ? '...' : `$${paidTotal.toFixed(2)}` }}</strong>
      </article>
      <article class="metric">
        <span>Pedidos registrados</span>
        <strong>{{ loading ? '...' : orders.length }}</strong>
      </article>
      <article class="metric warning">
        <span>Productos con poco stock</span>
        <strong>{{ loading ? '...' : lowStock.length }}</strong>
      </article>
      <article class="metric">
        <span>Productos disponibles</span>
        <strong>{{ loading ? '...' : products.filter((product) => product.disponible).length }}</strong>
      </article>
    </div>

    <section class="dashboard-panel sales-chart-panel">
      <header>
        <div>
          <h2>Productos vendidos</h2>
          <p>Ranking por unidades vendidas en pedidos activos.</p>
        </div>
        <RouterLink to="/pedidos">Ver pedidos</RouterLink>
      </header>

      <div v-if="loading" class="chart-empty">Cargando ventas...</div>
      <div v-else-if="!soldProducts.length" class="chart-empty">
        Todavía no hay ventas registradas para graficar.
      </div>
      <div v-else class="sales-bar-chart">
        <article
          v-for="(product, index) in soldProducts"
          :key="product.id"
          class="sales-column"
          :style="{ '--bar-height': chartHeight(product.unidades), '--bar-delay': `${index * 90}ms` }"
        >
          <div class="sales-column-value">{{ product.unidades }} ud</div>
          <div class="sales-column-track" :aria-label="`${product.nombre}: ${product.unidades} unidades vendidas`">
            <span class="sales-column-bar"></span>
          </div>
          <div class="sales-column-label">
            <strong>{{ product.nombre }}</strong>
            <span>${{ product.total.toFixed(2) }}</span>
          </div>
        </article>
      </div>
    </section>

    <section class="dashboard-panel buyers-chart-panel">
      <header>
        <div>
          <h2>Usuarios que más han comprado</h2>
          <p>Clientes con mayor importe comprado y productos principales.</p>
        </div>
        <RouterLink to="/usuarios">Ver usuarios</RouterLink>
      </header>

      <div v-if="loading" class="chart-empty">Cargando compradores...</div>
      <div v-else-if="!topBuyers.length" class="chart-empty">
        Aún no hay compras de usuarios para graficar.
      </div>
      <div v-else class="buyers-chart">
        <article
          v-for="(buyer, index) in topBuyers"
          :key="buyer.id"
          class="buyer-row"
          :style="{ '--buyer-width': buyerBarWidth(buyer.total), '--buyer-delay': `${index * 90}ms` }"
        >
          <div class="buyer-avatar">{{ buyer.nombre.charAt(0).toUpperCase() }}</div>
          <div class="buyer-info">
            <div class="buyer-main">
              <strong>{{ buyer.nombre }}</strong>
              <span>{{ buyer.pedidos }} pedidos · {{ buyer.unidades }} productos</span>
            </div>
            <div class="buyer-track" :aria-label="`${buyer.nombre}: $${buyer.total.toFixed(2)} en compras`">
              <span class="buyer-bar"></span>
            </div>
            <small>{{ buyer.productosTexto || 'Sin productos registrados' }}</small>
          </div>
          <strong class="buyer-total">${{ buyer.total.toFixed(2) }}</strong>
        </article>
      </div>
    </section>

    <div class="dashboard-grid">
      <section class="dashboard-panel">
        <header>
          <h2>Pedidos recientes</h2>
          <RouterLink to="/pedidos">Ver todos</RouterLink>
        </header>
        <div class="data-table-wrap borderless">
          <table class="data-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td><strong class="folio">{{ shortId(order.id) }}</strong></td>
                <td>{{ userFor(order.usuario_id)?.nombre || 'Cliente' }}</td>
                <td>{{ date(order.creado_en) }}</td>
                <td><strong>${{ Number(order.total).toFixed(2) }}</strong></td>
                <td><span class="status-badge" :class="order.estado">{{ states[order.estado] }}</span></td>
              </tr>
              <tr v-if="!loading && !recentOrders.length">
                <td colspan="5">Todavía no hay pedidos.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <aside class="dashboard-panel inventory-alerts">
        <header><h2>Alertas de inventario</h2></header>
        <div v-for="product in lowStock.slice(0, 6)" :key="product.id" class="inventory-alert">
          <div>
            <strong>{{ product.nombre }}</strong>
            <span>{{ product.categoria_nombre }}</span>
          </div>
          <b :class="{ empty: product.stock === 0 }">{{ product.stock }} ud</b>
        </div>
        <div v-if="!lowStock.length" class="empty-inline">Inventario sin alertas.</div>
        <RouterLink class="button-primary full-button" to="/inventario">Gestionar inventario</RouterLink>
      </aside>
    </div>
  </section>
</template>
