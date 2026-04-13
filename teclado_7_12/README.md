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
1. **Ejecutar el Puente:** En Windows, haz doble clic en el archivo `RUN_BRIDGE.bat`. 
   - La primera vez se instalarán automáticamente las librerías necesarias.
   - Verás un mensaje que dice: `Status: Escuchando teclado en ws://localhost:8081`.
2. **Abrir el Teclado:** Abre `index.html` en tu navegador.
3. **Verificar Vínculo:** Verás que el indicador **LINK** en la pantalla del teclado se pone verde.
4. **Habilitar Envío:** Activa el switch **OSC**. El indicador **SEND** se pondrá verde y las teclas empezarán a enviar paquetes binarios.

### Configuración de Destino
Desde la interfaz del teclado puedes configurar la **IP** (ej: `127.0.0.1`) y el **Puerto** (ej: `8000`) de tu sintetizador. El puente redirigirá los mensajes automáticamente sin necesidad de reiniciarlo.

### Formato de Mensajes
- **/mnote [id:float, velocity:int]**: Enviado al presionar/soltar teclas.
- **/param/a/octave [val:int]**: Enviado al cambiar la transposición.
- **/allnotesoff**: Comando de pánico.

---

## Uso General
El proyecto no requiere ningún framework o librería pesada en el frontend. Es puro Vanilla HTML, CSS y Javascript. Simplemente abre el archivo `index.html` en tu navegador y empieza a tocar.

