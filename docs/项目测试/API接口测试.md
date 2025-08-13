## 1. 内容展示模块 (Public Content)

### 1.1 获取分类列表
```http
GET /categories
```

**查询参数**:
- `parent_id`: 父分类ID (可选)
- `is_active`: 是否激活 (可选)

**响应数据**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "音乐",
            "name_en": "Music",
            "description": "各类音乐内容",
            "icon_url": "https://example.com/icon.png",
            "color_code": "#4CD964",
            "children": [
                {
                    "id": 2,
                    "name": "流行音乐",
                    "name_en": "Pop Music"
                }
            ]
        }
    ]
}
```
