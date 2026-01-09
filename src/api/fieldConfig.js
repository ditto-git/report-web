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

// 获取模板字段配置信息
// params: {
//   templateCode: 模板编码（必填）
//   cellCode: 字段编码（可选，用于搜索）
//   cellProperty: 模板参数（可选，用于搜索）
//   headContent: 表头内容（可选，用于搜索）
// }
// TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
export function getExTemplateInfo(params) {
  return request({
    url: '/ExTemplateConsole/exTemplateInfo',
    method: 'post',
    data: params
  })
}

// 更新字段配置
// data: {
//   templateCode: 模板编码
//   cellCode: 字段编码
//   cellProperty: 模板参数
//   headContent: 表头内容
//   ... 其他字段配置信息
// }
// TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
export function updateExTemplateCell(data) {
  return request({
    url: '/ExTemplateConsole/updateExTemplateCell',
    method: 'post',
    data
  })
}

// 上传字段配置文件
// file: 文件对象
// TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
export function uploadExCells(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/ExTemplateConsole/uploadExCells',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 下载字段配置文件
// params: {
//   templateCode: 模板编码
// }
// TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
export function downloadExCells(params) {
  return request({
    url: '/ExTemplateConsole/downloadExCells',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}





