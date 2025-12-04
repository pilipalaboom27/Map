<template>
  <div class="info-panel">
    <n-grid cols="3" :x-gap="20" :y-gap="20">
      <n-grid-item>
        <n-card :bordered="false" :shadow="'small'" size="small" class="info-card">
          <template #header>
            <h4 class="card-title">探索流程</h4>
          </template>
          <p class="card-content">
            输入主题 → 生成核心节点 → 点击节点拓展相关概念，逐层构建知识网络。
          </p>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card :bordered="false" :shadow="'small'" size="small" class="info-card">
          <template #header>
            <h4 class="card-title">操作技巧</h4>
          </template>
          <ul class="card-content">
            <li>拖拽节点自定义布局，滚轮或触控缩放画板</li>
            <li>按住右键/中键或空格+左键即可平移视图</li>
            <li>悬停节点可预览详情</li>
          </ul>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card :bordered="false" :shadow="'small'" size="small" class="info-card">
          <template #header>
            <h4 class="card-title">灵感提示</h4>
          </template>
          <p class="card-content">
            尝试为每个分支添加补充描述，或通过钉住的卡片对比不同概念，打造自己的学习路径。
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