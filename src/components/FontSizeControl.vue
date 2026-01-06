<template>
  <div class="font-size-control">
    <el-button
      :icon="Setting"
      circle
      class="control-button"
      @click="showPanel = !showPanel"
    />
    <div v-if="showPanel" class="control-panel">
      <div class="panel-header">
        <span>字体大小</span>
        <el-button text :icon="Close" @click="showPanel = false" />
      </div>
      <div class="panel-content">
        <el-slider
          v-model="fontSize"
          :min="12"
          :max="24"
          :step="1"
          show-input
          @change="handleFontSizeChange"
        />
        <div class="preset-buttons">
          <el-button size="small" @click="setFontSize(12)">小</el-button>
          <el-button size="small" @click="setFontSize(14)">中</el-button>
          <el-button size="small" @click="setFontSize(16)">大</el-button>
          <el-button size="small" @click="setFontSize(18)">特大</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Setting, Close } from '@element-plus/icons-vue'

const showPanel = ref(false)
const fontSize = ref(14)

// 设置字体大小
const setFontSize = (size) => {
  fontSize.value = size
  handleFontSizeChange(size)
}

// 处理字体大小改变
const handleFontSizeChange = (size) => {
  document.documentElement.style.setProperty('--base-font-size', `${size}px`)
  localStorage.setItem('fontSize', size.toString())
}

// 初始化
onMounted(() => {
  const savedFontSize = localStorage.getItem('fontSize')
  if (savedFontSize) {
    fontSize.value = parseInt(savedFontSize)
    document.documentElement.style.setProperty('--base-font-size', `${savedFontSize}px`)
  }
})
</script>

<style scoped>
.font-size-control {
  position: fixed;
  top: 30px;
  right: 30px;
  z-index: 9999;
}

.control-button {
  width: 50px;
  height: 50px;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-panel {
  position: absolute;
  top: 70px;
  right: 0;
  width: 280px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.preset-buttons .el-button {
  flex: 1;
}

@media screen and (max-width: 768px) {
  .font-size-control {
    top: 20px;
    right: 20px;
  }

  .control-button {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .control-panel {
    width: 240px;
    top: 60px;
  }
}
</style>

