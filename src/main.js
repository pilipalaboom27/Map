import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 导入CSS变量
import './styles/variables.css'
// 导入全局样式
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')