/**
 * 节点操作 Composable
 * 处理节点的增删改查操作
 */

import { ref } from 'vue'
import { useLogger } from '@/core/logger.js'
import { createGraphService } from '@/services/graphService.js'

/**
 * 节点操作 Composable
 * @param {Object} store - GraphStore实例
 */
export function useNodeOperations(store) {
  const logger = useLogger('NodeOperations')
  const graphService = createGraphService(store)
  const showEntityEditor = ref(false)
  const currentEditingEntity = ref(null)

  /**
   * 添加主题
   * @param {string} topic - 主题名称
   */
  const addTopic = (topic) => {
    try {
      return graphService.addTopic(topic)
    } catch (error) {
      logger.error('添加主题失败:', error)
      throw error
    }
  }

  /**
   * 清空画布
   */
  const clearCanvas = () => {
    if (confirm('确定要清空画板吗？')) {
      graphService.clearCanvas()
    }
  }

  /**
   * 处理节点点击
   * @param {Object} node - 节点对象
   * @param {Function} onExpand - 展开回调
   */
  const handleNodeClick = (node, onExpand) => {
    graphService.handleNodeClick(node, onExpand)
  }

  /**
   * 处理实体保存
   * @param {Object} entityData - 实体数据
   */
  const handleEntitySave = (entityData) => {
    let nodeId = entityData.id
    
    if (entityData.id) {
      // 更新现有实体
      graphService.updateNode(entityData.id, {
        topic: entityData.name,
        description: entityData.description,
        type: entityData.type
      })
      logger.info('更新实体:', entityData.name)
    } else {
      // 创建新实体
      const node = graphService.addTopic(entityData.name)
      nodeId = node.id
      logger.info('创建实体:', entityData.name)
    }
    
    // 处理相关实体关系
    if (entityData.relatedEntities && entityData.relatedEntities.length > 0) {
      entityData.relatedEntities.forEach(relatedId => {
        store.addEdge(nodeId, relatedId)
      })
    }
    
    // 关闭编辑器
    showEntityEditor.value = false
    currentEditingEntity.value = null
  }

  /**
   * 打开实体编辑器
   * @param {Object} entity - 实体对象
   */
  const openEntityEditor = (entity = null) => {
    currentEditingEntity.value = entity
    showEntityEditor.value = true
  }

  /**
   * 关闭实体编辑器
   */
  const closeEntityEditor = () => {
    showEntityEditor.value = false
    currentEditingEntity.value = null
  }

  return {
    showEntityEditor,
    currentEditingEntity,
    addTopic,
    clearCanvas,
    handleNodeClick,
    handleEntitySave,
    openEntityEditor,
    closeEntityEditor
  }
}

