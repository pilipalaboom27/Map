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

    <!-- 节点详情对话框 -->
    <NodeDetailDialog
      v-model:visible="detailDialog.visible"
      :node="detailDialog.node"
    />

    <!-- AI 追问对话框 -->
    <AIDialog
      v-model:visible="aiDialog.visible"
      :node="aiDialog.node"
    />

  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useAIPanelStore } from '@/stores/aiPanelStore'
import { useLogger } from '@/core/logger.js'
import { useNodeExpansion } from '@/composables/useNodeExpansion.js'
import D3Graph from '../D3Graph.vue'
import ContextMenu from '../common/ContextMenu.vue'
import NodeDetailDialog from '../common/NodeDetailDialog.vue'
import AIDialog from '../common/AIDialog.vue'

// ========== Props & Emits ==========
const emit = defineEmits(['node-click', 'view-details'])

// ========== Store & Logger ==========
const store = useGraphStore()
const aiPanelStore = useAIPanelStore()
const logger = useLogger('GraphCanvas')

// ========== Node Expansion ==========
const { expandNode } = useNodeExpansion(store)

// ========== Context Menu State ==========
const contextMenu = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  items: [],
  targetNode: null
})

// ========== Detail Dialog State ==========
const detailDialog = reactive({
  visible: false,
  node: null
})

// ========== AI Dialog State ==========
const aiDialog = reactive({
  visible: false,
  node: null
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
  logger.debug('收到右键菜单事件:', { event, nodeData })
  
  // 阻止默认右键菜单
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  // 尝试从 store 中查找节点，如果找不到则使用传入的 nodeData
  let node = null
  if (nodeData && nodeData.id) {
    node = store.nodes.find(n => n.id === nodeData.id)
    if (!node) {
      // 如果 store 中找不到，可能节点刚添加，使用传入的数据
      node = nodeData
      logger.debug('节点未在 store 中找到，使用传入数据:', nodeData)
    }
  }
  
  if (!node || !node.id) {
    logger.warn('无法处理右键菜单：节点数据无效', { nodeData, storeNodes: store.nodes.length })
    return
  }

  logger.debug('处理节点右键菜单:', node.topic, 'ID:', node.id)

  contextMenu.targetNode = node
  
  // 获取鼠标位置，如果事件对象无效则使用默认位置
  let menuX = 0
  let menuY = 0
  if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
    menuX = event.clientX
    menuY = event.clientY
  } else {
    // 如果事件对象无效，尝试从鼠标位置获取
    if (window.event && window.event.clientX) {
      menuX = window.event.clientX
      menuY = window.event.clientY
    } else {
      // 最后使用屏幕中心位置
      menuX = window.innerWidth / 2
      menuY = window.innerHeight / 2
    }
  }
  
  contextMenu.position = { 
    x: menuX, 
    y: menuY 
  }
  
  // 构建菜单项，按优先级排序
  const items = []
  
  // 1. 展开节点（如果未展开）
  if (!node.expanded && !node.expanding) {
    items.push({ label: '展开节点', icon: '📂', action: 'expand-node' })
  }
  
  // 2. 查看详细介绍
  items.push({ label: '查看详细介绍', icon: '📖', action: 'view-details' })
  
  // 3. AI 深度追问
  items.push({ label: 'AI 深度追问', icon: '🤖', action: 'ask-ai' })
  
  // 4. 分隔线
  items.push({ type: 'divider' })
  
  // 5. 删除节点
  items.push({ label: '删除节点', icon: '🗑️', action: 'delete', disabled: node.id === 'root' })
  
  contextMenu.items = items
  contextMenu.visible = true
  
  logger.debug('右键菜单已显示，节点:', node.topic, '菜单项数:', items.length, '位置:', contextMenu.position)
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
  if (!node) return
  
  switch (item.action) {
    case 'expand-node':
      // 展开节点
      expandNode(node).catch(error => {
        logger.error('展开节点失败:', error)
        alert('展开节点失败：' + error.message)
      })
      break
    case 'view-details':
      // 打开详情对话框
      detailDialog.node = node
      detailDialog.visible = true
      emit('view-details', node)
      break
    case 'ask-ai':
      // 打开 AI 追问侧栏
      aiPanelStore.open(node)
      logger.debug('打开 AI 追问侧栏:', node.topic)
      break
    case 'details':
      // 保留旧的 details action 以兼容
      emit('node-click', node)
      break
    case 'delete':
      if (confirm(`确定要删除 "${node.topic}" 及其子节点吗？`)) {
        store.deleteNode(node.id)
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

