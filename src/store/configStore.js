import { ref } from 'vue'

// 应用配置状态
const config = ref({
  // 画布配置
  canvas: {
    minScale: 0.1,
    maxScale: 5,
    defaultScale: 1,
    animationDuration: 750
  },
  // 节点配置
  node: {
    minWidth: 100,
    maxWidth: 200,
    minHeight: 50,
    padding: 15,
    fontSize: 14
  },
  // 力导向布局配置
  forceLayout: {
    linkDistance: 150,
    chargeStrength: -500,
    collisionRadius: 20
  },
  // 颜色配置
  colors: {
    palette: [
      '#667eea', '#764ba2', '#f093fb', '#4facfe',
      '#43e97b', '#fa709a', '#fee140', '#30cfd0',
      '#a8edea', '#fed6e3', '#ff9a9e', '#fecfef'
    ]
  }
})

// 获取配置
const getConfig = (keyPath = '') => {
  if (!keyPath) return config.value
  
  return keyPath.split('.').reduce((acc, key) => {
    return acc?.[key]
  }, config.value)
}

// 更新配置
const updateConfig = (keyPath, value) => {
  if (!keyPath) return
  
  const keys = keyPath.split('.')
  let current = config.value
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  
  current[keys[keys.length - 1]] = value
}

export function useConfigStore() {
  return {
    config,
    getConfig,
    updateConfig
  }
}