import * as d3 from 'd3'

/**
 * 图渲染器 - 封装 SVG 渲染逻辑
 */
export class GraphRenderer {
  constructor(svgElement) {
    this.svg = d3.select(svgElement)
    this.layers = null
    this.edgeElements = null
    this.nodeElements = null
  }

  /**
   * 初始化图层
   */
  initLayers() {
    // 清除现有内容
    this.svg.selectAll('*').remove()

    // 创建根组
    const g = this.svg.append('g').attr('class', 'graph-root')

    // 创建图层（顺序决定z-index）
    this.layers = {
      edges: g.append('g').attr('class', 'edges-layer'),
      nodes: g.append('g').attr('class', 'nodes-layer'),
      labels: g.append('g').attr('class', 'labels-layer')
    }

    return g
  }

  /**
   * 渲染边/连接线
   * @param {Array} edges - 边数组
   * @param {Array} nodes - 节点数组（用于获取位置）
   */
  renderEdges(edges, nodes) {
    if (!this.layers) {
      throw new Error('Layers not initialized. Call initLayers() first.')
    }

    this.edgeElements = this.layers.edges
      .selectAll('line')
      .data(edges, d => `${d.from}-${d.to}`)
      .join(
        enter => enter.append('line')
          .attr('class', 'edge')
          .attr('stroke', d => d.color || '#10b981')
          .attr('stroke-width', d => d.width || 4)
          .attr('stroke-opacity', 0)
          .attr('stroke-linecap', 'round')
          .attr('marker-end', d => d.arrow !== false ? 'url(#arrowhead)' : null)
          .attr('x1', d => this.getNodePosition(nodes, d.from).x)
          .attr('y1', d => this.getNodePosition(nodes, d.from).y)
          .attr('x2', d => this.getNodePosition(nodes, d.to).x)
          .attr('y2', d => this.getNodePosition(nodes, d.to).y)
          .call(enter => enter.transition().duration(300).attr('stroke-opacity', 1)),
        update => update
          .attr('x1', d => this.getNodePosition(nodes, d.from).x)
          .attr('y1', d => this.getNodePosition(nodes, d.from).y)
          .attr('x2', d => this.getNodePosition(nodes, d.to).x)
          .attr('y2', d => this.getNodePosition(nodes, d.to).y),
        exit => exit.transition().duration(200).attr('stroke-opacity', 0).remove()
      )

    return this.edgeElements
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
      focusedNodeId = null
    } = options

    this.nodeElements = this.layers.nodes
      .selectAll('g.node')
      .data(nodes, d => d.id)
      .join(
        enter => this.createNodeGroup(enter, onClick, onMouseOver, onMouseOut, focusedNodeId),
        update => this.updateNodeGroup(update, focusedNodeId),
        exit => exit.transition().duration(200).style('opacity', 0).remove()
      )

    return this.nodeElements
  }

  /**
   * 创建节点组（enter selection）
   */
  createNodeGroup(enter, onClick, onMouseOver, onMouseOut, focusedNodeId) {
    const g = enter.append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0})`)
      .style('opacity', 0)

    // 添加事件监听
    if (onClick) g.on('click', (event, d) => onClick(event, d))
    if (onMouseOver) g.on('mouseover', (event, d) => onMouseOver(event, d))
    if (onMouseOut) g.on('mouseout', (event, d) => onMouseOut(event, d))

    // 添加矩形
    g.append('rect')
      .attr('width', d => this.getNodeWidth(d, focusedNodeId))
      .attr('height', d => this.getNodeHeight(d, focusedNodeId))
      .attr('x', d => -this.getNodeWidth(d, focusedNodeId) / 2)
      .attr('y', d => -this.getNodeHeight(d, focusedNodeId) / 2)
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', d => d.color || '#8b5cf6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // 添加文本
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', d => this.getNodeFontSize(d, focusedNodeId))
      .attr('font-weight', 'bold')
      .text(d => d.topic)

    // 入场动画
    g.transition()
      .duration(400)
      .style('opacity', 1)

    return g
  }

  /**
   * 更新节点组（update selection）
   */
  updateNodeGroup(update, focusedNodeId) {
    // 更新位置
    update
      .attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0})`)

    // 更新矩形
    update.select('rect')
      .attr('width', d => this.getNodeWidth(d, focusedNodeId))
      .attr('height', d => this.getNodeHeight(d, focusedNodeId))
      .attr('x', d => -this.getNodeWidth(d, focusedNodeId) / 2)
      .attr('y', d => -this.getNodeHeight(d, focusedNodeId) / 2)

    // 更新文本
    update.select('text')
      .attr('font-size', d => this.getNodeFontSize(d, focusedNodeId))

    return update
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
   * 更新边的位置（用于动画过程中）
   */
  updateEdgePositions(nodes) {
    if (this.edgeElements) {
      this.edgeElements
        .attr('x1', d => this.getNodePosition(nodes, d.from).x)
        .attr('y1', d => this.getNodePosition(nodes, d.from).y)
        .attr('x2', d => this.getNodePosition(nodes, d.to).x)
        .attr('y2', d => this.getNodePosition(nodes, d.to).y)
    }
  }

  /**
   * 获取根组（用于缩放/平移）
   */
  getRootGroup() {
    return this.svg.select('.graph-root')
  }
}

