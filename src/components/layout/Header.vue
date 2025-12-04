<template>
  <header class="header">
    <div class="title-block">
      <h1>知识探索画板</h1>
      <p class="subtitle">以更直观的方式串联概念、比较知识，沉浸式探索你的学习地图。</p>
      <div class="status-tags">
        <span>实时生成</span>
        <span>智能布局</span>
        <span>Hover 预览</span>
      </div>
    </div>
    <div class="controls">
      <LayoutSwitcher />
      <div class="input-control-group">
        <n-input 
          v-model:value="newTopic" 
          placeholder="输入要学习的主题（如：SVM）"
          @keyup.enter="addTopic"
          size="medium"
          :round="false"
          :bordered="false"
          :style="{
            backgroundColor: 'var(--input-bg)',
            borderRadius: '0',
            color: 'var(--text-primary)'
          }"
        />
        <n-button 
          type="primary" 
          @click="addTopic" 
          :round="false"
          :bordered="false"
          :style="{
            height: '40px',
            backgroundColor: 'var(--primary-color)',
            border: '1px solid var(--primary-color)',
            borderRadius: '0',
            color: '#fff'
          }"
        >
          添加主题
        </n-button>
      </div>
      <n-button 
        type="error" 
        @click="clearCanvas" 
        :round="false"
        :bordered="false"
        :style="{
          height: '40px',
          backgroundColor: 'transparent',
          borderRadius: '0',
          color: 'var(--error-color)'
        }"
      >
        清空画板
      </n-button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import LayoutSwitcher from '../KnowledgeGraph/LayoutSwitcher.vue'
import { NInput, NButton, NInputGroup } from 'naive-ui'

const emit = defineEmits(['add-topic', 'clear-canvas'])

const newTopic = ref('')

const addTopic = () => {
  if (newTopic.value.trim()) {
    emit('add-topic', newTopic.value)
    newTopic.value = ''
  } else {
    alert('请输入主题名称')
  }
}

const clearCanvas = () => {
  if (confirm('确定要清空画板吗？')) {
    emit('clear-canvas')
  }
}
</script>

<style scoped>
.header {
  background-color: var(--card-bg);
  padding: 24px 40px;
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border-color);
}

.title-block {
  
  flex: 1;
  min-width: 300px;
}

.title-block h1 {
  font-family: var(--font-family);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.status-tags {
  display: flex;
  gap: 10px;
}

.status-tags span {
  font-size: 12px;
  padding: 4px 12px;
  background-color: transparent;
  color: var(--text-primary);
  border-radius: 0;
  background-color: rgb(41, 41, 41);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.input-control-group {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--bg-color);
  border-radius: 0;
  overflow: hidden;
}

.input-control-group :deep(.n-input-wrapper) {
  height: 40px;
  border-radius: 0;
  background: transparent;
  border: none;
}

.input-control-group :deep(.n-input__input-el) {
  height: 40px;
  background: transparent;
  color: var(--text-primary);
}

.input-control-group :deep(.n-input__input-el::placeholder) {
  height: 40px;
  color: var(--text-muted);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .title-block {
    width: 100%;
    text-align: center;
  }
}
</style>