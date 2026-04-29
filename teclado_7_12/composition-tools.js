// composition-tools.js
// Operaciones de pitch-class sets para 41-TET y UI

/**
 * Calcula módulo siempre positivo
 */
function mod(n, m) {
    return ((n % m) + m) % m;
}

/**
 * Remueve duplicados y ordena un array
 */
function removeDuplicatesAndSort(arr) {
    const unique = [];
    for (let i = 0; i < arr.length; i++) {
        if (!unique.includes(arr[i])) {
            unique.push(arr[i]);
        }
    }
    return unique.sort((a, b) => a - b);
}

/**
 * Transpone un set por un intervalo dado
 */
function transpose(set, interval, temp) {
    const result = [];
    for (let i = 0; i < set.length; i++) {
        result.push(mod(set[i] + interval, temp));
    }
    return result;
}

/**
 * Invierte un set alrededor de un índice dado
 */
function invert(set, index, temp) {
    const result = [];
    for (let i = 0; i < set.length; i++) {
        result.push(mod(index - set[i], temp));
    }
    return result.sort((a, b) => a - b);
}

/**
 * Parsea una cadena de entrada a un array de pitch classes válidos
 */
function parseSetInput(inputString, maxValue = 40) {
    const numbers = inputString
        .trim()
        .split(/[\s,]+/)
        .map(n => parseInt(n))
        .filter(n => !isNaN(n) && n >= 0 && n <= maxValue);

    return removeDuplicatesAndSort(numbers);
}

/**
 * Normaliza un set aplicando módulo al temperamento
 */
function normalizeSet(set, temp) {
    return set.map(n => mod(n, temp));
}

// UI Handling for Composition Tools
document.addEventListener("DOMContentLoaded", () => {
    const compToolsPanel = document.getElementById("comp-tools-panel");
    const compToolsToggle = document.getElementById("comp-tools-toggle");
    
    if (compToolsToggle && compToolsPanel) {
        compToolsToggle.addEventListener("click", () => {
            compToolsPanel.classList.toggle("active");
            compToolsToggle.classList.toggle("active");
        });
    }

    const calcBtn = document.getElementById("calc-set-btn");
    const setInput = document.getElementById("set-input");
    const transInput = document.getElementById("trans-input");
    const invInput = document.getElementById("inv-input");
    const setResult = document.getElementById("set-result");

    if (calcBtn) {
        calcBtn.addEventListener("click", () => {
            let set = parseSetInput(setInput.value, 40);
            
            // Transposition
            const tVal = parseInt(transInput.value);
            if (!isNaN(tVal) && tVal !== 0) {
                set = transpose(set, tVal, 41);
                set = removeDuplicatesAndSort(set); // re-sort after transposition
            }
            
            // Inversion
            const iVal = parseInt(invInput.value);
            if (!isNaN(iVal)) {
                set = invert(set, iVal, 41);
            }
            
            setResult.textContent = set.length > 0 ? set.join(", ") : "Vacio";
        });
    }
});
