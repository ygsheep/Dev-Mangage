@echo off
echo ===== DevAPI Manager 后端调试脚本 =====
echo.

echo 1. 检查后端服务状态...
curl -s http://localhost:3000/health
echo.
echo.

echo 2. 检查 API 端点...
curl -s http://localhost:3000/api/v1
echo.
echo.

echo 3. 测试项目列表 API...
curl -s http://localhost:3000/api/v1/projects
echo.
echo.

echo 4. 测试 Dashboard Stats API...
curl -s http://localhost:3000/api/v1/dashboard/stats
echo.
echo.

echo 5. 测试 Dashboard Analytics API...
curl -s "http://localhost:3000/api/v1/dashboard/analytics?timeRange=7d"
echo.
echo.

echo 6. 检查端口 3000 是否被占用...
netstat -ano | findstr :3000
echo.

echo ===== 调试完成 =====
pause
