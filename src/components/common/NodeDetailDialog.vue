<template>
  <Transition name="fade">
    <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
      <div class="dialog-container" @click.stop>
        <!-- 对话框头部 -->
        <div class="dialog-header">
          <div class="header-title">
            <span class="icon">📖</span>
            <span>{{ node?.topic || '节点详情' }}</span>
            <span v-if="nodeInfo.level !== undefined" class="level-badge">L{{ nodeInfo.level }}</span>
            <span v-if="nodeInfo.model" class="model-badge">{{ nodeInfo.model }}</span>
          </div>
          <div class="header-actions">
            <button 
              class="refresh-btn" 
              @click="handleRefresh" 
              :disabled="loading"
              title="刷新信息"
            >
              <span class="refresh-icon" :class="{ spinning: loading }">🔄</span>
            </button>
            <button class="close-btn" @click="handleClose" title="关闭">×</button>
          </div>
        </div>

        <!-- 对话框内容 -->
        <div class="dialog-content">
          <!-- 加载状态 -->
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">正在获取节点信息...</div>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <div class="error-text">{{ error }}</div>
            <button class="retry-btn" @click="handleRefresh">重试</button>
          </div>

          <!-- 内容区域 -->
          <template v-else>
            <!-- 详细介绍区域 -->
            <div class="detail-section" v-if="summary">
              <h3 class="section-title">
                <span class="title-icon">📝</span>
                详细介绍
              </h3>
              <div class="section-content summary-content">
                {{ summary }}
              </div>
            </div>

            <!-- 概念列表区域 -->
            <div class="detail-section" v-if="concepts && concepts.length > 0">
              <h3 class="section-title">
                <span class="title-icon">🔗</span>
                核心概念 ({{ concepts.length }})
              </h3>
              <div class="section-content concepts-list">
                <div 
                  v-for="(concept, index) in concepts" 
                  :key="index"
                  class="concept-item"
                  :class="{ clickable: canJumpToConcept(concept.name) }"
                  @click="handleConceptClick(concept.name)"
                >
                  <div class="concept-header">
                    <span class="concept-index">{{ index + 1 }}.</span>
                    <div class="concept-name">{{ concept.name }}</div>
                  </div>
                  <div class="concept-description" v-if="concept.description">
                    {{ concept.description }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Python示例区域 -->
            <div class="detail-section">
              <div class="section-header-with-action">
                <h3 class="section-title">
                  <span class="title-icon">🐍</span>
                  Python 示例代码
                </h3>
                <div class="section-actions">
                  <button 
                    class="generate-btn" 
                    @click="handleGenerateCodeExample" 
                    :disabled="codeGenerating || loading"
                    title="使用AI生成实际应用案例代码"
                  >
                    <span class="generate-icon" :class="{ spinning: codeGenerating }">✨</span>
                    <span v-if="codeGenerating">生成中...</span>
                    <span v-else>生成应用案例</span>
                  </button>
                  <button class="copy-btn" @click="handleCopyCode" title="复制代码">
                    <span class="copy-icon">📋</span>
                    复制
                  </button>
                </div>
              </div>
              <!-- 代码生成错误提示 -->
              <div v-if="codeError" class="code-error">
                <span class="error-icon">⚠️</span>
                <span class="error-text">{{ codeError }}</span>
                <button class="retry-btn-small" @click="handleGenerateCodeExample">重试</button>
              </div>
              <div class="section-content code-content">
                <pre class="code-block"><code>{{ pythonCode }}</code></pre>
              </div>
            </div>

            <!-- 无数据提示 -->
            <div v-if="!summary && (!concepts || concepts.length === 0)" class="empty-state">
              <div class="empty-icon">📭</div>
              <div class="empty-text">该节点暂无详细信息</div>
              <div class="empty-hint">点击刷新按钮获取信息</div>
            </div>
          </template>
        </div>

        <!-- 对话框底部 -->
        <div class="dialog-footer">
          <button class="cyber-btn primary" @click="handleClose">关闭</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { generatePythonExample } from '@/utils/pythonExampleGenerator.js'
import { fetchKnowledge, generateCodeExample } from '@/services/api/index.js'
import { useGraphStore } from '@/stores/graphStore'
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

const emit = defineEmits(['update:visible', 'close', 'focus-node'])

const store = useGraphStore()
const logger = useLogger('NodeDetailDialog')

// 状态管理
const loading = ref(false)
const error = ref(null)
const codeGenerating = ref(false)
const codeError = ref(null)
const aiGeneratedCode = ref(null)

// 计算属性
const summary = computed(() => {
  if (!props.node) return ''
  return props.node.knowledge?.summary || 
         props.node.knowledge?.description || 
         props.node.description || 
         ''
})

const concepts = computed(() => {
  if (!props.node) return []
  return props.node.knowledge?.concepts || []
})

const pythonCode = computed(() => {
  if (!props.node) return generatePythonExample(null)
  // 如果AI生成了代码，优先使用AI生成的代码
  if (aiGeneratedCode.value) {
    return aiGeneratedCode.value
  }
  // 否则使用默认生成的代码
  return generatePythonExample(props.node)
})

const nodeInfo = computed(() => {
  if (!props.node) return {}
  return {
    level: props.node.level,
    model: props.node.knowledge?.model,
    topic: props.node.topic
  }
})

// 方法
const handleClose = () => {
  error.value = null
  emit('update:visible', false)
  emit('close')
}

const handleRefresh = async () => {
  if (!props.node || loading.value) return
  
  await fetchNodeKnowledge()
}

const fetchNodeKnowledge = async () => {
  if (!props.node || !props.node.topic) return
  
  // 如果节点已有 knowledge 数据，不需要重新获取
  if (props.node.knowledge && props.node.knowledge.summary) {
    logger.debug('节点已有知识数据，跳过获取')
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    logger.debug('开始获取节点知识:', props.node.topic)
    const knowledge = await fetchKnowledge(
      props.node.topic, 
      props.node.knowledge,
      getNodePath(props.node)
    )
    
    // 更新节点的 knowledge
    store.updateNode(props.node.id, { knowledge })
    logger.debug('节点知识获取成功')
  } catch (err) {
    logger.error('获取节点知识失败:', err)
    error.value = err.message || '获取节点信息失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 获取节点路径
const getNodePath = (node) => {
  const path = []
  let current = node
  
  while (current && current.parentId) {
    const parent = store.getNodeById(current.parentId)
    if (parent) {
      path.unshift(parent.topic)
      current = parent
    } else {
      break
    }
  }
  
  return path
}

// 检查是否可以跳转到概念节点
const canJumpToConcept = (conceptName) => {
  if (!conceptName) return false
  return store.nodes.some(n => n.topic === conceptName)
}

// 处理概念点击
const handleConceptClick = (conceptName) => {
  if (!canJumpToConcept(conceptName)) return
  
  const conceptNode = store.nodes.find(n => n.topic === conceptName)
  if (conceptNode) {
    store.setFocusedNode(conceptNode)
    emit('focus-node', conceptNode)
    logger.debug('跳转到概念节点:', conceptName)
  }
}

const handleCopyCode = async (event) => {
  try {
    await navigator.clipboard.writeText(pythonCode.value)
    // 简单的反馈提示
    const btn = event.target.closest('.copy-btn')
    if (btn) {
      const originalText = btn.innerHTML
      btn.innerHTML = '<span class="copy-icon">✓</span> 已复制'
      btn.style.color = 'var(--primary-color)'
      setTimeout(() => {
        btn.innerHTML = originalText
        btn.style.color = ''
      }, 2000)
    }
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请手动选择代码复制')
  }
}

const handleGenerateCodeExample = async () => {
  if (!props.node || !props.node.topic || codeGenerating.value) return
  
  codeGenerating.value = true
  codeError.value = null
  
  try {
    // 构建context对象
    const context = {
      summary: summary.value,
      concepts: concepts.value
    }
    
    logger.debug('开始生成代码示例:', props.node.topic)
    
    const result = await generateCodeExample(props.node.topic, context)
    
    // 保存AI生成的代码
    aiGeneratedCode.value = result.content
    
    logger.debug('代码生成成功')
    
    // 滚动到代码区域顶部
    const codeContent = document.querySelector('.code-content')
    if (codeContent) {
      codeContent.scrollTop = 0
    }
  } catch (err) {
    logger.error('代码生成失败:', err)
    codeError.value = err.message || '生成代码失败，请稍后重试'
  } finally {
    codeGenerating.value = false
  }
}

// 监听节点变化，自动获取知识
watch(
  () => [props.visible, props.node],
  ([newVisible, newNode]) => {
    if (newVisible && newNode) {
      // 对话框打开时，如果节点没有 knowledge，自动获取
      fetchNodeKnowledge()
    }
  },
  { immediate: true }
)

// 监听节点变化，清除AI生成的代码
watch(
  () => props.node?.id,
  (newNodeId, oldNodeId) => {
    if (newNodeId !== oldNodeId) {
      // 节点变化时，清除AI生成的代码，恢复使用默认生成的代码
      aiGeneratedCode.value = null
      codeError.value = null
    }
  }
)

// ESC 键关闭
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && props.visible) {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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
  
  /* 切角设计 */
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

.level-badge, .model-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(6, 182, 212, 0.2);
  border: 1px solid rgba(6, 182, 212, 0.4);
  border-radius: 10px;
  color: var(--primary-color);
  font-weight: 600;
  margin-left: 8px;
}

.model-badge {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  color: #8b5cf6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: var(--text-primary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.2);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

.dialog-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(6, 182, 212, 0.3);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-family: var(--font-family);
  font-size: 14px;
  color: var(--text-secondary);
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.error-text {
  font-family: var(--font-family);
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: rgba(6, 182, 212, 0.2);
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: var(--primary-color);
  font-family: var(--font-family);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 2px;
}

.retry-btn:hover {
  background: rgba(6, 182, 212, 0.3);
  border-color: var(--primary-color);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.title-icon {
  font-size: 18px;
}

.section-content {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 4px;
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
}

.summary-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.concepts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.concept-item {
  padding: 12px;
  background: rgba(6, 182, 212, 0.05);
  border-left: 2px solid var(--primary-color);
  border-radius: 2px;
  transition: all 0.2s;
}

.concept-item.clickable {
  cursor: pointer;
}

.concept-item.clickable:hover {
  background: rgba(6, 182, 212, 0.15);
  border-left-color: #22d3ee;
  transform: translateX(2px);
}

.concept-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.concept-index {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  min-width: 20px;
}

.concept-name {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 15px;
  flex: 1;
}

.concept-description {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.code-content {
  padding: 0;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(6, 182, 212, 0.2);
  position: relative;
}

.code-block {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  background: transparent;
}

.code-block code {
  color: inherit;
  font-family: inherit;
}

.generate-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 2px;
}

.generate-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.3);
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generate-icon {
  font-size: 14px;
}

.generate-icon.spinning {
  animation: spin 1s linear infinite;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
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

.copy-btn:hover {
  background: rgba(6, 182, 212, 0.3);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.copy-icon {
  font-size: 14px;
}

.code-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  margin-bottom: 12px;
  font-family: var(--font-family);
  font-size: 12px;
}

.error-icon {
  font-size: 16px;
}

.error-text {
  flex: 1;
  color: #fca5a5;
}

.retry-btn-small {
  padding: 4px 8px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  font-family: var(--font-family);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 2px;
}

.retry-btn-small:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
  color: #fff;
}

.empty-state {
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

.dialog-footer {
  padding: 16px 24px;
  background: rgba(6, 182, 212, 0.05);
  border-top: 1px solid rgba(6, 182, 212, 0.2);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cyber-btn {
  height: 38px;
  padding: 0 20px;
  font-family: var(--font-family);
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-weight: 600;
  border-radius: 2px;
}

.cyber-btn.primary {
  background: var(--primary-color);
  color: #000;
  font-weight: bold;
  box-shadow: 0 0 10px var(--primary-glow);
}

.cyber-btn.primary:hover {
  background: #22d3ee;
  transform: translateY(-1px);
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
  
  .code-block {
    font-size: 11px;
  }
}
</style>

