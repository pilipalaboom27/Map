import { useMapStore } from '../../store/mapStore'
import { calculateNodeSize, updateNodeDimensions } from './sizeCalculator.js'

// 获取状态管理实例
const { addNode: storeAddNode, addConnection: storeAddConnection, clearNodes: storeClearNodes } = useMapStore()

// 提取简介
export const extractIntro = (text) => {
  if (!text) return ''
  const clean = text.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const sentences = clean.split(/(?<=[。！？!?])/)
  let intro = ''
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue
    intro += trimmed
    if (intro.length >= 120 || intro.split(/[。！？!?]/).length > 1) {
      break
    }
  }
  if (!intro) intro = clean.slice(0, 120)
  return intro
}

// 添加节点
export const addNode = (topic, x, y, parentId = null, description = null) => {
  const nodeSize = calculateNodeSize(topic, description)
  
  const node = storeAddNode(topic, x, y, parentId, description)
  node.width = nodeSize.width
  node.height = nodeSize.height
  
  return node
}

// 添加连接线
export const addConnection = (fromId, toId) => {
  storeAddConnection(fromId, toId)
}

// 清空节点
export const clearNodes = () => {
  storeClearNodes()
}

// 更新节点信息
export const updateNodeInfo = (node, updates) => {
  Object.assign(node, updates)
  if (updates.topic || updates.description) {
    updateNodeDimensions(node)
  }
}

// 导出节点数据
export const exportNodeData = () => {
  const { nodes, connections } = useMapStore()
  return {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    connections: JSON.parse(JSON.stringify(connections.value)),
    exportTime: new Date().toISOString()
  }
}

// 导入节点数据
export const importNodeData = (data) => {
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.connections)) {
    throw new Error('无效的数据格式')
  }
  
  // 清空现有节点
  clearNodes()
  
  // 导入节点
  const importedNodes = data.nodes.map(node => {
    const newNode = addNode(node.topic, node.x, node.y, node.parentId, node.description)
    // 保留原始属性
    Object.assign(newNode, node)
    return newNode
  })
  
  // 导入连接
  data.connections.forEach(conn => {
    addConnection(conn.from, conn.to)
  })
  
  return importedNodes
}