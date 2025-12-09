<template>
  <div class="minimap" @mousedown.stop>
    <svg :width="width" :height="height">
      <g :transform="miniTransform">
        <line
          v-for="edge in edges"
          :key="edge.id"
          :x1="edge.source?.x || 0"
          :y1="edge.source?.y || 0"
          :x2="edge.target?.x || 0"
          :y2="edge.target?.y || 0"
          stroke="rgba(255,255,255,0.2)"
          stroke-width="1"
        />
        <circle
          v-for="node in nodes"
          :key="node.id"
          :cx="node.x || 0"
          :cy="node.y || 0"
          r="3"
          fill="rgba(6,182,212,0.8)"
        />
      </g>
      <rect
        class="viewport"
        :x="viewport.x" :y="viewport.y"
        :width="viewport.w" :height="viewport.h"
        fill="rgba(6,182,212,0.1)"
        stroke="rgba(6,182,212,0.8)"
        stroke-width="1"
        @mousedown.prevent="startDrag"
      />
    </svg>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  edges: { type: Array, default: () => [] },
  viewTransform: { type: Object, default: () => ({ k: 1, x: 0, y: 0 }) }, // { k, x, y }
  width: { type: Number, default: 160 },
  height: { type: Number, default: 120 },
  canvasSize: { type: Object, default: () => ({ w: 1000, h: 800 }) }
})
const emit = defineEmits(['pan-to'])

const scale = ref(0.15)
const miniTransform = ref('')
const viewport = ref({ x: 0, y: 0, w: 50, h: 50 })
let dragging = false
let start = { x: 0, y: 0 }

watch(() => [props.viewTransform, props.canvasSize], ([vt, cs]) => {
  if (!vt || !cs) return
  viewport.value = {
    x: (-vt.x / vt.k) * scale.value,
    y: (-vt.y / vt.k) * scale.value,
    w: (cs.w / vt.k) * scale.value,
    h: (cs.h / vt.k) * scale.value
  }
  miniTransform.value = `scale(${scale.value}) translate(0,0)`
}, { immediate: true, deep: true })

const startDrag = (e) => {
  dragging = true
  start = { x: e.clientX, y: e.clientY }
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

const onDrag = (e) => {
  if (!dragging) return
  const dx = (e.clientX - start.x) / scale.value
  const dy = (e.clientY - start.y) / scale.value
  start = { x: e.clientX, y: e.clientY }
  emit('pan-to', { dx, dy })
}

const stopDrag = () => {
  dragging = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}
</script>

<style scoped>
.minimap {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 160px;
  height: 120px;
  background: rgba(2, 6, 23, 0.8);
  border: 1px solid rgba(6, 182, 212, 0.3);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  z-index: 20;
}
.viewport { cursor: move; }
</style>


