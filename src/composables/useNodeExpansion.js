/**
 * 节点展开 Composable
 * 处理节点展开逻辑和预缓存机制
 */

import { ref } from 'vue'
import { useLogger } from '@/core/logger.js'
import { fetchKnowledge, preloadKnowledge } from '@/services/api/index.js'

/**
 * 节点展开 Composable
 * @param {Object} store - GraphStore实例
 */
export function useNodeExpansion(store) {
  const logger = useLogger('NodeExpansion')
  const loading = ref(false)
  const preloadQueue = new Set() // 预加载队列，避免重复请求

  /**
   * 展开节点（获取子节点）
   * @param {Object} node - 节点对象
   */
  const expandNode = async (node) => {
    // 如果节点已经展开过，不再重复展开
    if (node.expanding || node.expanded) {
      logger.debug('节点已展开，跳过:', node.topic)
      return
    }
    
    // 检查是否有缓存
    if (node.cachedChildren) {
      logger.debug('使用缓存数据:', node.topic)
      const knowledge = node.cachedChildren
      store.updateNode(node.id, { knowledge, cachedChildren: null })
      addChildNodes(node, knowledge.concepts)
      store.updateNode(node.id, { expanded: true })
      // 已移除预加载
      return
    }
    
    store.updateNode(node.id, { expanding: true })
    loading.value = true
    
    try {
      logger.info('========== 开始展开节点 ==========')
      logger.debug('节点信息:', {
        topic: node.topic,
        id: node.id,
        level: node.level
      })
      
      // 用户主动请求，立即处理
      const knowledge = await fetchKnowledge(node.topic, node.knowledge)
      logger.info('API返回的知识数据:', {
        主题: knowledge.topic,
        概念数: knowledge.concepts?.length || 0
      })
      
      store.updateNode(node.id, { knowledge })
      
      // 基础知识判定：无概念或概念无效/占位，直接提示且不渲染子节点
      const summaryText = knowledge.summary || ''
      const concepts = knowledge.concepts || []
      const modelName = knowledge.model || ''
      const isSummaryBasic = summaryText.includes('已是基础知识') || summaryText.includes('基础知识')
      const isConceptsEmpty = concepts.length === 0
      const allConceptsInvalid = concepts.length > 0 && concepts.every(c => {
        const name = (c?.name || '').trim()
        if (!name) return true
        const lower = name.toLowerCase()
        return lower.includes('topic') || lower.includes('概念') || lower.startsWith('{') || lower.startsWith('\"{') || lower.startsWith('“{')
      })

      if (isSummaryBasic || isConceptsEmpty || allConceptsInvalid) {
        const msg = summaryText || '该主题已是基础知识，无需再拆分。'
        alert(`${msg}${modelName ? `（模型：${modelName}）` : ''}`)
        // 标记已展开但不添加子节点
        store.updateNode(node.id, { knowledge, expanded: true })
        return
      }

      if (knowledge.concepts && knowledge.concepts.length > 0) {
        logger.info(`解析到 ${knowledge.concepts.length} 个概念`)
        
        addChildNodes(node, knowledge.concepts)
        
        logger.info('========== 节点展开完成 ==========')
        logger.info(`当前总节点数: ${store.nodes.length}`)
        logger.info(`当前总边数: ${store.edges.length}`)
        
        // 标记节点为已展开
        store.updateNode(node.id, { expanded: true })
        
        // 预加载已取消
      } else {
        logger.warn('没有找到概念')
      }
    } catch (error) {
      logger.error('展开节点失败:', error)
      logger.error('错误堆栈:', error.stack)
      throw error
    } finally {
      store.updateNode(node.id, { expanding: false })
      loading.value = false
    }
  }

  /**
   * 添加子节点
   * @param {Object} parentNode - 父节点
   * @param {Array} concepts - 概念数组
   */
  const addChildNodes = (parentNode, concepts) => {
    const addedNodes = []
    
    concepts.forEach((concept, index) => {
      // 检查是否已存在同名节点
      const existingNode = store.nodes.find(n => n.topic === concept.name)
      if (!existingNode) {
        const childNode = store.addNode(
          concept.name,
          parentNode.id,
          concept.description
        )
        
        addedNodes.push(childNode)
        logger.debug(`${index + 1}. 添加节点: ${concept.name}`)
      } else {
        logger.debug(`${index + 1}. 节点已存在: ${concept.name}`)
      }
    })
    
    return addedNodes
  }

  return {
    loading,
    expandNode
  }
}

