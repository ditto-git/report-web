import request from '@/utils/request'

/**
 * 报表浏览相关接口
 */

// 获取表头
export function getReportHeaders() {
  return request({
    url: '/report/browse/headers',
    method: 'get'
  })
}

// 查询报表数据
export function queryReportData(params) {
  return request({
    url: '/report/browse/query',
    method: 'post',
    data: params
  })
}

// 导出报表
export function exportReport(params) {
  return request({
    url: '/report/browse/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}




