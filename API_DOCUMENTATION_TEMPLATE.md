# 文件上传 API 文档

## 接口信息

### 员工出行备案数据导入

**接口地址：** `/TripFiling/readData`

**请求方法：** `POST`

**接口描述：** 用于上传 Excel 文件，导入员工出行备案数据

**Content-Type：** `multipart/form-data`

---

## 请求参数

### 请求头（Headers）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Content-Type | String | 是 | `multipart/form-data`（浏览器会自动设置，包含 boundary） |

### 请求体（Body - FormData）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | File | 是 | Excel 文件（.xlsx 或 .xls 格式） |

**文件要求：**
- 文件格式：`.xlsx` 或 `.xls`
- 文件大小：不超过 10MB
- 文件内容：符合员工出行备案模板格式

---

## 响应格式

### 成功响应

**HTTP 状态码：** `200 OK`

**响应体：** 无响应参数，200 状态码即表示成功

```json
// 无响应体，仅通过 HTTP 状态码判断
```

### 失败响应

**HTTP 状态码：** 非 200 状态码（如 400、500 等）

**响应体示例：**

```json
{
  "code": 400,
  "message": "文件格式不正确",
  "data": null
}
```

**常见错误码：**
- `400` - 请求参数错误（文件格式不正确、文件过大等）
- `500` - 服务器内部错误
- `413` - 文件过大

---

## 调用示例

### JavaScript / Vue.js 示例

```javascript
// 使用 FormData 上传文件
const formData = new FormData()
formData.append('file', fileObject) // fileObject 是 File 对象

// 使用 axios 发送请求
const response = await axios({
  url: '/TripFiling/readData',
  method: 'POST',
  data: formData
  // 注意：不要手动设置 Content-Type，让浏览器自动设置
})

if (response.status === 200) {
  console.log('上传成功')
} else {
  console.error('上传失败')
}
```

### Element Plus Upload 组件示例

```vue
<template>
  <el-upload
    :auto-upload="false"
    :show-file-list="false"
    accept=".xlsx,.xls"
    :on-change="handleFileChange"
  >
    <el-button type="primary">选择文件</el-button>
  </el-upload>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const handleFileChange = async (uploadFile) => {
  const file = uploadFile.raw || uploadFile
  
  if (!file || !(file instanceof File)) {
    console.error('文件对象无效')
    return
  }
  
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await axios({
      url: '/TripFiling/readData',
      method: 'POST',
      data: formData
    })
    
    if (response.status === 200) {
      console.log('上传成功')
    }
  } catch (error) {
    console.error('上传失败:', error)
  }
}
</script>
```

### cURL 示例

```bash
curl -X POST \
  http://localhost:8080/ditto/TripFiling/readData \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/your/file.xlsx'
```

### Postman 调用示例

1. 选择请求方法：`POST`
2. 输入 URL：`http://localhost:8080/ditto/TripFiling/readData`
3. 在 **Body** 标签页选择 `form-data`
4. 添加字段：
   - Key: `file`（类型选择 `File`）
   - Value: 点击 "Select Files" 选择 Excel 文件
5. 发送请求

---

## 后端接收示例

### Java (Spring Boot) 示例

```java
@PostMapping("/readData")
public ResponseEntity<?> readData(@RequestParam("file") MultipartFile file) {
    try {
        // 验证文件
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("文件不能为空");
        }
        
        // 验证文件格式
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || 
            (!originalFilename.endsWith(".xlsx") && !originalFilename.endsWith(".xls"))) {
            return ResponseEntity.badRequest().body("文件格式不正确，仅支持 .xlsx 或 .xls");
        }
        
        // 验证文件大小（10MB）
        if (file.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.badRequest().body("文件大小不能超过 10MB");
        }
        
        // 处理文件
        // ... 你的业务逻辑
        
        return ResponseEntity.ok().build();
    } catch (Exception e) {
        return ResponseEntity.status(500).body("处理失败: " + e.getMessage());
    }
}
```

### Node.js (Express) 示例

```javascript
const multer = require('multer')
const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

app.post('/TripFiling/readData', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '文件不能为空' })
  }
  
  const file = req.file
  // 验证文件格式
  if (!file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
    return res.status(400).json({ message: '文件格式不正确' })
  }
  
  // 处理文件
  // ... 你的业务逻辑
  
  res.status(200).json({ message: '上传成功' })
})
```

---

## 注意事项

1. **Content-Type 设置**
   - 使用 `multipart/form-data` 时，不要手动设置 `Content-Type` 请求头
   - 浏览器会自动设置正确的 `Content-Type`，包括 `boundary` 参数

2. **文件字段名**
   - 前端 FormData 的字段名必须是 `file`
   - 后端通过 `request.getFile("file")` 或 `@RequestParam("file")` 获取文件

3. **文件验证**
   - 前端应在上传前验证文件格式和大小
   - 后端也应进行二次验证，确保安全性

4. **错误处理**
   - 通过 HTTP 状态码判断成功或失败
   - 200 状态码表示成功
   - 非 200 状态码表示失败，可查看响应体获取错误信息

5. **文件大小限制**
   - 建议前端限制为 10MB
   - 后端也应设置相应的文件大小限制

---

## 测试用例

### 正常情况
- ✅ 上传 `.xlsx` 格式文件（小于 10MB）
- ✅ 上传 `.xls` 格式文件（小于 10MB）

### 异常情况
- ❌ 上传非 Excel 文件（如 `.pdf`、`.txt`）
- ❌ 上传超过 10MB 的文件
- ❌ 上传空文件
- ❌ 不传递 `file` 参数
- ❌ 传递错误的字段名（不是 `file`）

---

## 更新日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-XX | 初始版本 |

