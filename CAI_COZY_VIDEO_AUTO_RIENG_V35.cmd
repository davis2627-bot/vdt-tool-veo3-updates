@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title VDT COZY VIDEO AUTO RIENG V35

set "ROOT=D:\VDT TOOL VEO 3"
set "NODE=%ROOT%\runtime\node.exe"
set "PATCH=%~dp0PATCH_COZY_VIDEO_AUTO_RIENG_V35.mjs"

echo ============================================================
echo VDT COZY VIDEO AUTO RIENG V35
echo - KHONG SUA flowAutomation.js
echo - KHONG SUA cozyFlowAutomation.js
echo - TAO RIENG cozyVideoAutomation.js
echo - UPLOAD 1 LAN CUNG LUC 3 REF
echo - ADD REF1 - REF2 - REF3 - ROI MOI DAN PROMPT VIDEO
echo - ROUTE RIENG /api/cozy/create-videos-v35
echo ============================================================

if not exist "%NODE%" (
  echo [ERROR] Khong thay runtime\node.exe
  pause
  exit /b 1
)
if not exist "%PATCH%" (
  echo [ERROR] Khong thay PATCH_COZY_VIDEO_AUTO_RIENG_V35.mjs
  pause
  exit /b 1
)
if not exist "%ROOT%\src\flowAutomation.js" (
  echo [ERROR] Khong thay src\flowAutomation.js
  pause
  exit /b 1
)

"%NODE%" "%PATCH%"
if errorlevel 1 (
  echo.
  echo [ERROR] Cai V35 that bai. Tool CHUA khoi dong lai.
  pause
  exit /b 1
)

for %%F in ("%ROOT%\src\app.js" "%ROOT%\src\server.js" "%ROOT%\src\cozyVideoAutomation.js") do (
  "%NODE%" --check "%%~F"
  if errorlevel 1 goto :syntaxerr
)

echo.
echo [RESTART] Dung server cu 5177/5178 de nap V35...
for %%P in (5177 5178) do call :killport %%P

echo.
echo ============================================================
echo [OK] V35 DA CAI XONG + NODE CHECK OK.
echo flowAutomation.js      = GIU NGUYEN
echo cozyFlowAutomation.js  = GIU NGUYEN AUTO ANH COZY
echo cozyVideoAutomation.js = AUTO VIDEO COZY RIENG
echo COZY VIDEO             = UPLOAD 1 LAN CUNG LUC 3 REF
echo ROUTE                  = /api/cozy/create-videos-v35
echo ============================================================
echo.
echo Mo lai VDT TOOL va TEST 1 CANH COZY truoc.
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
echo Chay KHOI_PHUC_TRUOC_V35.cmd de quay lai.
pause
exit /b 1
