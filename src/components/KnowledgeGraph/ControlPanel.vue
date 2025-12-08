<template>
  <div class="control-panel">
    <el-card shadow="hover" class="control-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">图谱控制面板</span>
        </div>
      </template>
      
      <div class="control-section">
        <div class="section-title">布局选项</div>
        <el-radio-group v-model="currentLayout" size="small" @change="switchLayout">
          <el-radio-button v-for="layout in layouts" :key="layout.name" :label="layout.name">
            <span class="layout-icon">{{ layout.icon }}</span>
            <span class="layout-label">{{ layout.label }}</span>
          </el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="control-section">
        <div class="section-title">视图控制</div>
        <div class="view-controls">
          <el-tooltip content="自适应缩放" placement="top">
            <el-button type="primary" size="small" icon="FullScreen" @click="handleFitToView" />
          </el-tooltip>
          <el-tooltip content="重置视图" placement="top">
            <el-button type="success" size="small" icon="RefreshRight" @click="handleResetView" />
          </el-tooltip>
        </div>
      </div>
      
      <div class="control-section">
        <div class="section-title">操作提示</div>
        <div class="tips">
          <el-alert title="提示" type="info" :closable="false">
            <ul>
              <li>点击节点可展开相关概念</li>
              <li>拖拽节点可调整位置</li>
              <li>鼠标滚轮可缩放图谱</li>
              <li>拖拽空白处可平移图谱</li>
            </ul>
          </el-alert>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'

const store = useGraphStore()

const emit = defineEmits(['fit-to-view', 'reset-view'])

// 布局选项
const layouts = [
  { 
    name: 'radial', 
    label: '径向', 
    description: '聚焦节点在中心，子节点圆形分布'
  },
  { 
    name: 'hierarchical', 
    label: '层次', 
    description: '层级化布局，清晰展示父子关系' 
  }
]

// 当前布局
const currentLayout = computed({
  get: () => store.layoutType,
  set: (val) => switchLayout(val)
})

// 切换布局
const switchLayout = (layoutName) => {
  store.switchLayout(layoutName)
  console.log('🔄 切换布局:', layoutName)
}

// 自适应缩放
const handleFitToView = () => {
  emit('fit-to-view')
}

// 重置视图
const handleResetView = () => {
  emit('reset-view')
}
</script>

<style scoped>
.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: var(--z-index-card);
  width: 280px;
}

.control-card {
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid #e8e8e8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 700;
  color: #000000;
}

.control-section {
  margin-bottom: 20px;
}

.control-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 12px;
}

.layout-icon {
  margin-right: 6px;
  font-size: 16px;
}

.layout-label {
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  color: #000000;
}

.view-controls {
  display: flex;
  gap: 8px;
}

.tips {
  font-size: 13px;
  line-height: 1.5;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
}

.tips li {
  margin-bottom: 6px;
  color: #000000;
  font-weight: 400;
}

/* 调整 Element Plus 组件样式 */
:deep(.el-radio-button__inner) {
  font-size: 13px;
  font-weight: 500;
  color: #000000;
  background-color: #ffffff;
  border-color: #dcdfe6;
}

:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  color: #ffffff;
  background-color: #91c4f7;
  border-color: #84c0fc;
}

:deep(.el-button) {
  font-size: 13px;
  font-weight: 500;
}

:deep(.el-alert) {
  background-color: #f0f9ff;
  border-color: #b3d8ff;
}

:deep(.el-alert__title) {
  font-size: 14px;
  font-weight: 600;
  color: #000000;
}

:deep(.el-alert__content) {
  font-size: 13px;
  color: #000000;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-panel {
    width: 100%;
    right: 0;
    left: 0;
    top: auto;
    bottom: 20px;
    margin: 0 20px;
  }
  
  .layout-label {
    display: none;
  }
  
  .layout-icon {
    margin-right: 0;
  }
}
</style>