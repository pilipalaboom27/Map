import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'

/**
 * 图谱状态管理 Store
 * 
 * 管理知识图谱的所有状态，包括：
 * - 节点数据（nodes）
 * - 边数据（edges）
 * - 聚焦节点（focusedNode）
 * - 布局类型（layoutType）
 * 
 * @returns {Object} Pinia Store 实例
 */
export const useGraphStore = defineStore('graph', () => {
  // ========== State ==========
  
  /** @type {import('vue').Ref<Node[]>} 节点数组 */
  const nodes = ref([])
  
  /** @type {import('vue').Ref<Connection[]>} 边数组 */
  const edges = ref([])
  
  /** @type {import('vue').Ref<Node|null>} 当前聚焦的节点 */
  const focusedNode = ref(null)
  
  /** @type {import('vue').Ref<LayoutType>} 布局类型 */
  const layoutType = ref('radial')
  
  // 颜色配置 - 使用CSS变量
  let colorIndex = 0
  const levelColors = {}
  const colorPalette = [
    'rgb(95, 219, 111)',
    'rgb(59, 130, 246)',
    'rgb(168, 85, 247)',
    'rgb(236, 72, 153)',
    'rgb(251, 146, 60)',
    'rgb(34, 197, 94)',
    'rgb(14, 165, 233)',
    'rgb(139, 92, 246)'
  ]

  // ========== Getters ==========
  
  /**
   * 获取可见节点（聚焦节点 + 所有父节点 + 所有子节点）
   */
  const visibleNodes = computed(() => {
    if (!focusedNode.value) {
      // 没有聚焦节点，只显示根节点
      return nodes.value.filter(n => !n.parentId || n.level === 0)
    }

    const visible = []
    const focusedId = focusedNode.value.id

    // 添加聚焦节点
    visible.push(focusedNode.value)

    // 添加所有父节点（向上遍历所有祖先节点）
    let current = focusedNode.value
    while (current && current.parentId) {
      const parent = nodes.value.find(n => n.id === current.parentId)
      if (parent) {
        visible.push(parent)
        current = parent
      } else {
        break
      }
    }

    // 添加所有子节点
    const children = nodes.value.filter(n => n.parentId === focusedId)
    visible.push(...children)

    return visible.filter(Boolean)
  })

  /**
   * 获取可见边
   */
  const visibleEdges = computed(() => {
    const visibleIds = new Set(visibleNodes.value.map(n => n.id))
    return edges.value.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to))
  })

  /**
   * 获取根节点
   */
  const rootNodes = computed(() => {
    return nodes.value.filter(n => !n.parentId || n.level === 0)
  })

  // ========== Actions ==========

  /**
   * 获取节点颜色（按层级）
   * @param {number} level - 节点层级
   * @returns {string} 节点颜色（RGB格式）
   */
  function getColorForLevel(level) {
    if (!levelColors[level]) {
      levelColors[level] = colorPalette[colorIndex % colorPalette.length]
      colorIndex++
    }
    return levelColors[level]
  }

  /**
   * 计算节点大小（基于文本内容）
   * @param {string} topic - 节点主题文本
   * @returns {{width: number, height: number}} 节点尺寸
   */
  function calculateNodeSize(topic) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      // 降级方案
      return {
        width: Math.min(200, Math.max(100, topic.length * 10)),
        height: 60
      }
    }

    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const textWidth = ctx.measureText(topic).width
    
    return {
      width: Math.min(250, Math.max(120, Math.ceil(textWidth) + 40)),
      height: 60
    }
  }

  /**
   * 添加节点
   * @param {string} topic - 节点主题
   * @param {string|null} parentId - 父节点ID
   * @param {string|null} description - 描述
   */
  function addNode(topic, parentId = null, description = null) {
    const parentNode = parentId ? nodes.value.find(n => n.id === parentId) : null
    const level = parentNode ? parentNode.level + 1 : 0
    const nodeSize = calculateNodeSize(topic)

    const node = {
      id: nanoid(),
      topic,
      description: description || '',
      parentId,
      level,
      x: undefined,  // 位置由布局引擎计算
      y: undefined,
      width: nodeSize.width,
      height: nodeSize.height,
      knowledge: null,
      expanding: false,
      expanded: false,
      cachedChildren: null, // 预缓存的子节点数据
      preloading: false // 是否正在预加载
    }

    nodes.value.push(node)
    
    // 如果有父节点，自动创建边
    if (parentId) {
      addEdge(parentId, node.id)
    }

    return node
  }

  /**
   * 添加边
   * @param {string} from - 起始节点ID
   * @param {string} to - 目标节点ID
   * @param {string} type - 边类型
   */
  function addEdge(from, to, type = 'default') {
    const edge = {
      id: nanoid(),
      from,
      to,
      type,
      width: 1.5,
      arrow: true
    }

    edges.value.push(edge)
    return edge
  }

  /**
   * 设置聚焦节点
   * @param {Object|null} node - 节点对象
   */
  function setFocusedNode(node) {
    focusedNode.value = node
  }

  /**
   * 切换布局类型
   * @param {string} type - 布局类型
   */
  function switchLayout(type) {
    layoutType.value = type
  }

  /**
   * 获取节点通过ID
   * @param {string} id - 节点ID
   */
  function getNodeById(id) {
    return nodes.value.find(n => n.id === id)
  }

  /**
   * 更新节点
   * @param {string} id - 节点ID
   * @param {Object} updates - 更新内容
   */
  function updateNode(id, updates) {
    const node = getNodeById(id)
    if (node) {
      Object.assign(node, updates)
    }
  }

  /**
   * 删除节点（及其子节点）
   * @param {string} id - 节点ID
   */
  function deleteNode(id) {
    // 递归删除子节点
    const children = nodes.value.filter(n => n.parentId === id)
    children.forEach(child => deleteNode(child.id))

    // 删除相关的边
    edges.value = edges.value.filter(e => e.from !== id && e.to !== id)

    // 删除节点
    nodes.value = nodes.value.filter(n => n.id !== id)

    // 如果删除的是聚焦节点，清除聚焦
    if (focusedNode.value?.id === id) {
      focusedNode.value = null
    }
  }

  /**
   * 清空所有节点和边
   */
  function clearAll() {
    nodes.value = []
    edges.value = []
    focusedNode.value = null
    colorIndex = 0
    Object.keys(levelColors).forEach(key => delete levelColors[key])
  }

  /**
   * 获取节点的所有子节点（递归）
   * @param {string} nodeId - 节点ID
   */
  function getAllDescendants(nodeId) {
    const descendants = []
    const children = nodes.value.filter(n => n.parentId === nodeId)
    
    children.forEach(child => {
      descendants.push(child)
      descendants.push(...getAllDescendants(child.id))
    })

    return descendants
  }

  /**
   * 获取节点的所有祖先节点
   * @param {string} nodeId - 节点ID
   */
  function getAllAncestors(nodeId) {
    const ancestors = []
    let current = getNodeById(nodeId)

    while (current && current.parentId) {
      const parent = getNodeById(current.parentId)
      if (parent) {
        ancestors.push(parent)
        current = parent
      } else {
        break
      }
    }

    return ancestors
  }

  // ========== Return ==========
  return {
    // State
    nodes,
    edges,
    focusedNode,
    layoutType,

    // Getters
    visibleNodes,
    visibleEdges,
    rootNodes,

    // Actions
    addNode,
    addEdge,
    setFocusedNode,
    switchLayout,
    getNodeById,
    updateNode,
    deleteNode,
    clearAll,
    getAllDescendants,
    getAllAncestors
  }
})

