<template>
  <div class="report-management">
    <div class="header">
      <h2>报表管理浏览</h2>
      <div class="header-right">
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入模板编码或模板名搜索"
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
            :icon="Plus" 
            @click="handleAddNew"
            class="add-btn"
          >
            新建
          </el-button>
          <el-button 
            type="danger" 
            :icon="Delete"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <el-table 
        :data="filteredTableData" 
        border 
        stripe
        style="width: 100%"
        class="report-table"
        @selection-change="handleSelectionChange"
      >
      <el-table-column 
        type="selection" 
        width="55" 
        align="center"
        :selectable="(row) => !row.isNew && !row.isEditing"
      />
      <el-table-column prop="templateCode" label="模板编码" min-width="120">
        <template #default="{ row }">
          <el-input 
            v-if="row.isNew"
            v-model="row.templateCode"
            placeholder="请输入模板编码"
            :class="{ 'is-error': !row.templateCode && row.touched }"
            @blur="handleBlur(row, 'templateCode')"
          />
          <el-tooltip
            v-else
            :content="row.templateCode"
            placement="top"
            :disabled="!row.templateCode || row.templateCode.length <= 10"
          >
            <span class="text-ellipsis">
              {{ row.templateCode }}
            </span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column prop="templateName" label="模板名" min-width="150">
        <template #default="{ row }">
          <el-input 
            v-if="row.isEditing || row.isNew"
            v-model="row.templateName"
            placeholder="请输入模板名"
            :class="{ 'is-error': !row.templateName && row.touched }"
            @blur="handleBlur(row, 'templateName')"
          />
          <el-tooltip
            v-else
            :content="row.templateName"
            placement="top"
            :disabled="!row.templateName || row.templateName.length <= 15"
          >
            <span 
              @dblclick="handleCellEdit(row, 'templateName')"
              class="editable-cell text-ellipsis"
            >
              {{ row.templateName }}
            </span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column prop="templateType" label="模板类型" min-width="120">
        <template #default="{ row }">
          <el-select 
            v-if="row.isNew"
            v-model="row.templateType"
            placeholder="请选择模板类型"
          > <el-option label="自识别" :value="12" />
            <el-option label="自定义" :value="0" />
           
          </el-select>
          <el-tooltip
            v-else
            :content="getTemplateTypeText(row.templateType)"
            placement="top"
          >
            <span class="text-ellipsis">
              {{ getTemplateTypeText(row.templateType) }}
            </span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column prop="templateUrl" label="模板路径" min-width="180">
        <template #default="{ row }">
          <el-input 
            v-if="(row.isEditing || row.isNew) && row.templateType === 0"
            v-model="row.templateUrl"
            placeholder="请输入模板路径"
            @blur="handleBlur(row, 'templateUrl')"
          />
          <span v-else-if="row.isNew">-</span>
          <el-tooltip
            v-else
            :content="row.templateUrl || '暂无路径'"
            placement="top"
            :disabled="!row.templateUrl || row.templateUrl.length <= 20"
          >
            <span 
              v-if="row.templateType === 0"
              @dblclick="handleCellEdit(row, 'templateUrl')"
              class="editable-cell text-ellipsis"
            >
              {{ row.templateUrl || '-' }}
            </span>
            <span v-else class="text-ellipsis">
              {{ row.templateUrl || '-' }}
            </span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="模板上传" min-width="100" align="center">
        <template #default="{ row }">
          <el-upload
            v-if="!row.isNew"
            :ref="el => setUploadRef(row, el)"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="(file) => handleFileChange(file, row)"
            :before-upload="beforeUpload"
          >
            <template #trigger>
              <el-button 
                :type="row.templateUrl ? 'warning' : 'success'" 
                size="small"
                :icon="Upload"
              >
                {{ row.templateUrl ? '更新' : '上传' }}
              </el-button>
            </template>
          </el-upload>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="模板下载" min-width="100" align="center">
        <template #default="{ row }">
          <el-button 
            v-if="!row.isNew"
            type="primary" 
            size="small"
            :icon="Download"
            @click="handleDownload(row)"
          >
            下载
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column prop="fileName" label="文件名" min-width="150">
        <template #default="{ row }">
          <el-input 
            v-if="row.isEditing || row.isNew"
            v-model="row.fileName"
            placeholder="请输入文件名"
            @blur="handleBlur(row, 'fileName')"
          />
          <el-tooltip
            v-else
            :content="row.fileName || '暂无文件名'"
            placement="top"
            :disabled="!row.fileName || row.fileName.length <= 15"
          >
            <span 
              @dblclick="handleCellEdit(row, 'fileName')"
              class="editable-cell text-ellipsis"
            >
              {{ row.fileName || '-' }}
            </span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column prop="templateStatus" label="模板状态" min-width="120" align="center">
        <template #default="{ row }">
          <div class="status-cell">
            <el-switch
              v-model="row.templateStatus"
              :active-value="1"
              :inactive-value="0"
              :active-text="row.templateStatus === 1 ? '使用中' : ''"
              :inactive-text="row.templateStatus === 0 ? '维护中' : ''"
              :disabled="row.isNew || row.isEditing || hasNewRow"
              inline-prompt
              @change="handleStatusChange(row)"
            />
          </div>
        </template>
      </el-table-column>

      <el-table-column :label="getActionColumnLabel()" min-width="200" fixed="right">
        <template #default="{ row, $index }">
          <div v-if="row.isEditing || row.isNew" class="action-buttons">
            <el-button 
              type="primary" 
              size="small"
              :icon="DocumentChecked"
              @click="handleSaveRow(row, $index)"
              :loading="row.saving"
            >
              保存
            </el-button>
            <el-button 
              type="danger" 
              size="small"
              :icon="Delete"
              @click="handleCancelRow(row, $index)"
            >
              取消
            </el-button>
          </div>
          <div v-else>
            <el-button 
              type="primary" 
              size="small"
              :icon="Folder"
              :disabled="hasNewRow"
              @click="handleFieldConfig(row)"
            >
              字段配置
            </el-button>
          </div>
        </template>
      </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Delete, DocumentChecked, Upload, Download, View, Folder } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 表格数据
const tableData = ref([
  {
    templateCode: 'T001',
    templateName: '销售报表',
    templateType: 0,
    templateUrl: '/templates/sales.xlsx',
    fileName: 'sales_report.xlsx',
    templateStatus: 1,
    isNew: false,
    isEditing: false,
    touched: false,
    saving: false
  },
  {
    templateCode: 'T002',
    templateName: '财务报表',
    templateType: 1,
    templateUrl: '/templates/finance.xlsx',
    fileName: 'finance_report.xlsx',
    templateStatus: 0,
    isNew: false,
    isEditing: false,
    touched: false,
    saving: false
  },
  {
    templateCode: 'T003',
    templateName: '库存管理报表模板文件名称较长时测试',
    templateType: 0,
    templateUrl: '',
    fileName: '',
    templateStatus: 0,
    isNew: false,
    isEditing: false,
    touched: false,
    saving: false
  }
])

// 存储原始数据，用于取消编辑时恢复
const originalDataMap = new Map()

// 搜索关键字
const searchKeyword = ref('')

// 选中的行
const selectedRows = ref([])

// 是否有新建行或编辑行
const hasNewRow = computed(() => {
  return tableData.value.some(row => row.isNew || row.isEditing)
})

// 过滤后的表格数据
const filteredTableData = computed(() => {
  if (!searchKeyword.value.trim()) {
    return tableData.value
  }
  const keyword = searchKeyword.value.trim().toLowerCase()
  return tableData.value.filter(row => {
    return (
      row.templateCode?.toLowerCase().includes(keyword) ||
      row.templateName?.toLowerCase().includes(keyword)
    )
  })
})

// 获取操作列标题
const getActionColumnLabel = () => {
  return hasNewRow.value ? '操作' : '字段配置'
}

// 获取模板类型文本
const getTemplateTypeText = (type) => {
  const typeMap = {
    12: '自识别',
    0: '自定义',
    2: '横向表',
    1: '纵向表'
  }
  return typeMap[type] || '-'
}

// 获取模板状态文本
const getTemplateStatusText = (status) => {
  return status === 1 ? '使用中' : '维护中'
}

// 新建功能
const handleAddNew = () => {
  // 如果已有新建行或编辑行，先提示
  if (hasNewRow.value) {
    ElMessage.warning('请先完成或取消当前操作')
    return
  }

  const newRow = {
    templateCode: '',
    templateName: '',
    templateType: 12, // 默认自定义
    templateUrl: '',
    fileName: '',
    templateStatus: 0, // 默认维护中
    isNew: true,
    isEditing: false,
    touched: false,
    saving: false
  }

  // 插入到表格最上方
  tableData.value.unshift(newRow)
}

// 双击单元格进入编辑模式（允许编辑模板名、文件名和模板路径）
const handleCellEdit = (row, field) => {
  // 允许编辑模板名、文件名，以及模板路径（仅当模板类型为自定义时）
  if (field === 'templateUrl' && row.templateType !== 0) {
    return
  }
  
  if (field !== 'templateName' && field !== 'fileName' && field !== 'templateUrl') {
    return
  }
  
  // 如果已有其他行在编辑，先提示
  const otherEditing = tableData.value.find(r => r !== row && (r.isEditing || r.isNew))
  if (otherEditing) {
    ElMessage.warning('请先完成或取消当前编辑')
    return
  }

  // 保存原始数据
  if (!row.isNew && !row.isEditing) {
    originalDataMap.set(row, { ...row })
    row.isEditing = true
  }
}

// 失去焦点时的处理（可选，这里保留用于某些场景）
const handleBlur = (row, field) => {
  // 可以在这里添加失焦验证逻辑
}

// 保存单行
const handleSaveRow = async (row, index) => {
  // 验证必填字段
  if (row.isNew) {
    row.touched = true
    
    if (!row.templateCode || !row.templateCode.trim()) {
      ElMessage.error('模板编码不能为空')
      return
    }
    
    if (!row.templateName || !row.templateName.trim()) {
      ElMessage.error('模板名不能为空')
      return
    }
  }

  // 检查模板编码是否重复（排除当前行）
  const codes = tableData.value
    .filter(r => r !== row)
    .map(r => r.templateCode?.trim())
    .filter(Boolean)
  
  if (codes.includes(row.templateCode.trim())) {
    ElMessage.error('模板编码不能重复')
    return
  }

  try {
    row.saving = true
    
    // 这里调用保存接口
    // if (row.isNew) {
    //   await createReport(row)
    // } else {
    //   await updateReport(row)
    // }
    
    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 保存成功后，清除编辑状态
    if (row.isNew) {
      row.isNew = false
    }
    row.isEditing = false
    row.touched = false
    
    // 清除原始数据
    originalDataMap.delete(row)
    
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    row.saving = false
  }
}

// 取消编辑/新建
const handleCancelRow = (row, index) => {
  if (row.isNew) {
    // 如果是新建行，直接删除
    const actualIndex = tableData.value.findIndex(r => r === row)
    if (actualIndex !== -1) {
      tableData.value.splice(actualIndex, 1)
    }
  } else if (row.isEditing) {
    // 如果是编辑行，恢复原始数据
    const originalData = originalDataMap.get(row)
    if (originalData) {
      Object.assign(row, originalData)
      row.isEditing = false
      row.touched = false
      originalDataMap.delete(row)
    }
  }
}

// 搜索功能
const handleSearch = () => {
  // 搜索逻辑已通过 computed 实现，这里可以添加其他逻辑
}

// 选择变化处理
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条数据吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 过滤出需要删除的行（排除新建和编辑中的行）
    const rowsToDelete = selectedRows.value.filter(row => !row.isNew && !row.isEditing)
    
    if (rowsToDelete.length === 0) {
      ElMessage.warning('选中的数据中包含正在编辑的数据，无法删除')
      return
    }

    // 获取要删除的行的模板编码
    const codesToDelete = rowsToDelete.map(row => row.templateCode)

    // 从表格数据中删除
    tableData.value = tableData.value.filter(row => !codesToDelete.includes(row.templateCode))

    // 清除选中状态
    selectedRows.value = []

    ElMessage.success(`成功删除 ${rowsToDelete.length} 条数据`)
  } catch (error) {
    // 用户取消删除
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

// 模板状态切换
const handleStatusChange = (row) => {
  // 状态切换时的处理逻辑
  // 如果需要立即保存，可以在这里调用保存接口
  // await updateTemplateStatus(row.templateCode, row.templateStatus)
  
  // 暂时只显示提示信息
  const statusText = row.templateStatus === 1 ? '使用中' : '维护中'
  ElMessage.success(`模板状态已切换为：${statusText}`)
}

// 模板下载
const handleDownload = (row) => {
  if (!row.templateUrl) {
    ElMessage.warning('模板路径为空，无法下载')
    return
  }
  
  try {
    // 这里调用下载接口
    // 方式1：直接下载文件
    // window.open(row.templateUrl, '_blank')
    
    // 方式2：通过API下载
    // downloadTemplate(row.templateCode).then(res => {
    //   // 创建下载链接
    //   const url = window.URL.createObjectURL(new Blob([res.data]))
    //   const link = document.createElement('a')
    //   link.href = url
    //   link.setAttribute('download', row.fileName || `${row.templateName}.xlsx`)
    //   document.body.appendChild(link)
    //   link.click()
    //   document.body.removeChild(link)
    //   window.URL.revokeObjectURL(url)
    //   ElMessage.success('下载成功')
    // }).catch(err => {
    //   ElMessage.error('下载失败：' + err.message)
    // })
    
    // 临时模拟下载
    ElMessage.info(`准备下载模板：${row.templateName}`)
    console.log('下载模板:', row.templateUrl)
  } catch (error) {
    ElMessage.error('下载失败：' + error.message)
  }
}

// 字段配置（跳转到下一个页面）
const handleFieldConfig = (row) => {
  // 使用路由跳转到字段配置页面
  router.push({
    name: 'FieldConfig',
    query: { templateCode: row.templateCode }
  })
}

// 上传组件引用 Map
const uploadRefsMap = new Map()

// 设置上传组件引用
const setUploadRef = (row, el) => {
  if (el) {
    uploadRefsMap.set(row, el)
  } else {
    uploadRefsMap.delete(row)
  }
}

// 文件上传前的验证
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  file.type === 'application/vnd.ms-excel' ||
                  file.name.endsWith('.xlsx') || 
                  file.name.endsWith('.xls')
  
  if (!isExcel) {
    ElMessage.error('只能上传 Excel 格式文件（.xlsx 或 .xls）')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  
  return true
}

// 文件选择变化处理
const handleFileChange = async (file, row) => {
  if (!beforeUpload(file.raw)) {
    // 如果验证失败，清除文件选择
    const uploadRef = uploadRefsMap.get(row)
    uploadRef?.clearFiles()
    return
  }
  
  try {
    // 保存原始模板路径，用于判断是上传还是更新
    const isUpdate = !!row.templateUrl
    
    // 这里可以处理文件上传逻辑
    // 例如：调用API上传文件
    // const formData = new FormData()
    // formData.append('file', file.raw)
    // formData.append('templateCode', row.templateCode)
    // const res = await uploadTemplate(formData)
    
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 更新模板路径（这里使用文件名为示例，实际应该使用服务器返回的路径）
    // row.templateUrl = res.data.templateUrl
    // row.fileName = file.name
    row.templateUrl = `/templates/${file.name}`
    row.fileName = file.name
    
    ElMessage.success(isUpdate ? '模板更新成功' : '模板上传成功')
    
    // 清除文件选择，允许重复选择同一文件
    const uploadRef = uploadRefsMap.get(row)
    uploadRef?.clearFiles()
  } catch (error) {
    ElMessage.error('模板上传失败：' + error.message)
    const uploadRef = uploadRefsMap.get(row)
    uploadRef?.clearFiles()
  }
}
</script>

<style scoped>
/* 主容器 - 居中显示，设置最大宽度避免在超大屏幕上过度拉伸 */
.report-management {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: clamp(0.75rem, 2vw, 2rem);
  background: #fff;
  box-sizing: border-box;
  min-height: 100vh;
}

/* 头部区域 */
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
  font-size: clamp(1rem, 2vw, 1.5rem);
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

.add-btn {
  margin-left: 0;
}

/* 表格容器，支持横向滚动 */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  /* 添加滚动条样式优化 */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.table-wrapper::-webkit-scrollbar {
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.report-table {
  margin-bottom: clamp(1rem, 2.5vw, 1.5rem);
  width: 100%;
  font-size: clamp(0.875rem, 1.2vw, 1rem);
}

/* 确保表格在小屏幕上也能正常显示 */
.report-table :deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

.report-table :deep(.el-table__header-wrapper) {
  overflow-x: hidden;
}

/* 表格单元格自适应 */
.report-table :deep(.el-table__cell) {
  padding: clamp(0.5rem, 1.2vw, 1rem) clamp(0.5rem, 1.5vw, 1.25rem);
}

.report-table :deep(.is-error) {
  border-color: #f56c6c;
}

.report-table :deep(.is-error:focus) {
  border-color: #f56c6c;
}

.editable-cell {
  cursor: pointer;
  padding: 0.3125rem;
  display: inline-block;
  width: 100%;
  min-height: 1.25rem;
  font-size: inherit;
}

.editable-cell:hover {
  background-color: #f5f7fa;
  border-radius: 0.25rem;
}

/* 文本溢出省略 */
.text-ellipsis {
  display: inline-block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

/* 状态标签居中 */
.status-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

/* 状态徽章样式 - 类似按钮但不能点击 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  cursor: default;
  user-select: none;
  white-space: nowrap;
  min-width: 50px;
}

.status-success {
  background-color: #f0f9ff;
  color: #67c23a;
  border: 1px solid #b3e19d;
}

.status-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #f5dab1;
}

/* 状态选择框选项居中 */
.status-select :deep(.el-select__wrapper) {
  text-align: center;
}

.status-select :deep(.el-select__selected-item) {
  text-align: center;
  margin: 0 auto;
}

.status-select :deep(.el-select__placeholder) {
  text-align: center;
}

/* 下拉选项文字居中 - 需要全局样式，因为下拉菜单不在组件内 */
.report-table :deep(.el-select-dropdown__item) {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.report-table :deep(.el-select-dropdown__item span) {
  text-align: center;
  width: 100%;
}

.report-table :deep(.el-select-dropdown__item.is-selected) {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.report-table :deep(.el-select-dropdown__item:hover) {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: clamp(0.375rem, 1vw, 0.75rem);
  flex-wrap: wrap;
}

/* 按钮自适应大小 */
.header-buttons .el-button,
.action-buttons .el-button {
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  padding: clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1.25rem);
}

/* ========== 响应式断点设计 ========== */

/* 超小屏幕 - 手机竖屏 (≤480px) */
@media screen and (max-width: 480px) {
  .report-management {
    padding: 0.75rem;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .header h2 {
    font-size: 1.125rem;
    text-align: center;
  }

  .header-buttons {
    width: 100%;
    justify-content: stretch;
  }

  .header-buttons .el-button {
    flex: 1;
    min-width: 0;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .report-table {
    font-size: 0.8125rem;
  }

  .report-table :deep(.el-table__cell) {
    padding: 0.5rem 0.375rem;
  }
}

/* 小屏幕 - 手机横屏/小平板 (481px - 768px) */
@media screen and (min-width: 481px) and (max-width: 768px) {
  .report-management {
    padding: 1rem;
  }

  .header {
    flex-direction: row;
    align-items: center;
  }

  .header h2 {
    font-size: 1.125rem;
  }

  .header-right {
    position: relative;
    min-height: 40px;
  }

  .search-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 180px);
    max-width: 500px;
  }

  .header-buttons {
    justify-content: flex-end;
    margin-left: auto;
  }

  .report-table {
    font-size: 0.875rem;
  }
}

/* 中等屏幕 - 平板/小笔记本 (769px - 1024px) */
@media screen and (min-width: 769px) and (max-width: 1024px) {
  .report-management {
    padding: 1.25rem;
  }

  .header h2 {
    font-size: 1.25rem;
  }
}

/* 大屏幕 - 笔记本/台式机 (1025px - 1440px) */
@media screen and (min-width: 1025px) and (max-width: 1440px) {
  .report-management {
    padding: 1.5rem;
    max-width: 1400px;
  }

  .header h2 {
    font-size: 1.375rem;
  }
}

/* 超大屏幕 - 大显示器 (1441px - 1920px) */
@media screen and (min-width: 1441px) and (max-width: 1920px) {
  .report-management {
    padding: 1.75rem 2rem;
    max-width: 1600px;
  }

  .header h2 {
    font-size: 1.5rem;
  }
}

/* 超宽屏幕 - 4K/超宽屏 (≥1921px) */
@media screen and (min-width: 1921px) {
  .report-management {
    padding: 2rem 3rem;
    max-width: 1800px;
  }

  .header h2 {
    font-size: 1.625rem;
  }

  .report-table {
    font-size: 1rem;
  }
}

/* 横屏优化 */
@media screen and (orientation: landscape) and (max-height: 600px) {
  .report-management {
    padding: 0.75rem 1rem;
  }

  .header {
    margin-bottom: 0.75rem;
  }
}
</style>

<style>
/* 全局样式：状态选择框下拉选项居中 */
.el-select-dropdown__item {
  text-align: center !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.el-select-dropdown__item span {
  text-align: center !important;
}

.el-select-dropdown__item.is-selected {
  text-align: center !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  transform: translateY(5px) !important;
}

.el-select-dropdown__item:hover {
  text-align: center !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  transform: translateY(10px) !important;
}
</style>

