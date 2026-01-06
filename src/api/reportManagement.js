import request from '@/utils/request'

/**
 * 报表管理相关接口
 */

// 获取模板列表
export function getTemplateList(params) {
  return request({
    url: '/report/templates',
    method: 'get',
    params
  })
}

// 创建模板
export function createTemplate(data) {
  return request({
    url: '/report/templates',
    method: 'post',
    data
  })
}

// 更新模板
export function updateTemplate(id, data) {
  return request({
    url: `/report/templates/${id}`,
    method: 'put',
    data
  })
}

// 删除模板
export function deleteTemplate(id) {
  return request({
    url: `/report/templates/${id}`,
    method: 'delete'
  })
}

// 批量删除模板
export function batchDeleteTemplates(ids) {
  return request({
    url: '/report/templates/batch-delete',
    method: 'post',
    data: { ids }
  })
}

// 上传模板文件
export function uploadTemplateFile(id, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: `/report/templates/${id}/upload`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 下载模板文件
export function downloadTemplateFile(id) {
  return request({
    url: `/report/templates/${id}/download`,
    method: 'get',
    responseType: 'blob'
  })
}


