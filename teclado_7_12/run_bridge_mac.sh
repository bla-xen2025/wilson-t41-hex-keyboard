#!/bin/bash

# =========================================
#    Wilson T41 - Launcher para macOS
# =========================================

# Nos movemos a la carpeta donde está el script
cd "$(dirname "$0")"

echo "========================================="
echo "   Wilson T41 - Iniciando Bridge OSC"
echo "========================================="

# Verificar si node_modules existe, si no, instalar dependencias
if [ ! -d "node_modules" ]; then
    echo "[INFO] No se encontraron las librerías necesarias."
    echo "[INFO] Instalando dependencias (esto pasará solo la primera vez)..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "[ERROR] Hubo un problema al instalar las dependencias." 
        echo "[ERROR] Asegurate de tener Node.js instalado (https://nodejs.org)."
        echo "Presioná cualquier tecla para salir..."
        read -n 1
        exit 1
    fi
    echo "[INFO] Instalación completada con éxito."
fi

# Correr el script del puente
echo "[INFO] Levantando el puente WebSocket-to-UDP..."
npm start

# Si el script falla o se cierra solo
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] El puente se cerró de forma inesperada."
    echo "Presioná cualquier tecla para salir..."
    read -n 1
fi
