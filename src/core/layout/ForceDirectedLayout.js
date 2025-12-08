/**
 * 力导向布局 - 节点根据关系自动分散，保持自然间距
 */
export class ForceDirectedLayout {
  constructor(options = {}) {
    this.options = {
      canvasWidth: 1200,
      canvasHeight: 800,
      linkDistance: 200,      // 连接线默认长度
      linkStrength: 0.3,      // 连接力强度（降低，使布局更松散）
      chargeStrength: -500,   // 节点间排斥力（增强，避免节点重叠）
      centerStrength: 0.05,   // 中心引力（降低，使布局更自然）
      iterations: 50,         // 模拟迭代次数（减少，提高性能）
      damping: 0.95,          // 阻尼系数，使布局更快稳定
      minDistance: 100,       // 节点最小间距
      maxDistance: 500,       // 节点最大间距
      ...options
    }
  }

  /**
   * 计算节点位置
   */
  calculate(nodes, edges, focusNode) {
    const positions = new Map()
    const { canvasWidth, canvasHeight } = this.options
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    if (nodes.length === 0) return positions

    // 根据节点数量动态调整参数
    const dynamicOptions = this.getDynamicOptions(nodes.length)

    // 初始化节点位置（随机或基于现有位置）
    const nodeData = nodes.map(node => ({
      id: node.id,
      x: node.x !== undefined ? node.x : centerX + (Math.random() - 0.5) * 300,
      y: node.y !== undefined ? node.y : centerY + (Math.random() - 0.5) * 300,
      vx: 0,
      vy: 0,
      isFocused: focusNode && node.id === focusNode.id,
      level: node.level || 0
    }))

    // 构建节点索引
    const nodeIndex = new Map()
    nodeData.forEach((n, i) => nodeIndex.set(n.id, i))

    // 构建邻接表，用于优化连接力计算
    const adjacencyList = this.buildAdjacencyList(edges, nodeIndex)

    // 运行力导向模拟
    for (let iteration = 0; iteration < this.options.iterations; iteration++) {
      // 应用排斥力（优化版）
      this.applyChargeForce(nodeData, dynamicOptions)

      // 应用连接力（优化版）
      this.applyLinkForce(nodeData, adjacencyList, dynamicOptions)

      // 应用中心引力
      this.applyCenterForce(nodeData, centerX, centerY, dynamicOptions)

      // 应用层级约束（确保层级关系清晰）
      this.applyLevelConstraints(nodeData, edges, nodeIndex)

      // 更新位置
      this.updatePositions(nodeData, dynamicOptions)

      // 降低速度（自适应阻尼）
      const alpha = 1 - iteration / this.options.iterations
      const damping = this.options.damping + (1 - this.options.damping) * (1 - alpha)
      nodeData.forEach(node => {
        node.vx *= damping
        node.vy *= damping
      })
    }

    // 如果有聚焦节点，将其移到中心
    if (focusNode) {
      this.centerFocusedNode(nodeData, focusNode, centerX, centerY)
    }

    // 保存结果
    nodeData.forEach(node => {
      // 限制节点位置在画布内
      const clampedX = Math.max(50, Math.min(canvasWidth - 50, node.x))
      const clampedY = Math.max(50, Math.min(canvasHeight - 50, node.y))
      positions.set(node.id, { x: clampedX, y: clampedY })
    })

    return positions
  }

  /**
   * 根据节点数量动态调整参数
   */
  getDynamicOptions(nodeCount) {
    if (nodeCount < 10) {
      return {
        linkDistance: this.options.linkDistance * 0.8,
        chargeStrength: this.options.chargeStrength * 0.8,
        centerStrength: this.options.centerStrength * 1.2
      }
    } else if (nodeCount > 50) {
      return {
        linkDistance: this.options.linkDistance * 1.2,
        chargeStrength: this.options.chargeStrength * 1.5,
        centerStrength: this.options.centerStrength * 0.8
      }
    }
    return this.options
  }

  /**
   * 构建邻接表，优化连接力计算
   */
  buildAdjacencyList(edges, nodeIndex) {
    const adjacencyList = new Map()
    
    edges.forEach(edge => {
      const sourceIdx = nodeIndex.get(edge.from)
      const targetIdx = nodeIndex.get(edge.to)
      
      if (sourceIdx === undefined || targetIdx === undefined) return
      
      if (!adjacencyList.has(sourceIdx)) {
        adjacencyList.set(sourceIdx, [])
      }
      if (!adjacencyList.has(targetIdx)) {
        adjacencyList.set(targetIdx, [])
      }
      
      adjacencyList.get(sourceIdx).push(targetIdx)
      adjacencyList.get(targetIdx).push(sourceIdx)
    })
    
    return adjacencyList
  }

  /**
   * 应用排斥力（优化版）
   */
  applyChargeForce(nodes, options) {
    const { chargeStrength, minDistance, maxDistance } = { ...this.options, ...options }
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]
        
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const distSq = dx * dx + dy * dy
        
        if (distSq < 0.01) continue // 避免除零
        
        const dist = Math.sqrt(distSq)
        
        // 只在有效距离范围内应用排斥力
        if (dist > maxDistance) continue
        if (dist < minDistance) {
          // 当节点过近时，应用更强的排斥力
          const force = chargeStrength * 2 / distSq
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          
          nodeA.vx -= fx
          nodeA.vy -= fy
          nodeB.vx += fx
          nodeB.vy += fy
        } else {
          // 正常距离下的排斥力
          const force = chargeStrength / (distSq * 0.01)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          
          nodeA.vx -= fx
          nodeA.vy -= fy
          nodeB.vx += fx
          nodeB.vy += fy
        }
      }
    }
  }

  /**
   * 应用连接力（优化版）
   */
  applyLinkForce(nodeData, adjacencyList, options) {
    const { linkDistance, linkStrength } = { ...this.options, ...options }
    
    // 遍历邻接表，只计算有连接的节点对
    adjacencyList.forEach((neighbors, nodeIdx) => {
      const source = nodeData[nodeIdx]
      
      neighbors.forEach(neighborIdx => {
        if (nodeIdx >= neighborIdx) return // 避免重复计算
        
        const target = nodeData[neighborIdx]
        
        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 0.01) return
        
        // 基于距离动态调整连接力
        let force
        if (dist < linkDistance * 0.8) {
          // 过近时，连接力变为排斥力
          force = (dist - linkDistance * 0.8) * linkStrength * 0.5
        } else if (dist > linkDistance * 1.2) {
          // 过远时，增强连接力
          force = (dist - linkDistance) * linkStrength * 1.5
        } else {
          // 正常距离
          force = (dist - linkDistance) * linkStrength
        }
        
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        
        source.vx += fx
        source.vy += fy
        target.vx -= fx
        target.vy -= fy
      })
    })
  }

  /**
   * 应用中心引力
   */
  applyCenterForce(nodes, centerX, centerY, options) {
    const { centerStrength } = { ...this.options, ...options }
    
    nodes.forEach(node => {
      if (node.isFocused) return // 聚焦节点不受中心引力
      
      const dx = centerX - node.x
      const dy = centerY - node.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      // 距离中心越远，中心引力越强
      const scaledStrength = centerStrength * (dist / 1000)
      
      node.vx += dx * scaledStrength
      node.vy += dy * scaledStrength
    })
  }

  /**
   * 应用层级约束
   */
  applyLevelConstraints(nodeData, edges, nodeIndex) {
    // 确保高层级节点围绕低层级节点分布
    edges.forEach(edge => {
      const sourceIdx = nodeIndex.get(edge.from)
      const targetIdx = nodeIndex.get(edge.to)
      
      if (sourceIdx === undefined || targetIdx === undefined) return
      
      const source = nodeData[sourceIdx]
      const target = nodeData[targetIdx]
      
      // 如果存在层级差异，确保子节点在父节点周围
      if (source.level < target.level) {
        const dx = source.x - target.x
        const dy = source.y - target.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        // 轻微调整子节点位置，使其更靠近父节点
        if (dist > this.options.linkDistance * 1.5) {
          const force = (dist - this.options.linkDistance) * 0.1
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          
          target.vx += fx
          target.vy += fy
        }
      }
    })
  }

  /**
   * 更新位置
   */
  updatePositions(nodes, options) {
    const { canvasWidth, canvasHeight } = this.options
    
    nodes.forEach(node => {
      // 更新位置
      node.x += node.vx
      node.y += node.vy
      
      // 边界约束（软约束，避免节点超出画布）
      const margin = 50
      if (node.x < margin) {
        node.x = margin + (margin - node.x) * 0.1
        node.vx *= 0.5
      } else if (node.x > canvasWidth - margin) {
        node.x = canvasWidth - margin - (node.x - (canvasWidth - margin)) * 0.1
        node.vx *= 0.5
      }
      
      if (node.y < margin) {
        node.y = margin + (margin - node.y) * 0.1
        node.vy *= 0.5
      } else if (node.y > canvasHeight - margin) {
        node.y = canvasHeight - margin - (node.y - (canvasHeight - margin)) * 0.1
        node.vy *= 0.5
      }
    })
  }

  /**
   * 将聚焦节点移到中心
   */
  centerFocusedNode(nodeData, focusNode, centerX, centerY) {
    const focusedNodeData = nodeData.find(n => n.id === focusNode.id)
    if (!focusedNodeData) return
    
    const offsetX = centerX - focusedNodeData.x
    const offsetY = centerY - focusedNodeData.y
    
    // 所有节点一起移动，保持相对位置不变
    nodeData.forEach(node => {
      node.x += offsetX
      node.y += offsetY
    })
  }

  /**
   * 更新配置
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options }
  }
}