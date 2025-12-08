<template>
  <div ref="containerRef" class="d3-graph-container">
    <!-- 节点悬停提示卡片 -->
    <NodeTooltip
      :visible="showTooltip"
      :node="tooltipNode"
      :position="tooltipPosition"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useEventManager } from '@/core/eventManager.js'
import { useLogger } from '@/core/logger.js'
import { createRenderer, renderNodes, renderEdges, updateNodePositions, updateEdgePositions } from '@/core/d3/renderer.js'
import { createZoomPan, handleResize as handleResizeInteraction } from '@/core/d3/interaction.js'
import { applyLayout } from '@/core/d3/layoutEngine.js'
import NodeTooltip from '@/components/common/NodeTooltip.vue'

const props = defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '800px'
  },
  nodes: {
    type: Array,
    default: () => []
  },
  edges: {
    type: Array,
    default: () => []
  },
  layout: {
    type: String,
    default: 'radial'
  }
})

const emit = defineEmits(['node-click', 'edge-click'])

const store = useGraphStore()
const eventManager = useEventManager()
const logger = useLogger('D3Graph')

const containerRef = ref(null)
let svg = null
let g = null
let zoom = null
let nodeSelection = null
let linkSelection = null
let containerWidth = 0
let containerHeight = 0

// 工具提示状态
const showTooltip = ref(false)
const tooltipNode = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

// 初始化
onMounted(() => {
  nextTick(() => {
    initGraph()
  })
})

// 初始化图表
function initGraph() {
  if (!containerRef.value) return

  const container = containerRef.value
  containerWidth = container.clientWidth || 800
  containerHeight = container.clientHeight || 600

  // 创建渲染器
  const renderer = createRenderer(container, containerWidth, containerHeight)
  svg = renderer.svg
  g = renderer.g

  // 创建缩放和平移交互
  zoom = createZoomPan(svg, g)

  // 注册窗口大小变化监听
  eventManager.on('resize', handleResize, {
    target: window,
    namespace: eventManager.namespace
  })

  // 初始渲染
  renderGraph()
}

// 渲染图表
function renderGraph() {
  if (!svg || !g) return
  
  // 如果没有节点，只清除内容但不渲染
  if (!props.nodes.length) {
    g.selectAll('*').remove()
    return
  }

  // 清除旧内容
  g.selectAll('.links').remove()
  g.selectAll('.nodes').remove()

  // 应用布局算法
  const focusedNode = store.focusedNode
  if (focusedNode) {
    applyLayout(props.layout, props.nodes, focusedNode, containerWidth, containerHeight)
  }

  // 渲染连接线
  linkSelection = renderEdges(g, props.edges, props.nodes, (edge) => {
    emit('edge-click', edge)
  })

  // 渲染节点（传入聚焦节点信息和工具提示回调）
  nodeSelection = renderNodes(
    g, 
    props.nodes, 
    (node) => {
      logger.debug('节点点击事件触发:', node?.topic, node?.id)
      emit('node-click', node)
    }, 
    focusedNode,
    {
      onMouseEnter: (event, node) => {
        // 显示工具提示
        const rect = containerRef.value.getBoundingClientRect()
        tooltipPosition.value = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
        tooltipNode.value = node
        showTooltip.value = true
      },
      onMouseMove: (event, node) => {
        // 更新工具提示位置
        const rect = containerRef.value.getBoundingClientRect()
        tooltipPosition.value = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
      },
      onMouseLeave: () => {
        // 隐藏工具提示
        showTooltip.value = false
        tooltipNode.value = null
      }
    }
  )

  // 更新位置（传入聚焦节点信息，nodeSelection现在是节点组）
  updateNodePositions(nodeSelection, props.nodes, containerWidth / 2, containerHeight / 2, focusedNode)
  updateEdgePositions(linkSelection, props.edges, props.nodes)
}

// 处理窗口大小变化
function handleResize() {
  if (!containerRef.value) return
  
  containerWidth = containerRef.value.clientWidth || 800
  containerHeight = containerRef.value.clientHeight || 600
  
  // 更新SVG尺寸
  handleResizeInteraction(svg, containerWidth, containerHeight)
  
  // 重新应用布局
  const focusedNode = store.focusedNode
  if (focusedNode && props.nodes.length > 0) {
    applyLayout(props.layout, props.nodes, focusedNode, containerWidth, containerHeight)
    
    // 更新位置（传入聚焦节点信息）
    if (nodeSelection) {
      updateNodePositions(nodeSelection, props.nodes, containerWidth / 2, containerHeight / 2, focusedNode)
    }
    if (linkSelection) {
      updateEdgePositions(linkSelection, props.edges, props.nodes)
    }
  }
}

// 监听数据变化
watch(
  [() => props.nodes, () => props.edges, () => props.layout, () => store.focusedNode],
  () => {
    if (svg && g) {
      renderGraph()
    }
  },
  { deep: true }
)

// 组件卸载时清理
onUnmounted(() => {
  // 清理事件监听器
  eventManager.clear()
  
  // 清理SVG
  if (svg) {
    svg.selectAll('*').remove()
  }
})
</script>

<style scoped>
.d3-graph-container {
  width: 100%;
  height: 100%;
  background-color: transparent;
  overflow: hidden;
}

.d3-graph-container :deep(.node text) {
  pointer-events: none;
  user-select: none;
}

.d3-graph-container :deep(.links line) {
  transition: stroke-opacity 0.2s, stroke-width 0.2s;
}
</style>
