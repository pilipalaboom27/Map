<template>
  <div class="header-container">
    <header class="header">
      <div class="title-block">
        <div class="logo-area">
          <div class="logo-icon"></div>
          <h1>深空知识图谱 <span class="highlight">MAP</span></h1>
        </div>
        <div class="status-tags">
          <span class="tag">实时渲染</span>
          <span class="tag">神经网络</span>
          <span class="tag active">在线</span>
        </div>
      </div>
      
      <div class="controls">
        <LayoutSwitcher />
        
        <div class="hud-input-group">
          <div class="input-wrapper">
            <span class="prompt">></span>
            <n-input 
              v-model:value="newTopic" 
              placeholder="输入探索目标..."
              @keyup.enter="addTopic"
              :bordered="false"
              class="hud-input"
            />
          </div>
          <button class="hud-btn primary" @click="addTopic">
            <span class="btn-text">启动探索</span>
            <div class="btn-glitch"></div>
          </button>
        </div>

        <button class="hud-btn danger" @click="clearCanvas">
          <span class="btn-text">清空画板</span>
        </button>

        <div class="export-group">
          <button class="hud-btn secondary" @click="handleExport('png')">
            <span class="btn-text">导出 PNG</span>
          </button>
          <button class="hud-btn secondary" @click="handleExport('svg')">
            <span class="btn-text">导出 SVG</span>
          </button>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LayoutSwitcher from '../KnowledgeGraph/LayoutSwitcher.vue'
import { NInput } from 'naive-ui'
import { exportGraphAsPng, exportGraphAsSvg } from '@/utils/exportGraph.js'

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
  emit('clear-canvas')
}

const handleExport = async (type) => {
  try {
    if (type === 'png') {
      await exportGraphAsPng()
    } else {
      await exportGraphAsSvg()
    }
  } catch (e) {
    alert('导出失败: ' + e.message)
  }
}

</script>

<style scoped>
.header-container {
  position: absolute;
  top: 24px;
  left: 0;
  right: 0;
  width: 100%;
  max-width: none;
  padding: 0 24px;
  box-sizing: border-box;
  z-index: 100;
}

.header {
  background: rgba(2, 6, 23, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 4px; /* 切角风格通常配合小圆角 */
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  
  /* 底部发光条 */
  box-shadow: 
    0 0 0 1px rgba(6, 182, 212, 0.1),
    0 10px 20px -5px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}

/* 顶部装饰线 */
.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
  opacity: 0.5;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 24px;
  height: 24px;
  border: 2px solid var(--primary-color);
  transform: rotate(45deg);
  position: relative;
  box-shadow: 0 0 10px var(--primary-glow);
}

.logo-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  transform: translate(-50%, -50%);
}

.title-block h1 {
  font-family: var(--font-family); /* 使用全局字体 */
  font-size: 22px; /* 从 20px 增加到 22px */
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
}

.highlight {
  color: var(--primary-color);
}

.status-tags {
  display: flex;
  gap: 8px;
}

.tag {
  font-family: var(--font-family); /* 使用全局字体 */
  font-size: 11px; /* 从 10px 增加到 11px */
  padding: 3px 8px; /* 从 2px 6px 增加 */
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: var(--text-secondary);
  border-radius: 2px;
}

.tag.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(6, 182, 212, 0.1);
  box-shadow: 0 0 5px rgba(6, 182, 212, 0.2);
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* HUD Input Group */
.hud-input-group {
  display: flex;
  align-items: stretch;
  background: rgba(0, 0, 0, 0.6); /* 加深背景 */
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5); /* 内部阴影，增加深度 */
}

.input-wrapper {
  display: flex;
  align-items: center;
  padding-left: 12px;
  width: 240px;
}

.prompt {
  color: var(--primary-color);
  font-weight: bold;
  margin-right: 4px;
  font-family: var(--font-family-mono); /* 提示符保持等宽字体 */
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.hud-input {
  background: transparent;
  font-family: var(--font-family); /* 使用新字体 */
  font-size: 14px;
  font-weight: 500; /* 稍微加粗 */
  color: #ffffff; /* 纯白文字 */
}

:deep(.n-input .n-input__input-el) {
  color: #000000 !important; /* 强制纯白 */
  caret-color: var(--primary-color);
  font-size: 14px !important;
  font-family: var(--font-family) !important;
  font-weight: 500 !important;
}

:deep(.n-input__placeholder) {
  color: rgba(255, 255, 255, 0.4) !important; /* 占位符颜色调整 */
}

/* HUD Buttons */
.hud-btn {
  position: relative;
  height: 38px; /* 从 36px 增加到 38px */
  padding: 0 22px; /* 从 20px 增加到 22px */
  font-family: var(--font-family); /* 使用全局字体 */
  font-size: 13px; /* 从 12px 增加到 13px */
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hud-btn.primary {
  background: var(--primary-color);
  color: #000;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}

.hud-btn.secondary {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary);
  border: 1px solid rgba(255,255,255,0.15);
}

.hud-btn.secondary:hover {
  background: rgba(255,255,255,0.15);
  color: var(--primary-color);
  box-shadow: 0 0 10px rgba(6,182,212,0.3);
}

.hud-btn.primary:hover {
  background: #22d3ee; /* Cyan 400 */
  box-shadow: 0 0 15px var(--primary-glow);
}

.hud-btn.danger {
  background: transparent;
  border: 1px solid var(--accent-color);
  color: var(--accent-color);
  border-radius: 2px;
}

.hud-btn.danger:hover {
  background: rgba(244, 114, 182, 0.1);
  box-shadow: 0 0 10px rgba(244, 114, 182, 0.3);
}

.export-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-container {
    width: 95%;
    top: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .hud-input-group {
    width: 100%;
  }
  
  .input-wrapper {
    width: 100%;
  }
}
</style>
