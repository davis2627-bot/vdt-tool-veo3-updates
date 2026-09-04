@echo off
setlocal EnableExtensions
set "ROOT=D:\VDT TOOL VEO 3"

echo ============================================================
echo KHOI PHUC TRUOC COZY VIDEO V34
echo ============================================================

if exist "%ROOT%\src\app.js.before_cozy_video_v34" (
  copy /y "%ROOT%\src\app.js.before_cozy_video_v34" "%ROOT%\src\app.js" >nul
  echo [OK] Khoi phuc app.js
)
if exist "%ROOT%\src\server.js.before_cozy_video_v34" (
  copy /y "%ROOT%\src\server.js.before_cozy_video_v34" "%ROOT%\src\server.js" >nul
  echo [OK] Khoi phuc server.js
)
if exist "%ROOT%\src\cozyVideoAutomation.js" (
  del /f /q "%ROOT%\src\cozyVideoAutomation.js" >nul 2>nul
  echo [OK] Xoa cozyVideoAutomation.js V34
)

echo flowAutomation.js KHONG CAN KHOI PHUC vi V34 khong sua file nay.
echo cozyFlowAutomation.js KHONG CAN KHOI PHUC vi V34 khong sua file nay.
echo.
pause
endlocal
