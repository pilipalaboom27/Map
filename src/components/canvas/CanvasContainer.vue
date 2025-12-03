<template>
  <div class="canvas-container" ref="canvasContainer">
    <svg ref="svgCanvas" class="canvas-svg"></svg>
    <NodeInfoCard 
      v-if="hoveredNode" 
      :node="hoveredNode"
      :position="infoCardPosition"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import NodeInfoCard from '../common/InfoCard.vue'

const props = defineProps({
  nodes: {
    type: Array,
    required: true
  },
  connections: {
    type: Array,
    required: true
  },
  focusedNode: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['node-click', 'node-expand'])

const canvasContainer = ref(null)
const svgCanvas = ref(null)
const hoveredNode = ref(null)
const infoCardPosition = ref({ x: 0, y: 0 })

// 获取要显示的节点（当前节点 + 父节点 + 子节点）
const getVisibleNodes = () => {
  if (!props.focusedNode) {
    // 如果没有聚焦节点，只显示根节点（level 0）
    return props.nodes.filter(n => n.level === 0)
  }
  
  const visibleNodeIds = new Set()
  const focusedId = props.focusedNode.id
  
  // 添加聚焦节点本身
  visibleNodeIds.add(focusedId)
  
  // 添加父节点链（递归向上）
  let currentNode = props.focusedNode
  while (currentNode && currentNode.parentId) {
    visibleNodeIds.add(currentNode.parentId)
    currentNode = props.nodes.find(n => n.id === currentNode.parentId)
  }
  
  // 添加直接子节点（通过connections查找）
  props.connections.forEach(conn => {
    if (conn.from === focusedId) {
      visibleNodeIds.add(conn.to)
    }
  })
  
  return props.nodes.filter(n => visibleNodeIds.has(n.id))
}

// 精确计算所有节点的目标位置（取代force simulation）
const calculateExactPositions = (focusedNode, visibleNodes) => {
  if (!focusedNode || !canvasContainer.value) return new Map()
  
  const centerX = canvasContainer.value.clientWidth / 2
  const centerY = canvasContainer.value.clientHeight / 2
  const positions = new Map()
  
  // 1. 聚焦节点：画布正中心
  positions.set(focusedNode.id, { 
    x: centerX, 
    y: centerY,
    role: 'focus' 
  })
  
  // 2. 父节点：正上方固定280px
  const parent = visibleNodes.find(n => n.id === focusedNode.parentId)
  if (parent) {
    positions.set(parent.id, { 
      x: centerX, 
      y: centerY - 280,
      role: 'parent'
    })
  }
  
  // 3. 子节点：圆形均匀分布，半径250px
  const children = visibleNodes.filter(n => 
    props.connections.some(c => c.from === focusedNode.id && c.to === n.id)
  )
  
  if (children.length > 0) {
    const radius = 250
    const angleStep = (2 * Math.PI) / children.length
    const startAngle = -Math.PI / 2 // 从正上方开始
    
    children.forEach((child, index) => {
      const angle = startAngle + angleStep * index
      positions.set(child.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        role: 'child',
        angle: angle
      })
    })
  }
  
  return positions
}

// 获取要显示的连接线
const getVisibleConnections = () => {
  const visibleNodes = getVisibleNodes()
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id))
  
  return props.connections.filter(conn => 
    visibleNodeIds.has(conn.from) && visibleNodeIds.has(conn.to)
  )
}

// 缩放和平移相关
const scale = ref(1)
const minScale = 0.1
const maxScale = 5
const offset = ref({ x: 0, y: 0 })

// D3力导向布局
let simulation = null
let svg = null
let link = null
let node = null

// 初始化D3画布
const initCanvas = () => {
  if (!svgCanvas.value || !canvasContainer.value) return
  
  const container = canvasContainer.value
  const width = container.clientWidth
  const height = container.clientHeight
  
  // 清除现有内容
  d3.select(svgCanvas.value).selectAll('*').remove()
  
  // 创建SVG
  svg = d3.select(svgCanvas.value)
    .attr('width', width)
    .attr('height', height)
  
  // 创建缩放行为
  const zoom = d3.zoom()
    .scaleExtent([minScale, maxScale])
    .on('zoom', (event) => {
      scale.value = event.transform.k
      offset.value = { x: event.transform.x, y: event.transform.y }
      g.attr('transform', event.transform)
    })
  
  // 添加箭头标记定义
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 8)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', '#10b981')
  
  // 创建可缩放的组
  const g = svg.append('g')
  
  svg.call(zoom)
  
  // 创建连接线组
  const linkGroup = g.append('g')
    .attr('class', 'links')
  
  // 创建节点组
  const nodeGroup = g.append('g')
    .attr('class', 'nodes')
  
  // ✅ 完全移除Force Simulation
  // 使用精确计算 + 轨道运动 + 磁性吸附系统
  simulation = null
  
  // 初始化连接线选择器（空数据，等待updateSimulation更新）
  link = linkGroup.selectAll('line')
  
  // 初始时不渲染节点，让updateSimulation统一处理
  updateSimulation()
  
  // 拖拽开始
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }
  
  // 拖拽中
  function dragged(event, d) {
    d.fx = event.x
    d.fy = event.y
  }
  
  // 拖拽结束
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }
}

// 保存当前可见节点的引用
let currentVisibleNodes = []
let previousVisibleNodeIds = new Set()

// 获取可见节点的ID集合
const getVisibleNodeIds = (focusNode) => {
  if (!focusNode) return new Set()
  
  const ids = new Set()
  ids.add(focusNode.id)
  
  // 添加父节点
  let current = focusNode
  while (current && current.parentId) {
    ids.add(current.parentId)
    current = props.nodes.find(n => n.id === current.parentId)
  }
  
  // 添加子节点
  props.connections.forEach(conn => {
    if (conn.from === focusNode.id) {
      ids.add(conn.to)
    }
  })
  
  return ids
}

// 创建波纹扩散效果
const createRipple = (node) => {
  if (!node || !svg || node.x === undefined || node.y === undefined) return
  
  const g = svg.select('g') // 获取主画布组
  
  // 创建3个波纹
  for (let i = 0; i < 3; i++) {
    g.append('circle')
      .attr('cx', node.x)
      .attr('cy', node.y)
      .attr('r', 0)
      .attr('fill', 'none')
      .attr('stroke', node.color)
      .attr('stroke-width', 2)
      .attr('opacity', 0.6)
      .transition()
      .delay(i * 150) // 依次发出
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr('r', 400) // 扩散到400px
      .attr('opacity', 0)
      .remove()
  }
}

// 创建脉冲光晕效果
const createPulseGlow = (focusNode) => {
  if (!focusNode || !svg || focusNode.x === undefined || focusNode.y === undefined) return
  
  const g = svg.select('g')
  
  // 创建两个扩散的光环
  for (let i = 0; i < 2; i++) {
    g.append('circle')
      .attr('cx', focusNode.x)
      .attr('cy', focusNode.y)
      .attr('r', Math.max(focusNode.width, focusNode.height) / 2)
      .attr('fill', 'none')
      .attr('stroke', focusNode.color)
      .attr('stroke-width', 3)
      .attr('opacity', 0.8)
      .transition()
      .delay(i * 400)
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('r', Math.max(focusNode.width, focusNode.height) * 1.2)
      .attr('stroke-width', 0)
      .attr('opacity', 0)
      .remove()
  }
}

// 轨道运动：从当前位置到目标位置的优雅弧线运动
const animateOrbitalMotion = (nodeId, from, to, duration = 1200, onComplete) => {
  if (!node) return
  
  const nodeElement = node.filter(d => d.id === nodeId)
  if (!nodeElement.node()) return
  
  // 计算贝塞尔曲线控制点
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  
  // 根据距离调整弧度
  const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2))
  const arcHeight = Math.min(distance * 0.3, 100)
  
  // 创建弧线偏移（垂直于连线方向）
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.sqrt(dx * dx + dy * dy)
  
  const offsetX = length > 0 ? (-dy / length) * arcHeight : 0
  const offsetY = length > 0 ? (dx / length) * arcHeight : 0
  
  const controlPoint = {
    x: midX + offsetX,
    y: midY + offsetY
  }
  
  // 使用二次贝塞尔曲线插值
  nodeElement
    .transition()
    .duration(duration)
    .ease(d3.easeCubicInOut)
    .attrTween('transform', function(d) {
      return function(t) {
        // 二次贝塞尔曲线公式
        const x = Math.pow(1-t, 2) * from.x + 
                  2 * (1-t) * t * controlPoint.x + 
                  Math.pow(t, 2) * to.x
        
        const y = Math.pow(1-t, 2) * from.y + 
                  2 * (1-t) * t * controlPoint.y + 
                  Math.pow(t, 2) * to.y
        
        // 实时更新节点数据
        d.x = x
        d.y = y
        
        return `translate(${x},${y})`
      }
    })
    .on('end', () => {
      if (onComplete) onComplete()
    })
}

// 磁性吸附引擎类
class MagneticSnapEngine {
  constructor() {
    this.animationFrame = null
    this.activeNodes = new Map() // nodeId -> { current: {x, y}, target: {x, y} }
    this.damping = 0.12 // 阻尼系数（0.1-0.2之间）
    this.threshold = 0.5 // 停止阈值（像素）
  }
  
  // 添加需要吸附的节点
  addNode(nodeId, currentPos, targetPos) {
    this.activeNodes.set(nodeId, {
      current: { ...currentPos },
      target: { ...targetPos }
    })
  }
  
  // 启动吸附动画
  start(updateLinks) {
    if (this.animationFrame || this.activeNodes.size === 0) return
    
    const animate = () => {
      let hasActiveNodes = false
      
      this.activeNodes.forEach((data, nodeId) => {
        const dx = data.target.x - data.current.x
        const dy = data.target.y - data.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > this.threshold) {
          hasActiveNodes = true
          
          // 阻尼运动：越接近目标速度越慢
          data.current.x += dx * this.damping
          data.current.y += dy * this.damping
          
          // 更新DOM
          const nodeElement = node?.filter(d => d.id === nodeId)
          if (nodeElement && nodeElement.node()) {
            nodeElement.attr('transform', `translate(${data.current.x},${data.current.y})`)
            
            // 更新节点数据
            const nodeData = props.nodes.find(n => n.id === nodeId)
            if (nodeData) {
              nodeData.x = data.current.x
              nodeData.y = data.current.y
            }
          }
        } else {
          // 精确吸附到目标
          const nodeElement = node?.filter(d => d.id === nodeId)
          if (nodeElement && nodeElement.node()) {
            nodeElement.attr('transform', `translate(${data.target.x},${data.target.y})`)
            
            const nodeData = props.nodes.find(n => n.id === nodeId)
            if (nodeData) {
              nodeData.x = data.target.x
              nodeData.y = data.target.y
            }
          }
          
          // 移除已完成的节点
          this.activeNodes.delete(nodeId)
        }
      })
      
      // 更新连接线
      if (updateLinks) updateLinks()
      
      if (hasActiveNodes) {
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        this.stop()
      }
    }
    
    this.animationFrame = requestAnimationFrame(animate)
  }
  
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }
  
  clear() {
    this.stop()
    this.activeNodes.clear()
  }
}

// 创建全局磁性吸附引擎实例
const magneticEngine = new MagneticSnapEngine()

// 实时更新连接线位置
const updateLinksPosition = () => {
  if (!link) return
  
  link
    .attr('x1', d => {
      const sourceNode = props.nodes.find(n => n.id === d.from)
      return sourceNode?.x ?? 0
    })
    .attr('y1', d => {
      const sourceNode = props.nodes.find(n => n.id === d.from)
      return sourceNode?.y ?? 0
    })
    .attr('x2', d => {
      const targetNode = props.nodes.find(n => n.id === d.to)
      return targetNode?.x ?? 0
    })
    .attr('y2', d => {
      const targetNode = props.nodes.find(n => n.id === d.to)
      return targetNode?.y ?? 0
    })
}

// 沿连接线移动到中心
const animateAlongPath = (newNode, oldNode, onComplete) => {
  if (!newNode || !canvasContainer.value) return
  
  const centerX = canvasContainer.value.clientWidth / 2
  const centerY = canvasContainer.value.clientHeight / 2
  
  // 检查是否有连接关系
  const hasConnection = oldNode && props.connections.some(c => 
    (c.from === oldNode.id && c.to === newNode.id) ||
    (c.from === newNode.id && c.to === oldNode.id)
  )
  
  if (hasConnection && oldNode && newNode.x !== undefined) {
    // 沿连接线移动
    const startX = newNode.x
    const startY = newNode.y
    
    // 创建路径插值
    const interpolateX = d3.interpolate(startX, centerX)
    const interpolateY = d3.interpolate(startY, centerY)
    
    // 找到对应的DOM节点并动画
    const targetNodeElement = node?.filter(d => d.id === newNode.id)
    if (targetNodeElement && targetNodeElement.node()) {
      d3.select(targetNodeElement.node())
        .transition()
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .tween('move', function() {
          return function(t) {
            newNode.x = interpolateX(t)
            newNode.y = interpolateY(t)
            newNode.fx = newNode.x
            newNode.fy = newNode.y
            
            // 更新节点位置
            d3.select(this).attr('transform', `translate(${newNode.x},${newNode.y})`)
            
            // 更新连接线
            if (link) {
              link
                .attr('x1', d => {
                  const source = typeof d.source === 'object' ? d.source : currentVisibleNodes.find(n => n.id === d.source)
                  return source?.x ?? 0
                })
                .attr('y1', d => {
                  const source = typeof d.source === 'object' ? d.source : currentVisibleNodes.find(n => n.id === d.source)
                  return source?.y ?? 0
                })
                .attr('x2', d => {
                  const target = typeof d.target === 'object' ? d.target : currentVisibleNodes.find(n => n.id === d.target)
                  return target?.x ?? 0
                })
                .attr('y2', d => {
                  const target = typeof d.target === 'object' ? d.target : currentVisibleNodes.find(n => n.id === d.target)
                  return target?.y ?? 0
                })
            }
          }
        })
        .on('end', () => {
          newNode.fx = centerX
          newNode.fy = centerY
          if (onComplete) onComplete()
        })
    }
  } else {
    // 直接固定在中心
    newNode.fx = centerX
    newNode.fy = centerY
    if (onComplete) onComplete()
  }
}

// 节点弹性放大效果
const bounceScale = (nodeId) => {
  if (!node) return
  
  const targetNode = node.filter(d => d.id === nodeId)
  
  // 矩形弹性放大
  targetNode.select('rect')
    .transition()
    .duration(800)
    .ease(d3.easeBackOut.overshoot(1.4)) // 超出再回弹
    .attr('width', d => d.width * 1.5)
    .attr('height', d => d.height * 1.5)
    .attr('x', d => -(d.width * 1.5) / 2)
    .attr('y', d => -(d.height * 1.5) / 2)
  
  // 文字弹性放大
  targetNode.select('text')
    .transition()
    .duration(800)
    .ease(d3.easeBackOut.overshoot(1.4))
    .attr('font-size', '20px')
}

// 退场节点动画 - 优雅离场
const animateExitNodes = (exitNodeIds) => {
  if (!node || !canvasContainer.value || exitNodeIds.length === 0) return
  
  const centerX = canvasContainer.value.clientWidth / 2
  const centerY = canvasContainer.value.clientHeight / 2
  
  exitNodeIds.forEach((exitId, index) => {
    const exitNode = node.filter(d => d.id === exitId)
    const exitData = props.nodes.find(n => n.id === exitId)
    
    if (exitNode && exitData) {
      exitNode
        .transition()
        .delay(index * 50) // 依次退场
        .duration(600)
        .ease(d3.easeCubicIn)
        .style('opacity', 0)
        .attrTween('transform', function() {
          const startX = exitData.x || 0
          const startY = exitData.y || 0
          return function(t) {
            // 向中心收缩
            const x = startX + (centerX - startX) * t * 0.3
            const y = startY + (centerY - startY) * t * 0.3
            const scale = 1 - t * 0.7
            return `translate(${x},${y}) scale(${scale})`
          }
        })
    }
  })
}

// 旧主角让位动画
const animateOldFocus = (oldNode) => {
  if (!oldNode || !node) return
  
  const oldNodeElement = node.filter(d => d.id === oldNode.id)
  
  // 缩小动画
  oldNodeElement.select('rect')
    .transition()
    .duration(1000)
    .ease(d3.easeCubicInOut)
    .attr('width', d => d.width)
    .attr('height', d => d.height)
    .attr('x', d => -d.width / 2)
    .attr('y', d => -d.height / 2)
  
  oldNodeElement.select('text')
    .transition()
    .duration(1000)
    .ease(d3.easeCubicInOut)
    .attr('font-size', '14px')
}

// 新入场节点动画 - 从虚空中显现
const animateEnterNodes = (enterNodeIds) => {
  if (!node || enterNodeIds.length === 0) return
  
  enterNodeIds.forEach((enterId, index) => {
    const enterNode = node.filter(d => d.id === enterId)
    
    if (enterNode && enterNode.node()) {
      // 初始状态：缩小且透明
      enterNode
        .style('opacity', 0)
        .each(function(d) {
          d3.select(this)
            .select('rect')
            .attr('transform', 'scale(0.3)')
          d3.select(this)
            .select('text')
            .attr('transform', 'scale(0.3)')
        })
      
      // 入场动画：延迟入场，形成波浪效果
      enterNode
        .transition()
        .delay(800 + index * 100) // 依次入场
        .duration(1000)
        .ease(d3.easeBackOut.overshoot(1.2))
        .style('opacity', 1)
        .each(function() {
          d3.select(this)
            .select('rect')
            .transition()
            .duration(1000)
            .ease(d3.easeBackOut.overshoot(1.2))
            .attr('transform', 'scale(1)')
          
          d3.select(this)
            .select('text')
            .transition()
            .duration(1000)
            .ease(d3.easeBackOut.overshoot(1.2))
            .attr('transform', 'scale(1)')
        })
    }
  })
}

// 保留节点流体重排
const animateStayNodes = (stayNodeIds, excludeFocusId) => {
  if (!node || stayNodeIds.length === 0) return
  
  stayNodeIds
    .filter(id => id !== excludeFocusId)
    .forEach((stayId, index) => {
      const stayNode = node.filter(d => d.id === stayId)
      
      // 使用弹性缓动，带延迟形成波浪效果
      stayNode.select('rect')
        .transition()
        .delay(200 + index * 50)
        .duration(1200)
        .ease(d3.easeElasticOut.amplitude(1).period(0.4))
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('x', d => -d.width / 2)
        .attr('y', d => -d.height / 2)
      
      stayNode.select('text')
        .transition()
        .delay(200 + index * 50)
        .duration(1200)
        .ease(d3.easeElasticOut.amplitude(1).period(0.4))
        .attr('font-size', '14px')
    })
}

// 更新布局（使用精确计算，不再使用force simulation）
const updateSimulation = () => {
  // 获取可见的节点和连接线
  const visibleNodes = getVisibleNodes()
  const visibleConnections = getVisibleConnections()
  currentVisibleNodes = visibleNodes
  
  // 精确计算目标位置
  const targetPositions = calculateExactPositions(props.focusedNode, visibleNodes)
  
  // 为新节点设置初始位置
  visibleNodes.forEach(node => {
    const pos = targetPositions.get(node.id)
    if (pos && (node.x === undefined || node.y === undefined)) {
      // 新节点直接设置在目标位置
      node.x = pos.x
      node.y = pos.y
    } else if (node.x === undefined || node.y === undefined) {
      // 如果没有计算目标位置（如根节点），设置在画布中心
      if (canvasContainer.value) {
        node.x = canvasContainer.value.clientWidth / 2
        node.y = canvasContainer.value.clientHeight / 2
      }
    }
  })
  
  // 定义拖拽函数（不再需要simulation）
  function dragstarted(event, d) {
    d.isDragging = true
  }
  
  function dragged(event, d) {
    d.x = event.x
    d.y = event.y
    d3.select(event.sourceEvent.target.parentNode)
      .attr('transform', `translate(${d.x},${d.y})`)
    updateLinksPosition()
  }
  
  function dragended(event, d) {
    d.isDragging = false
  }
  
  // 更新连接线数据（使用 key 函数确保正确更新）
  link = link.data(visibleConnections, d => `${d.from}-${d.to}`)
    .join(
      enter => enter.append('line')
        .attr('class', 'edge')
        .attr('stroke', '#10b981')
        .attr('stroke-opacity', 0)
        .attr('stroke-width', 4)
        .attr('stroke-linecap', 'round')
        .attr('marker-end', 'url(#arrowhead)')
        .attr('x1', d => visibleNodes.find(n => n.id === d.from)?.x ?? 0)
        .attr('y1', d => visibleNodes.find(n => n.id === d.from)?.y ?? 0)
        .attr('x2', d => visibleNodes.find(n => n.id === d.to)?.x ?? 0)
        .attr('y2', d => visibleNodes.find(n => n.id === d.to)?.y ?? 0)
        .call(enter => enter.transition().duration(300).attr('stroke-opacity', 1)),
      update => update
        .attr('x1', d => visibleNodes.find(n => n.id === d.from)?.x ?? 0)
        .attr('y1', d => visibleNodes.find(n => n.id === d.from)?.y ?? 0)
        .attr('x2', d => visibleNodes.find(n => n.id === d.to)?.x ?? 0)
        .attr('y2', d => visibleNodes.find(n => n.id === d.to)?.y ?? 0),
      exit => exit.transition().duration(200).attr('stroke-opacity', 0).remove()
    )
  
  console.log(`✅ 已渲染 ${visibleConnections.length} 条连接线`)
  
  // 更新节点数据，只显示可见节点
  const nodeGroup = d3.select(svgCanvas.value).select('.nodes')
  node = nodeGroup.selectAll('g')
    .data(visibleNodes, d => d.id)
    .join(
      // 为新节点添加元素
      enter => {
        const g = enter.append('g')
          .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended))
          .on('click', (event, d) => {
            event.stopPropagation()
            emit('node-click', d)
          })
          .on('mouseover', (event, d) => {
            hoveredNode.value = d
            updateInfoCardPosition(event, d)
          })
          .on('mouseout', () => {
            hoveredNode.value = null
          })
        
        // 为新节点添加矩形
        g.append('rect')
          .attr('width', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? d.width * 1.5 : d.width
          })
          .attr('height', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? d.height * 1.5 : d.height
          })
          .attr('x', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? -(d.width * 1.5) / 2 : -d.width / 2
          })
          .attr('y', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? -(d.height * 1.5) / 2 : -d.height / 2
          })
          .attr('rx', 8)
          .attr('ry', 8)
          .attr('fill', d => d.color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
        
        // 为新节点添加文本
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? '20px' : '14px'
          })
          .attr('font-weight', 'bold')
          .text(d => d.topic)
        
        // 设置初始位置
        g.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
        
        return g
      },
      // 更新现有节点
      update => {
        update.call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))
          .on('click', (event, d) => {
            event.stopPropagation()
            emit('node-click', d)
          })
          .on('mouseover', (event, d) => {
            hoveredNode.value = d
            updateInfoCardPosition(event, d)
          })
          .on('mouseout', () => {
            hoveredNode.value = null
          })
        
        // 更新节点矩形（不带动画，动画由watch处理）
        update.select('rect')
          .attr('width', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? d.width * 1.5 : d.width
          })
          .attr('height', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? d.height * 1.5 : d.height
          })
          .attr('x', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? -(d.width * 1.5) / 2 : -d.width / 2
          })
          .attr('y', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? -(d.height * 1.5) / 2 : -d.height / 2
          })
          .attr('rx', 8)
          .attr('ry', 8)
          .attr('fill', d => d.color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
        
        // 更新节点文本
        update.select('text')
          .attr('font-size', d => {
            const isFocused = props.focusedNode && d.id === props.focusedNode.id
            return isFocused ? '20px' : '14px'
          })
          .text(d => d.topic)
        
        // 更新节点位置
        update.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`)
        
        return update
      },
      // 移除不需要的节点
      exit => exit.remove()
    )
  
  // 更新连接线位置
  updateLinksPosition()
}

// 更新信息卡片位置
const updateInfoCardPosition = (event, node) => {
  const rect = canvasContainer.value.getBoundingClientRect()
  infoCardPosition.value = {
    x: event.clientX - rect.left + 30,
    y: event.clientY - rect.top - 30
  }
}

// 监听节点和连接线变化
watch([() => props.nodes, () => props.connections], () => {
  nextTick(() => {
    updateSimulation()
  })
}, { deep: true })

// 监听聚焦节点变化
watch(() => props.focusedNode, (newNode, oldNode) => {
  if (!newNode) return
  
  // 停止之前的磁性吸附
  magneticEngine.clear()
  
  // === 分析节点角色 ===
  const oldVisibleIds = oldNode ? getVisibleNodeIds(oldNode) : new Set()
  const newVisibleIds = getVisibleNodeIds(newNode)
  
  const exitNodeIds = [...oldVisibleIds].filter(id => !newVisibleIds.has(id) && id !== oldNode?.id)
  const enterNodeIds = [...newVisibleIds].filter(id => !oldVisibleIds.has(id) && id !== newNode.id)
  const stayNodeIds = [...newVisibleIds].filter(id => oldVisibleIds.has(id) && id !== newNode.id)
  
  console.log('🎭 节点角色分析:', {
    退场: exitNodeIds.length,
    入场: enterNodeIds.length,
    保留: stayNodeIds.length,
    旧主角: oldNode?.topic,
    新主角: newNode?.topic
  })
  
  // 计算新的精确目标位置
  const newPositions = calculateExactPositions(newNode, getVisibleNodes())
  
  // === 动画编排时间轴 ===
  
  // [0-600ms] 第一幕：告别
  if (exitNodeIds.length > 0) {
    animateExitNodes(exitNodeIds)
  }
  
  if (oldNode) {
    createRipple(oldNode)           // 发出波纹
    animateOldFocus(oldNode)        // 缩小让位
  }
  
  // [0-1500ms] 第二幕：新主角轨道运动到中心
  const newPos = newPositions.get(newNode.id)
  if (newPos && newNode.x !== undefined) {
    animateOrbitalMotion(
      newNode.id,
      { x: newNode.x, y: newNode.y },
      newPos,
      1500,
      () => {
        // [1500-2300ms] 第三幕：弹性放大
        bounceScale(newNode.id)
        createPulseGlow(newNode)
      }
    )
  } else {
    // 新节点没有初始位置，直接设置在中心
    if (newPos) {
      newNode.x = newPos.x
      newNode.y = newPos.y
    }
  }
  
  // [200ms后] 第三幕：保留节点和新入场节点使用磁性吸附
  setTimeout(() => {
    const nodesToSnap = [...stayNodeIds, ...enterNodeIds].filter(id => id !== newNode.id)
    
    nodesToSnap.forEach(nodeId => {
      const nodeData = props.nodes.find(n => n.id === nodeId)
      const targetPos = newPositions.get(nodeId)
      
      if (nodeData && targetPos) {
        magneticEngine.addNode(
          nodeId,
          { x: nodeData.x || targetPos.x, y: nodeData.y || targetPos.y },
          targetPos
        )
      }
    })
    
    // 启动磁性吸附动画
    magneticEngine.start(updateLinksPosition)
  }, 200)
  
  // [800-1800ms] 第四幕：新节点入场动画
  if (enterNodeIds.length > 0) {
    setTimeout(() => {
      animateEnterNodes(enterNodeIds)
    }, 100) // 等待节点渲染
  }
  
  // 更新可见节点集合
  previousVisibleNodeIds = newVisibleIds
  
  // 重新渲染节点（只显示相关节点）
  nextTick(() => {
    updateSimulation()
  })
})

// 窗口大小变化时重新初始化
const handleResize = () => {
  initCanvas()
}

// 暴露方法
const zoomIn = () => {
  if (svgCanvas.value) {
    d3.select(svgCanvas.value).transition()
      .duration(600) // 增加到600ms，更慢
      .ease(d3.easeCubicInOut)
      .call(
        d3.zoom().scaleBy,
        1.2
      )
  }
}

const zoomOut = () => {
  if (svgCanvas.value) {
    d3.select(svgCanvas.value).transition()
      .duration(600) // 增加到600ms，更慢
      .ease(d3.easeCubicInOut)
      .call(
        d3.zoom().scaleBy,
        1 / 1.2
      )
  }
}

const resetView = () => {
  if (svgCanvas.value) {
    d3.select(svgCanvas.value).transition()
      .duration(1200) // 增加到1200ms，更慢更平滑
      .ease(d3.easeCubicInOut)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity
      )
  }
}

defineExpose({
  zoomIn,
  zoomOut,
  resetView,
  scale
})

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f7fafc;
}

.canvas-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.canvas-svg:active {
  cursor: grabbing;
}

.links line {
  stroke: #2563eb;
  stroke-opacity: 1;
  stroke-width: 3px;
  stroke-linecap: round;
}

.nodes g {
  cursor: pointer;
  transition: all 0.2s ease;
}

.nodes g:hover {
  filter: brightness(1.1);
}

.nodes rect {
  stroke: #fff;
  stroke-width: 2px;
  transition: all 0.2s ease;
}

.nodes g:hover rect {
  stroke-width: 3px;
}

.nodes text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: bold;
  text-anchor: middle;
  pointer-events: none;
}
</style>