const WebSocket = require('ws');
const dgram = require('dgram');

// Cliente UDP para enviar paquetes a SuperCollider / Max / Surge
const udpClient = dgram.createSocket('udp4');

// Servidor WebSocket (El teclado se conecta aquí)
const wss = new WebSocket.Server({ port: 8081 });

console.log('=========================================');
console.log('   WILSON T41 - OSC BRIDGE - v1.0       ');
console.log('=========================================');
console.log('Status: Escuchando teclado en ws://localhost:8081');

wss.on('connection', (ws) => {
    console.log('[BRIDGE] Teclado vinculado.');

    ws.on('message', (data) => {
        try {
            // El teclado manda un JSON con la metadata (IP, Puerto) y el Buffer binario
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
