@echo off
setlocal EnableExtensions
set "ROOT=D:\VDT TOOL VEO 3"

for %%F in ("app.js" "server.js" "flowAutomation.js" "cozyVideoAutomation.js") do (
  if exist "%ROOT%\src\%%~F.before_cozy_video_v35" (
    copy /y "%ROOT%\src\%%~F.before_cozy_video_v35" "%ROOT%\src\%%~F" >nul
    echo [OK] Khoi phuc %%~F truoc V35.
  )
)

echo.
echo [XONG] Da khoi phuc truoc V35.
pause
endlocal
