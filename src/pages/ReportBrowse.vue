<template>
  <div class="report-browse" v-loading="exporting" :element-loading-text="exporting ? `正在导出报表，请稍候... (${exportCountdown}秒)` : '正在导出报表，请稍候...'" element-loading-background="transparent">
    <div class="header">
      <h2>报表浏览</h2>
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
            :icon="Search"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button 
            type="success" 
            :icon="Download"
            @click="handleExport"
            :loading="exporting"
            :disabled="exporting"
          >
            报表导出
          </el-button>
          <el-button 
            type="warning" 
            :icon="Setting"
            @click="navigateToFieldConfig"
          >
            配置
          </el-button>
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

    <!-- 查询条件区域 -->
    <el-card class="query-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
          <el-button 
            text 
            :icon="showQueryConditions ? ArrowUp : ArrowDown"
            @click="showQueryConditions = !showQueryConditions"
            size="small"
          >
            {{ showQueryConditions ? '收起' : '展开' }}
          </el-button>
        </div>
      </template>
      <div v-show="showQueryConditions" class="query-form">
        <el-form 
          :model="queryForm" 
          :inline="true" 
          label-width="100px"
          class="query-form-content"
        >
          <el-form-item 
            v-for="(field, index) in queryFields" 
            :key="index"
            :label="field.label"
          >
            <el-input
              v-if="field.type === 'input'"
              v-model="queryForm[field.prop]"
              :placeholder="`请输入${field.label}`"
              clearable
              style="width: 200px"
            />
            <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="queryForm[field.prop]"
              type="date"
              :placeholder="`请选择${field.label}`"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 200px"
            />
            <el-date-picker
              v-else-if="field.type === 'daterange'"
              v-model="queryForm[field.prop]"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 240px"
            />
            <el-select
              v-else-if="field.type === 'select'"
              v-model="queryForm[field.prop]"
              :placeholder="`请选择${field.label}`"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="option in field.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 表格区域 -->
    <div class="table-wrapper">
      <el-table 
        :data="tableData" 
        border 
        stripe
        v-loading="loading"
        style="width: 100%"
        class="report-browse-table"
        :height="tableHeight"
        @sort-change="handleSortChange"
      >
        <el-table-column 
          type="index" 
          label="序号" 
          width="100" 
          align="center"
          :index="(index) => (pagination.currentPage - 1) * pagination.pageSize + index + 1"
        />
        <el-table-column 
          v-for="(column, index) in tableColumns" 
          :key="column.cellCode || index"
          :prop="column.cellProperty"
          :label="column.headContent"
          :min-width="getColumnWidth(column.headContent)"
          :sortable="'custom'"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tooltip
              :content="row[column.cellProperty] || '-'"
              placement="top"
              :disabled="!row[column.cellProperty] || String(row[column.cellProperty]).length <= 20"
            >
              <span class="text-ellipsis">
                {{ row[column.cellProperty] || '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页区域 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 30, 50, 100, 200]"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Download, Refresh, ArrowUp, ArrowDown, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

// 从路由参数获取 templateCode 和 code
// code 从路径参数获取，templateCode 从查询参数获取
const templateCode = ref(route.query.templateCode || '')
const reportCode = ref(route.params.code || route.query.code || '')

// 查询关键字
const searchKeyword = ref('')

// 是否显示查询条件
const showQueryConditions = ref(true)

// 加载状态
const loading = ref(false)

// 导出状态
const exporting = ref(false)
// 导出倒计时（秒）
const exportCountdown = ref(0)
let exportTimer = null

// 表格高度
const tableHeight = ref(600)

// 查询表单字段（示例，实际应该从后端获取）
const queryFields = ref([
  { label: '报表名称', prop: 'reportName', type: 'input' },
  { label: '创建日期', prop: 'createDate', type: 'daterange' },
  { label: '报表类型', prop: 'reportType', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '日报', value: 'daily' },
    { label: '周报', value: 'weekly' },
    { label: '月报', value: 'monthly' }
  ]},
  { label: '状态', prop: 'status', type: 'select', options: [
    { label: '全部', value: '' },
    { label: '已生成', value: 'generated' },
    { label: '生成中', value: 'generating' },
    { label: '失败', value: 'failed' }
  ]}
])

// 查询表单
const queryForm = ref({})

// 表格表头（从后端获取 List<String>）
const tableHeaders = ref([])

// 表格数据（从后端获取 List<Map<String,String>>）
const tableData = ref([])

// 分页信息
const pagination = ref({
  currentPage: 1,
  pageSize: 30, // 默认每页30条
  total: 0
})

// 排序信息
const sortInfo = ref({
  prop: '',
  order: ''
})

// 计算列宽
const getColumnWidth = (header) => {
  // 根据表头文字长度动态计算列宽
  const baseWidth = 120
  const charWidth = 14
  const minWidth = 100
  const maxWidth = 300
  const width = Math.max(minWidth, Math.min(maxWidth, baseWidth + header.length * charWidth))
  return width
}

// 搜索功能
const handleSearch = () => {
  pagination.value.currentPage = 1
  fetchTableData()
}

// 查询功能
const handleQuery = () => {
  pagination.value.currentPage = 1
  fetchTableData()
}

// 重置查询条件
const handleReset = () => {
  queryForm.value = {}
  pagination.value.currentPage = 1
  fetchTableData()
}

// 刷新功能
const handleRefresh = async () => {
  // 刷新时重置标志，允许重新初始化
  isInitialized.value = false
  await initData()
  isInitialized.value = true
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  fetchTableData()
}

// 页码改变
const handlePageChange = (page) => {
  pagination.value.currentPage = page
  fetchTableData()
}

// 排序改变
const handleSortChange = ({ prop, order }) => {
  sortInfo.value = { prop, order }
  fetchTableData()
}

// 获取表格数据
const fetchTableData = async () => {
  if (!templateCode.value) {
    ElMessage.warning('缺少 templateCode 参数')
    return
  }

  loading.value = true
  try {
    // 调用接口获取数据，使用统一的 request 工具处理跨域
    // 参数：templateCode=RY_CJ&pageNum=1&pageSize=30
    const data = await request({
      url: '/Person/query',
      method: 'GET',
      params: {
        templateCode: templateCode.value,
        pageNum: pagination.value.currentPage,
        pageSize: pagination.value.pageSize
      }
    })
    
    // 根据后端返回的数据结构处理
    // 假设返回格式为 { list: [...], total: 100 } 或 { data: [...], total: 100 } 或直接是数组
    let dataList = []
    let total = 0
    
    if (Array.isArray(data)) {
      // 如果直接返回数组，说明没有分页信息
      dataList = data
      total = data.length
    } else if (data.list) {
      // 格式：{ list: [...], total: 100 }
      dataList = data.list || []
      total = data.total || data.totalCount || data.totalElements || 0
    } else if (data.data) {
      // 格式：{ data: [...], total: 100 }
      dataList = Array.isArray(data.data) ? data.data : []
      total = data.total || data.totalCount || data.totalElements || 0
    } else if (data.records) {
      // 格式：{ records: [...], total: 100 } (MyBatis-Plus 分页格式)
      dataList = data.records || []
      total = data.total || data.totalCount || data.totalElements || 0
    } else {
      dataList = []
      total = 0
    }

    // 确保数据中的字段名与 cellProperty 匹配
    // 如果后端返回的字段名与 cellProperty 不一致，可能需要映射
    tableData.value = dataList
    pagination.value.total = total

    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('数据加载失败:', error)
    ElMessage.error('数据加载失败：' + error.message)
    tableData.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

// 表格列配置（包含 headContent 和 cellProperty）
const tableColumns = ref([])

// 获取表格表头
const fetchTableHeaders = async () => {
  if (!templateCode.value) {
    ElMessage.warning('缺少 templateCode 参数')
    return
  }

  try {
    // 调用接口获取表头配置，使用统一的 request 工具处理跨域
    const data = await request({
      url: '/Person/query-head',
      method: 'GET',
      params: {
        templateCode: templateCode.value
      }
    })
    
    // 处理响应数据，提取 headContent 和 cellProperty
    // 按 cellIndex 排序
    const sortedData = Array.isArray(data) 
      ? data.sort((a, b) => {
          const indexA = parseInt(a.cellIndex || 0)
          const indexB = parseInt(b.cellIndex || 0)
          return indexA - indexB
        })
      : []

    // 生成表头配置
    tableColumns.value = sortedData.map(item => ({
      headContent: item.headContent || '',
      cellProperty: item.cellProperty || '',
      cellIndex: item.cellIndex || '',
      cellCode: item.cellCode || ''
    }))

    // 提取表头显示文本（headContent）
    tableHeaders.value = tableColumns.value.map(col => col.headContent)
  } catch (error) {
    console.error('表头加载失败:', error)
    ElMessage.error('表头加载失败：' + error.message)
    tableHeaders.value = []
    tableColumns.value = []
  }
}

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
      // 如果UTF-8解码失败，使用fallback
      if (fileNameMatch[2]) {
        let fallback = fileNameMatch[2]
        // 检查fallback是否也需要解码
        if (fallback.includes('%')) {
          try {
            fallback = decodeURIComponent(fallback)
          } catch (e2) {
            // 解码失败，使用原始值
          }
        }
        return fallback
      }
    }
  }

  // 尝试匹配 filename="name" 格式
  fileNameMatch = contentDisposition.match(/filename="([^"]+)"/)
  if (fileNameMatch && fileNameMatch[1]) {
    let name = fileNameMatch[1]
    // 检查是否包含URL编码字符
    if (name.includes('%')) {
      try {
        name = decodeURIComponent(name)
        // 如果解码后还包含编码字符，再次尝试解码
        if (name.includes('%')) {
          name = decodeURIComponent(name)
        }
      } catch (e) {
        console.warn('文件名解码失败:', e)
      }
    }
    return name
  }

  // 尝试匹配 filename=name 格式（无引号）
  fileNameMatch = contentDisposition.match(/filename=([^;]+)/)
  if (fileNameMatch && fileNameMatch[1]) {
    let name = fileNameMatch[1].trim()
    // 移除可能的引号
    name = name.replace(/^["']|["']$/g, '')
    // 检查是否包含URL编码字符
    if (name.includes('%')) {
      try {
        name = decodeURIComponent(name)
        // 如果解码后还包含编码字符，再次尝试解码
        if (name.includes('%')) {
          name = decodeURIComponent(name)
        }
      } catch (e) {
        console.warn('文件名解码失败:', e)
      }
    }
    return name
  }

  return null
}

// 导出报表
const handleExport = async () => {
  if (!reportCode.value) {
    ElMessage.warning('缺少报表编码，无法导出')
    return
  }

  // 如果正在导出，禁止重复点击
  if (exporting.value) {
    return
  }

  exporting.value = true
  exportCountdown.value = 0
  
  // 启动倒计时
  exportTimer = setInterval(() => {
    exportCountdown.value++
  }, 1000)
  
  try {
    // 调用后端导出接口
    // 路径格式：http://localhost:8081/ditto/Person/{code}
    const response = await request({
      url: `/Person/${reportCode.value}`,
      method: 'GET',
      responseType: 'blob' // 文件下载需要 blob 类型
    })

    // 从响应头中获取文件名
    let fileName = parseFileName(response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'])

    // 如果没有从响应头获取到文件名，使用默认文件名
    if (!fileName) {
      fileName = `报表数据_${reportCode.value}_${new Date().getTime()}.xlsx`
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
    // 使用解码后的文件名
    link.setAttribute('download', finalFileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('报表导出成功')
  } catch (error) {
    console.error('报表导出失败:', error)
    ElMessage.error('报表导出失败：' + (error.message || '未知错误'))
  } finally {
    // 清除倒计时
    if (exportTimer) {
      clearInterval(exportTimer)
      exportTimer = null
    }
    exporting.value = false
    exportCountdown.value = 0
  }
}

// 跳转到字段配置页面
const navigateToFieldConfig = () => {
  if (!templateCode.value) {
    ElMessage.warning('缺少模板编码，无法跳转到配置页面')
    return
  }
  // 在新标签页打开
  const route = router.resolve({
    name: 'FieldConfig',
    query: {
      templateCode: templateCode.value
    }
  })
  window.open(route.href, '_blank')
}

// 计算表格高度
const calculateTableHeight = () => {
  const windowHeight = window.innerHeight
  const headerHeight = 120
  const queryCardHeight = showQueryConditions.value ? 150 : 60
  const paginationHeight = 60
  const padding = 40
  tableHeight.value = windowHeight - headerHeight - queryCardHeight - paginationHeight - padding
}

// 监听窗口大小变化
const handleResize = () => {
  calculateTableHeight()
}

// 初始化数据（先加载表头，再加载数据）
const initData = async () => {
  if (!templateCode.value) {
    return
  }
  
  try {
    // 先加载表头
    await fetchTableHeaders()
    // 表头加载成功后再加载数据
    await fetchTableData()
  } catch (error) {
    console.error('初始化数据失败:', error)
  }
}

// 初始化标志，防止重复调用
const isInitialized = ref(false)

// 监听路由参数变化
watch(() => [route.query.templateCode, route.params.code, route.query.code], async ([newTemplateCode, newPathCode, newQueryCode]) => {
  if (newTemplateCode) {
    templateCode.value = newTemplateCode
  }
  // 优先使用路径参数，如果没有则使用查询参数
  const code = newPathCode || newQueryCode
  if (code) {
    reportCode.value = code
  }
  if (newTemplateCode && !isInitialized.value) {
    isInitialized.value = true
    await initData()
  }
}, { immediate: false })

// 初始化
onMounted(async () => {
  if (templateCode.value && !isInitialized.value) {
    isInitialized.value = true
    await initData()
  }
  calculateTableHeight()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 清理导出倒计时
  if (exportTimer) {
    clearInterval(exportTimer)
    exportTimer = null
  }
})
</script>

<style scoped>
/* 主容器 */
.report-browse {
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

/* 查询卡片 */
.query-card {
  margin-bottom: clamp(1rem, 2.5vw, 1.5rem);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-form {
  padding: 10px 0;
}

.query-form-content {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

.report-browse-table {
  width: 100%;
  font-size: clamp(1rem, 1.2vw, 1.125rem);
}

.report-browse-table :deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

.report-browse-table :deep(.el-table__header-wrapper) {
  overflow-x: hidden;
}

.report-browse-table :deep(.el-table__cell) {
  padding: clamp(0.5rem, 1.2vw, 1rem) clamp(0.5rem, 1.5vw, 1.25rem);
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
  .report-browse {
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

  .query-form-content {
    flex-direction: column;
  }

  .report-browse-table {
    font-size: 0.9375rem;
  }

  .report-browse-table :deep(.el-table__cell) {
    padding: 0.5rem 0.375rem;
  }
}

@media screen and (min-width: 481px) and (max-width: 768px) {
  .report-browse {
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
  .report-browse {
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
  .report-browse {
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
  .report-browse {
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
  .report-browse {
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

  .report-browse-table {
    font-size: 1.125rem;
  }
}

/* 横屏优化 */
@media screen and (orientation: landscape) and (max-height: 600px) {
  .report-browse {
    padding: 0.75rem 1rem;
  }

  .header {
    margin-bottom: 0.75rem;
  }
}
</style>

