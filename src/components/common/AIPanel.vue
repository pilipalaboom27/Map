<template>
  <!-- 遮罩层（可选，较浅） -->
  <Transition name="fade">
    <div v-if="store.visible" class="panel-overlay" @click="handleClose"></div>
  </Transition>

  <!-- 侧栏面板 -->
  <Transition name="slide-right">
    <div v-if="store.visible" class="ai-panel" @click.stop>
      <!-- 头部 -->
      <div class="panel-header">
        <div class="header-title">
          <span class="icon">🤖</span>
          <span class="title-text">{{ store.currentNode ? 'AI 深度追问' : 'AI 助手' }}</span>
        </div>
        <button class="close-btn" @click="handleClose" title="关闭">×</button>
      </div>

      <!-- 节点信息 -->
      <div class="node-info" v-if="store.currentNode">
        <div class="node-topic">{{ store.currentNode.topic }}</div>
        <div class="context-items">
          <div class="context-item" v-if="store.nodeInfo.summary">
            <span class="label">概述：</span>
            <span class="value">{{ truncate(store.nodeInfo.summary, 80) }}</span>
          </div>
          <div class="context-item" v-if="store.nodeInfo.conceptsCount > 0">
            <span class="label">概念数：</span>
            <span class="value">{{ store.nodeInfo.conceptsCount }} 个</span>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer">
        <!-- 空状态 -->
        <div v-if="store.messages.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-text">开始对话</div>
          <div class="empty-hint">
            {{ store.currentNode ? '输入问题，AI 将基于节点上下文回答' : '输入问题，AI 将为你解答' }}
          </div>
        </div>

        <!-- 消息列表 -->
        <div 
          v-for="(message, index) in store.messages" 
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
        <div v-if="store.loading" class="message-item assistant loading">
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

      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-toolbar">
          <button 
            class="toolbar-btn" 
            @click="handleClear"
            :disabled="store.messages.length === 0"
            title="清空对话"
          >
            🗑️
          </button>
          <button 
            class="toolbar-btn" 
            @click="handleExport"
            :disabled="store.messages.length === 0"
            title="导出对话"
          >
            📥
          </button>
          <div class="message-count" v-if="store.messages.length > 0">
            {{ store.messages.length }} 条
          </div>
        </div>
        <div class="input-wrapper">
          <textarea
            v-model="inputText"
            @keydown="handleKeyDown"
            placeholder="输入问题 (Ctrl+Enter 发送)"
            class="input-textarea"
            rows="3"
            :disabled="store.loading"
          ></textarea>
          <button 
            class="send-btn"
            @click="handleSend"
            :disabled="!canSend"
            title="发送"
          >
            <span v-if="store.loading">⏳</span>
            <span v-else>📤</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useAIPanelStore } from '@/stores/aiPanelStore'
import { askAI } from '@/services/api/index.js'
import { useLogger } from '@/core/logger.js'

const store = useAIPanelStore()
const logger = useLogger('AIPanel')

const inputText = ref('')
const messagesContainer = ref(null)

// 计算属性
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !store.loading
})

// 方法
const handleClose = () => {
  store.close()
}

const handleClear = () => {
  if (confirm('确定要清空对话历史吗？')) {
    store.clearMessages()
  }
}

const handleExport = () => {
  if (store.messages.length === 0) return

  const exportText = store.messages.map(msg => {
    const role = msg.role === 'user' ? '用户' : 'AI'
    const time = formatTime(msg.timestamp)
    return `[${time}] ${role}: ${msg.content}`
  }).join('\n\n')

  const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `AI对话_${store.currentNode?.topic || '节点'}_${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const handleSend = async () => {
  if (!canSend.value) return

  const question = inputText.value.trim()
  if (!question) return

  // 添加用户消息
  store.addMessage('user', question)
  inputText.value = ''

  // 滚动到底部
  await scrollToBottom()

  // 发送请求
  store.setLoading(true)
  try {
    // 构建上下文（如果有节点）
    const context = store.currentNode ? {
      summary: store.currentNode.knowledge?.summary || store.currentNode.description || '',
      concepts: store.currentNode.knowledge?.concepts || []
    } : {
      summary: '',
      concepts: []
    }

    // 构建对话历史
    const conversationHistory = store.messages
      .filter(m => m.role === 'assistant' || m.role === 'user')
      .slice(-10)
      .map(m => ({
        role: m.role,
        content: m.content
      }))

    logger.debug('发送 AI 追问请求:', {
      topic: store.currentNode?.topic || '通用助手',
      question: question.substring(0, 50),
      historyLength: conversationHistory.length
    })

    const response = await askAI(
      store.currentNode?.topic || '通用知识助手',
      context,
      question,
      conversationHistory
    )

    // 添加 AI 响应
    store.addMessage('assistant', response.content, Date.now(), response.model)

    // 滚动到底部
    await scrollToBottom()

    logger.debug('AI 追问响应成功')
  } catch (error) {
    logger.error('AI 追问失败:', error)
    
    // 添加错误消息
    store.addMessage('assistant', `❌ 抱歉，获取回答时出现错误：${error.message || '未知错误'}`)
    await scrollToBottom()
  } finally {
    store.setLoading(false)
  }
}

const handleKeyDown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    handleSend()
  }
}

const truncate = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatMessage = (content) => {
  if (!content) return ''
  
  // 代码块处理
  const codeBlocks = []
  let html = content.replace(/```([\w]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const index = codeBlocks.length
    codeBlocks.push({ lang, code })
    return `__CODE_BLOCK_${index}__`
  })
  
  // 转义 HTML
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
  
  // 行内代码
  html = html.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>')
  
  // 粗体
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  
  // 斜体
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  
  // 列表处理
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

// 监听面板打开，滚动到底部
watch(
  () => store.visible,
  (newVisible) => {
    if (newVisible) {
      nextTick(() => {
        scrollToBottom()
      })
    }
  }
)

// 监听消息变化，自动滚动
watch(
  () => store.messages.length,
  () => {
    if (store.visible) {
      scrollToBottom()
    }
  }
)
</script>

<style scoped>
/* 遮罩层 */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 999;
}

/* 侧栏面板 */
.ai-panel {
  position: fixed;
  right: 16px;
  top: 200px;
  width: 400px;
  max-height: calc(100vh - 120px);
  background: rgba(2, 6, 23, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(6, 182, 212, 0.4);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

/* 头部 */
.panel-header {
  height: 48px;
  padding: 0 16px;
  background: rgba(6, 182, 212, 0.15);
  border-bottom: 1px solid rgba(6, 182, 212, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title .icon {
  font-size: 20px;
  filter: drop-shadow(0 0 5px rgba(6, 182, 212, 0.5));
}

.header-title .title-text {
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 0.5px;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 4px;
  color: var(--primary-color);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(6, 182, 212, 0.2);
  color: #ffffff;
  transform: scale(1.1);
}

/* 节点信息 */
.node-info {
  padding: 12px 16px;
  background: rgba(6, 182, 212, 0.05);
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
  flex-shrink: 0;
}

.node-topic {
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 6px;
}

.context-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.context-item {
  font-family: var(--font-family);
  font-size: 12px;
  color: var(--text-secondary);
}

.context-item .label {
  color: var(--primary-color);
  font-weight: 600;
}

.context-item .value {
  color: var(--text-secondary);
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.5);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(6, 182, 212, 0.7);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
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
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-hint {
  font-family: var(--font-family);
  font-size: 12px;
  color: var(--text-muted);
}

/* 消息项 */
.message-item {
  display: flex;
  gap: 8px;
  animation: messageSlideIn 0.3s ease;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border-radius: 50%;
  background: rgba(6, 182, 212, 0.1);
}

.message-item.user .message-avatar {
  background: rgba(139, 92, 246, 0.1);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  font-family: var(--font-family);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  padding: 8px 12px;
  background: rgba(6, 182, 212, 0.05);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 6px;
  word-wrap: break-word;
}

.message-item.user .message-text {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.message-text :deep(code.inline-code) {
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #22d3ee;
}

.message-text :deep(pre.code-block) {
  margin: 8px 0;
  padding: 12px;
  background: rgba(0, 0, 0, 0.5);
  border-left: 3px solid var(--primary-color);
  border-radius: 4px;
  overflow-x: auto;
}

.message-text :deep(pre.code-block code) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #e2e8f0;
  white-space: pre;
}

.message-text :deep(strong) {
  font-weight: 700;
  color: var(--primary-color);
}

.message-text :deep(em) {
  font-style: italic;
  color: var(--secondary-color);
}

.message-text :deep(a) {
  color: var(--primary-color);
  text-decoration: underline;
}

.message-text :deep(ul), .message-text :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  font-family: var(--font-family);
}

/* 加载动画 */
.loading-dots {
  display: flex;
  gap: 4px;
  padding: 12px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  background: var(--primary-color);
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 输入区域 */
.input-area {
  padding: 12px 16px;
  border-top: 1px solid rgba(6, 182, 212, 0.2);
  background: rgba(2, 6, 23, 0.8);
  flex-shrink: 0;
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 4px;
  color: var(--primary-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.2);
  border-color: var(--primary-color);
}

.toolbar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.message-count {
  margin-left: auto;
  font-family: var(--font-family);
  font-size: 11px;
  color: var(--text-muted);
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.input-textarea {
  flex: 1;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-family: var(--font-family);
  font-size: 13px;
  color: var(--text-primary);
  resize: none;
  min-height: 60px;
  max-height: 120px;
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
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  border: none;
  border-radius: 4px;
  color: #000;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background: #22d3ee;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active, .slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 响应式 */
@media (max-width: 768px) {
  .ai-panel {
    right: 8px;
    top: 70px;
    width: calc(100vw - 16px);
    max-width: 400px;
    max-height: calc(100vh - 90px);
  }
}
</style>

