import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 导入CSS变量
import './styles/variables.css'
// 导入全局样式
import './styles/global.css'

// 导入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
const pinia = createPinia()

// 使用Element Plus
app.use(ElementPlus)
app.use(pinia)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')