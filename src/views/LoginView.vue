<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api'
import { storeSession } from '../services/auth'
import greeting1 from '../assets/login/greeting-1.png'
import greeting2 from '../assets/login/greeting-2.png'
import greeting3 from '../assets/login/greeting-3.png'
import passwordHidden from '../assets/login/password-hidden.png'
import passwordPeek from '../assets/login/password-peek.png'
import storeLogo from '../assets/login/store-logo.png'

const router = useRouter()
const greetingFrames = [greeting1, greeting2, greeting3, greeting2]

const form = reactive({
  correo: '',
  password: '',
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const passwordActive = ref(false)
const greetingFrame = ref(0)
let greetingTimer

const mascotImage = computed(() => {
  if (!passwordActive.value) return greetingFrames[greetingFrame.value]
  return showPassword.value ? passwordPeek : passwordHidden
})

const mascotAlt = computed(() => {
  if (!passwordActive.value) return 'Mascota de Mi Despensa Market saludando'
  return showPassword.value
    ? 'Mascota mirando entre sus dedos'
    : 'Mascota cubriéndose los ojos'
})

onMounted(() => {
  greetingTimer = window.setInterval(() => {
    if (!passwordActive.value) {
      greetingFrame.value = (greetingFrame.value + 1) % greetingFrames.length
    }
  }, 280)
})

onBeforeUnmount(() => window.clearInterval(greetingTimer))

function togglePassword() {
  passwordActive.value = true
  showPassword.value = !showPassword.value
}

function showGreeting() {
  passwordActive.value = false
  greetingFrame.value = 0
}

async function submit() {
  loading.value = true
  error.value = ''

  try {
    const payload = await api.post('/auth/login/', form)

    if (payload.rol !== 'admin') {
      throw new Error('Esta cuenta no tiene permisos de administrador.')
    }

    storeSession(payload)
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <header class="login-brand" aria-label="Mi Despensa Market">
      <img :src="storeLogo" alt="" />
      <div>
        <span>Mi Despensa</span>
        <strong>Market</strong>
      </div>
    </header>

    <section class="login-welcome" aria-labelledby="welcome-title">
      <div class="login-welcome-copy">
        <span class="login-kicker">Panel administrativo</span>
        <h1 id="welcome-title" class="login-title">Todo tu negocio,<br />en un solo lugar.</h1>
        <p class="login-copy">
          Organiza tu catálogo, mantén el inventario al día y atiende a tus
          clientes con mayor facilidad.
        </p>
      </div>

      <div class="mascot-stage" aria-live="polite">
        <span class="mascot-shadow"></span>
        <div class="mascot-motion">
          <img :src="mascotImage" :alt="mascotAlt" />
        </div>
      </div>
    </section>

    <section class="login-card-wrap">
      <form class="login-card" @submit.prevent="submit">
        <span class="card-eyebrow">Acceso seguro</span>
        <h2>Bienvenido</h2>
        <p>Ingresa tus datos para continuar al panel de administración.</p>

        <div v-if="error" class="feedback error" role="alert">{{ error }}</div>

        <div class="field">
          <label for="correo">Correo electrónico</label>
          <input
            id="correo"
            v-model.trim="form.correo"
            type="email"
            autocomplete="email"
            placeholder="nombre@correo.com"
            required
            @focus="showGreeting"
          />
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <div class="password-control">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Ingresa tu contraseña"
              required
              @focus="passwordActive = true"
            />
            <button
              class="password-toggle"
              type="button"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :aria-pressed="showPassword"
              @click="togglePassword"
            >
              <svg v-if="showPassword" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.8 10.8 0 0112 4c5.5 0 9 6 9 6a16 16 0 01-2.1 2.7M6.6 6.6C4.3 8.1 3 10 3 10s3.5 6 9 6c1.1 0 2.2-.2 3.1-.6" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </button>
          </div>
        </div>

        <button class="button-primary login-submit" :disabled="loading" type="submit">
          <span>{{ loading ? 'Verificando...' : 'Ingresar al panel' }}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>
        </button>

        <small class="login-help">Acceso exclusivo para personal autorizado.</small>
      </form>
    </section>
  </main>
</template>
