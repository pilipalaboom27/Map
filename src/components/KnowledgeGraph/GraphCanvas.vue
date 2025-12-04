<template>
  <div class="graph-canvas-container">
    <!-- ECharts 可视化 -->
    <EChartsGraph
      :nodes="store.visibleNodes"
      :edges="store.visibleEdges"
      :layout="mapLayoutType(store.layoutType)"
      @node-click="handleEChartsNodeClick"
    />
  </div>
</template>

<script setup>
import { useGraphStore } from '@/stores/graphStore'
import EChartsGraph from '../EChartsGraph.vue'

// ========== Props & Emits ==========
const emit = defineEmits(['node-click'])

// ========== Store ==========
const store = useGraphStore()

/**
 * 处理 ECharts 节点点击
 */
function handleEChartsNodeClick(nodeData) {
  // 根据节点ID查找完整节点信息
  const node = store.nodes.find(n => n.id === nodeData.id)
  if (node) {
    console.log('🖱️ ECharts 节点点击:', node.topic)
    emit('node-click', node)
  }
}

/**
 * 映射布局类型到 ECharts 支持的布局
 */
function mapLayoutType(layoutType) {
  const layoutMap = {
    'radial': 'force',
    'force': 'force',
    'hierarchical': 'force',
    'circular': 'circular'
  }
  return layoutMap[layoutType] || 'force'
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

