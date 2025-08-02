// Mapeo de puntos Braille a letras
const brailleMap = {
    '1': 'a', '12': 'b', '14': 'c', '145': 'd', '15': 'e',
    '124': 'f', '1245': 'g', '125': 'h', '24': 'i', '245': 'j',
    '13': 'k', '123': 'l', '134': 'm', '1345': 'n', '12456': 'ñ', '135': 'o',
    '1234': 'p', '12345': 'q', '1235': 'r', '234': 's', '2345': 't',
    '136': 'u', '1236': 'v', '2456': 'w', '1346': 'x', '13456': 'y',
    '1356': 'z',
    '12356': 'á', '2346': 'é', '34': 'í', '346': 'ó', '1256': 'ú', '23456': 'ü'
};

let currentWordLetters = [];
let currentMode = 'play';
let activeDropzone = null;
let isDraggingDropzone = false;
let isResizingDropzone = false;
let startX, startY, startWidth, startHeight;
let activeResizer = null;

const brailleGrid = document.getElementById('braille-grid');
const currentWordContainer = document.getElementById('current-word');
const addLetterBtn = document.getElementById('addLetterBtn');
const clearWordBtn = document.getElementById('clearWordBtn');
const createCardBtn = document.getElementById('createCardBtn');
const cardsContainer = document.getElementById('cards-container');
const messageBox = document.getElementById('message-box');
const gameArea = document.getElementById('game-area');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const backgroundImageInput = document.getElementById('background-image-input');
const createDropzoneBtn = document.getElementById('createDropzoneBtn');
const playModeBtn = document.getElementById('playModeBtn');
const editModeBtn = document.getElementById('editModeBtn');
const teacherAccessBtn = document.getElementById('teacherAccessBtn');

// Inicializar la cuadrícula de puntos Braille
function initializeBrailleGrid() {
    brailleGrid.innerHTML = '';
    
    const brailleDotOrder = [1, 4, 2, 5, 3, 6];
    
    brailleDotOrder.forEach(id => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.dataset.id = id;
        dot.addEventListener('click', () => toggleDot(dot));
        brailleGrid.appendChild(dot);
    });
}

// Alternar el estado de un punto
function toggleDot(dot) {
    if (currentMode === 'play') {
        showMessage('No puedes modificar la celda Braille en modo Juego.', 'error');
        return;
    }
    dot.classList.toggle('active');
}

// Limpiar la cuadrícula de puntos
function clearBrailleGrid() {
    document.querySelectorAll('.dot').forEach(dot => {
        dot.classList.remove('active');
    });
}

// Función auxiliar para crear el elemento visual de la celda Braille
function createBrailleCellElement(dots) {
    const brailleLetterElement = document.createElement('div');
    brailleLetterElement.className = 'braille-letter';
    
    const brailleDotOrder = [1, 4, 2, 5, 3, 6];
    
    brailleDotOrder.forEach(id => {
        const dot = document.createElement('div');
        dot.className = 'braille-dot';
        if (dots.includes(id)) {
            dot.classList.add('filled');
        }
        brailleLetterElement.appendChild(dot);
    });

    return brailleLetterElement;
}

// Crear elemento de letra para la palabra
function createLetterElement(letter, dots) {
    const letterElement = document.createElement('div');
    letterElement.className = 'letter-small';

    const brailleLetterElement = createBrailleCellElement(dots);
    
    const textElement = document.createElement('span');
    textElement.textContent = letter;
    letterElement.appendChild(brailleLetterElement);
    letterElement.appendChild(textElement);
    return letterElement;
}

// Añadir una letra a la palabra actual
function addLetterToWord() {
    const activeDotsElements = document.querySelectorAll('#braille-grid .dot.active');

    if (activeDotsElements.length === 0) {
        showMessage('Selecciona al menos un punto', 'error');
        return;
    }

    const activeDotsIds = Array.from(activeDotsElements).map(dot => parseInt(dot.dataset.id));
    const sortedDots = activeDotsIds.sort((a, b) => a - b);
    
    const key = sortedDots.join('').trim();
    const letter = brailleMap[key] || '?';
    
    const letterElement = createLetterElement(letter, sortedDots);
    currentWordContainer.appendChild(letterElement);
    currentWordLetters.push({ letter: letter, dots: sortedDots });
    
    clearBrailleGrid();
    showMessage(`Letra añadida: ${letter}`, 'info');
}

// Limpiar la palabra actual
function clearWord() {
    currentWordLetters = [];
    currentWordContainer.innerHTML = '';
    clearBrailleGrid();
}

// Crear una tarjeta con la palabra completa
function createCard() {
    if (currentWordLetters.length === 0) {
        showMessage('Primero crea una palabra', 'error');
        return;
    }
    const word = currentWordLetters.map(item => item.letter).join('');
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.word = word;
    card.draggable = true;

    const brailleWordElement = document.createElement('div');
    brailleWordElement.className = 'braille-word';
    currentWordLetters.forEach(letterData => {
        const brailleLetterElement = createBrailleCellElement(letterData.dots);
        brailleWordElement.appendChild(brailleLetterElement);
    });

    const wordText = document.createElement('div');
    wordText.textContent = word;
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.remove();
    });

    card.appendChild(brailleWordElement);
    card.appendChild(wordText);
    card.appendChild(deleteBtn);
    cardsContainer.appendChild(card);
    
    clearWord();
    showMessage(`Tarjeta creada para: ${word}`, 'success');
}

let draggedItem = null;
cardsContainer.addEventListener('dragstart', (e) => {
    const targetCard = e.target.closest('.card');
    if (!targetCard) return;
    draggedItem = targetCard;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedItem.dataset.word);
    draggedItem.classList.add('dragging');
});

cardsContainer.addEventListener('dragend', () => {
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
    }
});

gameArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dropzone = e.target.closest('.dropzone');
    if (dropzone) {
        e.dataTransfer.dropEffect = 'move';
    }
});

gameArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const dropzone = e.target.closest('.dropzone');
    if (!dropzone || !draggedItem) return;

    if (currentMode === 'play') {
        const word = draggedItem.dataset.word;
        if (word === dropzone.dataset.answer) {
            dropzone.innerHTML = '';
            dropzone.appendChild(draggedItem);
            dropzone.classList.add('filled');
            dropzone.classList.add('correct');
            draggedItem.style.cursor = 'default';
            draggedItem.draggable = false;
            showMessage('¡Correcto!', 'success');
        } else {
            showMessage('Inténtalo de nuevo, esa no es la respuesta correcta.', 'error');
        }
    } else { // Modo Edición
        dropzone.innerHTML = '';
        dropzone.dataset.answer = draggedItem.dataset.word;
        dropzone.appendChild(draggedItem);
        draggedItem.style.opacity = '1';
        dropzone.classList.add('filled');
        showMessage(`Zona de arrastre asignada a: "${draggedItem.dataset.word}"`, 'info');
    }
});

function createDropzone(x, y) {
    const dropzone = document.createElement('div');
    dropzone.className = 'dropzone';
    dropzone.style.left = `${x}px`;
    dropzone.style.top = `${y}px`;
    dropzone.dataset.answer = '';

    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropzone.remove();
    });
    dropzone.appendChild(deleteBtn);

    const resizerDirections = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    resizerDirections.forEach(direction => {
        const resizer = document.createElement('div');
        resizer.className = `dropzone-resizer resizer-${direction}`;
        resizer.dataset.direction = direction;
        resizer.addEventListener('mousedown', (e) => startResizing(e, dropzone));
        dropzone.appendChild(resizer);
    });

    gameArea.appendChild(dropzone);
    
    dropzone.addEventListener('mousedown', (e) => {
        if (currentMode === 'edit' && !e.target.classList.contains('dropzone-resizer') && !e.target.classList.contains('delete-btn')) {
            startDragging(e, dropzone);
        }
    });
    showMessage('Zona de arrastre creada', 'info');
}

function startDragging(e, dropzone) {
    isDraggingDropzone = true;
    activeDropzone = dropzone;
    startX = e.clientX - dropzone.offsetLeft;
    startY = e.clientY - dropzone.offsetTop;
}

function startResizing(e, dropzone) {
    isResizingDropzone = true;
    activeDropzone = dropzone;
    activeResizer = e.target;
    e.stopPropagation();

    startX = e.clientX;
    startY = e.clientY;
    startWidth = dropzone.offsetWidth;
    startHeight = dropzone.offsetHeight;
}

document.addEventListener('mousemove', (e) => {
    if (isDraggingDropzone && activeDropzone) {
        const newLeft = e.clientX - startX;
        const newTop = e.clientY - startY;
        activeDropzone.style.left = `${newLeft}px`;
        activeDropzone.style.top = `${newTop}px`;
    }
    
    if (isResizingDropzone && activeDropzone) {
        const dropzone = activeDropzone;
        const direction = activeResizer.dataset.direction;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = dropzone.offsetLeft;
        let newTop = dropzone.offsetTop;
        
        const MIN_SIZE = 50;

        if (direction.includes('e')) {
            newWidth = Math.max(MIN_SIZE, startWidth + (e.clientX - startX));
        }
        if (direction.includes('s')) {
            newHeight = Math.max(MIN_SIZE, startHeight + (e.clientY - startY));
        }
        if (direction.includes('w')) {
            newWidth = Math.max(MIN_SIZE, startWidth - (e.clientX - startX));
            newLeft = dropzone.offsetLeft + (startWidth - newWidth);
        }
        if (direction.includes('n')) {
            newHeight = Math.max(MIN_SIZE, startHeight - (e.clientY - startY));
            newTop = dropzone.offsetTop + (startHeight - newHeight);
        }
        if (direction === 'se') {
            newWidth = Math.max(MIN_SIZE, startWidth + (e.clientX - startX));
            newHeight = Math.max(MIN_SIZE, startHeight + (e.clientY - startY));
        }

        dropzone.style.width = `${newWidth}px`;
        dropzone.style.height = `${newHeight}px`;
        dropzone.style.left = `${newLeft}px`;
        dropzone.style.top = `${newTop}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDraggingDropzone = false;
    isResizingDropzone = false;
    activeDropzone = null;
    activeResizer = null;
});

function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}

function setMode(mode) {
    currentMode = mode;
    const teacherButtons = document.querySelectorAll('.teacher-only');
    if (mode === 'edit') {
        document.body.classList.remove('play-mode');
        showMessage('Modo Edición activado', 'info');
        teacherButtons.forEach(btn => btn.style.display = 'block');
        document.querySelectorAll('.dropzone').forEach(dz => {
            dz.style.cursor = 'grab';
            dz.classList.remove('filled');
            dz.querySelectorAll('.dropzone-resizer').forEach(r => r.style.display = 'block');
            dz.querySelector('.delete-btn').style.display = 'block';
        });
    } else {
        document.body.classList.add('play-mode');
        showMessage('Modo Juego activado', 'info');
        teacherButtons.forEach(btn => btn.style.display = 'none');
        document.querySelectorAll('.dropzone').forEach(dz => {
            dz.style.cursor = 'default';
            dz.querySelectorAll('.dropzone-resizer').forEach(r => r.style.display = 'none');
            dz.querySelector('.delete-btn').style.display = 'none';
        });
    }
}

addLetterBtn.addEventListener('click', addLetterToWord);
addLetterBtn.classList.add('teacher-only');
createCardBtn.addEventListener('click', createCard);
createCardBtn.classList.add('teacher-only');
clearWordBtn.addEventListener('click', clearWord);
clearWordBtn.classList.add('teacher-only');
uploadImageBtn.addEventListener('click', () => {
    backgroundImageInput.click();
});
uploadImageBtn.classList.add('teacher-only');
backgroundImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            gameArea.style.backgroundImage = `url(${e.target.result})`;
            gameArea.style.border = 'none';
        };
        reader.readAsDataURL(file);
    }
});
createDropzoneBtn.addEventListener('click', () => {
    if (currentMode !== 'edit') {
        showMessage('Primero cambia a Modo Edición para crear zonas de arrastre.', 'error');
        return;
    }
    createDropzone(50, 50);
});
createDropzoneBtn.classList.add('teacher-only');
editModeBtn.addEventListener('click', () => setMode('edit'));
editModeBtn.classList.add('teacher-only');
playModeBtn.addEventListener('click', () => setMode('play'));
playModeBtn.classList.add('teacher-only');

teacherAccessBtn.addEventListener('click', () => {
    const password = prompt('Introduce la contraseña para el acceso de maestras:');
    if (password === 'maestra123') {
        showMessage('Acceso de maestras concedido', 'success');
        setMode('edit');
    } else {
        showMessage('Contraseña incorrecta', 'error');
    }
});

window.addEventListener('DOMContentLoaded', () => {
    initializeBrailleGrid();
    setMode('play');
});
