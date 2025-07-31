@echo off
echo 🚀 启动 DevAPI Manager 开发环境
echo.

echo 📊 系统信息:
echo    Node.js: %CD%
echo    工作目录: %CD%
echo.

echo 🔧 启动后端服务器...
start "后端服务器" cmd /k "cd packages\backend && npm run dev"

echo ⏳ 等待后端启动...
timeout /t 3 /nobreak > nul

echo 🌐 启动前端开发服务器...
start "前端开发服务器" cmd /k "cd packages\frontend && npm run dev"

echo.
echo ✅ 开发环境启动完成！
echo.
echo 📍 访问地址:
echo    🌐 前端: http://localhost:5173
echo    🔌 后端: http://localhost:3000
echo    📊 MCP Server控制台: http://localhost:5173/settings
echo.
echo 💡 使用说明:
echo    1. 前端页面会自动打开浏览器
echo    2. 进入 设置 页面查看 MCP 服务器控制台
echo    3. 点击 "启动服务器" 启动向量搜索服务
echo    4. 使用 Ctrl+C 停止相应服务
echo.
echo 🎯 MCP Server 特性:
echo    • 向量搜索 (all-MiniLM-L6-v2)
echo    • 智能回退 (TF-IDF算法)
echo    • 12个MCP工具
echo    • 实时状态监控
echo    • 日志流显示
echo.
pause