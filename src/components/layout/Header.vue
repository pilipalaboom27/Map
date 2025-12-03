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
      <input 
        type="text" 
        id="topicInput" 
        placeholder="输入要学习的主题（如：SVM）"
        v-model="newTopic"
        @keyup.enter="addTopic"
      >
      <button id="addTopicBtn" type="button" @click="addTopic">添加主题</button>
      <button id="clearBtn" type="button" @click="clearCanvas">清空画板</button>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import LayoutSwitcher from '../KnowledgeGraph/LayoutSwitcher.vue'

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
  background-color: white;
  padding: 20px 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.title-block {
  flex: 1;
}

.title-block h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #718096;
  margin-bottom: 12px;
}

.status-tags {
  display: flex;
  gap: 10px;
}

.status-tags span {
  font-size: 12px;
  padding: 4px 12px;
  background-color: #e2e8f0;
  color: #4a5568;
  border-radius: 12px;
  font-weight: 500;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.controls input {
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  width: 250px;
  outline: none;
  transition: border-color 0.2s;
}

.controls input:focus {
  border-color: #667eea;
}

.controls button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

#addTopicBtn {
  background-color: #667eea;
  color: white;
}

#addTopicBtn:hover {
  background-color: #5a67d8;
}

#clearBtn {
  background-color: #f56565;
  color: white;
}

#clearBtn:hover {
  background-color: #e53e3e;
}
</style>