@echo off
setlocal EnableExtensions
title VDT COZY IMAGE ROUTE V36

set "ROOT=D:\VDT TOOL VEO 3"
set "NODE=%ROOT%\runtime\node.exe"
set "PATCH=%~dp0PATCH_COZY_IMAGE_ROUTE_V36.mjs"

echo ============================================================
echo VDT COZY IMAGE ROUTE V36
echo COZY IMAGE - cozyFlowAutomation.js RIENG
echo KHONG SUA flowAutomation.js
echo VIDEO V35 GIU NGUYEN
echo ============================================================

if not exist "%NODE%" (
  echo [ERROR] Khong thay runtime\node.exe
  pause
  exit /b 1
)
if not exist "%ROOT%\src\cozyFlowAutomation.js" (
  echo [ERROR] Khong thay src\cozyFlowAutomation.js
  echo Day la AUTO Cozy rieng da tao truoc do. V36 khong tao lai tu flow chung.
  pause
  exit /b 1
)
if not exist "%PATCH%" (
  echo [ERROR] Khong thay PATCH_COZY_IMAGE_ROUTE_V36.mjs
  pause
  exit /b 1
)

"%NODE%" "%PATCH%"
if errorlevel 1 (
  echo.
  echo [ERROR] V36 patch that bai. Tool CHUA khoi dong lai.
  pause
  exit /b 1
)

for %%F in ("%ROOT%\src\app.js" "%ROOT%\src\server.js" "%ROOT%\src\cozyFlowAutomation.js") do (
  "%NODE%" --check "%%~F"
  if errorlevel 1 goto :syntaxerr
)

if exist "%ROOT%\public\cozyReferenceTripleExternal.js" (
  "%NODE%" --check "%ROOT%\public\cozyReferenceTripleExternal.js"
  if errorlevel 1 goto :syntaxerr
)

echo.
echo [RESTART] Dung server cu 5177/5178 de nap route V36...
for %%P in (5177 5178) do call :killport %%P

echo.
echo ============================================================
echo [OK] V36 DA CAI XONG + NODE CHECK OK.
echo flowAutomation.js      = KHONG SUA
echo cozyFlowAutomation.js  = AUTO ANH COZY RIENG
echo cozyVideoAutomation.js = GIU NGUYEN VIDEO V35
echo Cozy image route       = /api/cozy/create-reference-image-v36
echo ============================================================
echo.
echo Mo lai VDT TOOL va test TAO TU DONG 3 REF.
echo Log dung phai co: [cozy-ref-v36]
echo Neu con thay [flow-auto] ngay tu route tao anh Cozy thi dung lai va chup log.
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
echo Chay KHOI_PHUC_TRUOC_V36.cmd de quay lai.
pause
exit /b 1
