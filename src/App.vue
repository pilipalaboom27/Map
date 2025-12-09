<template>
  <div class="knowledge-map-app">
    <!-- 动态星空背景层 -->
    <div class="stars-bg"></div>
    <div class="grid-bg"></div>
    
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
      <div class="loading-card">
        <div class="loading-header">
          <span class="dot"></span>
          <span>系统初始化</span>
          <span class="dot"></span>
        </div>
        <div class="progress-track">
          <div class="progress-fill"></div>
        </div>
        <ul class="loading-steps">
          <li v-for="(step, idx) in loadingSteps" :key="step" :class="{ active: idx === activeStep }">
            <span class="bullet"></span>{{ step }}
          </li>
        </ul>
      </div>
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
import { ref, watch, onUnmounted } from 'vue'
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

const loadingSteps = [
  '解析语义...',
  '构建实体关系...',
  '渲染神经元...',
  '同步知识流...'
]
// 简单的循环演示：当 loading 为 true 时，步骤每 1.5s 轮换
const activeStep = ref(0)
let stepTimer = null

watch(loading, (val) => {
  if (val) {
    activeStep.value = 0
    stepTimer && clearInterval(stepTimer)
    stepTimer = setInterval(() => {
      activeStep.value = (activeStep.value + 1) % loadingSteps.length
    }, 1500)
  } else {
    stepTimer && clearInterval(stepTimer)
    stepTimer = null
  }
})

onUnmounted(() => {
  stepTimer && clearInterval(stepTimer)
})

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
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  position: relative;
  overflow: hidden;
}

/* 动态背景层 */
.stars-bg, .grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 星空噪点 */
.stars-bg {
  background-image: 
    radial-gradient(1px 1px at 25% 25%, rgba(255, 255, 255, 0.2) 50%, transparent 100%),
    radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.2) 50%, transparent 100%),
    radial-gradient(2px 2px at 75% 75%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
  background-size: 500px 500px;
  opacity: 0.6;
}

/* 科幻网格 */
.grid-bg {
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  perspective: 1000px;
  transform-style: preserve-3d;
  mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: transparent; /* 透明以显示背景 */
  z-index: 1;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  z-index: var(--z-index-overlay);
    color: var(--primary-color);
  color: var(--primary-color);
}

.loading-overlay.hidden {
  display: none;
}

.loading-card {
  width: 360px;
  background: rgba(2, 6, 23, 0.9);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.loading-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  letter-spacing: 2px;
  margin-bottom: 16px;
}

.loading-header .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-color);
  box-shadow: 0 0 10px var(--primary-color);
  animation: blink 1.2s infinite;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 16px;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.progress-fill {
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, rgba(6,182,212,0) 0%, rgba(6,182,212,0.8) 50%, rgba(6,182,212,0) 100%);
  animation: slide 1.6s linear infinite;
}

.loading-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-steps li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font-family);
  letter-spacing: 0.5px;
}

.loading-steps li .bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.2);
}

.loading-steps li.active {
  color: var(--primary-color);
  font-weight: 600;
}

.loading-steps li.active .bullet {
  background: var(--primary-color);
  box-shadow: 0 0 10px var(--primary-color);
}

@keyframes blink {
  50% { opacity: 0.3; }
}

@keyframes slide {
  0% { transform: translateX(-40%); }
  100% { transform: translateX(140%); }
}
</style>