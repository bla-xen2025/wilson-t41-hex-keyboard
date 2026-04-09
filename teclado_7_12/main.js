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

  // Limits for bounding container
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  let allHexes = [];

  // Gestión de polifonía y monitor
  const activeNotes = new Map();
  const eventLog = [];
  const MAX_LOG_ENTRIES = 10;
  const monitorEl = document.getElementById("monitor-content");

  const addEventLog = (msg) => {
    eventLog.push(msg);
    if (eventLog.length > MAX_LOG_ENTRIES) eventLog.shift();
    updateMonitor();
  };

  const updateMonitor = () => {
    if (eventLog.length === 0) {
      if (monitorEl) monitorEl.textContent = "Esperando MIDI/OSC...";
      return;
    }
    if (monitorEl) monitorEl.textContent = eventLog.join("\n");
  };

  // --- Lógica de Controles Globales (OSC) ---
  let currentOctaveIdx = 3; // Valor 0 por defecto
  let currentOctaveValue = 0; // Valor escalar real (-3 a 3)

  const updateOctave = (delta) => {
    const newIdx = currentOctaveIdx + delta;
    if (newIdx >= 0 && newIdx < transpositionArray.length) {
      currentOctaveIdx = newIdx;
      const [addr, val] = transpositionArray[currentOctaveIdx];
      currentOctaveValue = val;
      const displayEl = document.getElementById("oct-display");
      if (displayEl) displayEl.textContent = val > 0 ? `+${val}` : val;
      addEventLog(`["${addr}", ${val}]`);
    }
  };

  const sendPanic = (cmd) => {
    addEventLog(`"${cmd}"`);
  };

  // Bind Control Events
  document.getElementById("oct-down")?.addEventListener("click", () => updateOctave(-1));
  document.getElementById("oct-up")?.addEventListener("click", () => updateOctave(1));
  document.getElementById("panic-notes")?.addEventListener("click", () => sendPanic(panicCommands[0]));
  document.getElementById("panic-sound")?.addEventListener("click", () => sendPanic(panicCommands[1]));
  
  const handleNoteOn = (baseId, visualNum, name, el) => {
    // Calculamos el ID Real sumando el offset global
    const realId = baseId + (currentOctaveValue * 41);
    
    if (activeNotes.has(realId)) return;
    el.classList.add('active');
    
    // Guardamos el realId en el elemento para que NoteOff apague el correcto
    el.dataset.activeId = realId;
    
    activeNotes.set(realId, { visualNum, name });
    addEventLog(`["/mnote", ${realId}, 127]`);
  };

  const handleNoteOff = (el) => {
    const activeId = parseInt(el.dataset.activeId);
    if (isNaN(activeId) || !activeNotes.has(activeId)) return;
    
    const note = activeNotes.get(activeId);
    addEventLog(`["/mnote", ${activeId}, 0]`);
    el.classList.remove('active');
    
    activeNotes.delete(activeId);
    delete el.dataset.activeId;
  };
  
  function renderOctave(octaveIndex, xOffsetCols, yOffsetUnits, colorBase, bankSuffix) {
    // Forzamos el rango de IDs según el bloque (desacoplado de la posición visual):
    // - bloque verde ("c-green") emite siempre notas de 10 a 50 (índice -4).
    // - bloque naranja ("c-amber") emite siempre notas de 51 a 91 (índice -3).
    // - bloque celeste ("c-sky") emite siempre notas de 92 a 132 (índice -2).
    let effectiveOctaveIndex = octaveIndex;
    if (colorBase === "c-green") {
      effectiveOctaveIndex = -4; 
    } else if (colorBase === "c-amber") {
      effectiveOctaveIndex = -3;
    } else if (colorBase === "c-sky") {
      effectiveOctaveIndex = -2;
    }
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
        
        hex.dataset.visibleNum = visualNum;
        hex.dataset.baseId = mappedId;
        
        // Define suffix: Cc, Ca, Cb
        let type = "Cc";
        if ([1, -2, 4].includes(octaveIndex)) type = "Ca";
        if ([-1, -4, 2].includes(octaveIndex)) type = "Cb";
        
        hex.dataset.mappedName = `${visualNum}_oct${type}${bankSuffix}`;
        
        allHexes.push({ el: hex, note: mappedId, name: hex.dataset.mappedName, x: left, y: top });
        hex.innerHTML = `<span class="hex-num">${visualNum}</span>`;
        
        // Mouse Events
        hex.addEventListener('mousedown', () => handleNoteOn(mappedId, visualNum, hex.dataset.mappedName, hex));
        hex.addEventListener('mouseup', () => handleNoteOff(hex));
        hex.addEventListener('mouseleave', () => handleNoteOff(hex));
        
        // Touch Events (Polifonía real en tablets/pantallas táctiles)
        hex.addEventListener('touchstart', (e) => { 
          e.preventDefault(); 
          handleNoteOn(mappedId, visualNum, hex.dataset.mappedName, hex); 
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

  function renderBank(bankSuffix, xBase, yBase, colorBase, octIndices) {
    // Upper
    renderOctave(octIndices[0], xBase - 1, yBase - 3.5, colorBase, bankSuffix);
    // Lower
    renderOctave(octIndices[1], xBase + 1, yBase + 3.5, colorBase, bankSuffix);
    // Central (Rendered last for priority)
    renderOctave(octIndices[2], xBase, yBase, colorBase, bankSuffix);
  }

  // --- RENDERING CALLS ---
  
  // Bloque Grave (Izquierda, Verde)
  // Shift horizontal de -12 para que compartan la cuadrícula y se acoplen (interlocking).
  // Shift vertical de -1.0 para que la nota 40 (col 12, y=3) quede justo debajo de la 
  // nota 0 del bloque naranja (col 0, y=1). 3.0 - 1.0 = 2.0. Perfect fit.
  renderBank("-1", -12, -1.0, "c-green", [-2, -4, -3]);

  // Bloque Central (Centro, Naranja) 
  renderBank("", 0, 0, "c-amber", [1, -1, 0]);
  
  // Bloque Agudo (Derecha, Celeste)
  renderBank("+1", 12, 1.0, "c-sky", [4, 2, 3]);

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
});
