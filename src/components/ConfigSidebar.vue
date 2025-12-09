<template>
  <div class="config-sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header" @click="toggleCollapse">
      <div class="header-title">
        <span class="icon">⚙</span>
        <span>系统参数配置</span>
      </div>
      <div class="collapse-icon">{{ isCollapsed ? '+' : '-' }}</div>
    </div>
    
    <div class="sidebar-content">
      <n-form label-placement="top" :model="form" class="cyber-form">
        <n-form-item label="核心模型">
          <n-select
            v-model:value="form.model"
            :options="modelOptions"
            placeholder="选择AI核心..."
            filterable
            clearable
            class="cyber-select"
          />
        </n-form-item>
        <n-form-item label="访问密钥 (API Key)">
          <n-input 
            v-model:value="form.apiKey" 
            type="password" 
            show-password-on="click" 
            placeholder="输入密钥..." 
            class="cyber-input"
          />
        </n-form-item>
        <div class="row">
          <n-form-item label="温度 (随机性)" class="col">
            <n-input-number 
              v-model:value="form.temperature" 
              :min="0" :max="1" :step="0.1" 
              class="cyber-input"
            />
          </n-form-item>
          <n-form-item label="最大Token" class="col">
            <n-input-number 
              v-model:value="form.maxTokens" 
              :min="1" :step="100" 
              class="cyber-input"
            />
          </n-form-item>
        </div>
        
        <div class="actions">
          <button class="cyber-btn default" @click="resetToDefault">重置</button>
          <button class="cyber-btn primary" @click="handleSave">保存配置</button>
        </div>
      </n-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSelect } from 'naive-ui'
import { loadUserConfig, saveUserConfig } from '@/services/api/config.js'

const isCollapsed = ref(false)
const toggleCollapse = () => isCollapsed.value = !isCollapsed.value

const modelOptions = [
  { label: 'deepseek-chat', value: 'deepseek-chat' },
  { label: 'doubao-seed-1-6-251015', value: 'doubao-seed-1-6-251015' },
  { label: 'qwen-flash', value: 'qwen-flash' }
]

const form = reactive({
  apiKey: '',
  model: '',
  temperature: '',
  maxTokens: ''
})

const loadConfig = () => {
  const cfg = loadUserConfig() || {}
  form.apiKey = cfg.apiKey || ''
  form.model = cfg.model || ''
  form.temperature = cfg.temperature ?? ''
  form.maxTokens = cfg.maxTokens ?? ''
}

loadConfig()

const handleSave = () => {
  const temp = Number(form.temperature)
  const mt = Number(form.maxTokens)
  const validTemp = !Number.isNaN(temp) && temp >= 0 && temp <= 1
  const validMt = !Number.isNaN(mt) && mt > 0
  if (!validTemp) {
    alert('temperature 应在 0-1 之间')
    return
  }
  if (!validMt) {
    alert('max_tokens 应为正数')
    return
  }
  saveUserConfig({
    apiKey: form.apiKey,
    model: form.model,
    temperature: temp,
    maxTokens: mt
  })
  alert('已保存参数设置')
}

const resetToDefault = () => {
  saveUserConfig({})
  loadConfig()
}
</script>

<style scoped>
.config-sidebar {
  position: absolute;
  top: 140px;
  right: 24px;
  width: 360px; /* 从 300px 增大到 360px */
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-left: 2px solid var(--primary-color); /* 左侧强调线 */
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.5);
  
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
  max-height: 650px; /* 从 600px 增加到 650px */
}

.config-sidebar.collapsed {
  max-height: 52px; /* 从 48px 增加到 52px */
  width: 240px; /* 从 200px 增加到 240px */
  border-left-color: var(--text-muted);
}

.sidebar-header {
  padding: 12px 20px;
  background: rgba(6, 182, 212, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-family); /* 使用全局字体 */
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 1px;
  font-size: 14px; /* 增加标题字号 */
}

.sidebar-content {
  padding: 20px;
}

/* Form Styles */
.cyber-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 表单标签样式 - 使用多重选择器和 !important 确保生效 */
.cyber-form :deep(.n-form-item-label),
.cyber-form :deep(.n-form-item-label__text) {
  color: #e0f7ff !important; /* 非常亮的浅青色，接近白色 */
  font-family: var(--font-family) !important; /* 使用全局字体 */
  font-size: 13px !important; /* 从 11px 增加到 13px */
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: uppercase !important;
  text-shadow: 0 0 8px rgba(6, 182, 212, 0.6), 0 0 3px rgba(255, 255, 255, 0.8) !important;
  background: rgba(0, 0, 0, 0.3) !important;
  padding: 5px 10px !important; /* 增加内边距 */
  border-radius: 2px !important;
  display: inline-block !important;
  margin-bottom: 8px !important; /* 增加下边距 */
}

/* 自定义输入框样式 */
.cyber-input, .cyber-select {
  font-family: var(--font-family); /* 使用全局字体 */
}

.cyber-form :deep(.n-input),
.cyber-form :deep(.n-base-selection) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 0 !important; /* 直角 */
}

.cyber-form :deep(.n-input:hover),
.cyber-form :deep(.n-base-selection:hover),
.cyber-form :deep(.n-input--focus),
.cyber-form :deep(.n-base-selection--active) {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 5px rgba(6, 182, 212, 0.2) !important;
}

.cyber-form :deep(.n-input__input-el),
.cyber-form :deep(.n-base-selection-label) {
  color: var(--text-primary) !important;
  font-size: 14px !important; /* 从 12px 增加到 14px */
  padding: 8px 12px !important; /* 增加内边距 */
}

.cyber-form :deep(.n-input),
.cyber-form :deep(.n-base-selection),
.cyber-form :deep(.n-input-number) {
  min-height: 40px !important; /* 增加输入框高度 */
}

.row {
  display: flex;
  gap: 10px;
}

.col {
  flex: 1;
}

/* Cyber Buttons */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.cyber-btn {
  height: 38px; /* 从 32px 增加到 38px */
  padding: 0 20px; /* 从 16px 增加到 20px */
  font-family: var(--font-family); /* 使用全局字体 */
  font-size: 13px; /* 从 12px 增加到 13px */
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-weight: 600; /* 增加字重 */
}

.cyber-btn.default {
  background: transparent;
  border: 1px solid var(--text-muted);
  color: var(--text-muted);
}

.cyber-btn.default:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.cyber-btn.primary {
  background: var(--primary-color);
  color: #000;
  font-weight: bold;
  box-shadow: 0 0 10px var(--primary-glow);
}

.cyber-btn.primary:hover {
  background: #22d3ee;
  transform: translateY(-1px);
}
</style>

