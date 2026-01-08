import request from '@/utils/request'

/**
 * 字段配置相关接口
 */

// 获取字段配置列表
export function getFieldConfigList(params) {
  return request({
    url: '/field-config',
    method: 'get',
    params
  })
}

// 创建字段配置
export function createFieldConfig(data) {
  return request({
    url: '/field-config',
    method: 'post',
    data
  })
}

// 更新字段配置
export function updateFieldConfig(id, data) {
  return request({
    url: `/field-config/${id}`,
    method: 'put',
    data
  })
}

// 删除字段配置
export function deleteFieldConfig(id) {
  return request({
    url: `/field-config/${id}`,
    method: 'delete'
  })
}

// 导出字段配置
export function exportFieldConfig(params) {
  return request({
    url: '/field-config/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}

// 导入字段配置
export function importFieldConfig(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/field-config/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}




