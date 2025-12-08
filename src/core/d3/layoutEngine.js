/**
 * D3 布局引擎
 * 处理径向和层次布局算法
 */

import { getConfig } from '../config.js'

/**
 * 径向布局
 * @param {Array} nodes - 节点数组
 * @param {Object} focusedNode - 聚焦节点
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
export function radialLayout(nodes, focusedNode, width, height) {
  const centerX = width / 2
  const centerY = height / 2
  const config = getConfig('layout.radial')

  if (!focusedNode) {
    return
  }

  // 聚焦节点固定在中心
  const focusedNodeData = nodes.find(n => n.id === focusedNode.id)
  if (focusedNodeData) {
    focusedNodeData.x = centerX
    focusedNodeData.y = centerY
  }

  // 收集所有父节点（向上遍历）
  const parentNodes = []
  let current = focusedNode
  while (current && current.parentId) {
    const parent = nodes.find(n => n.id === current.parentId)
    if (parent) {
      parentNodes.push(parent)
      current = parent
    } else {
      break
    }
  }

  // 收集所有子节点
  const childNodes = nodes.filter(n => n.parentId === focusedNode.id && n.id !== focusedNode.id)

  // 计算父节点位置（在聚焦节点上方，按层级排列）
  parentNodes.forEach((parent, index) => {
    const level = index + 1
    const radius = config.centerRadius + level * config.levelSpacing
    const angle = config.parentAngle
    parent.x = centerX + Math.cos(angle) * radius
    parent.y = centerY + Math.sin(angle) * radius
  })

  // 计算子节点位置（在聚焦节点周围圆形分布）
  // 根据节点数量动态调整半径，确保节点间距足够
  if (childNodes.length > 0) {
    const minSpacing = config.minNodeSpacing || 80
    // 根据节点数量和最小间距计算合适的半径
    const circumference = childNodes.length * minSpacing
    const radius = Math.max(config.centerRadius, circumference / (2 * Math.PI))
    const angleStep = (2 * Math.PI) / childNodes.length
    
    childNodes.forEach((child, i) => {
      const angle = i * angleStep
      child.x = centerX + Math.cos(angle) * radius
      child.y = centerY + Math.sin(angle) * radius
    })
  }
}

/**
 * 层次布局
 * @param {Array} nodes - 节点数组
 * @param {Object} focusedNode - 聚焦节点
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
export function hierarchicalLayout(nodes, focusedNode, width, height) {
  const centerX = width / 2
  const centerY = height / 2
  const config = getConfig('layout.hierarchical')

  if (!focusedNode) {
    return
  }

  // 聚焦节点固定在中心
  const focusedNodeData = nodes.find(n => n.id === focusedNode.id)
  if (focusedNodeData) {
    focusedNodeData.x = centerX
    focusedNodeData.y = centerY
  }

  // 收集所有父节点（向上遍历）
  const parentNodes = []
  let current = focusedNode
  while (current && current.parentId) {
    const parent = nodes.find(n => n.id === current.parentId)
    if (parent) {
      parentNodes.push(parent)
      current = parent
    } else {
      break
    }
  }

  // 收集所有子节点
  const childNodes = nodes.filter(n => n.parentId === focusedNode.id && n.id !== focusedNode.id)

  // 计算父节点位置（在聚焦节点上方，按层级排列）
  parentNodes.forEach((parent, index) => {
    const level = index + 1
    parent.x = centerX
    parent.y = centerY - level * config.levelHeight
  })

  // 计算子节点位置（在聚焦节点下方，水平排列）
  // 确保节点间距足够，避免文字重叠
  if (childNodes.length > 0) {
    const minSpacing = config.minNodeSpacing || 100
    const spacing = Math.max(config.horizontalSpacing, minSpacing)
    const totalWidth = (childNodes.length - 1) * spacing
    const startX = centerX - totalWidth / 2
    
    childNodes.forEach((child, i) => {
      child.x = startX + i * spacing
      child.y = centerY + config.levelHeight
    })
  }
}

/**
 * 应用布局
 * @param {string} layoutType - 布局类型 'radial' | 'hierarchical'
 * @param {Array} nodes - 节点数组
 * @param {Object} focusedNode - 聚焦节点
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 */
export function applyLayout(layoutType, nodes, focusedNode, width, height) {
  switch (layoutType) {
    case 'radial':
      radialLayout(nodes, focusedNode, width, height)
      break
    case 'hierarchical':
      hierarchicalLayout(nodes, focusedNode, width, height)
      break
    default:
      radialLayout(nodes, focusedNode, width, height)
  }
}

