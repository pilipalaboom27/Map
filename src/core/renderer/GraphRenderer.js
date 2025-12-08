import * as d3 from 'd3'

/**
 * 图渲染器 - 封装 SVG 渲染逻辑
 */
export class GraphRenderer {
  constructor(svgElement) {
    this.svg = d3.select(svgElement)
    this.layers = null
    this.nodeElements = null
  }

  /**
   * 初始化图层
   * @param {d3.Selection} mainGroup - 可选的主图形组，如果提供则使用它，否则创建新的
   */
  initLayers(mainGroup = null) {
    // 始终添加渐变定义（确保只添加一次）
    if (!this.gradientsAdded) {
      this.addGradients()
      this.gradientsAdded = true
    }

    // 使用提供的mainGroup或创建新的根组
    const g = mainGroup || this.svg.append('g').attr('class', 'graph-root')

    // 创建图层（顺序决定z-index）
    this.layers = {
      edges: g.append('g').attr('class', 'edges-layer'),
      nodes: g.append('g').attr('class', 'nodes-layer'),
      labels: g.append('g').attr('class', 'labels-layer')
    }

    return g
  }

  /**
   * 添加渐变定义
   */
  addGradients() {
    const defs = this.svg.append('defs')

    // 节点渐变 - 主色
    defs.append('linearGradient')
      .attr('id', 'nodeGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#667eea' },
        { offset: '100%', color: '#764ba2' }
      ])
      .enter()
      .append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)

    // 节点渐变 - 次要色
    defs.append('linearGradient')
      .attr('id', 'nodeSecondaryGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#f093fb' },
        { offset: '100%', color: '#f5576c' }
      ])
      .enter()
      .append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)

    // 节点渐变 - 三级色
    defs.append('linearGradient')
      .attr('id', 'nodeTertiaryGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#4facfe' },
        { offset: '100%', color: '#00f2fe' }
      ])
      .enter()
      .append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)

    // 这里原来定义过箭头 marker，但为了让连线变成无箭头的普通线条，已移除
  }



  /**
   * 渲染节点
   * @param {Array} nodes - 节点数组
   * @param {Object} options - 渲染选项
   */
  renderNodes(nodes, options = {}) {
    if (!this.layers) {
      throw new Error('Layers not initialized. Call initLayers() first.')
    }

    const {
      onClick = null,
      onMouseOver = null,
      onMouseOut = null,
      focusedNodeId = null,
      onNodeDrag = null
    } = options

    this.nodeElements = this.layers.nodes
      .selectAll('g.node')
      .data(nodes, d => d.id)
      .join(
        enter => this.createNodeGroup(enter, onClick, onMouseOver, onMouseOut, focusedNodeId, onNodeDrag),
        update => this.updateNodeGroup(update, focusedNodeId),
        exit => exit.transition().duration(200).style('opacity', 0).remove()
      )

    // 初始化拖拽功能
    if (onNodeDrag) {
      this.initDrag(onNodeDrag)
    }

    return this.nodeElements
  }



  /**
   * 初始化拖拽功能
   */
  initDrag(onNodeDrag) {
    if (!this.nodeElements) return

    const dragHandler = d3.drag()
      .on('start', (event, d) => {
        d3.select(event.currentTarget)
          .style('cursor', 'grabbing')
          .style('filter', 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))')
        
        // 禁用其他事件
        event.sourceEvent.stopPropagation()
      })
      .on('drag', (event, d) => {
        // 更新节点位置
        d.x = event.x
        d.y = event.y
        
        // 应用变换
        d3.select(event.currentTarget)
          .attr('transform', `translate(${d.x}, ${d.y})`)
        
        // 通知外部拖拽事件
        if (onNodeDrag) {
          onNodeDrag(d)
        }
      })
      .on('end', (event, d) => {
        d3.select(event.currentTarget)
          .style('cursor', 'pointer')
          .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))')
      })

    // 应用拖拽行为
    this.nodeElements.call(dragHandler)
  }

  /**
   * 创建节点组（enter selection）
   */
  createNodeGroup(enter, onClick, onMouseOver, onMouseOut, focusedNodeId, onNodeDrag) {
    const g = enter.append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0})`)
      .style('opacity', 0)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))')

    // 添加事件监听
    if (onClick) g.on('click', (event, d) => onClick(event, d))
    if (onMouseOver) g.on('mouseover', (event, d) => this.handleMouseOver(event, d))
    if (onMouseOut) g.on('mouseout', (event, d) => this.handleMouseOut(event, d))

    // 添加节点背景圆（可选）
    // g.append('circle')
    //   .attr('r', d => Math.max(this.getNodeWidth(d, focusedNodeId), this.getNodeHeight(d, focusedNodeId)) / 2 + 5)
    //   .attr('fill', 'rgba(255, 255, 255, 0.3)')
    //   .attr('filter', 'blur(10px)')

    // 添加矩形
    const rect = g.append('rect')
      .attr('width', d => this.getNodeWidth(d, focusedNodeId))
      .attr('height', d => this.getNodeHeight(d, focusedNodeId))
      .attr('x', d => -this.getNodeWidth(d, focusedNodeId) / 2)
      .attr('y', d => -this.getNodeHeight(d, focusedNodeId) / 2)
      .attr('rx', 16)
      .attr('ry', 16)
      .attr('fill', 'transparent') // 背景设为透明
      .attr('stroke', '#ffffff') // 保持白色边框，确保节点可见
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    // 添加文本
    const text = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', d => this.getNodeFontSize(d, focusedNodeId))
      .attr('font-weight', 'bold')
      .attr('font-family', 'Inter, -apple-system, BlinkMacSystemFont, sans-serif')
      .attr('letter-spacing', '0.5px')
      .text(d => d.topic)
      // 移除 pointer-events: none，确保文本区域也能触发节点事件
      .style('pointer-events', 'auto')

    // 入场动画
    g.transition()
      .duration(600)
      .style('opacity', 1)
      .attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0}) scale(1)`)

    rect.transition()
      .duration(600)
      .attr('rx', 16)
      .attr('ry', 16)

    return g
  }

  /**
   * 更新节点组（update selection）
   */
  updateNodeGroup(update, focusedNodeId) {
    // 更新位置
    update
      .transition().duration(500)
      .attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0})`)

    // 更新矩形
    update.select('rect')
      .transition().duration(500)
      .attr('width', d => this.getNodeWidth(d, focusedNodeId))
      .attr('height', d => this.getNodeHeight(d, focusedNodeId))
      .attr('x', d => -this.getNodeWidth(d, focusedNodeId) / 2)
      .attr('y', d => -this.getNodeHeight(d, focusedNodeId) / 2)

    // 更新文本
    update.select('text')
      .transition().duration(500)
      .attr('font-size', d => this.getNodeFontSize(d, focusedNodeId))

    return update
  }

  /**
   * 处理鼠标悬停
   */
  handleMouseOver(event, d) {
    const g = d3.select(event.currentTarget)
    
    // 节点放大
    g.transition().duration(200)
      .attr('transform', `translate(${d.x}, ${d.y}) scale(1.1)`)
    
    // 提高节点阴影
    g.style('filter', 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))')
    
    // 提高边框亮度
    g.select('rect')
      .transition().duration(200)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
  }

  /**
   * 处理鼠标离开
   */
  handleMouseOut(event, d) {
    const g = d3.select(event.currentTarget)
    
    // 恢复节点大小
    g.transition().duration(200)
      .attr('transform', `translate(${d.x}, ${d.y}) scale(1)`)
    
    // 恢复阴影
    g.style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))')
    
    // 恢复边框
    g.select('rect')
      .transition().duration(200)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
  }

  /**
   * 获取节点位置
   */
  getNodePosition(nodes, nodeId) {
    const node = nodes.find(n => n.id === nodeId)
    return { x: node?.x ?? 0, y: node?.y ?? 0 }
  }

  /**
   * 获取节点宽度（聚焦节点放大）
   */
  getNodeWidth(node, focusedNodeId) {
    const baseWidth = node.width || 120
    return node.id === focusedNodeId ? baseWidth * 1.5 : baseWidth
  }

  /**
   * 获取节点高度（聚焦节点放大）
   */
  getNodeHeight(node, focusedNodeId) {
    const baseHeight = node.height || 60
    return node.id === focusedNodeId ? baseHeight * 1.5 : baseHeight
  }

  /**
   * 获取节点字体大小（聚焦节点更大）
   */
  getNodeFontSize(node, focusedNodeId) {
    return node.id === focusedNodeId ? '20px' : '14px'
  }

  /**
   * 获取根组（用于缩放/平移）
   */
  getRootGroup() {
    return this.svg.select('.graph-root')
  }
}

