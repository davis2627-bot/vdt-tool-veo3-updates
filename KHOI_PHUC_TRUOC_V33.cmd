@echo off
setlocal EnableExtensions
set "ROOT=D:\VDT TOOL VEO 3"

echo KHOI PHUC TRUOC COZY VIDEO AUTO RIENG V33

echo.
for %%F in (server.js app.js flowAutomation.js cozyFlowAutomation.js) do (
  if exist "%ROOT%\src\%%F.before_cozy_video_v33" (
    copy /y "%ROOT%\src\%%F.before_cozy_video_v33" "%ROOT%\src\%%F" >nul
    echo [OK] Khoi phuc src\%%F
  )
)

if exist "%ROOT%\public\app.js.before_cozy_video_v33" (
  copy /y "%ROOT%\public\app.js.before_cozy_video_v33" "%ROOT%\public\app.js" >nul
  echo [OK] Khoi phuc public\app.js
)

if exist "%ROOT%\src\cozyVideoAutomation.js" (
  del /f /q "%ROOT%\src\cozyVideoAutomation.js"
  echo [OK] Xoa cozyVideoAutomation.js V33
)

echo.
echo [XONG] Da khoi phuc truoc V33.
pause
endlocal
