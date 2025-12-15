<template>
  <Transition name="fade">
    <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
      <div class="dialog-container" @click.stop>
        <!-- 对话框头部 -->
        <div class="dialog-header">
          <div class="header-title">
            <span class="icon">🤖</span>
            <span>AI 深度追问 - {{ node?.topic || '节点' }}</span>
          </div>
          <button class="close-btn" @click="handleClose" title="关闭">×</button>
        </div>

        <!-- 节点上下文信息卡片 -->
        <div class="context-card" v-if="node">
          <div class="context-title">📋 上下文信息</div>
          <div class="context-content">
            <div class="context-item" v-if="nodeInfo.summary">
              <span class="context-label">概述：</span>
              <span class="context-value">{{ nodeInfo.summary.substring(0, 100) }}{{ nodeInfo.summary.length > 100 ? '...' : '' }}</span>
            </div>
            <div class="context-item" v-if="nodeInfo.conceptsCount > 0">
              <span class="context-label">概念数：</span>
              <span class="context-value">{{ nodeInfo.conceptsCount }} 个</span>
            </div>
          </div>
        </div>

        <!-- 对话历史区域 -->
        <div class="dialog-content">
          <div class="messages-container" ref="messagesContainer">
            <!-- 空状态 -->
            <div v-if="messages.length === 0" class="empty-messages">
              <div class="empty-icon">💬</div>
              <div class="empty-text">开始与 AI 对话，深入了解「{{ node?.topic }}」</div>
              <div class="empty-hint">输入你的问题，AI 将基于节点上下文回答</div>
            </div>

            <!-- 消息列表 -->
            <div 
              v-for="(message, index) in messages" 
              :key="index"
              class="message-item"
              :class="message.role"
            >
              <div class="message-avatar">
                <span v-if="message.role === 'user'">👤</span>
                <span v-else>🤖</span>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>

            <!-- 加载指示器 -->
            <div v-if="loading" class="message-item assistant loading">
              <div class="message-avatar">🤖</div>
              <div class="message-content">
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <div class="input-toolbar">
            <button 
              class="toolbar-btn" 
              @click="handleClearHistory"
              :disabled="messages.length === 0"
              title="清空对话历史"
            >
              🗑️ 清空
            </button>
            <button 
              class="toolbar-btn" 
              @click="handleExport"
              :disabled="messages.length === 0"
              title="导出对话"
            >
              📥 导出
            </button>
            <div class="toolbar-info" v-if="messages.length > 0">
              共 {{ messages.length }} 条消息
            </div>
          </div>
          <div class="input-wrapper">
            <textarea
              v-model="inputText"
              @keydown="handleKeyDown"
              placeholder="输入你的问题... (Ctrl+Enter 发送)"
              class="input-textarea"
              rows="3"
              :disabled="loading"
            ></textarea>
            <button 
              class="send-btn"
              @click="handleSend"
              :disabled="!canSend"
              title="发送 (Ctrl+Enter)"
            >
              <span v-if="loading">⏳</span>
              <span v-else>📤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { askAI } from '@/services/api/index.js'
import { useLogger } from '@/core/logger.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  node: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'close'])

const logger = useLogger('AIDialog')

// 状态管理
const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const messagesContainer = ref(null)

// 本地存储键名
const getStorageKey = () => {
  return props.node ? `ai_dialog_${props.node.id}` : 'ai_dialog_default'
}

// 计算属性
const nodeInfo = computed(() => {
  if (!props.node) return {}
  return {
    summary: props.node.knowledge?.summary || props.node.description || '',
    conceptsCount: props.node.knowledge?.concepts?.length || 0
  }
})

const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !loading.value
})

// 方法
const handleClose = () => {
  // 保存对话历史到本地存储
  saveConversationHistory()
  emit('update:visible', false)
  emit('close')
}

// 保存对话历史到本地存储
const saveConversationHistory = () => {
  try {
    const key = getStorageKey()
    if (messages.value.length > 0) {
      localStorage.setItem(key, JSON.stringify(messages.value))
      logger.debug('对话历史已保存:', messages.value.length, '条消息')
    }
  } catch (error) {
    logger.warn('保存对话历史失败:', error)
  }
}

// 从本地存储加载对话历史
const loadConversationHistory = () => {
  try {
    const key = getStorageKey()
    const saved = localStorage.getItem(key)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        messages.value = parsed
        logger.debug('对话历史已加载:', parsed.length, '条消息')
        return true
      }
    }
  } catch (error) {
    logger.warn('加载对话历史失败:', error)
  }
  return false
}

// 清除本地存储的对话历史
const clearStoredHistory = () => {
  try {
    const key = getStorageKey()
    localStorage.removeItem(key)
    logger.debug('已清除本地存储的对话历史')
  } catch (error) {
    logger.warn('清除对话历史失败:', error)
  }
}

const handleSend = async () => {
  if (!canSend.value || !props.node) return

  const question = inputText.value.trim()
  if (!question) return

  // 添加用户消息
  const userMessage = {
    role: 'user',
    content: question,
    timestamp: Date.now()
  }
  messages.value.push(userMessage)
  inputText.value = ''

  // 滚动到底部
  await scrollToBottom()

  // 发送请求
  loading.value = true
  try {
    const context = {
      summary: props.node.knowledge?.summary || props.node.description || '',
      concepts: props.node.knowledge?.concepts || []
    }

    // 构建对话历史（只包含最近的消息）
    const conversationHistory = messages.value
      .filter(m => m.role === 'assistant' || m.role === 'user')
      .slice(-10) // 只保留最近10条消息
      .map(m => ({
        role: m.role,
        content: m.content
      }))

    logger.debug('发送 AI 追问请求:', {
      topic: props.node.topic,
      question: question.substring(0, 50),
      historyLength: conversationHistory.length
    })

    const response = await askAI(
      props.node.topic,
      context,
      question,
      conversationHistory
    )

    // 添加 AI 响应
    const aiMessage = {
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      model: response.model
    }
    messages.value.push(aiMessage)

    // 保存对话历史（限制最多保存最近20条消息）
    if (messages.value.length > 20) {
      messages.value = messages.value.slice(-20)
    }
    saveConversationHistory()

    // 滚动到底部
    await scrollToBottom()

    logger.debug('AI 追问响应成功')
  } catch (error) {
    logger.error('AI 追问失败:', error)
    
    // 添加错误消息
    const errorMessage = {
      role: 'assistant',
      content: `❌ 抱歉，获取回答时出现错误：${error.message || '未知错误'}`,
      timestamp: Date.now(),
      isError: true
    }
    messages.value.push(errorMessage)
    await scrollToBottom()
  } finally {
    loading.value = false
  }
}

const handleKeyDown = (event) => {
  // Ctrl+Enter 或 Cmd+Enter 发送
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSend()
  }
}

const handleClearHistory = () => {
  if (confirm('确定要清空对话历史吗？')) {
    messages.value = []
    clearStoredHistory()
  }
}

const handleExport = () => {
  if (messages.value.length === 0) return

  const exportText = messages.value.map(msg => {
    const role = msg.role === 'user' ? '用户' : 'AI'
    const time = formatTime(msg.timestamp)
    return `[${time}] ${role}: ${msg.content}`
  }).join('\n\n')

  const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `AI对话_${props.node?.topic || '节点'}_${new Date().getTime()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const formatMessage = (content) => {
  if (!content) return ''
  
  // 先处理代码块，避免代码块内的内容被其他规则处理
  const codeBlocks = []
  let html = content.replace(/```([\w]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const index = codeBlocks.length
    codeBlocks.push({ lang, code })
    return `__CODE_BLOCK_${index}__`
  })
  
  // 转义 HTML（但保留代码块标记）
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // 恢复代码块
  codeBlocks.forEach((block, index) => {
    const escapedCode = block.code
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
    html = html.replace(`__CODE_BLOCK_${index}__`, `<pre class="code-block"><code>${escapedCode}</code></pre>`)
  })
  
  // 行内代码（排除已经在代码块中的）
  html = html.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>')
  
  // 粗体 (**text** 或 __text__，但排除代码块标记）
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(?!CODE_BLOCK_)([^_]+)__/g, '<strong>$1</strong>')
  
  // 斜体 (*text* 或 _text_，但排除代码块标记和粗体）
  html = html.replace(/(?<!\*)\*(?!\*)([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_(?!_)([^_\n]+)_(?!_)/g, '<em>$1</em>')
  
  // 链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // 有序列表 (1. item)
  const lines = html.split('\n')
  let inList = false
  let listType = null
  const processedLines = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/)
    const unorderedMatch = line.match(/^[-*]\s+(.+)$/)
    
    if (orderedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList && listType === 'ul') {
          processedLines.push('</ul>')
        }
        processedLines.push('<ol>')
        inList = true
        listType = 'ol'
      }
      processedLines.push(`<li>${orderedMatch[2]}</li>`)
    } else if (unorderedMatch) {
      if (!inList || listType !== 'ul') {
        if (inList && listType === 'ol') {
          processedLines.push('</ol>')
        }
        processedLines.push('<ul>')
        inList = true
        listType = 'ul'
      }
      processedLines.push(`<li>${unorderedMatch[1]}</li>`)
    } else {
      if (inList) {
        processedLines.push(listType === 'ol' ? '</ol>' : '</ul>')
        inList = false
        listType = null
      }
      processedLines.push(line)
    }
  }
  
  if (inList) {
    processedLines.push(listType === 'ol' ? '</ol>' : '</ul>')
  }
  
  html = processedLines.join('\n')
  
  // 换行
  html = html.replace(/\n/g, '<br>')
  
  return html
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 监听对话框打开，加载历史记录并滚动到底部
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // 加载对话历史
      loadConversationHistory()
      nextTick(() => {
        scrollToBottom()
      })
    }
  }
)

// 监听节点变化，重新加载历史记录
watch(
  () => props.node?.id,
  (newNodeId, oldNodeId) => {
    if (newNodeId && newNodeId !== oldNodeId) {
      // 节点变化时，保存当前历史（如果有），然后加载新节点的历史
      if (oldNodeId && messages.value.length > 0) {
        saveConversationHistory()
      }
      messages.value = []
      loadConversationHistory()
    }
  }
)

// ESC 键关闭
const handleKeyDownGlobal = (event) => {
  if (event.key === 'Escape' && props.visible) {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDownGlobal)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDownGlobal)
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 10000;
  padding: 140px 30px 30px; /* 预留 header 空间，避免遮挡 */
  box-sizing: border-box;
}

.dialog-container {
  width: 100%;
  max-width: 900px;
  max-height: calc(100vh - 160px); /* 固定窗口大小，避免与 header 重叠 */
  background: rgba(2, 6, 23, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-left: 2px solid var(--primary-color);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  
  clip-path: polygon(
    0 0,
    100% 0,
    100% calc(100% - 20px),
    calc(100% - 20px) 100%,
    0 100%
  );
  
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  padding: 16px 24px;
  background: rgba(6, 182, 212, 0.1);
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-family);
  font-weight: 700;
  color: var(--primary-color);
  font-size: 18px;
  letter-spacing: 0.5px;
}

.header-title .icon {
  font-size: 24px;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.close-btn:hover {
  background: rgba(6, 182, 212, 0.2);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: scale(1.1);
}

.context-card {
  padding: 12px 24px;
  background: rgba(6, 182, 212, 0.05);
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
}

.context-title {
  font-family: var(--font-family);
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.context-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.context-item {
  font-family: var(--font-family);
  font-size: 13px;
  color: var(--text-secondary);
}

.context-label {
  color: var(--primary-color);
  font-weight: 600;
}

.context-value {
  color: var(--text-primary);
}

.dialog-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 300px;
  max-height: 400px;
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-family: var(--font-family);
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-hint {
  font-family: var(--font-family);
  font-size: 13px;
  color: var(--text-muted);
}

.message-item {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(6, 182, 212, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  background: rgba(139, 92, 246, 0.2);
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-item.user .message-content {
  text-align: right;
}

.message-text {
  padding: 12px 16px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 8px;
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  word-wrap: break-word;
}

.message-text :deep(strong) {
  font-weight: 700;
  color: var(--primary-color);
}

.message-text :deep(em) {
  font-style: italic;
  color: var(--text-secondary);
}

.message-text :deep(code.inline-code) {
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #22d3ee;
}

.message-text :deep(pre.code-block) {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
}

.message-text :deep(pre.code-block code) {
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #e2e8f0;
  display: block;
  white-space: pre;
}

.message-text :deep(ul), .message-text :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-text :deep(a) {
  color: var(--primary-color);
  text-decoration: underline;
  transition: color 0.2s;
}

.message-text :deep(a:hover) {
  color: #22d3ee;
}

.message-item.user .message-text {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.message-item.assistant.loading .message-text {
  background: transparent;
  border: none;
  padding: 0;
}

.message-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  font-family: var(--font-family);
}

.message-item.user .message-time {
  text-align: right;
}

.loading-dots {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-area {
  padding: 16px 24px;
  background: rgba(6, 182, 212, 0.05);
  border-top: 1px solid rgba(6, 182, 212, 0.2);
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.toolbar-btn {
  padding: 6px 12px;
  background: rgba(6, 182, 212, 0.2);
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 2px;
}

.toolbar-btn:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.3);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-info {
  font-family: var(--font-family);
  font-size: 12px;
  color: var(--text-muted);
  margin-left: auto;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-textarea {
  flex: 1;
  padding: 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-family: var(--font-family);
  font-size: 14px;
  color: var(--text-primary);
  resize: vertical;
  min-height: 60px;
  max-height: 150px;
}

.input-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 5px rgba(6, 182, 212, 0.3);
}

.input-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  width: 48px;
  height: 48px;
  background: var(--primary-color);
  border: none;
  border-radius: 4px;
  color: #000;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.send-btn:hover:not(:disabled) {
  background: #22d3ee;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 自定义滚动条 */
.dialog-content::-webkit-scrollbar {
  width: 8px;
}

.dialog-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.5);
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: rgba(6, 182, 212, 0.7);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-active .dialog-container,
.fade-leave-active .dialog-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-from .dialog-container,
.fade-leave-to .dialog-container {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .dialog-container {
    max-width: 100%;
    max-height: 95vh;
    margin: 10px;
  }
  
  .dialog-content {
    padding: 16px;
  }
  
  .message-content {
    max-width: 85%;
  }
}
</style>

