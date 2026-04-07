const noteMapping = [
  {name: 'C', color: 'c-white'}, // 0
  {name: 'C+', color: 'c-blue'}, // 1
  {name: 'C#-', color: 'c-green'}, // 2
  {name: 'C#', color: 'c-gray'}, // 3
  {name: 'Db', color: 'c-gray'}, // 4
  {name: 'Db+', color: 'c-green'}, // 5
  {name: 'D-', color: 'c-blue'}, // 6
  {name: 'D', color: 'c-white'}, // 7
  {name: 'D+', color: 'c-blue'}, // 8
  {name: 'D#-', color: 'c-green'}, // 9
  {name: 'D#', color: 'c-gray'}, // 10
  {name: 'Eb', color: 'c-gray'}, // 11
  {name: 'Eb+', color: 'c-green'}, // 12
  {name: 'E-', color: 'c-blue'}, // 13
  {name: 'E', color: 'c-white'}, // 14
  {name: 'E+', color: 'c-blue'}, // 15
  {name: 'F-', color: 'c-blue'}, // 16
  {name: 'F', color: 'c-white'}, // 17
  {name: 'F+', color: 'c-blue'}, // 18
  {name: 'F#-', color: 'c-green'}, // 19
  {name: 'F#', color: 'c-gray'}, // 20
  {name: 'Gb', color: 'c-gray'}, // 21
  {name: 'Gb+', color: 'c-green'}, // 22
  {name: 'G-', color: 'c-blue'}, // 23
  {name: 'G', color: 'c-white'}, // 24
  {name: 'G+', color: 'c-blue'}, // 25
  {name: 'G#-', color: 'c-green'}, // 26
  {name: 'G#', color: 'c-gray'}, // 27
  {name: 'Ab', color: 'c-gray'}, // 28
  {name: 'Ab+', color: 'c-green'}, // 29
  {name: 'A-', color: 'c-blue'}, // 30
  {name: 'A', color: 'c-white'}, // 31
  {name: 'A+', color: 'c-blue'}, // 32
  {name: 'A#-', color: 'c-green'}, // 33
  {name: 'A#', color: 'c-gray'}, // 34
  {name: 'Bb', color: 'c-gray'}, // 35
  {name: 'Bb+', color: 'c-green'}, // 36
  {name: 'B-', color: 'c-blue'}, // 37
  {name: 'B', color: 'c-white'}, // 38
  {name: 'B+', color: 'c-blue'}, // 39
  {name: 'C-', color: 'c-blue'}  // 40
];

// Layout definition precisely as read from image
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

  // Limits for bounding container
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  let allHexes = [];
  
  function renderOctave(octaveIndex, xOffsetCols, yOffsetUnits, colorBase, bankSuffix) {
    const basePitch = octaveIndex * 41;
    
    for(let c = 0; c < layout7_12.length; c++) {
      let col = layout7_12[c];
      let curY = col.yStart;
      
      for(let i=0; i<col.notes.length; i++) {
        let visualNum = col.notes[i];
        let mappedId = col.notes[i] + basePitch;
        
        let left = (c + xOffsetCols) * dx;
        let shiftedY = curY + yOffsetUnits; 
        let top = shiftedY * dy;
        
        if (left < minX) minX = left;
        if (top < minY) minY = top;
        if (left > maxX) maxX = left;
        if (top > maxY) maxY = top;
        
        let hex = document.createElement("div");
        const isCenter = (octaveIndex % 3 === 0 || octaveIndex === 0 || octaveIndex === -3); 
        // Logic: Middle octave of each bank is brighter
        // For Bank 0: 0 is center. For Bank -1: -3 is center.
        
        // Manual check for central octave of the bank
        const isBankCenter = (octaveIndex === 0 || octaveIndex === -3 || octaveIndex === 3);
        hex.className = `hex ${isBankCenter ? colorBase : colorBase + '-dark'}`;
        
        hex.dataset.visibleNum = visualNum;
        hex.dataset.mappedId = mappedId;
        
        // Define suffix: Cc, Ca, Cb
        let type = "Cc";
        if ([1, -2, 4].includes(octaveIndex)) type = "Ca";
        if ([-1, -4, 2].includes(octaveIndex)) type = "Cb";
        
        hex.dataset.mappedName = `${visualNum}_oct${type}${bankSuffix}`;
        
        allHexes.push({ el: hex, note: mappedId, name: hex.dataset.mappedName, x: left, y: top });
        hex.innerHTML = `<span class="hex-num">${visualNum}</span>`;
        
        const monitorEl = document.getElementById("monitor-content");
        const triggerNote = () => {
          hex.classList.add('active'); 
          const outMsg = `Key[${visualNum}]\nID: ${mappedId}\nPitch: ${hex.dataset.mappedName}`;
          if (monitorEl) monitorEl.textContent = outMsg;
        };

        hex.addEventListener('mousedown', triggerNote);
        document.addEventListener('mouseup', () => hex.classList.remove('active'));
        hex.addEventListener('mouseleave', () => hex.classList.remove('active'));
        hex.addEventListener('touchstart', (e) => { e.preventDefault(); triggerNote(); });
        hex.addEventListener('touchend', (e) => { e.preventDefault(); hex.classList.remove('active'); });
        
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
