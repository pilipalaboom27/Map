<template>
  <div class="graph-canvas-container" ref="containerRef">
    <svg ref="svgRef" class="graph-svg"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { useGraphStore } from '@/stores/graphStore'
import { LayoutEngine } from '@/core/layout/LayoutEngine'
import { RadialLayout } from '@/core/layout/RadialLayout'
import { ForceDirectedLayout } from '@/core/layout/ForceDirectedLayout'
import { HierarchicalLayout } from '@/core/layout/HierarchicalLayout'
import { CircularLayout } from '@/core/layout/CircularLayout'
import { GraphRenderer } from '@/core/renderer/GraphRenderer'
import { AnimationController } from '@/core/animation/AnimationController'

// ========== Props & Emits ==========
const emit = defineEmits(['node-click'])

// ========== Refs ==========
const containerRef = ref(null)
const svgRef = ref(null)

// ========== Store ==========
const store = useGraphStore()

// ========== Core Instances ==========
let layoutEngine = null
let renderer = null
let animator = null
let zoom = null

// ========== Lifecycle ==========
onMounted(() => {
  initGraph()
})

// ========== Methods ==========

/**
 * 初始化图谱
 */
function initGraph() {
  if (!svgRef.value || !containerRef.value) return

  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 设置 SVG 尺寸
  d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)

  // 添加箭头标记定义
  const svg = d3.select(svgRef.value)
  const defs = svg.append('defs')
  
  defs.append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 8)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', '#10b981')

  // 初始化核心组件
  layoutEngine = new LayoutEngine()
  layoutEngine.register('radial', RadialLayout)
  layoutEngine.register('force', ForceDirectedLayout)
  layoutEngine.register('hierarchical', HierarchicalLayout)
  layoutEngine.register('circular', CircularLayout)

  renderer = new GraphRenderer(svgRef.value)
  const g = renderer.initLayers()

  animator = new AnimationController()

  // 设置缩放行为
  zoom = d3.zoom()
    .scaleExtent([0.1, 5])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  // 初始渲染
  render()
}

/**
 * 渲染图谱
 */
function render() {
  if (!renderer || !layoutEngine) return

  const nodes = store.visibleNodes
  const edges = store.visibleEdges

  console.log('📊 渲染图谱:', {
    节点数: nodes.length,
    边数: edges.length,
    聚焦节点: store.focusedNode?.topic
  })

  // 计算布局
  const positions = layoutEngine.calculate(
    nodes,
    edges,
    store.focusedNode,
    store.layoutType
  )

  // 应用位置到节点
  nodes.forEach(node => {
    const pos = positions.get(node.id)
    if (pos) {
      node.x = pos.x
      node.y = pos.y
    }
  })

  // 渲染边
  renderer.renderEdges(edges, nodes)

  // 渲染节点
  renderer.renderNodes(nodes, {
    onClick: handleNodeClick,
    focusedNodeId: store.focusedNode?.id
  })
}

/**
 * 处理节点点击
 */
function handleNodeClick(event, node) {
  event.stopPropagation()
  console.log('🖱️ 节点点击:', node.topic)
  emit('node-click', node)
}

/**
 * 重置视图
 */
function resetView() {
  if (!svgRef.value || !zoom) return

  const svg = d3.select(svgRef.value)
  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  svg.transition()
    .duration(600)
    .call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1))
}

/**
 * 缩放到适应所有节点
 */
function fitToView() {
  if (!svgRef.value || !zoom || store.nodes.length === 0) return

  const svg = d3.select(svgRef.value)
  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 计算所有节点的边界框
  const nodes = store.visibleNodes
  if (nodes.length === 0) return

  const xExtent = d3.extent(nodes, d => d.x)
  const yExtent = d3.extent(nodes, d => d.y)
  
  const dx = xExtent[1] - xExtent[0]
  const dy = yExtent[1] - yExtent[0]
  const x = (xExtent[0] + xExtent[1]) / 2
  const y = (yExtent[0] + yExtent[1]) / 2
  const scale = Math.min(8, 0.9 / Math.max(dx / width, dy / height))
  const translate = [width / 2 - scale * x, height / 2 - scale * y]

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))
}

// ========== Watchers ==========

/**
 * 监听可见节点变化
 */
watch(() => [store.visibleNodes.length, store.visibleEdges.length, store.focusedNode], 
  () => {
    nextTick(() => {
      render()
    })
  },
  { deep: true }
)

/**
 * 监听布局类型变化
 */
watch(() => store.layoutType, () => {
  console.log('🔄 切换布局:', store.layoutType)
  nextTick(() => {
    render()
  })
})

// ========== Expose ==========
defineExpose({
  resetView,
  fitToView,
  render
})
</script>

<style scoped>
.graph-canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.graph-svg {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.graph-svg:active {
  cursor: grabbing;
}

/* 节点样式 */
:deep(.node) {
  cursor: pointer;
  transition: filter 0.2s;
}

:deep(.node:hover) {
  filter: brightness(1.2);
}

:deep(.node rect) {
  transition: all 0.3s ease;
}

/* 边样式 */
:deep(.edge) {
  transition: all 0.3s ease;
}

:deep(.edge:hover) {
  stroke-width: 6 !important;
}
</style>

