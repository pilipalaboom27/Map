<template>
  <!-- 遮罩层 -->
  <div 
    class="panel-overlay" 
    v-if="!isCollapsed"
    @click="toggleCollapse"
  ></div>

  <div class="data-table-sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header" @click="isCollapsed ? toggleCollapse() : null" :title="isCollapsed ? '知识数据表' : ''">
      <div class="header-title">
        <span class="icon">📊</span>
        <span v-if="!isCollapsed">知识数据表</span>
        <span class="count-badge" v-if="!isCollapsed && tableData.length > 0">{{ tableData.length }}</span>
      </div>
      <div class="close-btn" v-if="!isCollapsed" @click.stop="toggleCollapse" title="关闭">×</div>
    </div>
    
    <div class="sidebar-content" v-if="!isCollapsed">
      <!-- 搜索和导出工具栏 -->
      <div class="toolbar">
        <n-input
          v-model:value="searchText"
          placeholder="搜索主题、概念..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <span style="color: var(--primary-color);">🔍</span>
          </template>
        </n-input>
        <div class="export-buttons">
          <n-button 
            size="small" 
            @click="handleExport('csv')"
            :disabled="filteredData.length === 0"
            class="export-btn"
          >
            导出 CSV
          </n-button>
          <n-button 
            size="small" 
            @click="handleExport('excel')"
            :disabled="filteredData.length === 0"
            class="export-btn"
          >
            导出 Excel
          </n-button>
        </div>
      </div>

      <!-- 表格 -->
      <div class="table-container">
        <n-data-table
          :columns="columns"
          :data="filteredData"
          :pagination="pagination"
          :bordered="false"
          :single-line="false"
          :scroll-x="980"
          :row-props="getRowProps"
          class="cyber-table"
          empty-description="暂无已展开的节点数据"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NDataTable, NInput, NButton } from 'naive-ui'
import { useGraphStore } from '@/stores/graphStore'
import { exportTableToCSV, exportTableToExcel } from '@/utils/exportTable.js'

const store = useGraphStore()
const isCollapsed = ref(true) // 默认折叠
const searchText = ref('')

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 获取已展开的节点
const expandedNodes = computed(() => {
  return store.nodes.filter(n => n.expanded && n.knowledge)
})

// 将节点数据转换为表格数据
const tableData = computed(() => {
  const rows = []
  expandedNodes.value.forEach(node => {
    const concepts = node.knowledge?.concepts || []
    if (concepts.length === 0) {
      // 即使没有概念，也显示节点本身
      rows.push({
        key: `${node.id}-empty`,
        topic: node.topic,
        conceptName: '-',
        conceptDescription: node.knowledge?.summary || '',
        level: node.level,
        model: node.knowledge?.model || '',
        summary: node.knowledge?.summary || '',
        nodeId: node.id
      })
    } else {
      concepts.forEach((concept, idx) => {
        rows.push({
          key: `${node.id}-${idx}`,
          topic: node.topic,
          conceptName: concept.name,
          conceptDescription: concept.description || '',
          level: node.level,
          model: node.knowledge?.model || '',
          summary: node.knowledge?.summary || '',
          nodeId: node.id
        })
      })
    }
  })
  return rows
})

// 搜索过滤
const filteredData = computed(() => {
  if (!searchText.value.trim()) {
    return tableData.value
  }
  const keyword = searchText.value.toLowerCase()
  return tableData.value.filter(row => {
    return (
      row.topic.toLowerCase().includes(keyword) ||
      row.conceptName.toLowerCase().includes(keyword) ||
      row.conceptDescription.toLowerCase().includes(keyword) ||
      row.model.toLowerCase().includes(keyword)
    )
  })
})

// 表格列定义
const columns = [
  {
    title: '主题',
    key: 'topic',
    width: 140,
    minWidth: 100,
    resizable: true,
    fixed: 'left',
    ellipsis: {
      tooltip: true
    },
    sorter: (a, b) => a.topic.localeCompare(b.topic)
  },
  {
    title: '概念名称',
    key: 'conceptName',
    width: 160,
    minWidth: 120,
    resizable: true,
    ellipsis: {
      tooltip: true
    },
    sorter: (a, b) => a.conceptName.localeCompare(b.conceptName)
  },
  {
    title: '概念描述',
    key: 'conceptDescription',
    width: 250,
    minWidth: 150,
    resizable: true,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '层级',
    key: 'level',
    width: 70,
    minWidth: 60,
    resizable: true,
    sorter: (a, b) => a.level - b.level
  },
  {
    title: '模型',
    key: 'model',
    width: 150,
    minWidth: 100,
    resizable: true,
    ellipsis: {
      tooltip: true
    },
    sorter: (a, b) => (a.model || '').localeCompare(b.model || '')
  }
]

// 分页配置
const pagination = computed(() => {
  return {
    pageSize: 10,
    showSizePicker: true,
    pageSizes: [10, 20, 50, 100],
    showQuickJumper: true,
    prefix: ({ itemCount }) => `共 ${itemCount} 条`,
    goto: () => '转到'
  }
})

// 行属性（用于点击高亮）
const getRowProps = (row) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      handleRowClick(row)
    }
  }
}

// 处理行点击
const handleRowClick = (row) => {
  const node = store.getNodeById(row.nodeId)
  if (node) {
    store.setFocusedNode(node)
  }
}

// 导出功能
const handleExport = (type) => {
  try {
    const data = filteredData.value
    const exportColumns = columns.filter(col => col.key !== 'nodeId') // 不导出 nodeId
    
    if (type === 'csv') {
      exportTableToCSV(data, exportColumns, `knowledge-table-${new Date().getTime()}`)
    } else if (type === 'excel') {
      exportTableToExcel(data, exportColumns, `knowledge-table-${new Date().getTime()}`)
    }
  } catch (error) {
    alert('导出失败: ' + error.message)
  }
}
</script>

<style scoped>
/* 遮罩层 */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 999;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.data-table-sidebar {
  position: absolute;
  right: 24px;
  bottom: 24px;
  width: 800px;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-right: 2px solid var(--primary-color);
  box-shadow: 5px 0 20px rgba(0, 0, 0, 0.5);
  
  /* 切角设计 */
  clip-path: polygon(
    0 0, 
    100% 0, 
    100% calc(100% - 20px), 
    calc(100% - 20px) 100%, 
    0 100%
  );
  
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  max-height: 650px;
  z-index: 50;
}

/* 展开时居中显示 */
.data-table-sidebar:not(.collapsed) {
  position: fixed;
  left: 50%;
  top: calc(50% + 24px); /* 避开顶部 Header */
  transform: translate(-50%, -50%);
  right: auto;
  bottom: auto;
  width: 900px;
  max-height: calc(80vh - 64px); /* 预留顶部空间 */
  z-index: 1000;
  background: rgba(2, 6, 23, 0.95);
  border: 1px solid rgba(6, 182, 212, 0.4);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  clip-path: none;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.data-table-sidebar.collapsed {
  width: 48px;
  height: 48px;
  max-height: 48px;
  border-right: 1px solid var(--border-color);
  border-radius: 4px;
  clip-path: none;
  transform: none;
}

.sidebar-header {
  padding: 12px 20px;
  background: rgba(6, 182, 212, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.data-table-sidebar:not(.collapsed) .sidebar-header {
  height: 48px;
  padding: 0 24px;
  background: rgba(6, 182, 212, 0.15);
  border-bottom: 1px solid rgba(6, 182, 212, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: default;
}

.data-table-sidebar.collapsed .sidebar-header {
  padding: 0;
  justify-content: center;
  align-items: center;
  border-bottom: none;
  height: 100%;
  width: 100%;
  background: rgba(6, 182, 212, 0.2);
}

.data-table-sidebar.collapsed .sidebar-header:hover {
  background: rgba(6, 182, 212, 0.4);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.5);
  transform: scale(1.05);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-family);
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 1px;
  font-size: 14px;
}

.data-table-sidebar:not(.collapsed) .header-title {
  font-size: 16px;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 300;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(6, 182, 212, 0.2);
  color: #ffffff;
  transform: scale(1.1);
}

.data-table-sidebar.collapsed .header-title {
  gap: 0;
}

.data-table-sidebar.collapsed .header-title .icon {
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 5px rgba(6, 182, 212, 0.5));
}

.data-table-sidebar.collapsed .sidebar-header:hover .icon {
  transform: scale(1.1);
  filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.8));
}

.count-badge {
  background: var(--primary-color);
  color: #000;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.collapse-icon {
  color: var(--primary-color);
  font-size: 10px;
}

.sidebar-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-input {
  width: 100%;
}

.export-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.export-btn {
  font-family: var(--font-family);
  font-size: 13px;
  font-weight: 600;
}

/* 导出按钮样式增强 */
.export-buttons :deep(.n-button) {
  background: rgba(6, 182, 212, 0.3) !important;
  border: 1px solid rgba(6, 182, 212, 0.6) !important;
  color: #06b6d4 !important;
  font-weight: 600 !important;
  text-shadow: 0 0 5px rgba(6, 182, 212, 0.5) !important;
}

.export-buttons :deep(.n-button:hover:not(.n-button--disabled)) {
  background: rgba(6, 182, 212, 0.5) !important;
  border-color: var(--primary-color) !important;
  color: #ffffff !important;
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.5) !important;
  transform: translateY(-1px);
}

.export-buttons :deep(.n-button:active:not(.n-button--disabled)) {
  background: rgba(6, 182, 212, 0.7) !important;
  transform: translateY(0);
}

.export-buttons :deep(.n-button--disabled) {
  background: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(6, 182, 212, 0.2) !important;
  color: rgba(6, 182, 212, 0.4) !important;
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.table-container {
  flex: 1;
  overflow: auto;
  max-height: calc(80vh - 200px); /* 减去头部和工具栏高度 */
  min-height: 200px;
}

/* 自定义滚动条样式 */
.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.5);
  border-radius: 4px;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: rgba(6, 182, 212, 0.7);
}

/* Firefox 滚动条 */
.table-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(6, 182, 212, 0.5) rgba(0, 0, 0, 0.3);
}

/* 表格样式定制 */
.cyber-table :deep(.n-data-table) {
  background: transparent;
}

.cyber-table :deep(.n-data-table-wrapper) {
  overflow: visible;
}

.cyber-table :deep(.n-data-table-base-table) {
  overflow: visible;
}

.cyber-table :deep(.n-data-table-th) {
  background: rgba(6, 182, 212, 0.2) !important;
  color: #06b6d4 !important;
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 13px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.4);
  text-shadow: 0 0 5px rgba(6, 182, 212, 0.5);
}

.cyber-table :deep(.n-data-table-td) {
  background: rgba(0, 0, 0, 0.5) !important;
  color: #e2e8f0 !important;
  font-family: var(--font-family);
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cyber-table :deep(.n-data-table-tr:hover) {
  background: rgba(6, 182, 212, 0.25) !important;
}

.cyber-table :deep(.n-data-table-tr--hover) {
  background: rgba(6, 182, 212, 0.25) !important;
}

.cyber-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: rgba(6, 182, 212, 0.25) !important;
  color: #ffffff !important;
}

.cyber-table :deep(.n-pagination) {
  margin-top: 12px;
}

.cyber-table :deep(.n-pagination-item) {
  background: rgba(0, 0, 0, 0.6) !important;
  border-color: rgba(6, 182, 212, 0.4) !important;
  color: #e2e8f0 !important;
}

.cyber-table :deep(.n-pagination-item:hover) {
  background: rgba(6, 182, 212, 0.3) !important;
  border-color: rgba(6, 182, 212, 0.6) !important;
  color: #ffffff !important;
}

.cyber-table :deep(.n-pagination-item--active) {
  background: var(--primary-color) !important;
  color: #000 !important;
  border-color: var(--primary-color) !important;
}

.cyber-table :deep(.n-pagination-prev),
.cyber-table :deep(.n-pagination-next) {
  background: rgba(0, 0, 0, 0.6) !important;
  border-color: rgba(6, 182, 212, 0.4) !important;
  color: #e2e8f0 !important;
}

.cyber-table :deep(.n-pagination-prev:hover),
.cyber-table :deep(.n-pagination-next:hover) {
  background: rgba(6, 182, 212, 0.3) !important;
  border-color: rgba(6, 182, 212, 0.6) !important;
  color: #ffffff !important;
}

.cyber-table :deep(.n-pagination-prev--disabled),
.cyber-table :deep(.n-pagination-next--disabled) {
  background: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(6, 182, 212, 0.2) !important;
  color: rgba(226, 232, 240, 0.4) !important;
}

.cyber-table :deep(.n-pagination-quick-jumper) {
  color: #e2e8f0 !important;
}

.cyber-table :deep(.n-pagination-quick-jumper-label) {
  color: #e2e8f0 !important;
  font-family: var(--font-family);
  font-size: 13px;
}

.cyber-table :deep(.n-pagination-quick-jumper-input) {
  background-color: rgba(0, 0, 0, 0.6) !important;
  border-color: rgba(6, 182, 212, 0.4) !important;
  color: #e2e8f0 !important;
}

.cyber-table :deep(.n-pagination-quick-jumper-input:hover) {
  border-color: rgba(6, 182, 212, 0.6) !important;
}

.cyber-table :deep(.n-pagination-quick-jumper-input--focus) {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 5px rgba(6, 182, 212, 0.3) !important;
}

.cyber-table :deep(.n-pagination-prefix) {
  color: #e2e8f0 !important;
  font-family: var(--font-family);
  font-size: 13px;
}

.cyber-table :deep(.n-pagination-size-picker) {
  color: #e2e8f0 !important;
}

.cyber-table :deep(.n-pagination-size-picker .n-base-selection) {
  background-color: rgba(0, 0, 0, 0.6) !important;
  border-color: rgba(6, 182, 212, 0.4) !important;
  color: #e2e8f0 !important;
}

.cyber-table :deep(.n-pagination-size-picker .n-base-selection:hover) {
  border-color: rgba(6, 182, 212, 0.6) !important;
}

.cyber-table :deep(.n-pagination-size-picker .n-base-selection-label) {
  color: #e2e8f0 !important;
}

.cyber-table :deep(.n-input) {
  background-color: rgba(0, 0, 0, 0.6);
  border-color: rgba(6, 182, 212, 0.4);
}

.cyber-table :deep(.n-input__input-el) {
  color: #e2e8f0 !important;
}

.search-input :deep(.n-input) {
  background-color: rgba(0, 0, 0, 0.6) !important;
  border-color: rgba(6, 182, 212, 0.4) !important;
}

.search-input :deep(.n-input__input-el) {
  color: #e2e8f0 !important;
}

.search-input :deep(.n-input:hover) {
  border-color: rgba(6, 182, 212, 0.6) !important;
}

.search-input :deep(.n-input--focus) {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 5px rgba(6, 182, 212, 0.3) !important;
}

/* 响应式 */
@media (max-width: 768px) {
  .data-table-sidebar {
    width: 100%;
    left: 0;
    max-height: 400px;
  }
  
  .toolbar {
    flex-direction: column;
  }
  
  .export-buttons {
    flex-direction: column;
  }
}
</style>

