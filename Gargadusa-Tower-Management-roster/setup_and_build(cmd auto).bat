@echo off
echo Starting build process...

echo.
echo [Step 1] Installing electron and electron-builder...
:: 'call' is required here, otherwise the batch script will exit after npm finishes
call npm install --save-dev electron electron-builder

echo.
echo [Step 2] Copying files from perma_files to current directory...
:: /Y overwrites without prompting, /E copies directories and subdirectories
xcopy "perma_files\*" ".\" /Y /E

echo.
echo [Step 3] Renaming electron.js to main.js...
if exist "electron.js" (
    ren "electron.js" "main.js"
    echo Renamed successfully.
) else (
    echo electron.js not found, skipping rename.
)

echo.
echo [Step 4] Running npm run build...
call npm run build

echo.
echo Build process complete.
:: This keeps the command prompt open in the current folder
cmd /k