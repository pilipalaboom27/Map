/**
 * 统一配置管理
 * 集中管理所有配置（颜色、布局参数、动画参数等）
 */

export const graphConfig = {
  // 颜色配置
  colors: {
    node: 'rgb(95, 219, 111)',
    edge: '#475569',
    text: '#ffffff', // 未展开节点颜色
    textExpanded: 'rgb(95, 219, 111)', // 已展开节点颜色（绿色）
    textHover: 'rgb(95, 219, 111)',
    background: 'transparent',
    border: '#2e2e2e'
  },

  // 节点配置
  node: {
    fontSize: 20,
    fontSizeFocused: 28, // 聚焦节点字体大小
    fontSizeHover: 22,
    fontWeight: 700,
    minWidth: 100,
    maxWidth: 250,
    height: 60,
    padding: 20,
    marker: {
      fontSize: 12,
      offsetX: 8,
      offsetY: -8
    }
  },

  // 边（连接线）配置
  edge: {
    strokeWidth: 2,
    strokeOpacity: 0.7,
    strokeOpacityHover: 1,
    strokeWidthHover: 3
  },

  // 布局配置
  layout: {
    radial: {
      centerRadius: 180, // 子节点到中心距离
      levelSpacing: 150, // 层级间距
      parentRadius: 120, // 父节点到中心距离
      parentAngle: Math.PI / 2, // 上方
      minNodeSpacing: 80 // 最小节点间距，避免重叠
    },
    hierarchical: {
      levelHeight: 180, // 层级高度
      horizontalSpacing: 250, // 水平间距
      topMargin: 100,
      minNodeSpacing: 100 // 最小节点间距
    }
  },

  // 交互配置
  interaction: {
    zoom: {
      min: 0.1,
      max: 4,
      default: 1
    },
    pan: {
      enabled: true
    },
    drag: {
      enabled: false // 当前禁用拖拽
    }
  },

  // 动画配置
  animation: {
    enabled: false,
    duration: 300,
    easing: 'easeCubicOut' // d3 缓动
  }
}

/**
 * 获取配置值（支持路径，如 'colors.node'）
 * @param {string} path - 配置路径
 * @param {*} defaultValue - 默认值
 */
export function getConfig(path, defaultValue = undefined) {
  const keys = path.split('.')
  let value = graphConfig

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return defaultValue
    }
  }

  return value
}

/**
 * 设置配置值
 * @param {string} path - 配置路径
 * @param {*} value - 配置值
 */
export function setConfig(path, value) {
  const keys = path.split('.')
  const lastKey = keys.pop()
  let target = graphConfig

  for (const key of keys) {
    if (!target[key] || typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key]
  }

  target[lastKey] = value
}

/**
 * 合并配置
 * @param {Object} newConfig - 新配置
 */
export function mergeConfig(newConfig) {
  Object.assign(graphConfig, newConfig)
}


