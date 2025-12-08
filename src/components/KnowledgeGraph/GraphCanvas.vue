<template>
  <div class="graph-canvas-container" ref="containerRef">
    <svg ref="svgRef" class="graph-svg"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, watchEffect } from 'vue'
import * as d3 from 'd3'
import { useGraphStore } from '@/stores/graphStore'
import { LayoutEngine } from '@/core/layout/LayoutEngine'
import { RadialLayout } from '@/core/layout/RadialLayout'
import { HierarchicalLayout } from '@/core/layout/HierarchicalLayout'
import { GraphRenderer } from '@/core/renderer/GraphRenderer'

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
let zoom = null
let mainGroup = null // 主图形组
let containerWidth = 0
let containerHeight = 0

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

  // 获取容器尺寸
  containerWidth = containerRef.value.clientWidth
  containerHeight = containerRef.value.clientHeight

  // 设置 SVG 尺寸
  const svg = d3.select(svgRef.value)
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  // 清除现有内容
  svg.selectAll('*').remove()

  // 创建主图形组
  mainGroup = svg.append('g')
    .attr('transform', `translate(${containerWidth / 2}, ${containerHeight / 2})`)

  // 初始化核心组件
  layoutEngine = new LayoutEngine()
  layoutEngine.register('radial', RadialLayout)
  layoutEngine.register('hierarchical', HierarchicalLayout)

  renderer = new GraphRenderer(svgRef.value)
  renderer.initLayers(mainGroup)

  // 设置缩放行为
  zoom = d3.zoom()
    .scaleExtent([0.1, 5])
    .on('zoom', (event) => {
      mainGroup.attr('transform', event.transform)
    })

  svg.call(zoom)

  // 初始渲染
  render()
  
  // 初始视图调整
  setTimeout(() => {
    adjustView()
  }, 100)
}

/**
 * 渲染图谱
 */
function render() {
  if (!renderer || !layoutEngine) return

  const nodes = store.visibleNodes
  const edges = store.visibleEdges



  // 确保节点有基本属性
  const preparedNodes = nodes.map(node => ({
    ...node,
    x: node.x || 0,
    y: node.y || 0,
    level: node.level || 0,
    width: node.width || 120,
    height: node.height || 60
  }))

  // 计算布局
  const positions = layoutEngine.calculate(
    preparedNodes,
    edges,
    store.focusedNode,
    store.layoutType
  )

  // 应用位置到节点
  preparedNodes.forEach(node => {
    const pos = positions.get(node.id)
    if (pos) {
      node.x = pos.x
      node.y = pos.y
    } else {
      // 确保每个节点都有坐标
      node.x = node.x || Math.random() * 100 - 50
      node.y = node.y || Math.random() * 100 - 50
    }
  })

  // 渲染节点
renderer.renderNodes(preparedNodes, {
    onClick: handleNodeClick,
    focusedNodeId: store.focusedNode?.id
  })
}



/**
 * 处理节点点击
 */
function handleNodeClick(event, node) {
  event.stopPropagation()
  // 发送事件，让 App.vue 处理
  emit('node-click', node)
}

/**
 * 调整视图，确保节点可见
 */
function adjustView() {
  if (!svgRef.value || !zoom) return

  const nodes = store.visibleNodes
  if (nodes.length === 0) return

  // 获取所有节点的实际位置
  const nodeElements = mainGroup?.selectAll('.node')
  if (!nodeElements?.size()) {
    // 简单中心定位
    const svg = d3.select(svgRef.value)
    svg.transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity.translate(containerWidth / 2, containerHeight / 2).scale(1))
    return
  }

  // 计算节点的边界框
  const bounds = mainGroup.node().getBBox()

  // 计算缩放比例，确保所有节点都可见
  const margin = 50
  const scale = Math.min(
    (containerWidth - margin * 2) / bounds.width,
    (containerHeight - margin * 2) / bounds.height,
    1 // 最大缩放比例为1
  )

  // 计算中心点偏移
  const xOffset = containerWidth / 2 - (bounds.x + bounds.width / 2) * scale
  const yOffset = containerHeight / 2 - (bounds.y + bounds.height / 2) * scale

  // 应用变换
  const svg = d3.select(svgRef.value)
  svg.transition()
    .duration(500)
    .call(zoom.transform, d3.zoomIdentity.translate(xOffset, yOffset).scale(scale))
}

/**
 * 监听节点变化，自动调整视图
 */
const nodesWatcher = watch(() => store.visibleNodes.length, (newCount, oldCount) => {
  nextTick(() => {
    render()
    
    // 当节点数量增加时，自动调整视图
    if (newCount > oldCount) {
      // 延迟执行，确保节点已渲染
      setTimeout(() => {
        adjustView()
      }, 300)
    }
  })
})

/**
 * 监听布局变化，重新渲染
 */
const layoutWatcher = watch(() => store.layoutType, () => {
  nextTick(() => {
    render()
    setTimeout(() => {
      adjustView()
    }, 300)
  })
})

/**
 * 监听容器尺寸变化，重新初始化
 */
const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    containerWidth = entry.contentRect.width
    containerHeight = entry.contentRect.height
    
    // 重置 SVG 尺寸
    if (svgRef.value) {
      d3.select(svgRef.value)
        .attr('width', containerWidth)
        .attr('height', containerHeight)
      
      initGraph()
    }
  }
})

// 监听容器尺寸变化
onMounted(() => {
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})

// 清理监听器
watchEffect(() => {
  return () => {
    resizeObserver.disconnect()
    nodesWatcher()
    layoutWatcher()
  }
})

// ========== Expose ==========
defineExpose({
  adjustView,
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

