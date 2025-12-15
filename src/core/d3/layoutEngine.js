/**
 * D3 布局引擎
 * 处理径向和层次布局算法
 */

import { getConfig } from '../config.js'

/**
 * 径向布局
 */
export function radialLayout(nodes, focusedNode, width, height) {
  const centerX = width / 2
  const centerY = height / 2
  const config = getConfig('layout.radial')

  if (!focusedNode) return

  const focusedNodeData = nodes.find(n => n.id === focusedNode.id)
  if (focusedNodeData) {
    focusedNodeData.x = centerX
    focusedNodeData.y = centerY
    focusedNodeData.fx = undefined
    focusedNodeData.fy = undefined
  }

  const parentNodes = []
  let current = focusedNode
  while (current && current.parentId) {
    const parent = nodes.find(n => n.id === current.parentId)
    if (parent) {
      parentNodes.push(parent)
      current = parent
    } else break
  }

  const childNodes = nodes.filter(n => n.parentId === focusedNode.id && n.id !== focusedNode.id)

  parentNodes.forEach((parent, index) => {
    const level = index + 1
    const radius = config.centerRadius + level * config.levelSpacing
    const angle = config.parentAngle
    parent.x = centerX + Math.cos(angle) * radius
    parent.y = centerY + Math.sin(angle) * radius
    parent.fx = undefined
    parent.fy = undefined
  })

  if (childNodes.length > 0) {
    const minSpacing = config.minNodeSpacing || 80
    const circumference = childNodes.length * minSpacing
    const radius = Math.max(config.centerRadius, circumference / (2 * Math.PI))
    const angleStep = (2 * Math.PI) / childNodes.length
    
    childNodes.forEach((child, i) => {
      const angle = i * angleStep
      child.x = centerX + Math.cos(angle) * radius
      child.y = centerY + Math.sin(angle) * radius
      child.fx = undefined
      child.fy = undefined
    })
  }
}

/**
 * 层次布局
 */
export function hierarchicalLayout(nodes, focusedNode, width, height) {
  const centerX = width / 2
  const centerY = height / 2
  const config = getConfig('layout.hierarchical')

  if (!focusedNode) return

  const focusedNodeData = nodes.find(n => n.id === focusedNode.id)
  if (focusedNodeData) {
    focusedNodeData.x = centerX
    focusedNodeData.y = centerY
    focusedNodeData.fx = undefined
    focusedNodeData.fy = undefined
  }

  const parentNodes = []
  let current = focusedNode
  while (current && current.parentId) {
    const parent = nodes.find(n => n.id === current.parentId)
    if (parent) {
      parentNodes.push(parent)
      current = parent
    } else break
  }

  const childNodes = nodes.filter(n => n.parentId === focusedNode.id && n.id !== focusedNode.id)

  parentNodes.forEach((parent, index) => {
    const level = index + 1
    parent.x = centerX
    parent.y = centerY - level * config.levelHeight
    parent.fx = undefined
    parent.fy = undefined
  })

  if (childNodes.length > 0) {
    const minSpacing = config.minNodeSpacing || 100
    const spacing = Math.max(config.horizontalSpacing, minSpacing)
    const totalWidth = (childNodes.length - 1) * spacing
    const startX = centerX - totalWidth / 2
    
    childNodes.forEach((child, i) => {
      child.x = startX + i * spacing
      child.y = centerY + config.levelHeight
      child.fx = undefined
      child.fy = undefined
    })
  }
}

/**
 * 应用布局
 */
export function applyLayout(layoutType, nodes, focusedNode, width, height, onTick) {
  switch (layoutType) {
    case 'radial':
      radialLayout(nodes, focusedNode, width, height)
      if (onTick) onTick()
      break
    case 'hierarchical':
      hierarchicalLayout(nodes, focusedNode, width, height)
      if (onTick) onTick()
      break
    default:
      radialLayout(nodes, focusedNode, width, height)
      if (onTick) onTick()
  }
}

