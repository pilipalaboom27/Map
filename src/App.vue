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
      <ControlPanel 
        @fit-to-view="handleFitToView"
        @reset-view="handleResetView"
      />
    </div>
    
    <InfoPanel />
    
    <div id="loadingOverlay" class="loading-overlay" :class="{ hidden: !loading }">
      <div class="loading-spinner"></div>
      <p>正在生成知识...</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from './components/layout/Header.vue'
import GraphCanvas from './components/KnowledgeGraph/GraphCanvas.vue'
import InfoPanel from './components/layout/InfoPanel.vue'
import ControlPanel from './components/KnowledgeGraph/ControlPanel.vue'
import { useGraphStore } from './stores/graphStore'
import { fetchKnowledge } from './services/api'

const store = useGraphStore()

const graphCanvas = ref(null)
const loading = ref(false)

/**
 * 添加主题节点
 */
const addTopic = (topic) => {
  const node = store.addNode(topic)
  store.setFocusedNode(node)
  console.log('✅ 添加主题:', topic)
}

/**
 * 清空画布
 */
const clearCanvas = () => {
  store.clearAll()
  console.log('🗑️ 画布已清空')
}

/**
 * 自适应缩放视图
 */
const handleFitToView = () => {
  if (graphCanvas.value) {
    graphCanvas.value.fitToView()
    console.log('🔍 自适应缩放视图')
  }
}

/**
 * 重置视图
 */
const handleResetView = () => {
  if (graphCanvas.value) {
    graphCanvas.value.resetView()
    console.log('🔄 重置视图')
  }
}

/**
 * 处理节点点击
 */
const handleNodeClick = (node) => {
  store.handleNodeClick(node, handleNodeExpand)
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
</script>

<style scoped>
.knowledge-map-app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #f7fafc;
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
  z-index: 1000;
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
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>