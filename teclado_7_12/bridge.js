const WebSocket = require('ws');
const dgram = require('dgram');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// --- Configuración ---
const HTTP_PORT = 3000;
const WS_PORT = 8081;

// --- Utilidad para obtener la IP local ---
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const LOCAL_IP = getLocalIP();

// --- Servidor HTTP (Para que el iPad pueda cargar el teclado) ---
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log('=========================================');
    console.log('   WILSON T41 - MASTER BRIDGE - v1.1    ');
    console.log('=========================================');
    console.log(`[HTTP] Interfaz: http://${LOCAL_IP}:${HTTP_PORT}`);
    console.log(`[WS]   Puente:   ws://${LOCAL_IP}:${WS_PORT}`);
    console.log('-----------------------------------------');
    console.log('Instrucciones para iPad:');
    console.log(`1. Conectá el iPad a la misma red Wi-Fi.`);
    console.log(`2. Abrí Safari e ingresá: http://${LOCAL_IP}:${HTTP_PORT}`);
    console.log('=========================================');
});

// --- Cliente UDP para enviar paquetes a SuperCollider / Max / Surge ---
const udpClient = dgram.createSocket('udp4');

// --- Servidor WebSocket (El teclado se conecta aquí) ---
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log('[BRIDGE] Teclado vinculado.');

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            
            if (msg.type === 'osc') {
                const buffer = Buffer.from(msg.message);
                
                // Enviamos el buffer binario puro por UDP al destino final
                udpClient.send(buffer, 0, buffer.length, msg.port, msg.ip, (err) => {
                    if (err) {
                        console.error('[UDP ERROR]', err);
                    }
                });
            }
        } catch (e) {
            console.error('[PROCESS ERROR]', e.message);
        }
    });

    ws.on('close', () => {
        console.log('[BRIDGE] Teclado desvinculado.');
    });
});

udpClient.on('error', (err) => {
    console.log(`[UDP SERVER ERROR]:\n${err.stack}`);
    udpClient.close();
});

