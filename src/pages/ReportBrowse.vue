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
      <vxe-table 
        :data="tableData" 
        border 
        :loading="loading"
        style="width: 100%"
        class="report-browse-table"
        :height="tableHeight"
        :max-height="tableHeight"
        :sort-config="{ trigger: 'default', remote: true }"
        @sort-change="handleSortChange"
        show-overflow="tooltip"
        auto-resize
      >
        <vxe-column 
          type="seq" 
          title="序号" 
          width="100" 
          align="center"
          :seq-config="seqConfig"
        />
        <vxe-column 
          v-for="(column, index) in tableColumns" 
          :key="column.cellCode || index"
          :field="column.cellProperty"
          :title="column.headContent"
          :min-width="getColumnWidth(column.headContent)"
          sortable
        >
          <template #default="{ row }">
            <span class="text-ellipsis">
              {{ row[column.cellProperty] || '-' }}
            </span>
          </template>
        </vxe-column>
      </vxe-table>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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

// 序号列配置（计算属性，确保响应式更新）
const seqConfig = computed(() => ({
  startIndex: (pagination.value.currentPage - 1) * pagination.value.pageSize
}))

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
const handleSortChange = ({ column, property, order }) => {
  // vxe-table 的排序事件参数格式：{ column, property, order, sortBy, sortList }
  sortInfo.value = { prop: property, order: order || '' }
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
    // 按 cellIndex 排序，并过滤掉 cellProperty 为 "XH" 的表头
    const sortedData = Array.isArray(data) 
      ? data
          .filter(item => item.cellProperty !== 'XH') // 过滤掉 cellProperty 为 "XH" 的表头
          .sort((a, b) => {
            const indexA = parseInt(a.cellIndex || 0)
            const indexB = parseInt(b.cellIndex || 0)
            return indexA - indexB
          })
      : []

    // 生成表头配置，清理 headContent 中的特殊字符（如换行符 \n、回车符 \r、制表符 \t 等）
    tableColumns.value = sortedData.map(item => {
      // 清理 headContent 中的特殊字符
      let headContent = item.headContent || ''
      // 移除换行符、回车符、制表符等特殊字符，替换为空格或直接移除
      headContent = headContent.replace(/[\n\r\t]/g, '').trim()
    
      
      return {
        headContent: headContent || '',
        cellProperty: item.cellProperty || '',
        cellIndex: item.cellIndex || '',
        cellCode: item.cellCode || ''
      }
    })

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

// 计算表格高度（确保能显示11行：1行表头 + 10行数据，每行48px）
const calculateTableHeight = () => {
  // 每行高度 48px，11行总共 528px
  const minTableHeight = 48 * 11 // 528px
  const windowHeight = window.innerHeight
  const headerHeight = 120
  const queryCardHeight = showQueryConditions.value ? 150 : 60
  const paginationHeight = 60
  const padding = 100
  const calculatedHeight = windowHeight - headerHeight - queryCardHeight - paginationHeight - padding
  // 取计算高度和最小高度的较大值，确保至少能显示11行
  tableHeight.value = Math.max(calculatedHeight, minTableHeight)
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
    // 数据加载完成后重新计算表格高度
    await nextTick()
    calculateTableHeight()
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
  scrollbar-color: transparent transparent; /* 默认透明 */
  margin-bottom: clamp(1rem, 2.5vw, 1.5rem);
  transition: scrollbar-color 0.3s;
}

.table-wrapper:hover {
  scrollbar-color: #c1c1c1 #f1f1f1; /* 悬停时显示 */
}

/* Webkit 浏览器滚动条 */
.table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: transparent; /* 默认透明 */
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: transparent; /* 默认透明 */
  border-radius: 4px;
  transition: background 0.3s;
}

.table-wrapper:hover::-webkit-scrollbar-track {
  background: #f1f1f1; /* 悬停时显示 */
}

.table-wrapper:hover::-webkit-scrollbar-thumb {
  background: #c1c1c1; /* 悬停时显示 */
}

.table-wrapper:hover::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.report-browse-table {
  width: 100%;
  font-size: clamp(1rem, 1.2vw, 1.125rem);
}

/* 表格整体样式 - 类似 Element Plus */
.report-browse-table :deep(.vxe-table) {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  height: 100% !important;
}

/* 确保表格容器高度正确 */
.report-browse-table {
  height: 100%;
}

/* 表头样式 - 白色背景 */
.report-browse-table :deep(.vxe-table--header-wrapper) {
  overflow-x: hidden;
  background-color: #ffffff;
}

.report-browse-table :deep(.vxe-header--row) {
  background-color: #ffffff;
}

.report-browse-table :deep(.vxe-header--column) {
  background-color: #ffffff;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
  color: #606266;
  padding: 13.5px 19.6875px; /* 与数据行保持一致 */
  height: 48px; /* 固定行高，确保表头和数据行高度一致 */
  box-sizing: border-box;
}

.report-browse-table :deep(.vxe-header--column:last-child) {
  border-right: none;
}

/* 表头单元格内容 */
.report-browse-table :deep(.vxe-header--column .vxe-cell) {
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  line-height: 21px; /* 14px * 1.5 = 21px，与数据行保持一致 */
  height: 21px;
  display: flex;
  align-items: center;
}

/* 表格主体样式 */
.report-browse-table :deep(.vxe-table--body-wrapper) {
  overflow-x: auto;
}

.report-browse-table :deep(.vxe-body--row) {
  transition: background-color 0.25s;
  height: 48px; /* 固定行高，确保每行高度一致 */
}

/* 斑马纹样式 - 从灰色开始，依次轮替：灰-白-灰-白... */
/* 第1行（奇数）：灰色，第2行（偶数）：白色，第3行（奇数）：灰色，以此类推 */
.report-browse-table :deep(.vxe-body--row:nth-child(odd)) {
  background-color: #fafafa !important; /* 奇数行：灰色 */
}

.report-browse-table :deep(.vxe-body--row:nth-child(even)) {
  background-color: #ffffff !important; /* 偶数行：白色 */
}

/* 悬停效果 - 根据行的原始颜色显示不同的悬停色 */
.report-browse-table :deep(.vxe-body--row:nth-child(even):hover) {
  background-color: #f0f2f5 !important; /* 偶数行（白色）悬停时显示浅灰色 */
}

.report-browse-table :deep(.vxe-body--row:nth-child(odd):hover) {
  background-color: #ebeef5 !important; /* 奇数行（灰色）悬停时显示稍深的灰色 */
}

/* 单元格样式 - 与表头高度一致 */
.report-browse-table :deep(.vxe-body--column) {
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  padding: 13.5px 19.6875px; /* 与表头保持一致 */
  height: 48px; /* 固定行高，确保表头和数据行高度一致 */
  box-sizing: border-box;
}

.report-browse-table :deep(.vxe-body--column:last-child) {
  border-right: none;
}

.report-browse-table :deep(.vxe-cell) {
  padding: 0;
  font-size: 14px;
  color: #606266;
  line-height: 21px; /* 14px * 1.5 = 21px，与表头保持一致 */
  height: 21px;
  display: flex;
  align-items: center;
}

/* 序号列样式 */
.report-browse-table :deep(.vxe-header--column.type--seq) {
  background-color: #ffffff; /* 表头序号列：白色 */
  text-align: center;
}

.report-browse-table :deep(.vxe-body--column.type--seq) {
  text-align: center;
}

/* 确保序号列也遵循斑马纹：灰-白-灰-白... */
.report-browse-table :deep(.vxe-body--row:nth-child(even) .vxe-body--column.type--seq) {
  background-color: #ffffff !important; /* 偶数行序号列：白色 */
}

.report-browse-table :deep(.vxe-body--row:nth-child(odd) .vxe-body--column.type--seq) {
  background-color: #f5f7fa !important; /* 奇数行序号列：灰色 */
}

/* 排序图标样式 - 类似 Element Plus */
.report-browse-table :deep(.vxe-header--column .vxe-sort) {
  color: #c0c4cc;
  font-size: 12px;
}

.report-browse-table :deep(.vxe-header--column.col--sortable:hover .vxe-sort) {
  color: #909399;
}

.report-browse-table :deep(.vxe-header--column.col--sort-asc .vxe-sort),
.report-browse-table :deep(.vxe-header--column.col--sort-desc .vxe-sort) {
  color: #409eff;
}

/* 边框样式优化 */
.report-browse-table :deep(.vxe-table--border-line) {
  border-color: #ebeef5;
}

/* 滚动条样式 - 自动隐藏，只在悬停时显示 */
.report-browse-table :deep(.vxe-table--body-wrapper) {
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: transparent transparent; /* Firefox - 默认透明 */
}

.report-browse-table :deep(.vxe-table--body-wrapper:hover) {
  scrollbar-color: #c1c1c1 #f5f5f5; /* Firefox - 悬停时显示 */
}

/* Webkit 浏览器（Chrome, Safari, Edge） */
.report-browse-table :deep(.vxe-table--body-wrapper)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.report-browse-table :deep(.vxe-table--body-wrapper)::-webkit-scrollbar-track {
  background: transparent; /* 默认透明 */
  border-radius: 4px;
}

.report-browse-table :deep(.vxe-table--body-wrapper)::-webkit-scrollbar-thumb {
  background: transparent; /* 默认透明 */
  border-radius: 4px;
  transition: background 0.3s;
}

.report-browse-table :deep(.vxe-table--body-wrapper:hover)::-webkit-scrollbar-track {
  background: #f5f5f5; /* 悬停时显示 */
}

.report-browse-table :deep(.vxe-table--body-wrapper:hover)::-webkit-scrollbar-thumb {
  background: #c1c1c1; /* 悬停时显示 */
}

.report-browse-table :deep(.vxe-table--body-wrapper:hover)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 加载状态遮罩 - 类似 Element Plus */
.report-browse-table :deep(.vxe-table--loading) {
  background-color: rgba(255, 255, 255, 0.9);
}

.report-browse-table :deep(.vxe-table--loading-wrapper) {
  background-color: rgba(255, 255, 255, 0.9);
}

/* 空数据样式 - 类似 Element Plus */
.report-browse-table :deep(.vxe-table--empty-block) {
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

/* 选中行样式（如果需要） */
.report-browse-table :deep(.vxe-body--row.row--checked) {
  background-color: #ecf5ff;
}

.report-browse-table :deep(.vxe-body--row.row--checked:hover) {
  background-color: #d9ecff !important;
}

/* 确保序号列在悬停时也保持正确的背景色 */
.report-browse-table :deep(.vxe-body--row:nth-child(even):hover .vxe-body--column.type--seq) {
  background-color: #f0f2f5 !important; /* 偶数行序号列悬停时显示浅灰色 */
}

.report-browse-table :deep(.vxe-body--row:nth-child(odd):hover .vxe-body--column.type--seq) {
  background-color: #ebeef5 !important; /* 奇数行序号列悬停时显示稍深的灰色 */
}

/* 表格边框圆角 */
.report-browse-table :deep(.vxe-table--header) {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.report-browse-table :deep(.vxe-table--footer) {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* 优化单元格对齐 */
.report-browse-table :deep(.vxe-cell--title) {
  font-weight: 500;
}

/* 工具提示样式优化 */
.report-browse-table :deep(.vxe-tooltip--wrapper) {
  font-size: 12px;
  background-color: #303133;
  color: #fff;
  border-radius: 4px;
  padding: 8px 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 表格第一行和最后一行的边框优化 */
.report-browse-table :deep(.vxe-body--row:first-child .vxe-body--column) {
  border-top: none;
}

.report-browse-table :deep(.vxe-body--row:last-child .vxe-body--column) {
  border-bottom: 1px solid #ebeef5;
}

/* 表头第一列和最后一列的边框优化 */
.report-browse-table :deep(.vxe-header--column:first-child) {
  border-left: none;
}

.report-browse-table :deep(.vxe-body--column:first-child) {
  border-left: none;
}

/* 确保表格内容垂直居中 */
.report-browse-table :deep(.vxe-cell) {
  display: flex;
  align-items: center;
  min-height: 23px;
}

/* 优化序号列的对齐 */
.report-browse-table :deep(.vxe-body--column.type--seq .vxe-cell) {
  justify-content: center;
}

/* 表格整体阴影效果（可选，更接近 Element Plus） */
.report-browse-table :deep(.vxe-table) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 响应式字体大小 */
.report-browse-table :deep(.vxe-header--column .vxe-cell),
.report-browse-table :deep(.vxe-body--column .vxe-cell) {
  font-size: clamp(0.875rem, 1.2vw, 1rem);
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


