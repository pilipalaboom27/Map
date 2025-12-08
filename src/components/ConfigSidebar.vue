<template>
  <div class="config-sidebar">
    <div class="sidebar-header">参数设置</div>
    <n-form label-placement="top" :model="form" class="form">
      <n-form-item label="模型">
        <n-select
          v-model:value="form.model"
          :options="modelOptions"
          placeholder="选择模型"
          filterable
          clearable
        />
      </n-form-item>
      <n-form-item label="API Key">
        <n-input v-model:value="form.apiKey" type="password" show-password-on="click" placeholder="可选，使用自己的API Key" />
      </n-form-item>
      <n-form-item label="temperature (0-1)">
        <n-input-number v-model:value="form.temperature" :min="0" :max="1" :step="0.1" style="width: 100%;  " />
      </n-form-item>
      <n-form-item label="max_tokens">
        <n-input-number v-model:value="form.maxTokens" :min="1" :step="100" style="width: 100%;" />
      </n-form-item>
      <div class="actions">
        <n-button type="default" @click="resetToDefault">重置</n-button>
        <n-button type="primary" @click="handleSave">保存</n-button>
      </div>
    </n-form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSelect, NButton } from 'naive-ui'
import { loadUserConfig, saveUserConfig } from '@/services/api/config.js'

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
  top: 16px;
  right: 16px;
  width: 260px;
  padding: 12px;
  background: transparent;
  color: #ffffff;
  border: 1px solid #7bda97;
  box-shadow: none;
  overflow: hidden;
  opacity: 1;
}

.sidebar-header {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #ffffff;
}
.form :deep(.n-form-item-label__text) {
  color: #ffffff;
}

.form :deep(.n-input),
.form :deep(.n-input__input-el),
.form :deep(.n-input__input),
.form :deep(.n-input-number),
.form :deep(.n-input__state-border),
.form :deep(.n-base-selection),
.form :deep(.n-base-selection-label) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: #b8b8b8 !important;
}

/* 下拉弹层文字颜色 */
.form :deep(.n-base-select-option__content),
.form :deep(.n-base-selection-overlay__wrapper),
.form :deep(.n-base-select-menu),
.form :deep(.n-base-select-menu .n-base-select-option__label) {
  color: #b8b8b8 !important;
}

/* 占位符颜色 */
.form :deep(.n-input__input-el::placeholder),
.form :deep(.n-base-selection-placeholder) {
  color: #b8b8b8 !important;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

/* 重置按钮文字颜色 */
.actions :deep(.n-button--default-type),
.actions :deep(.n-button--default-type .n-button__content),
.actions :deep(.n-button--default-type:hover),
.actions :deep(.n-button--default-type:hover .n-button__content) {
  color: #ffffff !important;
}
</style>

