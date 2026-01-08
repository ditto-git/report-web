import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  // 使用相对路径，通过 Vite 代理转发到后端
  // 如需直接请求，可改为: 'http://localhost:8080/ditto'
  baseURL: import.meta.env.VITE_API_BASE_URL || '/ditto',
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // TODO: 权限认证 - 后端完成权限功能后启用
    // 可以在这里添加 token
    // const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken')
    // if (token) {
    //   // 根据后端要求选择认证方式
    //   // 方式1: Bearer Token (默认)
    //   config.headers.Authorization = `Bearer ${token}`
    //   // 方式2: 直接使用 token (如果后端不需要 Bearer 前缀)
    //   // config.headers.Authorization = token
    //   // 方式3: 使用自定义请求头 (如果后端要求)
    //   // config.headers['X-Auth-Token'] = token
    //   // config.headers['token'] = token
    // }
    
    // 打印请求信息（开发环境）
    if (import.meta.env.DEV) {
      console.log('请求配置:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`
      })
    }
    
    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 如果是 blob 响应（文件下载），直接返回 blob 数据
    if (response.config.responseType === 'blob' || response.data instanceof Blob) {
      return response.data
    }
    
    // 对响应数据做点什么
    const res = response.data
    
    // 根据后端返回的数据结构处理
    // 如果后端统一返回格式为 { code, message, data }
    if (res.code !== undefined) {
      if (res.code === 200 || res.code === 0) {
        return res.data || res
      } else {
        ElMessage.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message || '请求失败'))
      }
    }
    
    // 如果后端直接返回数据
    return res
  },
  error => {
    // 对响应错误做点什么
    console.error('响应错误:', error)
    
    let message = '请求失败'
    if (error.response) {
      // 服务器返回了错误状态码
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 可以在这里清除 token 并跳转到登录页
          localStorage.removeItem('token')
          // router.push('/login')
          break
        case 403:
          message = '拒绝访问（403），可能是 CORS 跨域问题，请检查后端配置或使用代理'
          // TODO: 权限认证 - 后端完成权限功能后，这里可以添加 token 相关处理
          console.error('403 错误详情:', {
            url: error.config?.url,
            method: error.config?.method,
            fullURL: `${error.config?.baseURL}${error.config?.url}`,
            headers: error.config?.headers,
            response: error.response?.data
          })
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败: ${error.response.status}`
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      message = '网络连接失败，请检查网络'
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service



