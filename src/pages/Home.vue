<template>
  <div class="home-page" v-loading="exporting" :element-loading-text="exporting ? `正在导出报表，请稍候... (${exportCountdown}秒)` : '正在导出报表，请稍候...'" element-loading-background="transparent">
    <!-- 导航栏 -->
    <div class="navbar">
      <div class="navbar-start">
        <div class="logo" @click="navigateToHome">
          <el-icon :size="32"><Document /></el-icon>
          <span class="logo-text">报表导出系统</span>
        </div>
      </div>
      
      <div class="navbar-center">
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          class="nav-menu"
        >
          <el-menu-item index="home" @click="navigateToHome">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="reports" @click="navigateToReportManagement">
            <el-icon><Document /></el-icon>
            <span>报表管理</span>
          </el-menu-item>
        </el-menu>
      </div>
      
      <div class="navbar-end">
        <div class="search-container">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索报表..."
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- 面包屑 -->
    <div class="breadcrumb-container">
      <el-breadcrumb separator="›">
        <el-breadcrumb-item :to="{ name: 'Home' }">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-breadcrumb-item>
        <el-breadcrumb-item>报表总览</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- Hero 区域 -->
      <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="hero-card">
            <h1 class="hero-title">报表总览</h1>
            <p class="hero-subtitle">
              所有可用报表一览无余，轻松配置，快速导出。
            </p>
            <div class="hero-actions">
              <el-button type="primary" size="large" @click="navigateToReportManagement">
                <el-icon><Plus /></el-icon>
                新建报表
              </el-button>
              <el-button type="default" size="large">
                <el-icon><Download /></el-icon>
                查看下载历史
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <div class="content-wrapper">
        <!-- 筛选和搜索区域 -->
        <section class="filter-section">
          <div class="filter-content">
            <div class="search-group">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索报表名称或描述..."
                class="report-search-input"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
                <template #append>
                  <el-button type="primary" @click="handleSearch">搜索</el-button>
                </template>
              </el-input>
            </div>
            
            <div class="filter-actions">
              <el-select v-model="selectedType" placeholder="类型" clearable style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="人员报表" value="person" />
                <el-option label="财务报表" value="finance" />
              </el-select>
              
              <el-select v-model="selectedStatus" placeholder="状态" clearable style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="已启用" value="enabled" />
                <el-option label="已禁用" value="disabled" />
              </el-select>
              
              <el-button @click="clearFilters">清除筛选</el-button>
              
              <div class="view-toggle">
                <el-button-group>
                  <el-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
                    <el-icon><Grid /></el-icon>
                  </el-button>
                  <el-button :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">
                    <el-icon><List /></el-icon>
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </div>
        </section>

        <!-- 报表列表区域 -->
        <section class="report-list-section">
          <div v-if="viewMode === 'card'" class="report-grid">
            <div
              v-for="report in filteredReports"
              :key="report.code"
              class="report-card"
              @click="navigateToReport(report)"
            >
              <div class="card-header">
                <h3 class="card-title">{{ report.name }}</h3>
                <el-tag :type="report.enabled ? 'success' : 'danger'" size="small">
                  {{ report.enabled ? '已启用' : '已禁用' }}
                </el-tag>
              </div>
              
              <p class="card-description">
                {{ report.description || '暂无描述' }}
              </p>
              
              <div class="card-meta">
                <div class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  <span>Code: {{ report.code }}</span>
                </div>
                <div class="meta-item">
                  <el-icon><Document /></el-icon>
                  <span>Template: {{ report.templateCode }}</span>
                </div>
              </div>
              
              <div class="card-actions">
                <el-button type="primary" link size="small" @click.stop="navigateToReport(report)">
                  查看
                </el-button>
                <el-dropdown @click.stop>
                  <el-button type="info" link size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click.stop="handleExportReport(report)">导出</el-dropdown-item>
                      <el-dropdown-item @click.stop="navigateToFieldConfig(report)">配置</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
          
          <div v-else class="report-table-container">
            <el-table
              :data="filteredReports"
              stripe
              style="width: 100%"
              @row-click="handleRowClick"
            >
              <el-table-column prop="name" label="报表名称" min-width="200" />
              <el-table-column prop="code" label="Code" min-width="150" />
              <el-table-column prop="templateCode" label="Template Code" min-width="150" />
              <el-table-column prop="enabled" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.enabled ? 'success' : 'danger'" size="small">
                    {{ row.enabled ? '已启用' : '已禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click.stop="navigateToReport(row)">
                    查看
                  </el-button>
                  <el-button type="warning" link size="small" @click.stop="navigateToFieldConfig(row)">
                    配置
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[12, 24, 36, 48]"
              :total="filteredReports.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </section>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <div class="footer-logo">
            <el-icon :size="32" color="#007bff"><Document /></el-icon>
            <h3>报表导出系统</h3>
          </div>
          <p>企业级报表管理平台</p>
          <p>技术支持：400-888-8888</p>
        </div>
        
        <div class="footer-section">
          <h4>快速导航</h4>
          <el-link type="primary" @click="navigateToHome">系统首页</el-link>
          <el-link type="primary" @click="navigateToReportManagement">报表总览</el-link>
        </div>
        
        <div class="footer-section">
          <h4>系统功能</h4>
          <span>数据导出</span>
          <span>报表生成</span>
          <span>历史记录</span>
          <span>批量处理</span>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>© 2025 报表导出系统. 版权所有</p>
        <div class="footer-links">
          <el-link type="info">隐私政策</el-link>
          <el-link type="info">使用条款</el-link>
          <span>系统版本 v2.1.0</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Document,
  HomeFilled,
  Setting,
  Search,
  Plus,
  Download,
  Calendar,
  Grid,
  List,
  MoreFilled,
  View
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

// 活动菜单项
const activeMenu = ref('home')

// 搜索关键词
const searchKeyword = ref('')

// 筛选条件
const selectedType = ref('')
const selectedStatus = ref('')

// 视图模式
const viewMode = ref('card')

// 分页
const currentPage = ref(1)
const pageSize = ref(12)

// 导出状态
const exporting = ref(false)
// 导出倒计时（秒）
const exportCountdown = ref(0)
let exportTimer = null

// 报表列表数据
const reportList = [
  {
    name: '现在职人员花名册(单位分组)',
    code: 'HMC_XZ_N',
    templateCode: 'HMC_XZ_N',
    enabled: true,
    description: '按单位分组显示的现在职人员花名册报表'
  },
  {
    name: '现在职人员花名册(单位)',
    code: 'HMC_XZ_S',
    templateCode: 'HMC_XZ',
    enabled: true,
    description: '单位维度的现在职人员花名册报表'
  },
  {
    name: '现在职人员花名册',
    code: 'HMC_XZ',
    templateCode: 'HMC_XZ',
    enabled: true,
    description: '完整的现在职人员花名册报表'
  },
  {
    name: '人员成绩',
    code: 'RY_CJ',
    templateCode: 'RY_CJ',
    enabled: true,
    description: '人员成绩统计报表'
  },
  {
    name: '人员成绩(新)',
    code: 'RY_CJ_N',
    templateCode: 'RY_CJ',
    enabled: true,
    description: '新版人员成绩统计报表'
  },
  {
    name: '人员成绩(单位)',
    code: 'RY_CJ_S',
    templateCode: 'RY_CJ',
    enabled: true,
    description: '按单位统计的人员成绩报表'
  }
]

// 过滤后的报表列表
const filteredReports = computed(() => {
  let result = reportList

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(report =>
      report.name.toLowerCase().includes(keyword) ||
      report.code.toLowerCase().includes(keyword) ||
      report.templateCode.toLowerCase().includes(keyword) ||
      (report.description && report.description.toLowerCase().includes(keyword))
    )
  }

  // 状态过滤
  if (selectedStatus.value) {
    result = result.filter(report => {
      if (selectedStatus.value === 'enabled') return report.enabled
      if (selectedStatus.value === 'disabled') return !report.enabled
      return true
    })
  }

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 清除筛选
const clearFilters = () => {
  searchKeyword.value = ''
  selectedType.value = ''
  selectedStatus.value = ''
  currentPage.value = 1
}

// 分页改变
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handlePageChange = (page) => {
  currentPage.value = page
}

// 导航
const navigateToHome = () => {
  router.push({ name: 'Home' })
}

const navigateToReportManagement = () => {
  const route = router.resolve({ name: 'ReportManagement' })
  window.open(route.href, '_blank')
}

const navigateToFieldConfig = (report) => {
  // 在新标签页打开
  if (report) {
    // 如果传入了报表对象，传递 templateCode
    const route = router.resolve({
      name: 'FieldConfig',
      query: {
        templateCode: report.templateCode
      }
    })
    window.open(route.href, '_blank')
  } else {
    // 如果没有传入报表对象，直接跳转
    const route = router.resolve({ name: 'FieldConfig' })
    window.open(route.href, '_blank')
  }
}

const navigateToReportBrowse = () => {
  router.push({ name: 'ReportBrowse' })
}

const navigateToEmployeeTravel = () => {
  router.push({ name: 'EmployeeTravelRecord' })
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

// 导出报表（与 report-browse 页面功能相同）
const handleExportReport = async (report) => {
  if (!report.code) {
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
      url: `/Person/${report.code}`,
      method: 'GET',
      responseType: 'blob' // 文件下载需要 blob 类型
    })

    // 从响应头中获取文件名
    let fileName = parseFileName(response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'])

    // 如果没有从响应头获取到文件名，使用默认文件名
    if (!fileName) {
      fileName = `报表数据_${report.code}_${new Date().getTime()}.xlsx`
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

const navigateToReport = (report) => {
  // 在新标签页打开
  const route = router.resolve({
    name: 'ReportBrowse',
    params: {
      code: report.code
    },
    query: {
      templateCode: report.templateCode
    }
  })
  window.open(route.href, '_blank')
}

// 表格行点击
const handleRowClick = (row) => {
  navigateToReport(row)
}

onMounted(() => {
  // 初始化
})

onUnmounted(() => {
  // 清理导出倒计时
  if (exportTimer) {
    clearInterval(exportTimer)
    exportTimer = null
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

/* 导航栏 */
.navbar {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 2rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.navbar-start {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 700;
  color: #007bff;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
}

.navbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-menu {
  border: none;
  background: transparent;
}

.navbar-end {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-container {
  width: 300px;
}

.search-input {
  width: 100%;
}

/* 面包屑 */
.breadcrumb-container {
  background: #f8f9fa;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

/* 主内容 */
.main-content {
  flex: 1;
  background: #f8f9fa;
}

/* Hero 区域 */
.hero-section {
  position: relative;
  min-height: 320px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0);
  background-size: 16px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 123, 255, 0.2);
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.hero-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 600px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin: 0 0 2rem 0;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* 内容包装器 */
.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* 筛选区域 */
.filter-section {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-group {
  flex: 1;
}

.report-search-input {
  width: 100%;
  max-width: 400px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.view-toggle {
  margin-left: auto;
}

/* 报表列表 */
.report-list-section {
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 卡片视图 */
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.report-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.report-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #007bff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
  cursor: pointer;
}

.card-title:hover {
  color: #007bff;
}

.card-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.8125rem;
  color: #94a3b8;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* 表格视图 */
.report-table-container {
  margin-bottom: 2rem;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding-top: 2rem;
}

/* 页脚 */
.footer {
  background: #f8f9fa;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #007bff;
  margin: 0 0 1rem 0;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.footer-logo h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #007bff;
  margin: 0;
}

.footer-section p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.5rem 0;
}

.footer-section .el-link {
  display: block;
  margin-bottom: 0.5rem;
}

.footer-section span {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.footer-bottom {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-bottom p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.footer-links span {
  font-size: 0.875rem;
  color: #64748b;
}

/* 响应式 */
@media screen and (max-width: 1200px) {
  .report-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media screen and (max-width: 768px) {
  .navbar {
    padding: 0 1rem;
  }

  .search-container {
    display: none;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-card {
    padding: 2rem 1.5rem;
  }

  .content-wrapper {
    padding: 1rem;
  }

  .report-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .view-toggle {
    margin-left: 0;
  }

  .footer-content {
    grid-template-columns: 1fr;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>