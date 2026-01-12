import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/report-management',
    name: 'ReportManagement',
    component: () => import('@/pages/ReportManagement.vue'),
    meta: {
      title: '报表管理'
    }
  },
  {
    path: '/field-config',
    name: 'FieldConfig',
    component: () => import('@/pages/FieldConfig.vue'),
    meta: {
      title: '字段配置'
    }
  },
  {
    path: '/report-browse/:code?',
    name: 'ReportBrowse',
    component: () => import('@/pages/ReportBrowse.vue'),
    meta: {
      title: '报表浏览'
    }
  },
  {
    path: '/employee-travel-record',
    name: 'EmployeeTravelRecord',
    component: () => import('@/pages/EmployeeTravelRecord.vue'),
    meta: {
      title: '员工出行备案'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 组件管理系统`
  }
  next()
})

export default router

