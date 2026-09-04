@echo off
setlocal EnableExtensions
set "ROOT=D:\VDT TOOL VEO 3"

for %%F in (app.js server.js cozyFlowAutomation.js) do (
  if exist "%ROOT%\src\%%~F.before_cozy_image_v36" (
    copy /y "%ROOT%\src\%%~F.before_cozy_image_v36" "%ROOT%\src\%%~F" >nul
    echo [OK] Khoi phuc %%~F truoc V36.
  )
)

if exist "%ROOT%\public\cozyReferenceTripleExternal.js.before_cozy_image_v36" (
  copy /y "%ROOT%\public\cozyReferenceTripleExternal.js.before_cozy_image_v36" "%ROOT%\public\cozyReferenceTripleExternal.js" >nul
  echo [OK] Khoi phuc cozyReferenceTripleExternal.js truoc V36.
)

echo.
echo Da khoi phuc file truoc V36.
pause
endlocal
