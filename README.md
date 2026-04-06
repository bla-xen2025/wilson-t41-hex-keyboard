# Wilson 41-TET Hexagonal Keyboard

Un teclado web interactivo de disposición hexagonal (patrón 7-12) diseñado algorítmicamente para la ejecución microtonal del sistema 41-TET teorizado por Erv Wilson. 

## Características
* **Visualización Automática Multioctava**: Renderiza prolijamente 3 octavas (Grave, Central y Aguda) entrelazándolas en el eje Y.
* **Mapeo Realista Numérico**: Las teclas abandonan la nomenclatura diatónica clásica para abrazar completamente el ruteo matemático (ej: `0_oct0`, `40_oct1`).
* **Monitor HUD Integrado**: Detecta y registra cada evento táctil/clickeable y arroja la información del *Mapped ID* exacto para que pueda enrutarse a plataformas de terceros como Max/MSP o PureData.
* **Estilos Responsivos**: Usa *Glassmorphism* sobre una grilla matemática auto-organizada.

## Uso
El proyecto no requiere ningún framework o librería pesada. Es puro Vanilla HTML, CSS y Javascript. Simplemente arrastra el archivo `index.html` al navegador y listo.
