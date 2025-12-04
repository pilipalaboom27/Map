<template>
  <n-drawer
    :show="show"
    @update:show="handleDrawerClose"
    :width="400"
    placement="right"
    title="实体编辑"
    :mask-closable="false"
  >
    <n-form 
      ref="formRef"
      :model="formData" 
      :rules="rules"
      label-placement="top"
      size="medium"
    >
      <n-form-item label="实体名称" path="name">
        <n-input 
          v-model:value="formData.name" 
          placeholder="请输入实体名称"
          clearable
        />
      </n-form-item>
      
      <n-form-item label="实体描述" path="description">
        <n-input 
          v-model:value="formData.description" 
          placeholder="请输入实体描述"
          type="textarea"
          :rows="4"
          resize="vertical"
        />
      </n-form-item>
      
      <n-form-item label="实体类型">
        <n-select 
          v-model:value="formData.type" 
          placeholder="请选择实体类型"
          clearable
        >
          <option value="concept">概念</option>
          <option value="theory">理论</option>
          <option value="method">方法</option>
          <option value="tool">工具</option>
          <option value="application">应用</option>
        </n-select>
      </n-form-item>
      
      <n-form-item label="相关实体">
        <n-select 
          v-model:value="formData.relatedEntities" 
          placeholder="请选择相关实体"
          multiple
          clearable
        >
          <option 
            v-for="entity in availableEntities" 
            :key="entity.id" 
            :value="entity.id"
          >
            {{ entity.topic }}
          </option>
        </n-select>
      </n-form-item>
      
      <div class="form-actions">
        <n-button type="primary" @click="handleSubmit" :loading="submitting">
          保存
        </n-button>
        <n-button @click="show = false">取消</n-button>
      </div>
    </n-form>
  </n-drawer>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { NDrawer, NForm, NFormItem, NInput, NSelect, NButton } from 'naive-ui'

// ========== Props & Emits ==========
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  entity: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:show', 'save', 'cancel'])

// ========== Store ==========
const store = useGraphStore()

// ========== Refs ==========
const formRef = ref(null)
const submitting = ref(false)

// ========== Form Data ==========
const formData = reactive({
  name: '',
  description: '',
  type: 'concept',
  relatedEntities: []
})

// ========== Form Rules ==========
const rules = {
  name: [
    { required: true, message: '请输入实体名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// ========== Computed ==========
const availableEntities = computed(() => {
  // 过滤掉当前实体（如果是编辑模式）
  return store.nodes.filter(node => !props.entity || node.id !== props.entity.id)
})

// ========== Watchers ==========
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      resetForm()
    }
  }
)

watch(
  () => props.entity,
  (newVal) => {
    if (newVal) {
      loadEntityData(newVal)
    }
  }
)

// ========== Methods ==========

/**
 * 重置表单
 */
function resetForm() {
  if (formRef.value) {
    formRef.value.reset()
  }
  
  Object.assign(formData, {
    name: '',
    description: '',
    type: 'concept',
    relatedEntities: []
  })
  
  if (props.entity) {
    loadEntityData(props.entity)
  }
}

/**
 * 加载实体数据
 */
function loadEntityData(entity) {
  Object.assign(formData, {
    name: entity.topic || '',
    description: entity.description || '',
    type: entity.type || 'concept',
    relatedEntities: [] // 后续可以从关系中提取
  })
}

/**
 * 处理表单提交
 */
async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    submitting.value = true
    await formRef.value.validate()
    
    const entityData = {
      id: props.entity?.id || null,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      relatedEntities: formData.relatedEntities
    }
    
    emit('save', entityData)
    emit('update:show', false)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

/**
 * 处理抽屉关闭
 */
function handleDrawerClose(showValue) {
  emit('update:show', showValue)
}
</script>

<style scoped>
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>