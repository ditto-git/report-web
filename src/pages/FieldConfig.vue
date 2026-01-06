<template>
  <div class="field-config">
    <div class="header">
      <h2>字段配置</h2>
      <div class="header-right">
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入关键词搜索"
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="header-buttons">
          <el-button 
            type="primary" 
            :icon="Download"
            @click="handleDownload"
          >
            配置下载
          </el-button>
          <el-button 
            type="success" 
            :icon="Upload"
            @click="handleUpload"
          >
            配置上传
          </el-button>
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <div class="table-header-controls">
        <el-button 
          :icon="showHiddenFields ? View : Hide"
          @click="showHiddenFields = !showHiddenFields"
          size="small"
        >
          展示隐藏字段
        </el-button>
        <el-button 
          :icon="Document"
          @click="handleDownloadManual"
          size="small"
        >
          下载公式说明书
        </el-button>
      </div>
      <el-table 
        :data="filteredTableData" 
        border 
        stripe
        style="width: 100%"
        class="field-config-table"
      >
        <el-table-column 
          type="index" 
          label="序号" 
          width="80" 
          align="center"
        />
        <el-table-column prop="cellCode" label="单元格编码" min-width="120">
          <template #default="{ row }">
            <el-tooltip
              :content="row.cellCode || '-'"
              placement="top"
              :disabled="!row.cellCode || String(row.cellCode).length <= 15"
            >
              <span class="text-ellipsis">
                {{ row.cellCode || '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column 
          v-if="showHiddenFields"
          prop="templateCode" 
          label="模板编码" 
          min-width="120"
        >
          <template #default="{ row }">
            <el-tooltip
              :content="row.templateCode || '-'"
              placement="top"
              :disabled="!row.templateCode || String(row.templateCode).length <= 15"
            >
              <span class="text-ellipsis">
                {{ row.templateCode || '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="cellProperty" label="单元格属性" min-width="120">
          <template #default="{ row }">
            <el-tooltip
              :content="row.cellProperty || '-'"
              placement="top"
              :disabled="!row.cellProperty || String(row.cellProperty).length <= 15"
            >
              <span class="text-ellipsis">
                {{ row.cellProperty || '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="cellHead" label="表头" min-width="100">
          <template #default="{ row }">
            <el-input 
              v-if="row.isEditing"
              v-model="row.cellHead"
              @blur="handleBlur(row, 'cellHead')"
            />
            <span 
              v-else
              @dblclick="handleRowClick(row)"
              class="editable-cell"
            >
              {{ row.cellHead || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="headContent" label="表头内容" min-width="120">
          <template #default="{ row }">
            <el-input 
              v-if="row.isEditing"
              v-model="row.headContent"
              @blur="handleBlur(row, 'headContent')"
            />
            <el-tooltip
              v-else
              :content="row.headContent || '-'"
              placement="top"
              :disabled="!row.headContent || String(row.headContent).length <= 15"
            >
              <span 
                @dblclick="handleRowClick(row)"
                class="editable-cell text-ellipsis"
              >
                {{ row.headContent || '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="cellStartRow" label="起始行" min-width="100" align="center">
          <template #default="{ row }">
            <el-input-number 
              v-if="row.isEditing"
              v-model="row.cellStartRow"
              :min="0"
              @blur="handleBlur(row, 'cellStartRow')"
            />
            <span 
              v-else
              @dblclick="handleRowClick(row)"
              class="editable-cell"
            >
              {{ row.cellStartRow ?? '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cellStartCol" label="起始列" min-width="100" align="center">
          <template #default="{ row }">
            <el-input-number 
              v-if="row.isEditing"
              v-model="row.cellStartCol"
              :min="0"
              @blur="handleBlur(row, 'cellStartCol')"
            />
            <span 
              v-else
              @dblclick="handleRowClick(row)"
              class="editable-cell"
            >
              {{ row.cellStartCol ?? '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cellIndex" label="单元格索引" min-width="120" align="center">
          <template #default="{ row }">
            <el-input-number 
              v-if="row.isEditing"
              v-model="row.cellIndex"
              :min="0"
              @blur="handleBlur(row, 'cellIndex')"
            />
            <span 
              v-else
              @dblclick="handleRowClick(row)"
              class="editable-cell"
            >
              {{ row.cellIndex ?? '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cellFormula" label="数据公式" min-width="200">
          <template #default="{ row }">
            <el-input 
              v-if="row.isEditing"
              v-model="row.cellFormula"
              @blur="handleBlur(row, 'cellFormula')"
            />
            <el-tooltip
              v-else
              :content="row.cellFormula || '-'"
              placement="top"
              :disabled="!row.cellFormula || String(row.cellFormula).length <= 20"
            >
              <span 
                @dblclick="handleRowClick(row)"
                class="editable-cell text-ellipsis"
              >
                {{ row.cellFormula || '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column 
          v-if="showHiddenFields"
          prop="headFormula" 
          label="表头公式" 
          min-width="200"
        >
          <template #default="{ row }">
            <el-tooltip
              :content="row.headFormula || '-'"
              placement="top"
              :disabled="!row.headFormula || String(row.headFormula).length <= 20"
            >
              <span class="text-ellipsis">
                {{ row.headFormula || '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <div v-if="row.isEditing" class="action-buttons">
              <el-button 
                type="primary" 
                size="small"
                @click="handleSaveRow(row)"
              >
                保存
              </el-button>
              <el-button 
                size="small"
                @click="handleCancelRow(row)"
              >
                取消
              </el-button>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="配置上传"
      width="500px"
    >
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :before-upload="beforeUpload"
        accept=".json"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 JSON 格式文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Download, Upload, View, Hide, Document, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()

// 搜索关键字
const searchKeyword = ref('')

// 是否显示隐藏字段
const showHiddenFields = ref(false)

// 上传对话框
const uploadDialogVisible = ref(false)
const uploadRef = ref(null)
const uploadFile = ref(null)

// 表格数据
const tableData = ref([
  {
    cellCode: 'A001',
    templateCode: 'T001',
    cellProperty: '文本',
    cellHead: '姓名',
    headContent: '员工姓名',
    cellStartRow: 1,
    cellStartCol: 1,
    cellIndex: 0,
    cellFormula: '=SUM(A1:A10)',
    headFormula: '=CONCATENATE("表头",B1)',
    isEditing: false,
    originalData: null
  },
  {
    cellCode: 'A002',
    templateCode: 'T001',
    cellProperty: '数字',
    cellHead: '年龄',
    headContent: '员工年龄',
    cellStartRow: 1,
    cellStartCol: 2,
    cellIndex: 1,
    cellFormula: '=AVERAGE(B1:B10)',
    headFormula: '=CONCATENATE("表头",B2)',
    isEditing: false,
    originalData: null
  },
  {
    cellCode: 'A003',
    templateCode: 'T002',
    cellProperty: '日期',
    cellHead: '入职日期',
    headContent: '员工入职日期',
    cellStartRow: 1,
    cellStartCol: 3,
    cellIndex: 2,
    cellFormula: '=TODAY()',
    headFormula: '=CONCATENATE("表头",B3)',
    isEditing: false,
    originalData: null
  }
])

// 过滤后的数据
const filteredTableData = computed(() => {
  if (!searchKeyword.value) {
    return tableData.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return tableData.value.filter(row => {
    return Object.values(row).some(val => 
      val && String(val).toLowerCase().includes(keyword)
    )
  })
})

// 搜索
const handleSearch = () => {
  // 搜索逻辑已在 computed 中实现
}

// 点击行进入编辑模式
const handleRowClick = (row) => {
  if (row.isEditing) return
  row.originalData = { ...row }
  row.isEditing = true
}

// 保存行
const handleSaveRow = (row) => {
  // 这里可以添加验证逻辑
  row.isEditing = false
  row.originalData = null
  ElMessage.success('保存成功')
}

// 取消编辑
const handleCancelRow = (row) => {
  if (row.originalData) {
    Object.assign(row, row.originalData)
  }
  row.isEditing = false
  row.originalData = null
}

// 失焦处理
const handleBlur = (row, field) => {
  // 可以在这里添加字段验证
}

// 配置下载
const handleDownload = () => {
  const dataStr = JSON.stringify(tableData.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `字段配置_${new Date().getTime()}.json`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
  ElMessage.success('配置下载成功')
}

// 配置上传
const handleUpload = () => {
  uploadDialogVisible.value = true
}

// 文件改变
const handleFileChange = (file) => {
  uploadFile.value = file
}

// 上传前验证
const beforeUpload = (file) => {
  const isJSON = file.type === 'application/json' || file.name.endsWith('.json')
  if (!isJSON) {
    ElMessage.error('只能上传 JSON 格式文件')
    return false
  }
  return false // 阻止自动上传
}

// 确认上传
const confirmUpload = () => {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      tableData.value = data
      ElMessage.success('配置上传成功')
      uploadDialogVisible.value = false
      uploadFile.value = null
    } catch (error) {
      ElMessage.error('文件格式错误，请检查 JSON 格式')
    }
  }
  reader.readAsText(uploadFile.value.raw)
}

// 下载公式说明书
const handleDownloadManual = () => {
  ElMessage.info('公式说明书下载功能')
  // 这里可以实现实际的下载逻辑
}
</script>

<style scoped>
.field-config {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: clamp(0.75rem, 2vw, 2rem);
  background: #fff;
  box-sizing: border-box;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 2.5vw, 1.5rem);
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
}

.header h2 {
  margin: 0;
  font-size: clamp(1.125rem, 2vw, 1.75rem);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  gap: clamp(0.75rem, 2vw, 1.5rem);
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  position: relative;
  min-height: 40px;
}

.search-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  z-index: 1;
}

.search-input {
  width: 100%;
}

.header-buttons {
  display: flex;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  align-items: center;
  flex-wrap: wrap;
  flex-shrink: 0;
  margin-left: auto;
  z-index: 2;
  position: relative;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  margin-bottom: clamp(1rem, 2.5vw, 1.5rem);
}

.table-header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.field-config-table {
  width: 100%;
  font-size: clamp(1rem, 1.2vw, 1.125rem);
}

.field-config-table :deep(.el-table__cell) {
  padding: clamp(0.5rem, 1.2vw, 1rem) clamp(0.5rem, 1.5vw, 1.25rem);
}

.text-ellipsis {
  display: inline-block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.editable-cell {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.editable-cell:hover {
  background-color: #f0f0f0;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

/* 响应式设计 */
@media screen and (max-width: 480px) {
  .field-config {
    padding: 0.75rem;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .header h2 {
    font-size: 1.25rem;
    text-align: center;
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    min-height: auto;
  }

  .search-container {
    position: static;
    transform: none;
    max-width: 100%;
    margin: 0;
  }

  .header-buttons {
    width: 100%;
    justify-content: stretch;
    margin-left: 0;
    z-index: 1;
  }

  .header-buttons .el-button {
    flex: 1;
    min-width: 0;
  }

  .table-header-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .field-config-table {
    font-size: 0.9375rem;
  }

  .field-config-table :deep(.el-table__cell) {
    padding: 0.5rem 0.375rem;
  }
}

@media screen and (min-width: 481px) and (max-width: 768px) {
  .field-config {
    padding: 1rem;
  }

  .header h2 {
    font-size: 1.25rem;
  }

  .search-container {
    position: static;
    transform: none;
    flex: 1;
    max-width: 400px;
    margin: 0;
  }

  .header-buttons {
    margin-left: auto;
  }
}

@media screen and (min-width: 769px) and (max-width: 1024px) {
  .field-config {
    padding: 1.25rem;
    max-width: 98%;
  }

  .search-container {
    position: static;
    transform: none;
    flex: 1;
    max-width: 500px;
    margin: 0;
  }

  .header-buttons {
    margin-left: auto;
  }
}

@media screen and (min-width: 1025px) and (max-width: 1440px) {
  .field-config {
    padding: 1.5rem;
    max-width: 1400px;
  }

  .header h2 {
    font-size: 1.5rem;
  }

  .search-container {
    position: static;
    transform: none;
    flex: 1;
    max-width: 550px;
    margin: 0;
  }

  .header-buttons {
    margin-left: auto;
  }
}

@media screen and (min-width: 1441px) and (max-width: 1920px) {
  .field-config {
    padding: 1.75rem;
    max-width: 1600px;
  }

  .header h2 {
    font-size: 1.625rem;
  }

  .search-container {
    position: static;
    transform: none;
    flex: 1;
    max-width: 600px;
    margin: 0;
  }

  .header-buttons {
    margin-left: auto;
  }
}

@media screen and (min-width: 1921px) {
  .field-config {
    padding: 2rem;
    max-width: 1800px;
  }

  .header h2 {
    font-size: 1.75rem;
  }

  .search-container {
    position: static;
    transform: none;
    flex: 1;
    max-width: 700px;
    margin: 0;
  }

  .header-buttons {
    margin-left: auto;
  }

  .field-config-table {
    font-size: 1.125rem;
  }
}
</style>

