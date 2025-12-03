/**
 * 环形布局 - 节点沿圆形或多个同心圆排列
 */
export class CircularLayout {
  constructor(options = {}) {
    this.options = {
      canvasWidth: 1200,
      canvasHeight: 800,
      baseRadius: 250,        // 基础半径
      radiusStep: 100,        // 多层圆的半径增量
      startAngle: -Math.PI / 2, // 起始角度（从正上方开始）
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

    if (!focusNode) {
      // 没有聚焦节点，所有节点单圆排列
      this.arrangeInSingleCircle(nodes, positions, centerX, centerY)
    } else {
      // 有聚焦节点，同心圆排列
      this.arrangeInConcentricCircles(nodes, edges, focusNode, positions, centerX, centerY)
    }

    return positions
  }

  /**
   * 单圆排列（所有节点）
   */
  arrangeInSingleCircle(nodes, positions, centerX, centerY) {
    const { baseRadius, startAngle } = this.options
    const angleStep = (2 * Math.PI) / nodes.length

    nodes.forEach((node, index) => {
      const angle = startAngle + angleStep * index
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * baseRadius,
        y: centerY + Math.sin(angle) * baseRadius
      })
    })
  }

  /**
   * 同心圆排列（按层级）
   */
  arrangeInConcentricCircles(nodes, edges, focusNode, positions, centerX, centerY) {
    const { baseRadius, radiusStep, startAngle } = this.options
    
    // 聚焦节点在中心
    positions.set(focusNode.id, { x: centerX, y: centerY })

    // 按层级分组
    const levels = new Map()
    
    // 第1圈：父节点
    if (focusNode.parentId) {
      const parent = nodes.find(n => n.id === focusNode.parentId)
      if (parent) {
        levels.set(1, [parent])
      }
    }

    // 第2圈：子节点
    const children = nodes.filter(n => n.parentId === focusNode.id)
    if (children.length > 0) {
      levels.set(2, children)
    }

    // 第3圈：孙节点
    const grandchildren = []
    children.forEach(child => {
      const childChildren = nodes.filter(n => n.parentId === child.id)
      grandchildren.push(...childChildren)
    })
    if (grandchildren.length > 0) {
      levels.set(3, grandchildren)
    }

    // 为每一圈分配位置
    levels.forEach((nodesInLevel, level) => {
      const radius = baseRadius + (level - 1) * radiusStep
      const angleStep = (2 * Math.PI) / nodesInLevel.length

      nodesInLevel.forEach((node, index) => {
        const angle = startAngle + angleStep * index
        positions.set(node.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        })
      })
    })
  }

  /**
   * 螺旋排列（可选的高级布局）
   */
  arrangeInSpiral(nodes, positions, centerX, centerY) {
    const { baseRadius, startAngle } = this.options
    const spiralGrowth = 15 // 螺旋增长速率

    nodes.forEach((node, index) => {
      const angle = startAngle + (index / nodes.length) * 4 * Math.PI
      const radius = baseRadius + spiralGrowth * index
      
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      })
    })
  }

  /**
   * 更新配置
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options }
  }
}

