# Wilson 41-TET Hexagonal Keyboard

Un teclado web interactivo de disposición hexagonal (patrón 7-12) diseñado algorítmicamente para la ejecución microtonal del sistema 41-TET teorizado por Erv Wilson. 

## Características
* **Visualización Automática Multioctava**: Renderiza prolijamente 3 octavas (Grave, Central y Aguda) entrelazándolas en el eje Y.
* **Mapeo Realista Numérico**: Las teclas abandonan la nomenclatura diatónica clásica para abrazar completamente el ruteo matemático (ej: `0_oct0`, `40_oct1`).
* **Monitor HUD Integrado**: Detecta y registra cada evento táctil/clickeable y arroja la información del *Mapped ID* exacto para que pueda enrutarse a plataformas de terceros como Max/MSP o PureData.
* **Estilos Responsivos**: Usa *Glassmorphism* sobre una grilla matemática auto-organizada.

## Conectividad y OSC (Open Sound Control)

Este teclado está preparado para controlar sintetizadores externos (SuperCollider, Max/MSP, Surge XT, etc.) enviando datos binarios siguiendo la especificación **OSC 1.0**.

### Requisito previo
Es necesario tener instalado [Node.js](https://nodejs.org/) en la computadora para ejecutar el puente de comunicación.

### Cómo conectar el teclado

#### 1. Iniciar el Puente (Bridge)
El bridge ahora es un **servidor maestro** que sirve tanto la interfaz web como el puente de datos OSC.

*   **En Windows:** Haz doble clic en el archivo `RUN_BRIDGE.bat`.
*   **En macOS:** Ejecuta `./run_bridge_mac.sh` (recuerda dar permisos con `chmod +x` la primera vez).

Al iniciarse, verás en la consola las direcciones de acceso:
- `[HTTP] Interfaz: http://[TU_IP_LOCAL]:3000`
- `[WS] Puente: ws://[TU_IP_LOCAL]:8081`

#### 2. Acceder a la Interfaz
No necesitas abrir el archivo `index.html` manualmente. Simplemente usa tu navegador favorito:

*   **Desde la PC:** Ingresa a `http://localhost:3000`.
*   **Desde un iPad o Tablet:** Ingresa la dirección IP que mostró la consola (ej: `http://192.168.1.15:3000`).

---

## Uso con iPad / Tablets (Recomendado)

Este teclado fue optimizado específicamente para su uso en iPad para aprovechar la polifonía multitáctil.

1.  **Modo App:** En Safari del iPad, presiona el botón "Compartir" y selecciona **"Añadir a pantalla de inicio"**. Esto instalará el teclado como una aplicación a pantalla completa, eliminando las barras del navegador.
2.  **Multitouch:** El teclado soporta múltiples puntos de presión simultáneos sin interferir con los gestos del sistema.
3.  **Vínculo Automático:** Mientras el Bridge esté corriendo en la PC, el iPad se vinculará automáticamente al cargar la página (el indicador **LINK** se pondrá verde).

---

### Configuración de Destino
Desde la interfaz del teclado (en el iPad o PC) puedes configurar la **IP** (ej: `127.0.0.1` si el soft de audio está en la misma PC que el bridge) y el **Puerto** (ej: `8000`) de tu sintetizador. El puente redirigirá los mensajes automáticamente.

### Formato de Mensajes
- **/mnote [id:float, velocity:int]**: Enviado al presionar/soltar teclas.
- **/param/a/octave [val:int]**: Enviado al cambiar la transposición.
- **/allnotesoff**: Comando de pánico.

---

## Estructura del Proyecto
- `bridge.js`: Servidor maestro (HTTP + WebSocket to UDP Bridge).
- `index.html`: Estructura de la interfaz (Optimizado para modo WebApp).
- `main.js`: Lógica del teclado, generador binario OSC 1.0 y gestión de eventos.
- `styles.css`: Sistema de diseño *Glassmorphism* y grilla hexagonal.


