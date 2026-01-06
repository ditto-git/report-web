import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'

// 导入全局样式
import './styles/global.css'
import './styles/variables.css'
import './styles/element-plus-override.css'
import './styles/font-size.css'

// 初始化字体大小（从localStorage读取或使用默认值）
const savedFontSize = localStorage.getItem('fontSize')
if (savedFontSize) {
  document.documentElement.style.setProperty('--base-font-size', `${savedFontSize}px`)
} else {
  // 默认14px
  document.documentElement.style.setProperty('--base-font-size', '14px')
}

const app = createApp(App)

// 注册 Element Plus（使用中文语言包）
app.use(ElementPlus, {
  locale: zhCn
})

// 注册路由
app.use(router)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

