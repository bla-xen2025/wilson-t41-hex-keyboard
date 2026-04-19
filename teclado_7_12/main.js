// Layout definition precisely as read from image
// Note: Each number in 'notes' represents the relative pitch (0-40) within the octave.
const layout7_12 = [
  { yStart: 0, notes: [1, 0] },
  { yStart: -0.5, notes: [5, 4, 3, 2] },
  { yStart: 0, notes: [8, 7, 6] },
  { yStart: 0.5, notes: [11, 10, 9] },
  { yStart: 0, notes: [15, 14, 13, 12] },
  { yStart: 0.5, notes: [18, 17, 16] },
  { yStart: 0, notes: [22, 21, 20, 19] },
  { yStart: 0.5, notes: [25, 24, 23] },
  { yStart: 0, notes: [29, 28, 27, 26] },
  { yStart: 0.5, notes: [32, 31, 30] },
  { yStart: 1.0, notes: [35, 34, 33] },
  { yStart: 0.5, notes: [39, 38, 37, 36] },
  { yStart: 3.0, notes: [40] }
];

// OSC Control Constants
const transpositionArray = [
  ["/param/a/octave", -3],
  ["/param/a/octave", -2],
  ["/param/a/octave", -1],
  ["/param/a/octave", 0],
  ["/param/a/octave", 1],
  ["/param/a/octave", 2],
  ["/param/a/octave", 3]
];

const panicCommands = [
  "/allnotesoff",
  "/allsoundoff"
];

document.addEventListener("DOMContentLoaded", () => {
  const gridContainer = document.getElementById("hex-grid");

  // Flat Topped Math Geometry settings
  const W = 66; // variable en CSS (--hex-w)
  const H = 57.16; // variable en CSS (--hex-h)
  const Gap = 1;
  
  // Paso horizontal en X (Distancia entre centros a los lados) = 3/4 * W
  const dx = (W * 0.75) + Gap; 
  // Paso vertical en Y = Height entero
  const dy = H + Gap;

  // Offset para normalizar IDs (mínimo -164 + 174 = 10 en trans 0)
  const KEY_ID_OFFSET = 174;

  // Limits for bounding container: Usamos Infinito para asegurar asignaciones iniciales correctas
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let allHexes = [];

  // Gestión de polifonía y monitor
  const monitorEl = document.getElementById("monitor-content");
  const activeNotes = new Set();
  const eventLog = [];
  const MAX_LOG_ENTRIES = 10;
  
  const updateMonitor = () => {
    if (eventLog.length === 0) {
      if (monitorEl) monitorEl.textContent = "Esperando MIDI/OSC...";
      return;
    }
    if (monitorEl) monitorEl.textContent = eventLog.join("\n");
  };

  // --- Lógica de Controles Globales y Conectividad ---
  let currentOctaveIdx = 3; 
  let currentOctaveValue = 0; 

  const oscStatus = {
    enabled: false,
    linked: false,
    ip: "127.0.0.1",
    port: 8000,
    socket: null
  };

  const addEventLog = (msg, isSystem = false) => {
    let finalMsg = msg;
    if (!isSystem) {
      const prefix = oscStatus.enabled ? `[${oscStatus.ip}:${oscStatus.port}]` : `[OFF]`;
      finalMsg = `${prefix} ${msg}`;
    }
    
    eventLog.push(finalMsg);
    if (eventLog.length > MAX_LOG_ENTRIES) eventLog.shift();
    updateMonitor();
  };

  // --- ESTADO DE CONFIGURACIÓN Y ZOOM ---
  let isConfigMode = true;
  let zoomLevel = 1.0;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2.0;

  const modeToggle = document.getElementById("mode-toggle");
  const modeLabel = document.getElementById("mode-label");
  const zoomDisplay = document.getElementById("zoom-display");
  const viewport = document.getElementById("keyboard-viewport");

  const autoCenterOrange = () => {
    if (viewport) {
      const targetX = -minX + padding + (W / 2);
      const targetY = -minY + padding + (H / 2);
      
      viewport.scrollLeft = (targetX * zoomLevel) - (viewport.clientWidth / 2);
      viewport.scrollTop = (targetY * zoomLevel) - (viewport.clientHeight / 2);
    }
  };

  const updateMode = () => {
    isConfigMode = !!modeToggle?.checked;
    if (modeLabel) modeLabel.textContent = isConfigMode ? "EDIT" : "PLAY";
    
    if (isConfigMode) {
      document.body.classList.remove("performance-mode");
      addEventLog("Modo Configuración: Zoom y Scroll habilitado", true);
    } else {
      document.body.classList.add("performance-mode");
      addEventLog("Modo Ejecución: Scroll bloqueado", true);
      // Ya no llamamos a autoCenterOrange() aquí para no perder el ajuste manual del usuario
    }
  };

  const updateZoom = (delta) => {
    if (!isConfigMode) return;
    zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel + delta));
    gridContainer.style.transform = `scale(${zoomLevel})`;
    if (zoomDisplay) zoomDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
  };

  modeToggle?.addEventListener("change", updateMode);
  document.getElementById("zoom-in")?.addEventListener("click", () => updateZoom(0.1));
  document.getElementById("zoom-out")?.addEventListener("click", () => updateZoom(-0.1));

  // Inicializar estado visual del modo pero NO ejecutar centrado aún (minX es Infinity)
  if (modeToggle) {
    isConfigMode = modeToggle.checked;
    modeLabel.textContent = isConfigMode ? "EDIT" : "PLAY";
    if (!isConfigMode) document.body.classList.add("performance-mode");
  }

  // --- Lógica de Codificación Binaria OSC 1.0 ---
  class OSCMessage {
    constructor(address, types, args) {
      this.address = address;
      this.types = "," + types;
      this.args = args;
    }

    encode() {
      const addrBuf = this.stringToBuffer(this.address);
      const typesBuf = this.stringToBuffer(this.types);
      const argsBuf = this.argsToBuffer();

      const totalSize = addrBuf.length + typesBuf.length + argsBuf.length;
      const buffer = new Uint8Array(totalSize);
      buffer.set(addrBuf, 0);
      buffer.set(typesBuf, addrBuf.length);
      buffer.set(argsBuf, addrBuf.length + typesBuf.length);
      return buffer.buffer;
    }

    stringToBuffer(str) {
      const content = new TextEncoder().encode(str);
      const len = content.length + 1; // null terminator
      const paddedLen = Math.ceil(len / 4) * 4;
      const buffer = new Uint8Array(paddedLen);
      buffer.set(content);
      return buffer;
    }

    argsToBuffer() {
      let size = 0;
      const tChars = this.types.substring(1).split("");
      tChars.forEach(t => { if (t==="i" || t==="f") size += 4; });
      
      const buffer = new ArrayBuffer(size);
      const view = new DataView(buffer);
      let offset = 0;
      tChars.forEach((t, idx) => {
        if (t === "i") { view.setInt32(offset, this.args[idx], false); offset += 4; }
        else if (t === "f") { view.setFloat32(offset, this.args[idx], false); offset += 4; }
      });
      return new Uint8Array(buffer);
    }
  }


  const initWebSocket = () => {
    if (oscStatus.socket) oscStatus.socket.close();
    
    // Asumimos un bridge en el puerto 8081 (común para websocket-osc bridges)
    const wsUrl = `ws://${window.location.hostname || "localhost"}:8081`;
    oscStatus.socket = new WebSocket(wsUrl);
    oscStatus.socket.binaryType = "arraybuffer";

    oscStatus.socket.onopen = () => {
      oscStatus.linked = true;
      updateStatusVisuals();
      addEventLog("Vínculo Bridge Establecido (WS)", true);
    };

    oscStatus.socket.onclose = () => {
      oscStatus.linked = false;
      updateStatusVisuals();
      addEventLog("Vínculo Bridge Perdido", true);
      // Reintento en 5s
      setTimeout(initWebSocket, 5000);
    };
  };

  // Inicializar conectividad
  initWebSocket();

  const dispatchOSC = (address, types, args) => {
    // 1. Mostrar en Monitor (Visual)
    const visualArgs = args.map(a => typeof a === "number" ? a.toFixed(2) : a).join(", ");
    addEventLog(`[${address}, ${visualArgs}]`);

    // 2. Enviar Binario si está habilitado
    if (oscStatus.enabled && oscStatus.linked && oscStatus.socket.readyState === WebSocket.OPEN) {
      const msg = new OSCMessage(address, types, args);
      const packet = msg.encode();
      
      // El bridge necesita saber a qué IP/Port UDP mandar el paquete OSC
      // Mandamos un objeto con el target y el blob binario
      const bridgeData = {
        host: oscStatus.ip,
        port: oscStatus.port,
        data: new Uint8Array(packet)
      };
      
      // Algunos bridges aceptan directamente el buffer OSC, 
      // pero otros necesitan metadata. Implementamos el estándar de metadatos:
      oscStatus.socket.send(JSON.stringify({
        type: "osc",
        ip: oscStatus.ip,
        port: oscStatus.port,
        message: Array.from(new Uint8Array(packet))
      }));
    }
  };

  const updateStatusVisuals = () => {
    const ledSend = document.getElementById("osc-led-send");
    if (ledSend) ledSend.className = oscStatus.enabled ? "led-green" : "led-red";
    const ledLink = document.getElementById("osc-led-link");
    if (ledLink) ledLink.className = oscStatus.linked ? "led-green" : "led-red";
  };

  window.setOscLinked = (state) => {
    oscStatus.linked = !!state;
    updateStatusVisuals();
  };

  // Listeners
  document.getElementById("osc-ip")?.addEventListener("input", (e) => oscStatus.ip = e.target.value);
  document.getElementById("osc-port")?.addEventListener("input", (e) => oscStatus.port = parseInt(e.target.value) || 0);
  document.getElementById("osc-toggle")?.addEventListener("change", (e) => {
    oscStatus.enabled = e.target.checked;
    updateStatusVisuals();
    addEventLog(oscStatus.enabled ? "OSC Habilitado" : "OSC Deshabilitado", true);
  });

  const updateOctave = (delta) => {
    const newIdx = currentOctaveIdx + delta;
    if (newIdx >= 0 && newIdx < transpositionArray.length) {
      currentOctaveIdx = newIdx;
      const [addr, val] = transpositionArray[currentOctaveIdx];
      currentOctaveValue = val;
      const displayEl = document.getElementById("oct-display");
      if (displayEl) displayEl.textContent = val > 0 ? `+${val}` : val;
      dispatchOSC(addr, "i", [val]);
    }
  };

  const sendPanic = (cmd) => {
    dispatchOSC(cmd, "", []);
  };

  document.getElementById("oct-down")?.addEventListener("click", () => updateOctave(-1));
  document.getElementById("oct-up")?.addEventListener("click", () => updateOctave(1));
  document.getElementById("panic-notes")?.addEventListener("click", () => sendPanic(panicCommands[0]));
  document.getElementById("panic-sound")?.addEventListener("click", () => sendPanic(panicCommands[1]));
  
  const handleNoteOn = (baseId, el) => {
    if (isConfigMode) return; // BLOQUEO EN MODO CONFIGURACIÓN
    
    const realId = baseId + (currentOctaveValue * 41);
    if (activeNotes.has(realId)) return;
    el.classList.add('active');
    el.dataset.activeId = realId;
    activeNotes.add(realId);
    dispatchOSC("/mnote", "fi", [realId, 127]);
  };

  const handleNoteOff = (el) => {
    const activeId = parseInt(el.dataset.activeId);
    if (isNaN(activeId) || !activeNotes.has(activeId)) return;
    dispatchOSC("/mnote", "fi", [activeId, 0]);
    el.classList.remove('active');
    activeNotes.delete(activeId);
    delete el.dataset.activeId;
  };


  // --- Mapeo de Control QWERTY (Pruebas) ---
  const qwertyMap = { 'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5, 'j': 6, 'k': 7, 'l': 8 };
  const pressedKeys = new Set();

  document.addEventListener('keydown', (e) => {
    if (e.repeat) return; // Evitar disparos repetidos mec\xe1nicos
    const key = e.key.toLowerCase();
    if (qwertyMap[key] !== undefined) {
      const visualNum = qwertyMap[key];
      const hexEl = document.querySelector(`[data-qwerty-target="${visualNum}"]`);
      if (hexEl && !pressedKeys.has(key)) {
        pressedKeys.add(key);
        // Desencadenamos un Note ON artificial pasando la baseId embutida y el elemento
        handleNoteOn(parseInt(hexEl.dataset.baseId), hexEl);
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (pressedKeys.has(key)) {
      pressedKeys.delete(key);
      const visualNum = qwertyMap[key];
      const hexEl = document.querySelector(`[data-qwerty-target="${visualNum}"]`);
      if (hexEl) handleNoteOff(hexEl);
    }
  });
  
  function renderOctave(octaveIndex, xOffsetCols, yOffsetUnits, colorBase) {
    // Forzamos el rango de IDs según el bloque mediante mapa de índices base
    const colorToBankOffset = {
      "c-green": -4,
      "c-amber": -3,
      "c-sky": -2
    };
    const effectiveOctaveIndex = colorToBankOffset[colorBase] ?? octaveIndex;
    const basePitch = effectiveOctaveIndex * 41;
    
    for(let c = 0; c < layout7_12.length; c++) {
      let col = layout7_12[c];
      let curY = col.yStart;
      
      for(let i=0; i<col.notes.length; i++) {
        let visualNum = col.notes[i];
        let mappedId = col.notes[i] + basePitch + KEY_ID_OFFSET;
        
        let left = (c + xOffsetCols) * dx;
        let shiftedY = curY + yOffsetUnits; 
        let top = shiftedY * dy;
        
        if (left < minX) minX = left;
        if (top < minY) minY = top;
        if (left > maxX) maxX = left;
        if (top > maxY) maxY = top;
        
        let hex = document.createElement("div");
        // Logic: Middle octave of each bank is brighter
        // For Bank 0: 0 is center. For Bank -1: -3 is center.
        
        // Manual check for central octave of the bank
        const isBankCenter = (octaveIndex === 0 || octaveIndex === -3 || octaveIndex === 3);
        hex.className = `hex ${isBankCenter ? colorBase : colorBase + '-dark'}`;
        
        allHexes.push({ el: hex, x: left, y: top });
        hex.innerHTML = `<span class="hex-num">${visualNum}</span>`;

        hex.dataset.baseId = mappedId;
        // Etiquetamos \xfanicamente a las notas 0 al 8 del bloque central naranja para prueba QWERTY
        if (octaveIndex === 0 && colorBase === "c-amber" && visualNum >= 0 && visualNum <= 8) {
          hex.dataset.qwertyTarget = visualNum;
        }
        
        // Mouse Events
        hex.addEventListener('mousedown', () => handleNoteOn(mappedId, hex));
        hex.addEventListener('mouseup', () => handleNoteOff(hex));
        hex.addEventListener('mouseleave', () => handleNoteOff(hex));
        
        // Touch Events (Polifonía real en tablets/pantallas táctiles)
        hex.addEventListener('touchstart', (e) => { 
          e.preventDefault(); 
          handleNoteOn(mappedId, hex); 
        });
        hex.addEventListener('touchend', (e) => { 
          e.preventDefault(); 
          handleNoteOff(hex); 
        });
        hex.addEventListener('touchcancel', (e) => { 
          e.preventDefault(); 
          handleNoteOff(hex); 
        });
        
        curY += 1.0;
      }
    }
  }

  function renderBank(xBase, yBase, colorBase, octIndices) {
    // Upper
    renderOctave(octIndices[0], xBase - 1, yBase - 3.5, colorBase);
    // Lower
    renderOctave(octIndices[1], xBase + 1, yBase + 3.5, colorBase);
    // Central (Rendered last for priority)
    renderOctave(octIndices[2], xBase, yBase, colorBase);
  }

  // --- RENDERING CALLS ---
  
  // Bloque Grave (Izquierda, Verde)
  // Shift horizontal de -12 para que compartan la cuadrícula y se acoplen (interlocking).
  // Shift vertical de -1.0 para que la nota 40 (col 12, y=3) quede justo debajo de la 
  // nota 0 del bloque naranja (col 0, y=1). 3.0 - 1.0 = 2.0. Perfect fit.
  renderBank(-12, -1.0, "c-green", [-2, -4, -3]);

  // Bloque Central (Centro, Naranja) 
  renderBank(0, 0, "c-amber", [1, -1, 0]);
  
  // Bloque Agudo (Derecha, Celeste)
  renderBank(12, 1.0, "c-sky", [4, 2, 3]);

  // FINAL RENDER
  const padding = 100;
  allHexes.forEach(h => {
    h.el.style.left = `${h.x - minX + padding}px`;
    h.el.style.top = `${h.y - minY + padding}px`;
    gridContainer.appendChild(h.el);
  });

  let totalW = (maxX - minX) + W + (padding * 2);
  let totalH = (maxY - minY) + H + (padding * 2);
  gridContainer.style.width = `${totalW}px`;
  gridContainer.style.height = `${totalH}px`;

  // === PREVENIR COMPORTAMIENTOS DE NAVEGADOR EN IPAD ===
  document.addEventListener('contextmenu', e => e.preventDefault());
  
  // Prevenir bounce/scroll accidental en iPad al tocar hex\xe1gonos
  document.addEventListener('touchmove', (e) => {
    if (e.target.closest('.hex')) e.preventDefault();
  }, { passive: false });

  setTimeout(autoCenterOrange, 200);
});
