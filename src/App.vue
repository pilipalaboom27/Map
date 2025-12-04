<template>
  <div class="knowledge-map-app">
    <Header 
      @add-topic="addTopic"
      @clear-canvas="clearCanvas"
    />
    
    <div class="canvas-container">
      <GraphCanvas 
        ref="graphCanvas"
        @node-click="handleNodeClick"
      />
    </div>
    
    <InfoPanel />
    
    <div id="loadingOverlay" class="loading-overlay" :class="{ hidden: !loading }">
      <div class="loading-spinner"></div>
      <p>正在生成知识...</p>
    </div>
    
    <!-- 实体编辑器 -->
    <EntityEditor 
      v-model:show="showEntityEditor"
      :entity="currentEditingEntity"
      @save="handleEntitySave"
    />

    <!-- 调试面板：显示当前节点信息，方便排查“看不到主题”的问题 -->
    <div v-if="DEBUG" class="debug-panel">
      <div class="debug-header">
        <span>调试面板（开发用）</span>
        <span>总节点: {{ store.nodes.length }}，可见节点: {{ store.visibleNodes.length }}</span>
      </div>
      <div class="debug-content">
        <div class="debug-section">
          <strong>所有节点：</strong>
          <ul>
            <li v-for="n in store.nodes" :key="n.id">
              {{ n.topic }}（level: {{ n.level }}, id: {{ n.id }}）
            </li>
          </ul>
        </div>
        <div class="debug-section">
          <strong>可见节点：</strong>
          <ul>
            <li v-for="n in store.visibleNodes" :key="n.id">
              {{ n.topic }}（level: {{ n.level }}, id: {{ n.id }}）
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from './components/layout/Header.vue'
import GraphCanvas from './components/KnowledgeGraph/GraphCanvas.vue'
import InfoPanel from './components/layout/InfoPanel.vue'
import EntityEditor from './components/EntityEditor.vue'
import { useGraphStore } from './stores/graphStore'
import { fetchKnowledge } from './services/api'

const store = useGraphStore()
const DEBUG = true

const graphCanvas = ref(null)
const loading = ref(false)
const showEntityEditor = ref(false)
const currentEditingEntity = ref(null)

/**
 * 添加主题节点
 */
const addTopic = (topic) => {
  const node = store.addNode(topic)
  store.setFocusedNode(node)
  console.log('✅ 添加主题:', topic)
  console.log('📊 当前节点数:', store.nodes.length, '可见节点数:', store.visibleNodes.length)
}

/**
 * 清空画布
 */
const clearCanvas = () => {
  store.clearAll()
  console.log('🗑️ 画布已清空')
}

/**
 * 处理节点点击
 */
const handleNodeClick = (node) => {
  if (store.focusedNode && node.id === store.focusedNode.id) {
    // 如果点击的是当前聚焦节点，展开节点
    handleNodeExpand(node)
  } else {
    // 否则聚焦节点
    store.setFocusedNode(node)
    console.log('🎯 聚焦节点:', node.topic)
  }
}

/**
 * 展开节点（获取子节点）
 */
const handleNodeExpand = async (node) => {
  // 如果节点已经展开过，不再重复展开
  if (node.expanding || node.expanded) {
    console.log('⏭️ 节点已展开，跳过:', node.topic)
    return
  }
  
  store.updateNode(node.id, { expanding: true })
  loading.value = true
  
  try {
    console.log('========== 开始展开节点 ==========')
    console.log('节点信息:', {
      topic: node.topic,
      id: node.id,
      level: node.level
    })
    
    const knowledge = await fetchKnowledge(node.topic, node.knowledge)
    console.log('📚 API返回的知识数据:', {
      主题: knowledge.topic,
      概念数: knowledge.concepts?.length || 0
    })
    
    store.updateNode(node.id, { knowledge })
    
    if (knowledge.concepts && knowledge.concepts.length > 0) {
      console.log(`✓ 解析到 ${knowledge.concepts.length} 个概念:`)
      
      const addedNodes = []
      
      knowledge.concepts.forEach((concept, index) => {
        // 检查是否已存在同名节点
        const existingNode = store.nodes.find(n => n.topic === concept.name)
        if (!existingNode) {
          const childNode = store.addNode(
            concept.name,
            node.id,
            concept.description
          )
          
          addedNodes.push(childNode)
          console.log(`  ${index + 1}. ✅ ${concept.name}`)
        } else {
          console.log(`  ${index + 1}. ⊘ ${concept.name} (已存在)`)
        }
      })
      
      console.log('========== 节点展开完成 ==========')
      console.log(`总计添加: ${addedNodes.length} 个节点`)
      console.log(`当前总节点数: ${store.nodes.length}`)
      console.log(`当前总边数: ${store.edges.length}`)
      
      // 标记节点为已展开
      store.updateNode(node.id, { expanded: true })
      
    } else {
      console.warn('⚠ 没有找到概念')
    }
  } catch (error) {
    console.error('❌ 展开节点失败:', error)
    console.error('错误堆栈:', error.stack)
    alert('展开节点失败：' + error.message)
  } finally {
    store.updateNode(node.id, { expanding: false })
    loading.value = false
  }
}

/**
 * 处理实体保存
 */
const handleEntitySave = (entityData) => {
  let nodeId = entityData.id
  
  if (entityData.id) {
    // 更新现有实体
    store.updateNode(entityData.id, {
      topic: entityData.name,
      description: entityData.description,
      type: entityData.type
    })
    console.log('✅ 更新实体:', entityData.name)
  } else {
    // 创建新实体
    const node = store.addNode(entityData.name, null, entityData.description)
    store.setFocusedNode(node)
    nodeId = node.id
    console.log('✅ 创建实体:', entityData.name)
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
</script>

<style scoped>
.knowledge-map-app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: var(--canvas-bg);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-overlay);
  color: white;
}

.loading-overlay.hidden {
  display: none;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top: 5px solid white;
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.debug-panel {
  position: fixed;
  right: 16px;
  bottom: 16px;
  max-width: 420px;
  max-height: 40vh;
  overflow: auto;
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  border: 1px solid #4b5563;
  padding: 8px 12px;
  font-size: 12px;
  z-index: 9999;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
  font-weight: 600;
}

.debug-content {
  display: flex;
  gap: 12px;
}

.debug-section {
  flex: 1;
}

.debug-section ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.debug-section li {
  line-height: 1.4;
  word-break: break-all;
}
</style>