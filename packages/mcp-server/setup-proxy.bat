@echo off
echo 配置系统代理用于下载向量模型

echo.
echo 请选择代理配置方式:
echo 1. 系统代理 (自动检测)
echo 2. 手动配置HTTP代理
echo 3. 手动配置HTTPS代理
echo 4. 清除代理配置
echo 5. 测试网络连接

set /p choice="请输入选择 (1-5): "

if "%choice%"=="1" (
    echo 检测系统代理设置...
    reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer 2>nul
    if %errorlevel%==0 (
        echo 系统代理已配置
    ) else (
        echo 未检测到系统代理
    )
) else if "%choice%"=="2" (
    set /p proxy="请输入HTTP代理地址 (格式: host:port): "
    set HTTP_PROXY=http://%proxy%
    setx HTTP_PROXY "http://%proxy%"
    echo HTTP代理已设置为: http://%proxy%
) else if "%choice%"=="3" (
    set /p proxy="请输入HTTPS代理地址 (格式: host:port): "
    set HTTPS_PROXY=https://%proxy%
    setx HTTPS_PROXY "https://%proxy%"
    echo HTTPS代理已设置为: https://%proxy%
) else if "%choice%"=="4" (
    set HTTP_PROXY=
    set HTTPS_PROXY=
    setx HTTP_PROXY ""
    setx HTTPS_PROXY ""
    echo 代理配置已清除
) else if "%choice%"=="5" (
    echo 测试网络连接...
    ping -n 1 huggingface.co >nul 2>&1
    if %errorlevel%==0 (
        echo ✅ 可以访问 huggingface.co
    ) else (
        echo ❌ 无法访问 huggingface.co
    )
    
    ping -n 1 hf-mirror.com >nul 2>&1
    if %errorlevel%==0 (
        echo ✅ 可以访问 hf-mirror.com (镜像站)
    ) else (
        echo ❌ 无法访问 hf-mirror.com
    )
) else (
    echo 无效选择
)

echo.
echo 当前代理设置:
echo HTTP_PROXY=%HTTP_PROXY%
echo HTTPS_PROXY=%HTTPS_PROXY%

echo.
echo 配置完成！请重新启动命令行窗口以使代理设置生效。
pause