@echo off
TITLE Wilson T41 - OSC Bridge
SETLOCAL

echo =========================================
echo    Wilson T41 - Iniciando Bridge OSC
echo =========================================

:: Verificar si node_modules existe, si no, instalar dependencias
if not exist node_modules (
    echo [INFO] No se encontraron las librerías necesarias.
    echo [INFO] Instalando dependencias (esto pasará solo la primera vez)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Hubo un problema al instalar las dependencias. 
        echo [ERROR] Asegurate de tener Node.js instalado en tu computadora.
        pause
        exit /b %errorlevel%
    )
    echo [INFO] Instalación completada con éxito.
)

:: Correr el script del puente
echo [INFO] Levantando el puente WebSocket-to-UDP...
npm start

:: Si el script falla o se cierra solo
if %errorlevel% neq 0 (
    echo [ERROR] El puente se cerró de forma inesperada.
    pause
)

ENDLOCAL
