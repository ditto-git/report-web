<template>
  <div class="report-browse">
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
          >
            报表导出
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
          v-for="(header, index) in tableHeaders" 
          :key="index"
          :prop="header"
          :label="header"
          :min-width="getColumnWidth(header)"
          :sortable="'custom'"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tooltip
              :content="row[header] || '-'"
              placement="top"
              :disabled="!row[header] || String(row[header]).length <= 20"
            >
              <span class="text-ellipsis">
                {{ row[header] || '-' }}
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
import { useRoute } from 'vue-router'
import { Search, Download, Refresh, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()

// 从路由参数获取 templateCode
const templateCode = ref(route.query.templateCode || '')
const reportCode = ref(route.query.code || '')

// 查询关键字
const searchKeyword = ref('')

// 是否显示查询条件
const showQueryConditions = ref(true)

// 加载状态
const loading = ref(false)

// 导出状态
const exporting = ref(false)

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
  pageSize: 20,
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
const handleRefresh = () => {
  fetchTableHeaders()
  fetchTableData()
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
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize,
      keyword: searchKeyword.value,
      templateCode: templateCode.value, // 传递 templateCode 参数
      ...queryForm.value,
      sortProp: sortInfo.value.prop,
      sortOrder: sortInfo.value.order
    }

    // 调用后端接口
    // const response = await getReportList(params)
    // tableData.value = response.data.list
    // pagination.value.total = response.data.total

    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟从后端获取的数据格式：List<Map<String,String>>
    const mockData = []
    for (let i = 0; i < pagination.value.pageSize; i++) {
      const row = {}
      tableHeaders.value.forEach(header => {
        row[header] = `${header}_数据_${(pagination.value.currentPage - 1) * pagination.value.pageSize + i + 1}`
      })
      mockData.push(row)
    }
    tableData.value = mockData
    pagination.value.total = 156 // 模拟总数

    ElMessage.success('数据加载成功')
  } catch (error) {
    ElMessage.error('数据加载失败：' + error.message)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// 获取表格表头
const fetchTableHeaders = async () => {
  try {
    // 调用后端接口获取表头
    // const response = await getReportHeaders()
    // tableHeaders.value = response.data // List<String>

    // 模拟从后端获取的表头格式：List<String>
    await new Promise(resolve => setTimeout(resolve, 200))
    tableHeaders.value = [
      '报表编号',
      '报表名称',
      '报表类型',
      '创建时间',
      '创建人',
      '报表状态',
      '文件大小',
      '备注信息'
    ]
  } catch (error) {
    ElMessage.error('表头加载失败：' + error.message)
    tableHeaders.value = []
  }
}

// 导出报表
const handleExport = async () => {
  exporting.value = true
  try {
    // 构建导出参数
    const params = {
      keyword: searchKeyword.value,
      ...queryForm.value,
      sortProp: sortInfo.value.prop,
      sortOrder: sortInfo.value.order,
      exportType: 'excel' // 或 'pdf'
    }

    // 调用后端导出接口
    // const response = await exportReport(params)
    // const url = window.URL.createObjectURL(new Blob([response.data]))
    // const link = document.createElement('a')
    // link.href = url
    // link.setAttribute('download', `报表数据_${new Date().getTime()}.xlsx`)
    // document.body.appendChild(link)
    // link.click()
    // document.body.removeChild(link)
    // window.URL.revokeObjectURL(url)

    // 模拟导出
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 创建模拟的导出数据
    const exportData = tableData.value.map((row, index) => {
      const exportRow = { 序号: (pagination.value.currentPage - 1) * pagination.value.pageSize + index + 1 }
      tableHeaders.value.forEach(header => {
        exportRow[header] = row[header] || '-'
      })
      return exportRow
    })

    // 转换为CSV格式（实际应该使用Excel库）
    const csvContent = [
      ['序号', ...tableHeaders.value].join(','),
      ...exportData.map(row => 
        ['序号', ...tableHeaders.value].map(header => 
          `"${row[header] || ''}"`
        ).join(',')
      )
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `报表数据_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('报表导出成功')
  } catch (error) {
    ElMessage.error('报表导出失败：' + error.message)
  } finally {
    exporting.value = false
  }
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

// 初始化
onMounted(() => {
  fetchTableHeaders()
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

