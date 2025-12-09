<template>
  <div class="graph-canvas-container" @contextmenu.prevent="handleCanvasRightClick">
    <!-- D3.js 可视化 -->
    <D3Graph
      :nodes="store.visibleNodes"
      :edges="store.visibleEdges"
      :layout="store.layoutType"
      @node-click="handleD3NodeClick"
      @node-contextmenu="handleNodeContextMenu"
    />
    
    <!-- 右键菜单 -->
    <ContextMenu
      v-model:visible="contextMenu.visible"
      :position="contextMenu.position"
      :menu-items="contextMenu.items"
      @select="handleMenuSelect"
    />

  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useLogger } from '@/core/logger.js'
import D3Graph from '../D3Graph.vue'
import ContextMenu from '../common/ContextMenu.vue'

// ========== Props & Emits ==========
const emit = defineEmits(['node-click'])

// ========== Store & Logger ==========
const store = useGraphStore()
const logger = useLogger('GraphCanvas')

// ========== Context Menu State ==========
const contextMenu = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  items: [],
  targetNode: null
})


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

/**
 * 处理节点右键菜单
 */
function handleNodeContextMenu(event, nodeData) {
  const node = store.nodes.find(n => n.id === nodeData.id)
  if (!node) return

  contextMenu.targetNode = node
  contextMenu.position = { x: event.clientX, y: event.clientY }
  contextMenu.items = [
    { label: 'AI 深度追问', icon: '🤖', action: 'ask-ai' },
    { label: '查看详细信息', icon: 'ℹ️', action: 'details' },
    { type: 'divider' },
    { label: node.locked ? '解锁位置' : '锁定位置', icon: node.locked ? '🔓' : '🔒', action: 'toggle-lock' },
    { type: 'divider' },
    { label: '删除节点', icon: '🗑️', action: 'delete', disabled: node.id === 'root' } // 根节点不可删
  ]
  contextMenu.visible = true
}

/**
 * 处理画布空白处右键
 */
function handleCanvasRightClick(event) {
  // 如果是点击在节点上（会冒泡），D3Graph 已经处理了
  // 这里只处理点击在空白处的情况，或者 D3Graph 没有捕获到的情况
  // 暂时不显示画布菜单，或者显示全局操作
  /*
  contextMenu.targetNode = null
  contextMenu.position = { x: event.clientX, y: event.clientY }
  contextMenu.items = [
    { label: '重置视图', icon: '⌂', action: 'reset-view' },
    { label: '清空画板', icon: '🧹', action: 'clear-canvas' }
  ]
  contextMenu.visible = true
  */
}

/**
 * 处理菜单选择
 */
function handleMenuSelect(item) {
  const node = contextMenu.targetNode
  
  switch (item.action) {
    case 'ask-ai':
      alert(`正在针对 "${node.topic}" 进行 AI 深度追问... (功能开发中)`)
      break
    case 'details':
      emit('node-click', node) // 触发点击相同的逻辑，打开详情
      break
    case 'toggle-lock':
      if (node) {
        node.locked = !node.locked
        // 如果解锁，且当前是力导向布局，需要手动释放 fx/fy
        if (!node.locked) {
          node.fx = null
          node.fy = null
        } else {
          node.fx = node.x
          node.fy = node.y
        }
        // 触发视图更新 (如果是在 force 布局下，模拟器会自动处理位置，但我们需要通知 store 或 强制刷新)
        // 这里简化处理，如果是锁定，D3 force 会自动尊重 fx/fy
      }
      break
    case 'delete':
      if (confirm(`确定要删除 "${node.topic}" 及其子节点吗？`)) {
        store.removeNode(node.id)
      }
      break
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

