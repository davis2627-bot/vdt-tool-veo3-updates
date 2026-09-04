@echo off
setlocal EnableExtensions
title VDT COZY VIDEO AUTO RIENG V34

set "ROOT=D:\VDT TOOL VEO 3"
set "NODE=%ROOT%\runtime\node.exe"
set "PATCH=%~dp0PATCH_COZY_VIDEO_AUTO_RIENG_V34.mjs"

echo ============================================================
echo VDT COZY VIDEO AUTO RIENG V34
echo - KHONG SUA flowAutomation.js
echo - KHONG SUA cozyFlowAutomation.js
echo - TAO RIENG cozyVideoAutomation.js
echo - UPLOAD 1 LAN CUNG LUC 3 REF
echo - ADD REF1 - REF2 - REF3 - ROI MOI DAN PROMPT VIDEO
echo - ROUTE RIENG /api/cozy/create-videos
echo ============================================================

if not exist "%NODE%" (
  echo [ERROR] Khong thay runtime\node.exe
  pause
  exit /b 1
)
if not exist "%ROOT%\src\flowAutomation.js" (
  echo [ERROR] Khong thay src\flowAutomation.js
  pause
  exit /b 1
)
if not exist "%ROOT%\src\app.js" (
  echo [ERROR] Khong thay src\app.js
  pause
  exit /b 1
)
if not exist "%ROOT%\src\server.js" (
  echo [ERROR] Khong thay src\server.js
  pause
  exit /b 1
)
if not exist "%PATCH%" (
  echo [ERROR] Khong thay file patch V34.
  pause
  exit /b 1
)

"%NODE%" "%PATCH%"
if errorlevel 1 (
  echo.
  echo [ERROR] Cai V34 that bai. Tool CHUA khoi dong lai.
  pause
  exit /b 1
)

"%NODE%" --check "%ROOT%\src\cozyVideoAutomation.js"
if errorlevel 1 goto :syntaxerr
"%NODE%" --check "%ROOT%\src\server.js"
if errorlevel 1 goto :syntaxerr
"%NODE%" --check "%ROOT%\src\app.js"
if errorlevel 1 goto :syntaxerr

echo.
echo [RESTART] Dung server cu 5177/5178 de nap V34...
for %%P in (5177 5178) do call :killport %%P

echo.
echo ============================================================
echo [OK] V34 DA CAI XONG + NODE CHECK OK.
echo flowAutomation.js      = GIU NGUYEN
echo cozyFlowAutomation.js  = GIU NGUYEN AUTO ANH COZY
ECHO cozyVideoAutomation.js = AUTO VIDEO COZY RIENG
echo Cozy video             = UPLOAD 1 LAN 3 REF
ECHO ============================================================
echo Mo lai VDT TOOL va test CHI CANH 1 COZY truoc.
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
echo [ERROR] Node syntax check that bai.
echo Chay KHOI_PHUC_TRUOC_V34.cmd de quay lai.
pause
exit /b 1
