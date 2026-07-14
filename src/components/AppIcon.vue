<script setup>
defineProps({ name: { type: String, required: true }, size: { type: Number, default: 20 } })
</script>

<template>
  <svg class="app-icon" :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="name === 'dashboard'"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></template>
    <template v-else-if="name === 'products'"><path d="M4 7h16v13H4zM3 4h18v3H3z"/><path d="M9 11h6"/></template>
    <template v-else-if="name === 'categories'"><path d="M12 3l4 6H8l4-6z"/><rect x="3" y="14" width="7" height="7"/><circle cx="17.5" cy="17.5" r="3.5"/></template>
    <template v-else-if="name === 'inventory'"><path d="M3 10l9-6 9 6v10H3z"/><path d="M8 20v-6h8v6M7 10h10"/></template>
    <template v-else-if="name === 'orders'"><path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"/><path d="M4 6h2M18 6h2M4 10h2M18 10h2"/></template>
    <template v-else-if="name === 'payments'"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 9H5M19 15h-2"/></template>
    <template v-else-if="name === 'users'"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-6 6-6s6 2 6 6M16 5a3 3 0 010 6M16 14c3 0 5 2 5 6"/></template>
    <template v-else-if="name === 'search'"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></template>
    <template v-else-if="name === 'logout'"><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></template>
    <template v-else-if="name === 'close'"><path d="M5 5l14 14M19 5L5 19"/></template>
    <template v-else-if="name === 'plus'"><path d="M12 5v14M5 12h14"/></template>
    <template v-else-if="name === 'edit'"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 7l3 3"/></template>
    <template v-else-if="name === 'trash'"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></template>
    <template v-else-if="name === 'more'"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></template>
    <template v-else-if="name === 'chevron'"><path d="M9 5l7 7-7 7"/></template>
    <template v-else><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 17h.01"/></template>
  </svg>
</template>
