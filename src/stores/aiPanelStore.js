import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useGraphStore } from './graphStore'
import { useLogger } from '@/core/logger'

const logger = useLogger('AIPanelStore')

export const useAIPanelStore = defineStore('aiPanel', () => {
  // 状态
  const visible = ref(false)
  const currentNode = ref(null)
  const messages = ref([])
  const loading = ref(false)

  // 计算属性
  const hasMessages = computed(() => messages.value.length > 0)
  const nodeInfo = computed(() => {
    if (!currentNode.value) return {
      summary: '',
      conceptsCount: 0
    }
    return {
      summary: currentNode.value.knowledge?.summary || currentNode.value.description || '',
      conceptsCount: currentNode.value.knowledge?.concepts?.length || 0
    }
  })

  // 方法：打开面板并设置节点
  const open = (node) => {
    if (!node) {
      logger.warn('尝试打开 AI 面板但未提供节点')
      return
    }
    
    currentNode.value = node
    visible.value = true
    
    // 加载该节点的对话历史
    loadConversationHistory(node.id)
    
    logger.debug('AI 面板已打开，节点:', node.topic)
  }

  // 方法：打开最新聚焦的节点或作为通用 AI 助手
  const openLatestOrHint = () => {
    const graphStore = useGraphStore()
    
    if (graphStore.focusedNode) {
      // 如果有聚焦节点，使用该节点
      open(graphStore.focusedNode)
    } else if (currentNode.value) {
      // 如果有之前的节点，继续使用
      visible.value = true
      logger.debug('AI 面板已打开，使用上次节点:', currentNode.value.topic)
    } else {
      // 没有节点时，作为通用 AI 助手打开
      currentNode.value = null
      visible.value = true
      // 加载通用对话历史
      loadConversationHistory('general')
      logger.debug('AI 面板已打开，通用助手模式')
    }
  }

  // 方法：关闭面板
  const close = () => {
    visible.value = false
    logger.debug('AI 面板已关闭')
  }

  // 方法：切换显示状态
  const toggle = () => {
    if (visible.value) {
      close()
    } else {
      openLatestOrHint()
    }
  }

  // 方法：添加消息
  const addMessage = (role, content, timestamp = Date.now(), model = null) => {
    messages.value.push({
      role,
      content,
      timestamp,
      model
    })
    
    // 限制消息数量，最多保留 50 条
    if (messages.value.length > 50) {
      messages.value = messages.value.slice(-50)
    }
    
    // 保存对话历史
    saveConversationHistory()
  }

  // 方法：清空对话历史
  const clearMessages = () => {
    if (!currentNode.value) return
    
    messages.value = []
    saveConversationHistory()
    logger.debug('对话历史已清空')
  }

  // 方法：设置加载状态
  const setLoading = (value) => {
    loading.value = value
  }

  // 方法：保存对话历史到 localStorage
  const saveConversationHistory = () => {
    try {
      const key = currentNode.value 
        ? `ai-conversation-${currentNode.value.id}`
        : 'ai-conversation-general'
      localStorage.setItem(key, JSON.stringify(messages.value))
      logger.debug('对话历史已保存，节点:', currentNode.value?.id || '通用')
    } catch (error) {
      logger.warn('保存对话历史失败:', error)
    }
  }

  // 方法：加载对话历史
  const loadConversationHistory = (nodeId) => {
    try {
      const key = `ai-conversation-${nodeId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        messages.value = JSON.parse(saved)
        logger.debug('对话历史已加载，节点:', nodeId, '消息数:', messages.value.length)
      } else {
        messages.value = []
      }
    } catch (error) {
      logger.warn('加载对话历史失败:', error)
      messages.value = []
    }
  }

  // 方法：切换节点时加载对应的对话历史
  const switchNode = (node) => {
    if (!node) return
    
    // 保存当前节点的对话历史
    if (currentNode.value) {
      saveConversationHistory()
    }
    
    // 切换到新节点
    currentNode.value = node
    loadConversationHistory(node.id)
    
    logger.debug('已切换到节点:', node.topic)
  }

  return {
    // 状态
    visible,
    currentNode,
    messages,
    loading,
    
    // 计算属性
    hasMessages,
    nodeInfo,
    
    // 方法
    open,
    openLatestOrHint,
    close,
    toggle,
    addMessage,
    clearMessages,
    setLoading,
    saveConversationHistory,
    loadConversationHistory,
    switchNode
  }
})

