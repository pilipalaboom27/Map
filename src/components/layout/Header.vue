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
      <div class="theme-switcher">
        <span>🌞</span>
        <el-switch
          v-model="isDarkMode"
          @change="toggleTheme"
          active-text="🌙"
          inactive-text="🌞"
          inline-prompt
          style="--el-switch-on-color: #667eea; --el-switch-off-color: #f093fb;"
        />
        <span>🌙</span>
      </div>
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
import { ref, onMounted } from 'vue'

const emit = defineEmits(['add-topic', 'clear-canvas'])

const newTopic = ref('')
const isDarkMode = ref(false)

// 初始化主题
onMounted(() => {
  // 从localStorage读取主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  }
})

// 切换主题
const toggleTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

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
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
}

/* 暗色主题样式 */
:deep(.dark) .header {
  background-color: var(--surface-2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.title-block {
  flex: 1;
}

.title-block h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

:deep(.dark) .title-block h1 {
  color: var(--text-primary);
}

.subtitle {
  font-size: 14px;
  color: #718096;
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

:deep(.dark) .subtitle {
  color: var(--text-secondary);
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
  transition: all 0.3s ease;
}

:deep(.dark) .status-tags span {
  background-color: var(--surface-3);
  color: var(--text-tertiary);
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

/* 主题切换器样式 */
.theme-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f7fafc;
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.dark) .theme-switcher {
  background-color: var(--surface-3);
}

.theme-switcher span {
  font-size: 18px;
  line-height: 1;
  transition: all 0.3s ease;
}

:deep(.dark) .theme-switcher span {
  color: var(--text-primary);
}

.controls input {
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  width: 250px;
  outline: none;
  transition: all 0.3s ease;
  background-color: white;
  color: #2d3748;
}

:deep(.dark) .controls input {
  background-color: var(--surface-3);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:deep(.dark) .controls input::placeholder {
  color: var(--text-muted);
}

.controls input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

:deep(.dark) .controls input:focus {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.controls button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

#addTopicBtn {
  background-color: #667eea;
  color: white;
}

#addTopicBtn:hover {
  background-color: #5a67d8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

#clearBtn {
  background-color: #f56565;
  color: white;
}

#clearBtn:hover {
  background-color: #e53e3e;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .controls {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .controls input {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 15px 20px;
  }
  
  .title-block h1 {
    font-size: 24px;
  }
  
  .controls {
    gap: 10px;
  }
  
  .controls input {
    width: 180px;
  }
  
  .controls button {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>