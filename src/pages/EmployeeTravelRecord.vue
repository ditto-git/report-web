<template>
  <div class="employee-travel-record">
    <div class="header">
      <h2>员工出行备案</h2>
      <div class="header-right">
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入姓名/身份证号/员工编号搜索"
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
            :icon="Search"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button 
            type="warning" 
            :icon="Download"
            :loading="downloadingTemplate"
            :disabled="downloadingTemplate"
            @click="handleDownloadTemplate"
          >
            模板下载
          </el-button>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            class="upload-wrapper"
            style="display: inline-block"
          >
            <template #trigger>
              <el-button 
                type="success" 
                :icon="Upload"
                :loading="importing"
              >
                数据导入
              </el-button>
            </template>
          </el-upload>
          <el-button 
            type="info" 
            :icon="Refresh"
            @click="handleRefresh"
          >
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <div class="filter-left">
        <span class="filter-label">部门筛选：</span>
        <el-select
          v-model="selectedDepartments"
          placeholder="请选择部门"
          clearable
          class="department-select"
          @change="handleDepartmentFilterChange"
        >
          <el-option
            v-for="dept in departmentFilters"
            :key="dept.value"
            :label="dept.text"
            :value="dept.value"
          />
        </el-select>
        <el-button
          v-if="selectedDepartments"
          text
          type="primary"
          size="small"
          @click="clearDepartmentFilter"
          class="clear-filter-btn"
        >
          清空筛选
        </el-button>
      </div>
      <div class="filter-right">
        <span class="data-count">
          共 <strong>{{ pagination.total }}</strong> 条数据
        </span>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-wrapper">
      <el-table 
        :data="filteredTableData" 
        border 
        stripe
        v-loading="loading"
        style="width: 100%"
        class="travel-record-table"
        :height="tableHeight"
        @sort-change="handleSortChange"
      >
        <!-- 序号列 -->
        <el-table-column 
          type="index" 
          label="序号" 
          width="80" 
          align="center"
          fixed="left"
          :index="(index) => (pagination.currentPage - 1) * pagination.pageSize + index + 1"
        />

        <!-- 部门 -->
        <el-table-column 
          prop="org" 
          label="部门" 
          fixed="left"
          min-width="120"
          show-overflow-tooltip
        />

        <!-- 人员基本信息 - 多级表头 -->
        <el-table-column label="人员基本信息" fixed="left">
          <el-table-column prop="name" label="姓名" min-width="100"  show-overflow-tooltip />
          <el-table-column prop="idNumber" label="身份证号" min-width="170"  show-overflow-tooltip />
          <el-table-column prop="pernr" label="员工编号" min-width="120" show-overflow-tooltip />
        </el-table-column>

        <!-- 所在国家 -->
        <el-table-column 
          prop="szAddress" 
          label="所在国家" 
          min-width="120"
          align="left"
          show-overflow-tooltip
        />

        <!-- 出行国家（地区） -->
        <el-table-column 
          prop="cxAddress" 
          label="出行国家（地区）" 
          min-width="180"
          align="left"
          show-overflow-tooltip
        />

        <!-- 拟安排行程相关信息 - 多级表头 -->
        <el-table-column label="拟安排行程相关信息" align="center">
          <!-- 出行信息 - 三级表头 -->
          <el-table-column label="出行信息" align="center">
            <el-table-column prop="date" label="出发日期" min-width="120"  show-overflow-tooltip />
            <el-table-column prop="vehicle" label="交通工具" min-width="120"  show-overflow-tooltip />
            <el-table-column prop="flightNumber" label="航班号（车次等）" min-width="180"  show-overflow-tooltip />
            <el-table-column prop="dep" label="出发地" min-width="120"  show-overflow-tooltip />
            <el-table-column prop="dst" label="目的地" min-width="120"  show-overflow-tooltip />
          </el-table-column>
          <!-- 居住地 - 三级表头 -->
          <el-table-column label="居住地" >
            <el-table-column prop="province" label="省份" min-width="100"  show-overflow-tooltip />
            <el-table-column prop="city" label="地市" min-width="100"  show-overflow-tooltip />
          </el-table-column>
        </el-table-column>

        <!-- 其他需要说明的情况 -->
        <el-table-column 
          prop="quit" 
          label="其他需要说明的情况" 
          min-width="200"
          align="left"
          show-overflow-tooltip
        />
      </el-table>
    </div>

    <!-- 分页区域 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100, 200]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="pagination"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Upload, Refresh, Search, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

// 加载状态
const loading = ref(false)

// 导入状态
const importing = ref(false)

// 模板下载状态
const downloadingTemplate = ref(false)

// 表格高度
const tableHeight = ref(600)

// 搜索关键字
const searchKeyword = ref('')

// 原始表格数据（未过滤）
const allTableData = ref([])

// 表格数据（过滤后）
const tableData = ref([])

// 部门筛选器选项
const departmentFilters = ref([])

// 分页信息
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 排序信息
const sortInfo = ref({
  prop: '',
  order: ''
})

// 搜索功能
const handleSearch = () => {
  pagination.value.currentPage = 1
  fetchTableData() // 调用API查询
}

// 选中的部门（单选）
const selectedDepartments = ref('')

// 部门筛选改变
const handleDepartmentFilterChange = () => {
  pagination.value.currentPage = 1
  fetchTableData() // 重新查询数据
}

// 清空部门筛选
const clearDepartmentFilter = () => {
  selectedDepartments.value = ''
  pagination.value.currentPage = 1
  fetchTableData() // 重新查询数据
}

// 计算过滤后的数据
// 注意：搜索和分页已由后端API处理，这里不需要额外过滤
const filteredTableData = computed(() => {
  // 后端已处理分页和筛选，直接返回数据
  return allTableData.value
})

// 应用所有过滤条件（搜索）- 用于重置分页
// 注意：现在直接调用 fetchTableData，此函数保留用于兼容
const applyFilters = () => {
  pagination.value.currentPage = 1
  // filteredTableData 会自动重新计算（前端过滤）
}

// 刷新功能
const handleRefresh = () => {
  searchKeyword.value = ''
  selectedDepartments.value = ''
  fetchTableData()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  fetchTableData() // 重新查询数据
}

// 页码改变
const handlePageChange = (page) => {
  pagination.value.currentPage = page
  fetchTableData() // 重新查询数据
}

// 排序改变
const handleSortChange = ({ prop, order }) => {
  sortInfo.value = { prop, order }
  fetchTableData()
}


// 获取表格数据
const fetchTableData = async () => {
  loading.value = true
  try {
    // 构建请求参数
    const params = {}
    
    // 部门筛选（单选）
    if (selectedDepartments.value) {
      params.org = selectedDepartments.value
    }
    
    // 搜索参数（统一使用 name 参数）
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.name = searchKeyword.value.trim()
    }

    // 分页参数
    params.pageNum = pagination.value.currentPage
    params.pageSize = pagination.value.pageSize

    // 调用后端接口
    const data = await request({
      url: '/TripFiling/query-tripFilings',
      method: 'GET',
      params: params
    })

    // 处理响应数据（新的分页格式）
    let responseData = []
    let total = 0
    
    if (data && data.records && Array.isArray(data.records)) {
      // 新的分页响应格式
      responseData = data.records
      total = data.total || 0
      
      // 更新分页信息
      pagination.value.total = total
      pagination.value.currentPage = data.current || pagination.value.currentPage
      pagination.value.pageSize = data.size || pagination.value.pageSize
    } else if (Array.isArray(data)) {
      // 兼容旧格式（直接返回数组）
      responseData = data
      total = data.length
      pagination.value.total = total
    } else if (data && Array.isArray(data.list)) {
      // 兼容其他格式
      responseData = data.list
      total = data.total || data.list.length
      pagination.value.total = total
    } else if (data && Array.isArray(data.data)) {
      responseData = data.data
      total = data.total || data.data.length
      pagination.value.total = total
    }
    
    // 保存原始数据（后端已分页，直接使用）
    allTableData.value = responseData
    
    // 生成部门筛选器选项（从返回的数据中提取）
    // 注意：由于后端分页，这里只能从当前页数据提取部门，可能不完整
    // 如果需要完整的部门列表，可能需要单独的接口
    const departments = [...new Set(responseData.map(item => item.org).filter(Boolean))].sort()
    // 合并到现有部门列表，避免丢失
    const existingDepts = departmentFilters.value.map(d => d.value)
    const newDepts = departments.filter(d => !existingDepts.includes(d))
    if (newDepts.length > 0) {
      departmentFilters.value = [
        ...departmentFilters.value,
        ...newDepts.map(dept => ({ text: dept, value: dept }))
      ].sort((a, b) => a.text.localeCompare(b.text))
    }

    if (responseData.length > 0) {
      ElMessage.success(`数据加载成功，共 ${total} 条`)
    } else {
      ElMessage.info('未查询到数据')
    }
  } catch (error) {
    console.error('数据加载失败:', error)
    ElMessage.error('数据加载失败：' + (error.message || '请重试'))
    allTableData.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

// 文件上传引用
const uploadRef = ref(null)

// 解析文件名（处理各种编码格式）
const parseFileName = (contentDisposition) => {
  if (!contentDisposition) {
    return null
  }

  // 尝试匹配 filename*=UTF-8''encoded-name 格式（RFC 5987）
  let fileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (fileNameMatch && fileNameMatch[1]) {
    try {
      let decoded = decodeURIComponent(fileNameMatch[1])
      // 如果解码后还包含编码字符，再次尝试解码
      if (decoded.includes('%')) {
        decoded = decodeURIComponent(decoded)
      }
      return decoded
    } catch (e) {
      console.warn('UTF-8文件名解码失败:', e)
    }
  }

  // 尝试匹配 filename*=UTF-8''encoded-name; filename="fallback" 格式
  fileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+);\s*filename="([^"]+)"/i)
  if (fileNameMatch && fileNameMatch[1]) {
    try {
      let decoded = decodeURIComponent(fileNameMatch[1])
      // 如果解码后还包含编码字符，再次尝试解码
      if (decoded.includes('%')) {
        decoded = decodeURIComponent(decoded)
      }
      return decoded
    } catch (e) {
      console.warn('UTF-8文件名解码失败:', e)
    }
  }

  // 尝试匹配 filename="..." 格式
  fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i)
  if (fileNameMatch && fileNameMatch[1]) {
    return fileNameMatch[1]
  }

  // 尝试匹配 filename=... 格式（不带引号）
  fileNameMatch = contentDisposition.match(/filename=([^;]+)/i)
  if (fileNameMatch && fileNameMatch[1]) {
    return fileNameMatch[1].trim()
  }

  return null
}

// 模板下载
const handleDownloadTemplate = async () => {
  if (downloadingTemplate.value) {
    return
  }

  downloadingTemplate.value = true

  try {
    // 调用后端接口下载模板
    const response = await request({
      url: '/TripFiling/getTemplate',
      method: 'GET',
      responseType: 'blob' // 文件下载需要 blob 类型
    })

    // 从响应头中获取文件名
    let fileName = parseFileName(response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'])

    // 如果没有从响应头获取到文件名，使用默认文件名
    if (!fileName) {
      fileName = `员工出行备案导入模板_${new Date().getTime()}.xlsx`
    }

    // 确保文件名正确解码，处理可能的URL编码
    let finalFileName = fileName
    // 检查文件名是否包含URL编码字符（%开头）
    if (finalFileName.includes('%')) {
      try {
        // 尝试解码URL编码
        finalFileName = decodeURIComponent(finalFileName)
        // 如果解码后还包含编码字符，可能需要再次解码（处理双重编码的情况）
        if (finalFileName.includes('%')) {
          try {
            finalFileName = decodeURIComponent(finalFileName)
          } catch (e2) {
            // 第二次解码失败，使用第一次解码的结果
            console.warn('文件名二次解码失败:', e2)
          }
        }
      } catch (e) {
        console.warn('文件名解码失败，使用原始文件名:', e)
        // 解码失败，使用原始文件名
      }
    }

    // 创建下载链接
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', finalFileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('模板下载失败:', error)
    ElMessage.error('模板下载失败：' + (error.message || '请重试'))
  } finally {
    downloadingTemplate.value = false
  }
}

// 文件上传前验证
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

// 文件上传处理
const handleFileChange = async (uploadFile) => {
  // 获取真正的文件对象（Element Plus upload 组件传递的是包装对象）
  const file = uploadFile.raw || uploadFile
  
  if (!file || !(file instanceof File)) {
    ElMessage.error('文件对象无效')
    return
  }
  
  if (!beforeUpload(file)) {
    return
  }

  importing.value = true
  try {
    // 创建 FormData 对象，用于文件上传
    const formData = new FormData()
    // 确保传递的是真正的 File 对象，字段名为 'file'（后端通过 request.getFile("file") 获取）
    formData.append('file', file)
    
    // 调用后端导入接口
    await request({
      url: '/TripFiling/readData',
      method: 'POST', // 文件上传必须使用 POST
      data: formData
      // request.js 会自动处理 FormData，删除 Content-Type 让浏览器自动设置（包含 boundary）
    })
    
    ElMessage.success('数据导入成功')
    
    // 导入成功后刷新列表
    searchKeyword.value = ''
    selectedDepartments.value = ''
    pagination.value.currentPage = 1
    fetchTableData()
  } catch (error) {
    console.error('数据导入失败:', error)
    ElMessage.error('数据导入失败：' + (error.message || '请检查文件格式是否正确'))
  } finally {
    importing.value = false
    // 清空文件选择，允许重复选择同一文件
    uploadRef.value?.clearFiles()
  }
}

// 计算表格高度
const calculateTableHeight = () => {
  const windowHeight = window.innerHeight
  const headerHeight = 80
  const filterBarHeight = 70 // 筛选栏高度
  const paginationHeight = 60
  const padding = 40
  tableHeight.value = windowHeight - headerHeight - filterBarHeight - paginationHeight - padding
}

// 监听窗口大小变化
const handleResize = () => {
  calculateTableHeight()
}

// 初始化
onMounted(() => {
  fetchTableData()
  calculateTableHeight()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 主容器 */
.employee-travel-record {
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
  justify-content: flex-end;
  position: relative;
}

.search-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
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
  z-index: 2;
  position: relative;
}

.upload-wrapper {
  display: inline-block;
}

.upload-wrapper :deep(.el-upload) {
  display: inline-block;
}

/* 筛选区域 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  margin-bottom: 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  gap: 1.25rem;
  flex-wrap: wrap;
  transition: box-shadow 0.3s ease;
}

.filter-bar:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  flex: 1;
}

.filter-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.filter-label::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #409eff 0%, #66b1ff 100%);
  border-radius: 2px;
  margin-right: 0.5rem;
}

.department-select {
  min-width: 220px;
  max-width: 450px;
  flex: 0 1 auto;
}

.department-select :deep(.el-select__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
}

.department-select :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
  border-color: #c0c4cc;
}

.department-select :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) inset, 0 0 0 1px #409eff inset;
}

.clear-filter-btn {
  margin-left: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  border-radius: 6px;
  transition: all 0.3s;
}

.clear-filter-btn:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 1rem;
  border-left: 1px solid #e4e7ed;
}

.data-count {
  font-size: 0.875rem;
  color: #606266;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.data-count::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #409eff;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.data-count strong {
  color: #409eff;
  font-weight: 700;
  font-size: 1rem;
  margin: 0 0.125rem;
}

/* 表格容器 */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
  margin-bottom: clamp(1rem, 2.5vw, 1.5rem);
  }

.travel-record-table {
  width: 100%;
  font-size: clamp(0.875rem, 1.2vw, 1rem);
}



.travel-record-table :deep(.el-table__header-wrapper) {
  overflow-x: hidden; /* 还原 x 轴滚动条 */
  overflow-y: scroll; /* 添加 y 轴滚动条 */
  scrollbar-width: 2px; /* Firefox - y 轴滚动条宽度 4px（增加2px） */
  scrollbar-color: transparent transparent; /* Firefox - 隐藏滚动条 */
}

/* 表头的 y 轴滚动条样式 */
.travel-record-table :deep(.el-table__header-wrapper)::-webkit-scrollbar {
  width: 2px; /* y 轴滚动条宽度 4px（增加2px，从2px增加到4px） */
  height: 0;
}

.travel-record-table :deep(.el-table__header-wrapper)::-webkit-scrollbar-track {
  background: transparent; /* 隐藏滚动条轨道 */
}

.travel-record-table :deep(.el-table__header-wrapper)::-webkit-scrollbar-thumb {
  background: transparent; /* 隐藏滚动条滑块 */
}

.travel-record-table :deep(.el-table__header-wrapper)::-webkit-scrollbar-track {
  background: transparent; /* 隐藏滚动条轨道 */
}

.travel-record-table :deep(.el-table__header-wrapper)::-webkit-scrollbar-thumb {
  background: transparent; /* 隐藏滚动条滑块 */
}
 
/* 表格单元格样式 */
.travel-record-table :deep(.el-table__cell) {
  padding: clamp(0.5rem, 1.2vw, 0.875rem) clamp(0.5rem, 1.5vw, 1rem);
}

/* 表头样式 */
.travel-record-table :deep(.el-table__header-wrapper) {
  background-color: #f5f7fa;
}

.travel-record-table :deep(.el-table__header th) {
  background-color: #f5f7fa;
  font-weight: 600;
}

/* 所有列默认居左 */
.travel-record-table :deep(.el-table__body td) {
  text-align: left !important;
}

/* 表头单元格全部居中 */
.travel-record-table :deep(.el-table__header th) {
  text-align: center !important;
}

/* 单元格内容居左 */
.travel-record-table :deep(.el-table__body .cell) {
  text-align: left !important;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* 表头单元格内容全部居中 */
.travel-record-table :deep(.el-table__header .cell) {
  text-align: center !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 序号列保持居中（第一列，通过 align="center" 属性） */
.travel-record-table :deep(.el-table__body-wrapper .el-table__body tr td:first-child),
.travel-record-table :deep(.el-table__header-wrapper .el-table__header tr th:first-child) {
  text-align: center !important;
}

.travel-record-table :deep(.el-table__body-wrapper .el-table__body tr td:first-child .cell),
.travel-record-table :deep(.el-table__header-wrapper .el-table__header tr th:first-child .cell) {
  justify-content: center !important;
  text-align: center !important;
}

/* 分页区域 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(1rem, 2.5vw, 1.5rem) 0;
}

.pagination {
  font-size: calc(var(--base-font-size, 14px) * 0.875) !important;
}

/* 按钮自适应大小 */
.header-buttons .el-button {
  font-size: calc(var(--base-font-size, 14px) * 0.875) !important;
  padding: clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1.25rem);
}

/* 响应式设计 */
@media screen and (max-width: 480px) {
  .employee-travel-record {
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
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 0.875rem;
  }

  .filter-left {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .filter-label {
    width: 100%;
  }

  .department-select {
    width: 100%;
    max-width: 100%;
  }

  .filter-right {
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
    padding-top: 0.75rem;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #e4e7ed;
  }

  .filter-label::before {
    display: none;
  }

  .header-buttons .el-button {
    flex: 1;
    min-width: 0;
  }

  .travel-record-table {
    font-size: 0.8125rem;
  }

  .travel-record-table :deep(.el-table__cell) {
    padding: 0.5rem 0.375rem;
  }
}

@media screen and (min-width: 481px) and (max-width: 768px) {
  .employee-travel-record {
    padding: 1rem;
  }

  .header h2 {
    font-size: 1.25rem;
  }

  .search-container {
    position: static;
    transform: none;
    flex: 1;
    max-width: 300px;
    margin: 0;
  }

  .header-right {
    justify-content: flex-end;
  }
}

@media screen and (min-width: 769px) and (max-width: 1024px) {
  .employee-travel-record {
    padding: 1.25rem;
    max-width: 98%;
  }

  .header-right {
    justify-content: flex-end;
  }
}

@media screen and (min-width: 1025px) and (max-width: 1440px) {
  .employee-travel-record {
    padding: 1.5rem;
    max-width: 1400px;
  }

  .header h2 {
    font-size: 1.5rem;
  }

  .header-right {
    justify-content: flex-end;
  }
}

@media screen and (min-width: 1441px) and (max-width: 1920px) {
  .employee-travel-record {
    padding: 1.75rem;
    max-width: 1600px;
  }

  .header h2 {
    font-size: 1.625rem;
  }

  .header-right {
    justify-content: flex-end;
  }
}

@media screen and (min-width: 1921px) {
  .employee-travel-record {
    padding: 2rem;
    max-width: 1800px;
  }

  .header h2 {
    font-size: 1.75rem;
  }

  .header-right {
    justify-content: flex-end;
  }

  .travel-record-table {
    font-size: 1rem;
  }
}

/* 横屏优化 */
@media screen and (orientation: landscape) and (max-height: 600px) {
  .employee-travel-record {
    padding: 0.75rem 1rem;
  }

  .header {
    margin-bottom: 0.75rem;
  }
}
</style>
