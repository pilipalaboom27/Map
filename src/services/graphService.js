/**
 * 图谱服务层
 * 封装节点操作和业务逻辑
 */

import { logger } from '@/core/logger.js'

/**
 * 节点操作服务
 */
export class GraphService {
  constructor(store) {
    this.store = store
  }

  /**
   * 添加主题节点
   * @param {string} topic - 主题名称
   */
  addTopic(topic) {
    if (!topic || !topic.trim()) {
      throw new Error('主题名称不能为空')
    }

    const node = this.store.addNode(topic.trim())
    this.store.setFocusedNode(node)
    
    logger.info('添加主题:', topic)
    logger.debug('当前节点数:', this.store.nodes.length, '可见节点数:', this.store.visibleNodes.length)
    
    return node
  }

  /**
   * 清空画布
   */
  clearCanvas() {
    this.store.clearAll()
    logger.info('画布已清空')
  }

  /**
   * 处理节点点击
   * @param {Object} node - 节点对象
   * @param {Function} onExpand - 展开回调
   */
  handleNodeClick(node, onExpand) {
    logger.debug('处理节点点击:', node.topic, 'ID:', node.id)
    logger.debug('当前聚焦节点:', this.store.focusedNode?.id)
    
    if (this.store.focusedNode && node.id === this.store.focusedNode.id) {
      // 如果点击的是当前聚焦节点，展开节点
      logger.debug('点击的是聚焦节点，开始展开')
      if (onExpand) {
        onExpand(node)
      }
    } else {
      // 否则聚焦节点
      this.store.setFocusedNode(node)
      logger.info('切换聚焦节点:', node.topic)
    }
  }

  /**
   * 更新节点
   * @param {string} nodeId - 节点ID
   * @param {Object} updates - 更新内容
   */
  updateNode(nodeId, updates) {
    this.store.updateNode(nodeId, updates)
    logger.debug('更新节点:', nodeId, updates)
  }

  /**
   * 删除节点
   * @param {string} nodeId - 节点ID
   */
  deleteNode(nodeId) {
    this.store.deleteNode(nodeId)
    logger.info('删除节点:', nodeId)
  }
}

/**
 * 创建图谱服务实例
 * @param {Object} store - GraphStore实例
 */
export function createGraphService(store) {
  return new GraphService(store)
}

