/**
 * 布局引擎 - 使用策略模式支持多种布局算法
 */
export class LayoutEngine {
  constructor() {
    this.layouts = new Map()
    this.currentLayout = 'radial'
  }

  /**
   * 注册布局算法
   * @param {string} name - 布局名称
   * @param {class} layoutClass - 布局类
   */
  register(name, layoutClass) {
    this.layouts.set(name, new layoutClass())
  }

  /**
   * 计算节点位置
   * @param {Array} nodes - 节点数组
   * @param {Array} edges - 边数组
   * @param {Object} focusNode - 聚焦节点
   * @param {string} layoutName - 布局名称
   * @returns {Map} 节点位置映射 (nodeId -> {x, y})
   */
  calculate(nodes, edges, focusNode, layoutName = this.currentLayout) {
    const layout = this.layouts.get(layoutName)
    if (!layout) {
      throw new Error(`Layout "${layoutName}" not found`)
    }
    return layout.calculate(nodes, edges, focusNode)
  }

  /**
   * 切换布局算法
   * @param {string} layoutName - 布局名称
   */
  switch(layoutName) {
    if (!this.layouts.has(layoutName)) {
      throw new Error(`Layout "${layoutName}" not registered`)
    }
    this.currentLayout = layoutName
  }

  /**
   * 获取已注册的布局列表
   * @returns {Array} 布局名称数组
   */
  getAvailableLayouts() {
    return Array.from(this.layouts.keys())
  }
}

