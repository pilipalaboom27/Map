import { ref } from 'vue'
import { useConfigStore } from './configStore'

const { getConfig } = useConfigStore()

// 状态
const nodes = ref([])
const connections = ref([])
const focusedNode = ref(null)
let colorIndex = 0
const levelColors = {}

// 计算节点大小（使用准确的文本测量）
const calculateNodeSize = (topic, description) => {
  const nodeConfig = getConfig('node')
  const { minWidth, maxWidth, minHeight, padding, fontSize } = nodeConfig
  
  // 创建临时canvas用于测量文本宽度
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    // 降级方案：使用估算
    const estimatedWidth = Math.min(maxWidth, Math.max(minWidth, topic.length * 8 + padding * 2))
    return { width: estimatedWidth, height: minHeight }
  }
  
  // 设置字体（粗体）
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  
  // 测量文本宽度
  const textWidth = ctx.measureText(topic).width
  
  // 计算节点宽度（文本宽度 + 左右padding）
  const width = Math.min(maxWidth, Math.max(minWidth, Math.ceil(textWidth) + padding * 2))
  
  // 高度固定为最小高度（单行文本）
  const height = minHeight
  
  return { width, height }
}

// 获取节点颜色
const getColorForLevel = (level) => {
  if (!levelColors[level]) {
    const colorPalette = getConfig('colors.palette')
    levelColors[level] = colorPalette[colorIndex % colorPalette.length]
    colorIndex++
  }
  return levelColors[level]
}

// 添加节点
const addNode = (topic, x, y, parentId, description = null) => {
  const parentLevel = parentId ? (getNodeById(parentId)?.level ?? -1) : -1
  const level = parentId ? parentLevel + 1 : 0
  
  const nodeSize = calculateNodeSize(topic, description)
  
  // 计算节点位置
  let nodeX, nodeY
  if (x !== null && x !== undefined && y !== null && y !== undefined) {
    // 如果提供了明确的坐标，使用它
    nodeX = x
    nodeY = y
  } else if (parentId) {
    // 如果有父节点，在父节点附近生成位置
    const parent = getNodeById(parentId)
    if (parent && parent.x !== undefined && parent.y !== undefined) {
      // 在父节点周围随机位置，距离父节点150-250像素
      const angle = Math.random() * 2 * Math.PI
      const distance = 150 + Math.random() * 100
      nodeX = parent.x + Math.cos(angle) * distance
      nodeY = parent.y + Math.sin(angle) * distance
    } else {
      // 父节点位置未定义，使用随机位置
      nodeX = Math.random() * 400 - 200
      nodeY = Math.random() * 400 - 200
    }
  } else {
    // 根节点，使用画布中心附近的随机位置
    nodeX = Math.random() * 200 - 100
    nodeY = Math.random() * 200 - 100
  }
  
  const node = {
    id: Date.now() + Math.random(),
    topic: topic,
    description: description || '',
    x: nodeX,
    y: nodeY,
    width: nodeSize.width,
    height: nodeSize.height,
    padding: getConfig('node.padding'),
    color: getColorForLevel(level),
    parentId: parentId,
    level: level,
    knowledge: null,
    expanding: false,
    expanded: false  // 跟踪节点是否已展开
  }
  
  nodes.value.push(node)
  return node
}

// 添加连接线
const addConnection = (fromId, toId) => {
  const existingConnection = connections.value.find(
    conn => conn.from === fromId && conn.to === toId
  )
  
  if (!existingConnection) {
    connections.value.push({
      from: fromId,
      to: toId
    })
  }
}

// 根据ID获取节点
const getNodeById = (id) => {
  return nodes.value.find(n => n.id === id)
}

// 设置聚焦节点
const setFocusedNode = (node) => {
  focusedNode.value = node
}

// 清空所有节点
const clearNodes = () => {
  nodes.value = []
  connections.value = []
  focusedNode.value = null
  colorIndex = 0
  Object.keys(levelColors).forEach(key => delete levelColors[key])
}

// 获取相关节点
const getRelatedNodes = (focusNode) => {
  if (!focusNode) return nodes.value.map(node => node.id)
  
  const relatedNodes = new Set()
  
  relatedNodes.add(focusNode.id)
  
  let parent = focusNode.parentId ? getNodeById(focusNode.parentId) : null
  while (parent) {
    relatedNodes.add(parent.id)
    parent = parent.parentId ? getNodeById(parent.parentId) : null
  }
  
  connections.value.forEach(conn => {
    if (conn.from === focusNode.id) {
      relatedNodes.add(conn.to)
    }
  })
  
  return Array.from(relatedNodes)
}

// 更新节点知识
const updateNodeKnowledge = (nodeId, knowledge) => {
  const node = getNodeById(nodeId)
  if (node) {
    node.knowledge = knowledge
  }
}

// 删除节点
const deleteNode = (nodeId) => {
  // 删除节点
  const nodeIndex = nodes.value.findIndex(n => n.id === nodeId)
  if (nodeIndex !== -1) {
    nodes.value.splice(nodeIndex, 1)
  }
  
  // 删除相关连接
  connections.value = connections.value.filter(
    conn => conn.from !== nodeId && conn.to !== nodeId
  )
  
  // 如果聚焦节点被删除，取消聚焦
  if (focusedNode.value?.id === nodeId) {
    focusedNode.value = null
  }
}

// 更新节点位置
const updateNodePosition = (nodeId, x, y) => {
  const node = getNodeById(nodeId)
  if (node) {
    node.x = x
    node.y = y
  }
}

// 更新节点状态
const updateNodeStatus = (nodeId, status) => {
  const node = getNodeById(nodeId)
  if (node) {
    Object.assign(node, status)
  }
}

export function useMapStore() {
  return {
    nodes,
    connections,
    focusedNode,
    addNode,
    addConnection,
    getNodeById,
    setFocusedNode,
    clearNodes,
    getRelatedNodes,
    updateNodeKnowledge,
    deleteNode,
    updateNodePosition,
    updateNodeStatus
  }
}