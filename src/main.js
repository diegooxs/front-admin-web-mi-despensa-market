import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './style.css'

createApp(App).use(router).mount('#app')
