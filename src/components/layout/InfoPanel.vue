<template>
  <div class="info-panel">
    <div class="info-grid">
      <div class="info-card">
        <h4>探索流程</h4>
        <p>输入主题 → 生成核心节点 → 点击节点拓展相关概念，逐层构建知识网络。</p>
      </div>
      <div class="info-card">
        <h4>操作技巧</h4>
        <ul>
          <li>拖拽节点自定义布局，滚轮或触控缩放画板</li>
          <li>按住右键/中键或空格+左键即可平移视图</li>
          <li>悬停节点可预览详情</li>
        </ul>
      </div>
      <div class="info-card">
        <h4>灵感提示</h4>
        <p>尝试为每个分支添加补充描述，或通过钉住的卡片对比不同概念，打造自己的学习路径。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 不需要任何逻辑，纯展示组件
</script>

<style scoped>
.info-panel {
  background-color: white;
  padding: 20px 30px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-card {
  padding: 15px;
  background-color: #f7fafc;
  border-radius: 8px;
}

.info-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 10px;
}

.info-card p, .info-card ul {
  font-size: 13px;
  color: #718096;
  line-height: 1.6;
}

.info-card ul {
  padding-left: 20px;
}

.info-card li {
  margin-bottom: 5px;
}
</style>