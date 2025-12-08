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
      <ConfigSidebar />
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from './components/layout/Header.vue'
import GraphCanvas from './components/KnowledgeGraph/GraphCanvas.vue'
import InfoPanel from './components/layout/InfoPanel.vue'
import EntityEditor from './components/EntityEditor.vue'
import ConfigSidebar from './components/ConfigSidebar.vue'
import { useGraphStore } from './stores/graphStore'
import { useNodeOperations } from './composables/useNodeOperations.js'
import { useNodeExpansion } from './composables/useNodeExpansion.js'
import { useLogger } from './core/logger.js'

const store = useGraphStore()
const logger = useLogger('App')

const graphCanvas = ref(null)

// 使用 composables
const {
  showEntityEditor,
  currentEditingEntity,
  addTopic,
  clearCanvas,
  handleNodeClick: handleNodeClickOperation,
  handleEntitySave
} = useNodeOperations(store)

const {
  loading,
  expandNode
} = useNodeExpansion(store)

/**
 * 处理节点点击
 */
const handleNodeClick = (node) => {
  handleNodeClickOperation(node, (nodeToExpand) => {
    expandNode(nodeToExpand).catch(error => {
      logger.error('展开节点失败:', error)
      alert('展开节点失败：' + error.message)
    })
  })
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
</style>