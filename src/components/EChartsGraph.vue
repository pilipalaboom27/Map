<template>
  <div ref="chartRef" class="echarts-graph-container" :style="{ width: width, height: height }"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

// 定义props
const props = defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '800px'
  },
  nodes: {
    type: Array,
    default: () => []
  },
  edges: {
    type: Array,
    default: () => []
  },
  layout: {
    type: String,
    default: 'force'
  }
})

// 定义事件
const emit = defineEmits(['node-click', 'edge-click'])

// 图表实例和DOM引用
const chartRef = ref(null)
let chartInstance = null

// 初始化图表
onMounted(() => {
  initChart()
})

// 初始化图表实例
function initChart() {
  if (!chartRef.value) return
  
  // 创建图表实例
  chartInstance = echarts.init(chartRef.value)
  if (typeof window !== 'undefined') {
    window.__echarts_instance__ = chartInstance
  }
  console.log('[EChartsGraph] 初始化实例，DOM尺寸:', {
    width: chartRef.value.clientWidth,
    height: chartRef.value.clientHeight
  })
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
  
  // 初始渲染
  renderChart()
}

// 渲染图表
function renderChart() {
  if (!chartInstance) return
  
  // 转换数据格式
  const echartsData = convertToEChartsFormat(props.nodes, props.edges)
  console.log('[EChartsGraph] 渲染图表', {
    节点数: echartsData.nodes.length,
    边数: echartsData.edges.length,
    布局: props.layout
  })
  
  // 图表颜色配置，与CSS变量保持一致
  const chartColors = {
    node: 'rgb(95, 219, 111)',          // 对应 --primary-color (绿色)
    edge: '#475569',          
    label: '#ffffff',        
    labelBg: 'rgb(105, 161, 130)',  // 对应 --graph-label-bg (浅绿色)
    primary: 'rgb(95, 219, 111)',       // 对应 --primary-color (绿色)
    textPrimary: '#ffffff',   
    textSecondary: '#ffffff', 
    border: '#2e2e2e',        // 对应 --border-color (深灰色)
    success: '#10b981',      
    warning: '#f59e0b',      
    error: '#ef4444',         
    info: 'rgb(95, 219, 111)'           // 对应 --info-color (绿色)
  };
  
  // 图表配置
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: function(params) {
        if (params.dataType === 'node') {
          return `<div style="background: rgba(30, 41, 59, 1); padding: 10px 14px; border-radius: 8px; border: 1px solid ${chartColors.border}; color: ${chartColors.textPrimary};">
            <div style="font-weight: 500; font-size: 14px; margin-bottom: 4px; color: ${chartColors.primary};">${params.name}</div>
            <div style="font-size: 12px; color: ${chartColors.textSecondary}; line-height: 1.4;">${params.data.description || '无描述'}</div>
          </div>`;
        } else {
          return `<div style="background: rgba(30, 41, 59, 1); padding: 8px 12px; border-radius: 8px; border: 1px solid ${chartColors.border}; color: ${chartColors.textPrimary};">
            <div style="font-size: 13px;">关系: ${params.data.type || '关联'}</div>
          </div>`;
        }
      },
      padding: 0,
      border: 'none',
      shadowBlur: 12,
      shadowColor: 'rgba(0, 0, 0, 1)'
    },
    series: [
      {
        type: 'graph',
        layout: props.layout,
        data: echartsData.nodes,
        links: echartsData.edges,
        roam: true,
        draggable: true,
        // 使用透明矩形占位，让标签与节点坐标完全重合
        symbol: 'rect',
        symbolKeepAspect: true,
        symbolSize(value, params) {
          return params?.data?.symbolSize || [140, 60]
        },
        itemStyle: {
          color: 'rgba(0,0,0,0)',     // 完全透明
          borderColor: 'rgba(0,0,0,0)',
          borderWidth: 0,
          shadowBlur: 0
        },
        emphasis: {
          focus: 'adjacency',
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 600,
            color: chartColors.primary,
            backgroundColor: 'transparent',
            borderWidth: 0,
            borderRadius: 0,
            align: 'center',
            verticalAlign: 'middle'
          },
          lineStyle: {
            width: 5,
            color: chartColors.primary,
            opacity: 1
          }
        },
        lineStyle: {
          color: chartColors.edge,
          width: 2,
          curveness: 0.2,
          opacity: 0.7,
          type: 'solid',
          cap: 'round'
        },
        label: {
          show: true,
          position: 'center',
          formatter: '{b}',
          fontSize: 20,
          fontWeight: 700,
          color: '#ffffff',
          backgroundColor: 'transparent', // 去掉背景块
          padding: 0,
          borderRadius: 0,
          borderWidth: 0,
          borderColor: 'transparent',
          distance: 0,
          align: 'center',
          verticalAlign: 'middle',
          z: 1000
        },
        force: {
          repulsion: 1200,
          edgeLength: [100, 160],
          gravity: 0.15,
          friction: 0.6
        },
        circular: {
          rotateLabel: true
        },
        animationDuration: 1800,
        animationEasingUpdate: 'cubicOut'
      }
    ]
  }
  
  // 设置图表配置
  chartInstance.setOption(option)
  
  // 添加点击事件监听
  chartInstance.on('click', function(params) {
    if (params.dataType === 'node') {
      emit('node-click', params.data)
    } else {
      emit('edge-click', params.data)
    }
  })
}

// 转换数据格式为ECharts所需格式
function convertToEChartsFormat(nodes, edges) {
  return {
    nodes: nodes.map(node => ({
      id: node.id,
      name: node.topic,
      value: node.level || 0,
      description: node.description,
      symbolSize: [
        Math.max(90, Math.min(240, node.width || 160)),
        Math.max(50, Math.min(140, node.height || 60))
      ],
      itemStyle: node.color ? { color: node.color } : undefined
    })),
    edges: edges.map(edge => ({
      source: edge.from,
      target: edge.to,
      type: edge.type || '关联',
      lineStyle: edge.color || edge.width ? {
        color: edge.color,
        width: edge.width
      } : undefined
    }))
  }
}

// 处理窗口大小变化
function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听数据变化
watch(
  [() => props.nodes, () => props.edges, () => props.layout],
  () => {
    renderChart()
  },
  { deep: true }
)

// 组件卸载时清理
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

// 暴露方法
defineExpose({
  resize: handleResize,
  getChartInstance: () => chartInstance
})
</script>

<style scoped>
.echarts-graph-container {
  width: 100%;
  height: 100%;
  background-color: transparent;
  border-radius: 8px;
}
</style>