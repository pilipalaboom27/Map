/**
 * 层次布局 - 按树状结构层次化展示，清晰显示父子关系
 */
export class HierarchicalLayout {
  constructor(options = {}) {
    this.options = {
      canvasWidth: 1200,
      canvasHeight: 800,
      levelHeight: 200,       // 层级间距
      nodeSpacing: 150,       // 同层级节点间距
      direction: 'vertical',  // 布局方向: vertical | horizontal
      ...options
    }
  }

  /**
   * 计算节点位置
   */
  calculate(nodes, edges, focusNode) {
    const positions = new Map()
    const { canvasWidth, canvasHeight, direction } = this.options

    if (nodes.length === 0) return positions

    // 构建层级结构
    const levels = this.buildLevels(nodes, focusNode)
    
    // 计算每层的位置
    if (direction === 'vertical') {
      this.calculateVerticalLayout(levels, positions, canvasWidth, canvasHeight)
    } else {
      this.calculateHorizontalLayout(levels, positions, canvasWidth, canvasHeight)
    }

    return positions
  }

  /**
   * 构建层级结构
   */
  buildLevels(nodes, focusNode) {
    const levels = new Map()
    
    if (!focusNode) {
      // 没有聚焦节点，从根节点开始
      const rootNodes = nodes.filter(n => !n.parentId || n.level === 0)
      rootNodes.forEach(node => {
        this.addNodeToLevel(levels, node, 0)
        this.addDescendants(levels, nodes, node.id, 1)
      })
    } else {
      // 有聚焦节点，以聚焦节点为中心层
      const centerLevel = 1
      this.addNodeToLevel(levels, focusNode, centerLevel)
      
      // 添加所有祖先节点（上一层及以上）
      let currentNode = focusNode
      let currentLevel = centerLevel - 1
      while (currentNode.parentId) {
        const parent = nodes.find(n => n.id === currentNode.parentId)
        if (!parent) break
        
        this.addNodeToLevel(levels, parent, currentLevel)
        
        // 移动到下一个父节点
        currentNode = parent
        currentLevel--
      }
      
      // 添加直接子节点（下一层）
      // 只添加直接子节点，不递归添加所有后代
      const directChildren = nodes.filter(n => n.parentId === focusNode.id)
      directChildren.forEach(child => {
        this.addNodeToLevel(levels, child, centerLevel + 1)
      })
    }

    return levels
  }

  /**
   * 添加节点到指定层级
   */
  addNodeToLevel(levels, node, level) {
    if (!levels.has(level)) {
      levels.set(level, [])
    }
    levels.get(level).push(node)
  }

  /**
   * 递归添加后代节点
   */
  addDescendants(levels, nodes, parentId, level) {
    const children = nodes.filter(n => n.parentId === parentId)
    children.forEach(child => {
      this.addNodeToLevel(levels, child, level)
      this.addDescendants(levels, nodes, child.id, level + 1)
    })
  }

  /**
   * 计算垂直布局（从上到下）
   */
  calculateVerticalLayout(levels, positions, canvasWidth, canvasHeight) {
    const { levelHeight, nodeSpacing } = this.options
    
    // 计算总高度和起始Y
    const levelCount = levels.size
    const totalHeight = levelCount * levelHeight
    const startY = (canvasHeight - totalHeight) / 2 + levelHeight / 2

    let levelIndex = 0
    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b)

    sortedLevels.forEach(levelKey => {
      const nodesInLevel = levels.get(levelKey)
      const levelY = startY + levelIndex * levelHeight
      
      // 计算该层的宽度和起始X
      const levelWidth = nodesInLevel.length * nodeSpacing
      const startX = (canvasWidth - levelWidth) / 2 + nodeSpacing / 2

      nodesInLevel.forEach((node, nodeIndex) => {
        const x = startX + nodeIndex * nodeSpacing
        positions.set(node.id, { x, y: levelY })
      })

      levelIndex++
    })
  }

  /**
   * 计算水平布局（从左到右）
   */
  calculateHorizontalLayout(levels, positions, canvasWidth, canvasHeight) {
    const { levelHeight, nodeSpacing } = this.options
    
    // 计算总宽度和起始X
    const levelCount = levels.size
    const totalWidth = levelCount * levelHeight
    const startX = (canvasWidth - totalWidth) / 2 + levelHeight / 2

    let levelIndex = 0
    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b)

    sortedLevels.forEach(levelKey => {
      const nodesInLevel = levels.get(levelKey)
      const levelX = startX + levelIndex * levelHeight
      
      // 计算该层的高度和起始Y
      const levelHeight = nodesInLevel.length * nodeSpacing
      const startY = (canvasHeight - levelHeight) / 2 + nodeSpacing / 2

      nodesInLevel.forEach((node, nodeIndex) => {
        const y = startY + nodeIndex * nodeSpacing
        positions.set(node.id, { x: levelX, y })
      })

      levelIndex++
    })
  }

  /**
   * 更新配置
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options }
  }
}

