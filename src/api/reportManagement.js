import request from '@/utils/request'

/**
 * 报表管理相关接口
 */

// 获取模板列表
// select 参数：模板编码或模板名（可选，用于搜索）
export function getTemplateList(select = '') {
  return request({
    url: '/ExTemplateConsole/selectExTemplate',
    method: 'get',
    params: select ? { select } : {} // 如果有搜索关键词，传递 select 参数
  })
}

// 创建模板
// TODO: 待完善响应格式处理，当前仅判断200状态码
export function createTemplate(data) {
  return request({
    url: '/ExTemplateConsole/initExTemplate',
    method: 'post',
    data
  })
}

// 更新模板
// data: 包含模板信息的对象，例如：
// {
//   "templateCode": "TPL_20240107_001",
//   "templateUrl": "/templates/report/vertical_tpl.xlsx",
//   "templateTable": "sys_report_template",
//   "templateName": "月度销售报表模板",
//   "fileName": "月度销售报表_202401.xlsx",
//   "templateType": "1",
//   "templateStatus": "1"
// }
// TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
export function updateTemplate(data) {
  return request({
    url: '/ExTemplateConsole/updateExTemplate',
    method: 'post',
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
// templateCodes: 模板编码数组，例如 ["TPL_001", "TPL_002"]
// TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
export function batchDeleteTemplates(templateCodes) {
  return request({
    url: '/ExTemplateConsole/delExTemplate',
    method: 'post',
    data: templateCodes // 直接传递数组，例如 ["apple", "banana", "orange"]
  })
}

// 上传模板文件（旧接口，保留兼容）
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

// 上传/更新模板文件
// templateCode: 模板编码（路径变量）
// file: 文件对象
// TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
export function uploadExTemplate(templateCode, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: `/ExTemplateConsole/uploadExTemplate/${templateCode}`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 下载模板文件（旧接口，保留兼容）
export function downloadTemplateFile(id) {
  return request({
    url: `/report/templates/${id}/download`,
    method: 'get',
    responseType: 'blob'
  })
}

// 下载模板文件
// templateCode: 模板编码（路径变量）
// TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
export function downloadExTemplate(templateCode) {
  const formData = new FormData()
  // 虽然调用示例是 {}，但使用表单格式发送空表单
  return request({
    url: `/ExTemplateConsole/downloadExTemplate/${templateCode}`,
    method: 'post',
    data: formData,
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 更新模板状态
// data: 包含模板编码和状态的对象，例如：
// {
//   "templateCode": "TPL_20240107_001",
//   "templateStatus": "1"
// }
// TODO: 待完善响应格式处理，当前仅判断200状态码，后续会提供完整的响应示例
export function updateTemplateStatus(data) {
  return request({
    url: '/ExTemplateConsole/useExTemplate',
    method: 'post',
    data
  })
}



