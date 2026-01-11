<template>
  <div class="field-config">
    <div class="header">
      <h2>字段配置</h2>
      <div class="header-right">
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入字段编码、模板参数或表头内容搜索"
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon class="search-icon" @click="handleSearch"><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="header-buttons">
          <el-button 
            type="success" 
            :icon="Download"
            @click="handleDownload"
          >
            配置下载
          </el-button>
          <el-button 
            type="warning" 
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
        <div class="table-controls-left">
          <el-button 
            type="info"
            :icon="showHiddenFields ? ArrowUp : ArrowDown"
            @click="showHiddenFields = !showHiddenFields"
            size="small"
          >
            {{ showHiddenFields ? '收起隐藏字段' : '展开隐藏字段' }}
          </el-button>
          <el-button 
            type="primary"
            :icon="Document"
            @click="handleDownloadManual"
            size="small"
          >
            下载公式说明书
          </el-button>
        </div>
        <div class="table-controls-right"></div>
      </div>
      <el-table 
        :data="tableData" 
        border 
        stripe
        style="width: 100%"
        class="field-config-table"
        v-loading="loading"
      >
        <el-table-column prop="cellCode" label="字段编码" min-width="120">
          <template #default="{ row }">
            {{ row.cellCode || '-' }}
          </template>
        </el-table-column>
        <el-table-column 
          v-if="showHiddenFields"
          prop="templateCode" 
          label="模板编码" 
          min-width="120"
        >
          <template #default="{ row }">
            {{ row.templateCode || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="cellProperty" label="模板参数" min-width="120">
          <template #default="{ row }">
            {{ row.cellProperty || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="cellHead" label="表头位置" min-width="100">
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
            <span 
              v-else
              @dblclick="handleRowClick(row)"
              class="editable-cell"
            >
              {{ row.headContent || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cellStartRow" label="纵表起始行" min-width="140" width="140">
          <template #default="{ row }">
            <el-input 
              v-if="row.isEditing"
              v-model="row.cellStartRow"
              @blur="handleBlur(row, 'cellStartRow')"
            />
            <span 
              v-else
              @dblclick="handleRowClick(row)"
              class="editable-cell editable-cell-large"
            >
              {{ row.cellStartRow || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cellStartCol" label="横表起始列" min-width="140" width="140">
          <template #default="{ row }">
            <el-input 
              v-if="row.isEditing"
              v-model="row.cellStartCol"
              @blur="handleBlur(row, 'cellStartCol')"
            />
            <span 
              v-else
              @dblclick="handleRowClick(row)"
              class="editable-cell editable-cell-large"
            >
              {{ row.cellStartCol || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cellIndex" label="所在列/行" min-width="140" width="140">
          <template #default="{ row }">
            <el-input 
              v-if="row.isEditing"
              v-model="row.cellIndex"
              @blur="handleBlur(row, 'cellIndex')"
            />
            <span 
              v-else
              @dblclick="handleRowClick(row)"
              class="editable-cell editable-cell-large"
            >
              {{ row.cellIndex || '-' }}
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
            {{ row.headFormula || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <div v-if="row.isEditing" class="action-buttons">
              <el-button 
                type="primary" 
                size="small"
                :icon="Check"
                @click="handleSaveRow(row)"
              >
                保存
              </el-button>
              <el-button 
                size="small"
                :icon="Close"
                @click="handleCancelRow(row)"
              >
                取消
              </el-button>
            </div>
            <el-button 
              v-else
              type="primary" 
              size="small"
              :icon="Edit"
              @click="handleEditRow(row)"
            >
              编辑
            </el-button>
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
        accept=".xlsx,.xls,.json"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持上传 Excel (.xlsx, .xls) 或 JSON (.json) 格式文件
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Download, Upload, Document, UploadFilled, Edit, Check, Close, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExTemplateInfo, updateExTemplateCell, uploadExCells, downloadExCells } from '@/api/fieldConfig'

const route = useRoute()

// 搜索关键字
const searchKeyword = ref('')

// 是否显示隐藏字段
const showHiddenFields = ref(false)

// 当前模板编码（从路由参数获取）
const currentTemplateCode = ref('')

// 上传对话框
const uploadDialogVisible = ref(false)
const uploadRef = ref(null)
const uploadFile = ref(null)

// 表格数据
const tableData = ref([])

// 加载状态
const loading = ref(false)

// 搜索
const handleSearch = async () => {
  await fetchFieldConfigData()
}

// 点击行进入编辑模式（双击）
const handleRowClick = (row) => {
  if (row.isEditing) return
  handleEditRow(row)
}

// 点击编辑按钮进入编辑模式
const handleEditRow = (row) => {
  // 检查是否有其他行正在编辑
  const otherEditing = tableData.value.find(r => r !== row && r.isEditing)
  if (otherEditing) {
    ElMessage.warning('请先完成或取消当前编辑')
    return
  }
  row.originalData = { ...row }
  row.isEditing = true
}

// 保存行
const handleSaveRow = async (row) => {
  try {
    // 验证必填字段
    if (!row.cellCode) {
      ElMessage.warning('字段编码不能为空')
      return
    }
    
    if (!currentTemplateCode.value) {
      ElMessage.warning('缺少模板编码，无法保存')
      return
    }
    
    // 构建请求参数
    const requestData = {
      templateCode: currentTemplateCode.value,
      cellCode: row.cellCode || '',
      cellProperty: row.cellProperty || '',
      headContent: row.headContent || '',
      cellHead: row.cellHead || '',
      cellStartRow: row.cellStartRow || '',
      cellStartCol: row.cellStartCol || '',
      cellIndex: row.cellIndex || '',
      cellFormula: row.cellFormula || null,
      headFormula: row.headFormula || null
    }
    
    // TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
    // 调用后端接口保存数据
    await updateExTemplateCell(requestData)
    
    // 保存成功
    row.isEditing = false
    row.originalData = null
    ElMessage.success('保存成功')
    
    // 可选：刷新数据以确保数据同步
    // await fetchFieldConfigData()
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
    console.error('保存字段配置失败:', error)
  }
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

// 从响应头中解析文件名
const getFileNameFromResponse = (headers) => {
  if (!headers) {
    return null
  }
  
  // axios 可能将响应头转换为小写，所以需要检查多种格式
  const contentDisposition = headers['content-disposition'] || 
                             headers['Content-Disposition'] || 
                             headers['CONTENT-DISPOSITION']
  
  if (!contentDisposition) {
    return null
  }
  
  // 处理 filename*=UTF-8''... 格式（RFC 5987）
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch (e) {
      console.warn('文件名解码失败:', e)
    }
  }
  
  // 处理 filename="..." 或 filename=... 格式
  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]+)/i)
  if (filenameMatch && filenameMatch[1]) {
    let fileName = filenameMatch[1].replace(/^['"]|['"]$/g, '')
    // 处理可能的 URL 编码
    try {
      return decodeURIComponent(fileName)
    } catch (e) {
      return fileName
    }
  }
  
  return null
}

// 配置下载
const handleDownload = async () => {
  try {
    if (!currentTemplateCode.value) {
      ElMessage.warning('缺少模板编码，无法下载')
      return
    }
    
    // TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
    // 调用后端接口下载文件
    const response = await downloadExCells({
      templateCode: currentTemplateCode.value
    })
    
    // 从响应头中获取文件名
    let fileName = getFileNameFromResponse(response.headers)
    // 如果响应头中没有文件名，则使用默认值
    if (!fileName) {
      fileName = `字段配置_${currentTemplateCode.value}_${new Date().getTime()}.xlsx`
    }
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    // 接口返回200表示成功（已在request.js中处理）
    ElMessage.success('配置下载成功')
  } catch (error) {
    // 错误已在 request.js 的响应拦截器中处理，这里只显示通用错误
    ElMessage.error('下载失败，请重试')
    console.error('下载字段配置失败:', error)
  }
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
  const fileName = file.name || ''
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
  const isJSON = fileName.endsWith('.json') || file.type === 'application/json'
  
  if (!isExcel && !isJSON) {
    ElMessage.error('只能上传 Excel (.xlsx, .xls) 或 JSON (.json) 格式文件')
    return false
  }
  return false // 阻止自动上传
}

// 确认上传
const confirmUpload = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  try {
    // 验证文件类型（允许 Excel 和 JSON 格式）
    const file = uploadFile.value.raw || uploadFile.value
    const fileName = file.name || ''
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    const isJSON = fileName.endsWith('.json')
    
    if (!isExcel && !isJSON) {
      ElMessage.error('只能上传 Excel (.xlsx, .xls) 或 JSON (.json) 格式文件')
      return
    }
    
    // TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
    // 调用后端接口上传文件
    await uploadExCells(file)
    
    // 上传成功
    ElMessage.success('配置上传成功')
    uploadDialogVisible.value = false
    uploadFile.value = null
    
    // 刷新数据以显示最新配置
    await fetchFieldConfigData()
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
    console.error('上传字段配置失败:', error)
  }
}

// 下载公式说明书
const handleDownloadManual = () => {
  ElMessage.info('公式说明书下载功能')
  // 这里可以实现实际的下载逻辑
}

// 获取字段配置数据
const fetchFieldConfigData = async () => {
  try {
    // 从路由参数获取模板编码
    currentTemplateCode.value = route.query.templateCode || ''
    
    // 如果没有模板编码，提示用户
    if (!currentTemplateCode.value) {
      ElMessage.warning('缺少模板编码参数，请从报表管理页面进入')
      return
    }
    
    loading.value = true
    
    // 构建请求参数
    const keyword = searchKeyword.value?.trim() || ''
    const requestParams = {
      templateCode: currentTemplateCode.value,
      cellCode: keyword, // 搜索关键词传递到 cellCode
      cellProperty: keyword, // 搜索关键词传递到 cellProperty
      headContent: keyword // 搜索关键词也传递到 headContent，让后端处理匹配逻辑
    }
    
    // TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
    // 调用后端接口获取数据
    const response = await getExTemplateInfo(requestParams)
    
    // 处理响应数据
    // 如果后端返回的是数组，直接使用；如果返回的是对象包含 data 字段，使用 data
    const dataList = Array.isArray(response) ? response : (response.data || [])
    
    // 映射数据，添加编辑状态
    tableData.value = dataList.map(item => ({
      ...item,
      isEditing: false,
      originalData: null
    }))
    
    // 如果搜索后没有结果，提示用户
    if (keyword && tableData.value.length === 0) {
      ElMessage.info('未找到匹配的字段配置')
    }
  } catch (error) {
    ElMessage.error('数据加载失败：' + (error.message || '未知错误'))
    console.error('获取字段配置数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  fetchFieldConfigData()
})
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
  position: relative;
}

.header h2 {
  margin: 0;
  font-size: calc(var(--base-font-size, 14px) * 1.25);
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
  justify-content: center;
}

.search-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 600px;
  z-index: 1;
}

.search-input {
  width: 100%;
}

.search-icon {
  cursor: pointer;
  transition: color 0.2s;
}

.search-icon:hover {
  color: var(--el-color-primary);
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

.table-controls-left {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.table-controls-right {
  flex: 1;
}

.field-config-table {
  width: 100%;
  font-size: var(--base-font-size, 14px);
}

.field-config-table :deep(.el-table__cell) {
  padding: clamp(0.5rem, 1.2vw, 1rem) clamp(0.5rem, 1.5vw, 1.25rem);
  position: relative;
}

/* 增大包含可编辑大单元格的列的单元格垂直空间和可点击区域 */
.field-config-table :deep(.el-table__cell .editable-cell-large) {
  position: relative;
  z-index: 1;
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
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: block;
  min-height: 32px;
  width: 100%;
  line-height: 1.5;
  box-sizing: border-box;
}

.editable-cell:hover {
  background-color: #f0f0f0;
}

/* 特定字段（纵表起始行、横表起始列、所在列/行）的可编辑单元格，增大点击区域 */
.editable-cell-large {
  padding: 10px 14px;
  min-height: 40px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid transparent;
}

.editable-cell-large:hover {
  background-color: #f0f0f0;
  border-color: #e0e0e0;
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
    font-size: calc(var(--base-font-size, 14px) * 1.125);
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

  .table-controls-left {
    flex-direction: column;
    width: 100%;
  }

  .table-controls-left .el-button {
    width: 100%;
  }

  .field-config-table {
    font-size: calc(var(--base-font-size, 14px) * 0.875);
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
    font-size: calc(var(--base-font-size, 14px) * 1.125);
  }

  .search-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-width: 400px;
    width: 100%;
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
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-width: 500px;
    width: 100%;
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
    font-size: calc(var(--base-font-size, 14px) * 1.25);
  }

  .search-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-width: 550px;
    width: 100%;
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
    font-size: calc(var(--base-font-size, 14px) * 1.375);
  }

  .search-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-width: 600px;
    width: 100%;
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
    font-size: calc(var(--base-font-size, 14px) * 1.5);
  }

  .search-container {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-width: 700px;
    width: 100%;
  }

  .header-buttons {
    margin-left: auto;
  }

  .field-config-table {
    font-size: calc(var(--base-font-size, 14px) * 1.125);
  }
}
</style>

