<template>
  <div class="info-panel">
    <n-grid cols="3" :x-gap="20" :y-gap="20">
      <n-grid-item>
        <n-card :bordered="false" :shadow="'small'" size="small" class="info-card">
          <template #header>
            <h4 class="card-title">探索流程</h4>
          </template>
          <p class="card-content">
            输入主题生成核心节点，点击节点展开其子节点和所有父节点。点击的节点会自动居中显示，已展开的节点会变为绿色。支持径向和层次两种布局模式，逐层构建知识网络。
          </p>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card :bordered="false" :shadow="'small'" size="small" class="info-card">
          <template #header>
            <h4 class="card-title">操作技巧</h4>
          </template>
          <ul class="card-content">
            <li>左键点击空白区域可平移画布，滚轮缩放视图</li>
            <li>悬停节点显示知识卡片，查看节点摘要信息</li>
            <li>右侧配置面板可切换模型（deepseek/doubao/qwen）和调整参数</li>
            <li>顶部可切换径向布局和层次布局，适应不同探索需求</li>
          </ul>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card :bordered="false" :shadow="'small'" size="small" class="info-card">
          <template #header>
            <h4 class="card-title">灵感提示</h4>
          </template>
          <p class="card-content">
            系统会自动识别基础知识并提示无需再拆分。已展开的节点显示为绿色，聚焦节点会居中放大显示。可以切换不同模型来获得不同的知识分解视角，打造个性化的学习路径。
          </p>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup>
import { NCard, NGrid, NGridItem } from 'naive-ui'
</script>

<style scoped>
.info-panel {
  background-color: var(--card-bg);
  padding: 24px 40px;
  box-shadow: 0 -1px 0 var(--border-color);
  border-top: 1px solid var(--border-color);
}

.info-card {
  transition: all 0.3s ease;
  background-color: var(--bg-color) !important;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md) !important;
  border-color: var(--primary-color) !important;
}
.card-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-left: 0;
  color: var(--text-primary);
}

:deep(.n-card-header) {
  padding-bottom: 10px;
}

:deep(.n-card-body) {
  padding-top: 0;
  padding-bottom: 12px;
}

:deep(.n-typography-list-item) {
  margin-bottom: 5px;
}
</style>