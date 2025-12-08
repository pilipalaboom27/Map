/**
 * D3 渲染器
 * 处理节点和边的渲染逻辑
 */

import * as d3 from 'd3'
import { getConfig } from '../config.js'

function resolveEase(easingName) {
  const map = {
    easeCubicOut: d3.easeCubicOut,
    easeQuadOut: d3.easeQuadOut,
    easeLinear: d3.easeLinear
  }
  return map[easingName] || d3.easeCubicOut
}

/**
 * 创建渲染器
 */
export function createRenderer(container, width, height) {
  // 清除旧内容
  d3.select(container).selectAll('*').remove()

  // 创建 SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background-color', 'transparent')

  // 创建容器组（用于缩放和平移）
  const g = svg.append('g')

  return { svg, g }
}

/**
 * 渲染连接线
 * @param {Object} g - D3 选择器（容器组）
 * @param {Array} edges - 边数组
 * @param {Array} nodes - 节点数组
 * @param {Function} onEdgeClick - 边点击回调
 */
export function renderEdges(g, edges, nodes, onEdgeClick) {
  const config = getConfig('edge')
  const colors = getConfig('colors')

  // 转换边数据格式
  const edgesData = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.from)
    const targetNode = nodes.find(n => n.id === edge.to)
    return {
      ...edge,
      source: sourceNode || edge.from,
      target: targetNode || edge.to
    }
  })

  // 创建边（连接线）
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(edgesData)
    .enter()
    .append('line')
    .attr('stroke', colors.edge)
    .attr('stroke-width', config.strokeWidth)
    .attr('stroke-opacity', config.strokeOpacity)
    .style('cursor', 'pointer')
    .on('mouseenter', function() {
      d3.select(this)
        .attr('stroke-opacity', config.strokeOpacityHover)
        .attr('stroke-width', config.strokeWidthHover)
    })
    .on('mouseleave', function() {
      d3.select(this)
        .attr('stroke-opacity', config.strokeOpacity)
        .attr('stroke-width', config.strokeWidth)
    })
    .on('click', (event, d) => {
      event.stopPropagation()
      if (onEdgeClick) {
        onEdgeClick(d)
      }
    })

  return link
}

/**
 * 渲染节点
 * @param {Object} g - D3 选择器（容器组）
 * @param {Array} nodes - 节点数组
 * @param {Function} onNodeClick - 节点点击回调
 * @param {Object|null} focusedNode - 聚焦节点
 * @param {Object} tooltipCallbacks - 工具提示回调函数 { onMouseEnter, onMouseMove, onMouseLeave }
 */
export function renderNodes(g, nodes, onNodeClick, focusedNode = null, tooltipCallbacks = {}) {
  const config = getConfig('node')
  const colors = getConfig('colors')
  const focusedNodeId = focusedNode?.id

  // 创建节点容器组（包含文字）
  const nodeContainer = g.append('g').attr('class', 'nodes')
  
  // 创建节点组（每个节点包含文字）
  const nodeGroupSelection = nodeContainer
    .selectAll('g.node-group')
    .data(nodes, d => d.id)
  
  // 处理新进入的节点组
  const nodeGroupEnter = nodeGroupSelection
    .enter()
    .append('g')
    .attr('class', 'node-group')
    .attr('data-node-id', d => d.id)
    .style('cursor', 'pointer')
    .style('user-select', 'none')
    .style('pointer-events', 'all')
  
  // 添加文字节点
  nodeGroupEnter
    .append('text')
    .attr('class', 'node')
    .text(d => d.topic)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-weight', config.fontWeight)
    // 根据节点是否已展开设置颜色
    .attr('fill', d => d.expanded ? colors.textExpanded : colors.text)
    .attr('x', 0)
    .attr('y', 0)
    // 根据是否为聚焦节点设置字体大小
    .attr('font-size', d => {
      return d.id === focusedNodeId 
        ? `${config.fontSizeFocused}px` 
        : `${config.fontSize}px`
    })
  
  // 合并节点组
  const nodeGroup = nodeGroupEnter.merge(nodeGroupSelection)
  
  // 更新节点组位置
  nodeGroup.attr('transform', d => {
    const x = d.x !== undefined && !isNaN(d.x) ? d.x : 0
    const y = d.y !== undefined && !isNaN(d.y) ? d.y : 0
    return `translate(${x},${y})`
  })
  
  // 更新文字节点
  const nodeText = nodeGroup.select('text.node')
  nodeText
    .text(d => d.topic)
    .attr('x', 0)
    .attr('y', 0)
    // 根据节点是否已展开设置颜色
    .attr('fill', d => d.expanded ? colors.textExpanded : colors.text)
    // 根据是否为聚焦节点设置字体大小
    .attr('font-size', d => {
      return d.id === focusedNodeId 
        ? `${config.fontSizeFocused}px` 
        : `${config.fontSize}px`
    })
  
  // 为了兼容性，保留 node 变量指向 nodeGroup
  const node = nodeGroup

  // 节点悬停效果（绑定到节点组）
  nodeGroup.on('mouseenter', function(event, d) {
    const isFocused = d.id === focusedNodeId
    const textNode = d3.select(this).select('text.node')
    textNode
      .attr('fill', colors.textHover)
      .attr('font-size', isFocused 
        ? `${config.fontSizeFocused + 2}px` 
        : `${config.fontSizeHover}px`)
    
    // 触发工具提示显示
    if (tooltipCallbacks.onMouseEnter) {
      tooltipCallbacks.onMouseEnter(event, d)
    }
  })

  nodeGroup.on('mousemove', function(event, d) {
    // 更新工具提示位置
    if (tooltipCallbacks.onMouseMove) {
      tooltipCallbacks.onMouseMove(event, d)
    }
  })

  nodeGroup.on('mouseleave', function(event, d) {
    const isFocused = d.id === focusedNodeId
    const textNode = d3.select(this).select('text.node')
    // 恢复节点颜色（已展开的节点恢复为绿色，未展开的恢复为白色）
    textNode
      .attr('fill', d.expanded ? colors.textExpanded : colors.text)
      .attr('font-size', isFocused 
        ? `${config.fontSizeFocused}px` 
        : `${config.fontSize}px`)
    
    // 触发工具提示隐藏
    if (tooltipCallbacks.onMouseLeave) {
      tooltipCallbacks.onMouseLeave(event, d)
    }
  })
  
  // 点击事件绑定到节点组
  nodeGroup.on('click', (event, d) => {
    event.stopPropagation()
    if (onNodeClick) {
      onNodeClick(d)
    }
  })

  return node
}

/**
 * 更新节点位置和字体大小
 * @param {Object} nodeGroup - D3 节点组选择器
 * @param {Array} nodes - 节点数组
 * @param {number} defaultX - 默认X坐标
 * @param {number} defaultY - 默认Y坐标
 * @param {Object|null} focusedNode - 聚焦节点
 */
export function updateNodePositions(nodeGroup, nodes, defaultX = 0, defaultY = 0, focusedNode = null) {
  const config = getConfig('node')
  const colors = getConfig('colors')
  const animation = getConfig('animation')
  const focusedNodeId = focusedNode?.id
  const useTransition = animation?.enabled
  const easeFn = resolveEase(animation?.easing)
  const duration = animation?.duration || 300
  
  // 更新节点组位置
  const groupSel = useTransition
    ? nodeGroup.transition().duration(duration).ease(easeFn)
    : nodeGroup

  groupSel.attr('transform', d => {
    const x = d.x !== undefined && !isNaN(d.x) ? d.x : defaultX
    const y = d.y !== undefined && !isNaN(d.y) ? d.y : defaultY
    return `translate(${x},${y})`
  })
  
  // 更新文字节点
  const nodeText = useTransition
    ? nodeGroup.select('text.node').transition().duration(duration).ease(easeFn)
    : nodeGroup.select('text.node')
  nodeText
    .attr('x', 0)
    .attr('y', 0)
    // 根据节点是否已展开更新颜色
    .attr('fill', d => d.expanded ? colors.textExpanded : colors.text)
    // 根据是否为聚焦节点更新字体大小
    .attr('font-size', d => {
      return d.id === focusedNodeId 
        ? `${config.fontSizeFocused}px` 
        : `${config.fontSize}px`
    })
}

/**
 * 更新连接线位置
 * @param {Object} link - D3 连接线选择器
 * @param {Array} edges - 边数组
 * @param {Array} nodes - 节点数组
 */
export function updateEdgePositions(link, edges, nodes) {
  const animation = getConfig('animation')
  const useTransition = animation?.enabled
  const easeFn = resolveEase(animation?.easing)
  const duration = animation?.duration || 300

  const linkSel = useTransition
    ? link.transition().duration(duration).ease(easeFn)
    : link

  linkSel
    .attr('x1', d => {
      const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source)
      return source?.x || 0
    })
    .attr('y1', d => {
      const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source)
      return source?.y || 0
    })
    .attr('x2', d => {
      const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target)
      return target?.x || 0
    })
    .attr('y2', d => {
      const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target)
      return target?.y || 0
    })
}


