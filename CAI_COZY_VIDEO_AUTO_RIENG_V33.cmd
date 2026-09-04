@echo off
setlocal EnableExtensions
chcp 65001 >nul
title VDT COZY VIDEO AUTO RIENG V33

set "ROOT=D:\VDT TOOL VEO 3"
set "NODE=%ROOT%\runtime\node.exe"
set "PATCH=%~dp0PATCH_COZY_VIDEO_AUTO_RIENG_V33.mjs"

echo ============================================================
echo VDT COZY VIDEO AUTO RIENG V33
echo - KHONG SUA flowAutomation.js
echo - KHONG SUA cozyFlowAutomation.js
echo - TAO MOI cozyVideoAutomation.js
echo - ROUTE RIENG /api/cozy/create-videos
echo ============================================================
echo.

if not exist "%NODE%" (
  echo [ERROR] Khong thay %NODE%
  pause
  exit /b 1
)
if not exist "%PATCH%" (
  echo [ERROR] Khong thay PATCH_COZY_VIDEO_AUTO_RIENG_V33.mjs
  pause
  exit /b 1
)
if not exist "%ROOT%\src\flowAutomation.js" (
  echo [ERROR] Khong thay src\flowAutomation.js
  pause
  exit /b 1
)
if not exist "%ROOT%\src\cozyFlowAutomation.js" (
  echo [ERROR] Khong thay src\cozyFlowAutomation.js
  echo File nay phai co tu AUTO ANH COZY rieng da lam truoc.
  pause
  exit /b 1
)

"%NODE%" "%PATCH%"
if errorlevel 1 (
  echo.
  echo [ERROR] Cai V33 that bai. Tool chua duoc khoi dong lai.
  pause
  exit /b 1
)

echo.
echo [CHECK] Kiem tra syntax...
"%NODE%" --check "%ROOT%\src\cozyVideoAutomation.js"
if errorlevel 1 goto :syntaxerr
"%NODE%" --check "%ROOT%\src\server.js"
if errorlevel 1 goto :syntaxerr
"%NODE%" --check "%ROOT%\src\app.js"
if errorlevel 1 goto :syntaxerr
if exist "%ROOT%\public\app.js" (
  "%NODE%" --check "%ROOT%\public\app.js"
  if errorlevel 1 goto :syntaxerr
)

echo.
echo [RESTART] Dung server cu 5177/5178 de nap AUTO COZY moi...
for %%P in (5177 5178) do call :killport %%P

echo.
echo ============================================================
echo [OK] V33 DA CAI XONG + NODE CHECK OK.
echo ============================================================
echo flowAutomation.js     = GIU NGUYEN

echo cozyFlowAutomation.js = GIU NGUYEN AUTO 3 ANH

echo cozyVideoAutomation.js= AUTO VIDEO COZY RIENG

echo.
echo Mo lai VDT TOOL va test CANH 1 COZY truoc.
echo.
pause
exit /b 0

:killport
for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%1 .*LISTENING"') do (
  if not "%%A"=="0" taskkill /PID %%A /F >nul 2>nul
)
exit /b 0

:syntaxerr
echo.
echo [ERROR] NODE CHECK THAT BAI.
echo Chay KHOI_PHUC_TRUOC_V33.cmd de quay lai.
pause
exit /b 1
