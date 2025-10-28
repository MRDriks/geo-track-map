import './main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'

import App from './App.vue'

import Vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import '@jaxtheprime/vue3-dropzone/dist/style.css'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

app.component('Vue3Dropzone', Vue3Dropzone)

app.mount('#app')
