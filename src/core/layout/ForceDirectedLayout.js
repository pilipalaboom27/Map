/**
 * 力导向布局 - 节点根据关系自动分散，保持自然间距
 */
export class ForceDirectedLayout {
  constructor(options = {}) {
    this.options = {
      canvasWidth: 1200,
      canvasHeight: 800,
      linkDistance: 150,      // 连接线默认长度
      linkStrength: 0.5,      // 连接力强度
      chargeStrength: -300,   // 节点间排斥力
      centerStrength: 0.1,    // 中心引力
      iterations: 100,        // 模拟迭代次数
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

    // 初始化节点位置（随机或基于现有位置）
    const nodeData = nodes.map(node => ({
      id: node.id,
      x: node.x !== undefined ? node.x : centerX + (Math.random() - 0.5) * 400,
      y: node.y !== undefined ? node.y : centerY + (Math.random() - 0.5) * 400,
      vx: 0,
      vy: 0,
      isFocused: focusNode && node.id === focusNode.id
    }))

    // 构建节点索引
    const nodeIndex = new Map()
    nodeData.forEach((n, i) => nodeIndex.set(n.id, i))

    // 运行力导向模拟
    for (let iteration = 0; iteration < this.options.iterations; iteration++) {
      // 应用排斥力
      this.applyChargeForce(nodeData)

      // 应用连接力
      this.applyLinkForce(nodeData, edges, nodeIndex)

      // 应用中心引力
      this.applyCenterForce(nodeData, centerX, centerY)

      // 更新位置
      this.updatePositions(nodeData)

      // 降低速度
      const alpha = 1 - iteration / this.options.iterations
      nodeData.forEach(node => {
        node.vx *= 0.9 * alpha
        node.vy *= 0.9 * alpha
      })
    }

    // 如果有聚焦节点，将其移到中心
    if (focusNode) {
      const focusedNodeData = nodeData.find(n => n.id === focusNode.id)
      if (focusedNodeData) {
        const offsetX = centerX - focusedNodeData.x
        const offsetY = centerY - focusedNodeData.y
        
        // 所有节点一起移动
        nodeData.forEach(node => {
          node.x += offsetX
          node.y += offsetY
        })
      }
    }

    // 保存结果
    nodeData.forEach(node => {
      positions.set(node.id, { x: node.x, y: node.y })
    })

    return positions
  }

  /**
   * 应用排斥力（库仑力）
   */
  applyChargeForce(nodes) {
    const { chargeStrength } = this.options
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]
        
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const distSq = dx * dx + dy * dy
        
        if (distSq < 0.01) continue // 避免除零
        
        const dist = Math.sqrt(distSq)
        const force = chargeStrength / distSq
        
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        
        nodeA.vx -= fx
        nodeA.vy -= fy
        nodeB.vx += fx
        nodeB.vy += fy
      }
    }
  }

  /**
   * 应用连接力（弹簧力）
   */
  applyLinkForce(nodes, edges, nodeIndex) {
    const { linkDistance, linkStrength } = this.options
    
    edges.forEach(edge => {
      const sourceIdx = nodeIndex.get(edge.from)
      const targetIdx = nodeIndex.get(edge.to)
      
      if (sourceIdx === undefined || targetIdx === undefined) return
      
      const source = nodes[sourceIdx]
      const target = nodes[targetIdx]
      
      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 0.01) return
      
      const force = (dist - linkDistance) * linkStrength
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      
      source.vx += fx
      source.vy += fy
      target.vx -= fx
      target.vy -= fy
    })
  }

  /**
   * 应用中心引力
   */
  applyCenterForce(nodes, centerX, centerY) {
    const { centerStrength } = this.options
    
    nodes.forEach(node => {
      if (node.isFocused) return // 聚焦节点不受中心引力
      
      const dx = centerX - node.x
      const dy = centerY - node.y
      
      node.vx += dx * centerStrength
      node.vy += dy * centerStrength
    })
  }

  /**
   * 更新位置
   */
  updatePositions(nodes) {
    nodes.forEach(node => {
      node.x += node.vx
      node.y += node.vy
    })
  }

  /**
   * 更新配置
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options }
  }
}

