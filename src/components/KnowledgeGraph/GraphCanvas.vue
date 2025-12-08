<template>
  <div class="graph-canvas-container">
    <!-- D3.js 可视化 -->
    <D3Graph
      :nodes="store.visibleNodes"
      :edges="store.visibleEdges"
      :layout="store.layoutType"
      @node-click="handleD3NodeClick"
    />
  </div>
</template>

<script setup>
import { useGraphStore } from '@/stores/graphStore'
import { useLogger } from '@/core/logger.js'
import D3Graph from '../D3Graph.vue'

// ========== Props & Emits ==========
const emit = defineEmits(['node-click'])

// ========== Store & Logger ==========
const store = useGraphStore()
const logger = useLogger('GraphCanvas')

/**
 * 处理 D3 节点点击
 */
function handleD3NodeClick(nodeData) {
  // 根据节点ID查找完整节点信息
  const node = store.nodes.find(n => n.id === nodeData.id)
  if (node) {
    logger.debug('D3 节点点击:', node.topic, 'ID:', node.id)
    logger.debug('当前聚焦节点:', store.focusedNode?.id)
    emit('node-click', node)
  } else {
    logger.warn('未找到节点:', nodeData.id)
  }
}
</script>

<style scoped>
.graph-canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: var(--canvas-bg);
  border: 1px solid var(--border-color);
}
</style>

