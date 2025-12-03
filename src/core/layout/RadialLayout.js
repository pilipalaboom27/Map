/**
 * 径向布局 - 聚焦节点在中心，父节点在上方，子节点圆形分布
 */
export class RadialLayout {
  constructor(options = {}) {
    this.options = {
      canvasWidth: 1200,
      canvasHeight: 800,
      parentDistance: 280,    // 父节点距离
      childrenRadius: 280,    // 子节点圆形半径
      startAngle: -Math.PI / 2, // 开始角度（从正上方）
      ...options
    }
  }

  /**
   * 计算节点位置
   * @param {Array} nodes - 所有节点
   * @param {Array} edges - 所有边
   * @param {Object} focusNode - 聚焦节点
   * @returns {Map} 节点位置映射
   */
  calculate(nodes, edges, focusNode) {
    const positions = new Map()
    const { canvasWidth, canvasHeight } = this.options
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    if (!focusNode) {
      // 没有聚焦节点，将所有根节点放在中心
      return this.calculateRootLayout(nodes, centerX, centerY)
    }

    // 聚焦节点在中心
    positions.set(focusNode.id, { x: centerX, y: centerY })

    // 计算父节点位置
    if (focusNode.parentId) {
      this.calculateParentPosition(nodes, focusNode, positions, centerX, centerY)
    }

    // 计算子节点位置
    this.calculateChildrenPositions(nodes, focusNode, positions, centerX, centerY)

    return positions
  }

  /**
   * 计算根节点布局
   */
  calculateRootLayout(nodes, centerX, centerY) {
    const positions = new Map()
    const rootNodes = nodes.filter(n => !n.parentId || n.level === 0)
    
    if (rootNodes.length === 1) {
      // 单个根节点，放在中心
      positions.set(rootNodes[0].id, { x: centerX, y: centerY })
    } else {
      // 多个根节点，圆形分布
      const radius = 200
      const angleStep = (2 * Math.PI) / rootNodes.length
      
      rootNodes.forEach((node, index) => {
        const angle = angleStep * index
        positions.set(node.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        })
      })
    }
    
    return positions
  }

  /**
   * 计算父节点位置
   */
  calculateParentPosition(nodes, focusNode, positions, centerX, centerY) {
    const parent = nodes.find(n => n.id === focusNode.parentId)
    if (parent) {
      positions.set(parent.id, {
        x: centerX,
        y: centerY - this.options.parentDistance
      })
    }
  }

  /**
   * 计算子节点位置（圆形分布）
   */
  calculateChildrenPositions(nodes, focusNode, positions, centerX, centerY) {
    const children = nodes.filter(n => n.parentId === focusNode.id)
    
    if (children.length === 0) return

    const { childrenRadius, startAngle } = this.options
    const angleStep = (2 * Math.PI) / children.length

    children.forEach((child, index) => {
      const angle = startAngle + angleStep * index
      positions.set(child.id, {
        x: centerX + Math.cos(angle) * childrenRadius,
        y: centerY + Math.sin(angle) * childrenRadius
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

