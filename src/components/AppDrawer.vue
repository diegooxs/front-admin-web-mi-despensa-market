<script setup>
import AppIcon from './AppIcon.vue'

defineProps({ title: { type: String, required: true }, open: Boolean, wide: Boolean })
defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-layer" @mousedown.self="$emit('close')">
        <aside class="drawer-panel" :class="{ 'drawer-panel-wide': wide }" role="dialog" aria-modal="true">
          <header class="drawer-header">
            <h2>{{ title }}</h2>
            <button class="icon-button" type="button" aria-label="Cerrar" @click="$emit('close')"><AppIcon name="close" /></button>
          </header>
          <div class="drawer-content"><slot /></div>
          <footer v-if="$slots.footer" class="drawer-footer"><slot name="footer" /></footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
