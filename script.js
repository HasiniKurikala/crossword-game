let allWords = [];
let currentLevel = 1;
const GRID_SIZE = 13;
let grid = []; 
let placedWords = [];
let currentDirection = 'across'; // 'across' or 'down'
let selectedCell = { x: -1, y: -1 };
let revealCooldown = false;

window.onload = function() {
    // UPDATED: Now looks for 'nytcrosswords.csv'
    Papa.parse("nytcrosswords.csv", {
        download: true,
        header: true,
        complete: function(results) {
            processData(results.data);
        },
        error: function(err) {
            alert("Error loading CSV file. Make sure 'nytcrosswords.csv' is in your repository!");
        }
    });
};

function processData(data) {
    let seen = new Set();
    let uniqueData = [];
    data.forEach(row => {
        if (!row.Word || !row.Clue) return;
        let cleanWord = row.Word.toString().toUpperCase().replace(/[^A-Z]/g, '');
        // Filtering for words between 3 and 6 letters
        if (cleanWord.length >= 3 && cleanWord.length <= 6) {
            if (!seen.has(cleanWord)) {
                seen.add(cleanWord);
                uniqueData.push({ word: cleanWord, clue: row.Clue });
            }
        }
    });

    // Shuffle once deterministically
    allWords = shuffle(uniqueData, 12345);
    
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    
    loadLevel(1);
}

function loadLevel(level) {
    currentLevel = level;
    document.getElementById('current-level').innerText = level;
    document.getElementById('victory-modal').style.display = 'none';
    
    // Select words for this level (20 words per level)
    const startIndex = (level - 1) * 20;
    const levelWords = allWords.slice(startIndex, startIndex + 20);
    
    if (levelWords.length < 5) {
        alert("You have finished all levels! Amazing!");
        return;
    }

    const puzzleData = generateGrid(levelWords);
    placedWords = puzzleData.words;
    renderBoard();
}

function renderBoard() {
    const board = document.getElementById('crossword-board');
    const acrossList = document.getElementById('across-clues');
    const downList = document.getElementById('down-clues');
    
    board.innerHTML = '';
    acrossList.innerHTML = '';
    downList.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 38px)`;
    board.style.gridTemplateRows = `repeat(${GRID_SIZE}, 38px)`;
    
    // Reset Grid State
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    selectedCell = { x: -1, y: -1 };

    // Create DOM Cells
    let domCells = [];
    for(let y=0; y<GRID_SIZE; y++) {
        let row = [];
        for(let x=0; x<GRID_SIZE; x++) {
            let cell = document.createElement('div');
            cell.className = 'cell block';
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.onclick = () => selectCell(x, y);
            board.appendChild(cell);
            row.push(cell);
        }
        domCells.push(row);
    }

    let clueNum = 1;
    placedWords.sort((a,b) => (a.startY - b.startY) || (a.startX - b.startX));
    
    placedWords.forEach(w => {
        let startCell = domCells[w.startY][w.startX];
        if (!startCell.querySelector('.number')) {
            let num = document.createElement('span');
            num.className = 'number';
            num.innerText = clueNum++;
            startCell.appendChild(num);
        }
        let numText = startCell.querySelector('.number').innerText;
        
        for (let i = 0; i < w.word.length; i++) {
            let x = w.direction === 'across' ? w.startX + i : w.startX;
            let y = w.direction === 'across' ? w.startY : w.startY + i;
            let cell = domCells[y][x];
            
            grid[y][x] = w.word[i]; // Store answer
            cell.classList.remove('block');
            
            if (!cell.querySelector('input')) {
                let input = document.createElement('input');
                input.maxLength = 1;
                input.dataset.x = x;
                input.dataset.y = y;
                input.autocomplete = "off";
                input.addEventListener('input', (e) => handleInput(e.target));
                input.addEventListener('keydown', (e) => handleKeyDown(e, x, y));
                cell.appendChild(input);
            }
        }
        
        let li = document.createElement('li');
        li.innerHTML = `<b>${numText}.</b> ${w.clue}`;
        if (w.direction === 'across') acrossList.appendChild(li);
        else downList.appendChild(li);
    });
}

// --- INTERACTION LOGIC ---

function selectCell(x, y) {
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (cell.classList.contains('block')) return;

    // Toggle direction if clicking the already selected cell
    if (selectedCell.x === x && selectedCell.y === y) {
        currentDirection = currentDirection === 'across' ? 'down' : 'across';
    } else {
        selectedCell = { x, y };
    }

    highlightBoard();
    const input = cell.querySelector('input');
    if (input) input.focus();
}

function highlightBoard() {
    // Clear old highlights
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('active', 'highlight');
    });

    // Highlight active cell
    const activeCell = document.querySelector(`.cell[data-x="${selectedCell.x}"][data-y="${selectedCell.y}"]`);
    if (activeCell) activeCell.classList.add('active');

    // Highlight active word
    const wordObj = getActiveWordObj();
    if (wordObj) {
        for(let i=0; i<wordObj.word.length; i++) {
            let x = wordObj.direction === 'across' ? wordObj.startX + i : wordObj.startX;
            let y = wordObj.direction === 'across' ? wordObj.startY : wordObj.startY + i;
            let cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
            if (cell) cell.classList.add('highlight');
        }
    }
}

function getActiveWordObj() {
    return placedWords.find(w => {
        if (w.direction !== currentDirection) return false;
        if (currentDirection === 'across') {
            return w.startY === selectedCell.y && selectedCell.x >= w.startX && selectedCell.x < w.startX + w.word.length;
        } else {
            return w.startX === selectedCell.x && selectedCell.y >= w.startY && selectedCell.y < w.startY + w.word.length;
        }
    });
}

function handleInput(input) {
    const val = input.value.toUpperCase();
    input.value = val; 
    
    if (val === '') return;

    // Move to next cell
    let nextX = selectedCell.x;
    let nextY = selectedCell.y;
    if (currentDirection === 'across') nextX++;
    else nextY++;

    const nextCell = document.querySelector(`.cell[data-x="${nextX}"][data-y="${nextY}"]`);
    if (nextCell && !nextCell.classList.contains('block')) {
        selectCell(nextX, nextY);
    }

    checkCurrentWord();
}

function handleKeyDown(e, x, y) {
    if (e.key === 'Backspace' && e.target.value === '') {
        let prevX = x;
        let prevY = y;
        if (currentDirection === 'across') prevX--;
        else prevY--;
        
        const prevCell = document.querySelector(`.cell[data-x="${prevX}"][data-y="${prevY}"]`);
        if (prevCell && !prevCell.classList.contains('block')) {
            selectCell(prevX, prevY);
            e.preventDefault();
        }
    }
}

function checkCurrentWord() {
    const wordObj = getActiveWordObj();
    if (!wordObj) return;

    let userWord = "";
    let inputs = [];
    
    for(let i=0; i<wordObj.word.length; i++) {
        let x = wordObj.direction === 'across' ? wordObj.startX + i : wordObj.startX;
        let y = wordObj.direction === 'across' ? wordObj.startY : wordObj.startY + i;
        let input = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"] input`);
        userWord += input.value;
        inputs.push(input);
    }

    if (userWord.length === wordObj.word.length) {
        if (userWord === wordObj.word) {
            // Correct
            inputs.forEach(inp => inp.parentElement.classList.add('correct'));
            checkWinCondition();
        } else {
            // Wrong -> Shake
            inputs.forEach(inp => {
                inp.parentElement.classList.add('shake');
                setTimeout(() => {
                    inp.parentElement.classList.remove('shake');
                    inp.value = ''; 
                }, 500);
            });
        }
    }
}

function revealSelectedSquare() {
    if (revealCooldown) return;
    if (selectedCell.x === -1) { alert("Select a square first!"); return; }

    const correctLetter = grid[selectedCell.y][selectedCell.x];
    const cell = document.querySelector(`.cell[data-x="${selectedCell.x}"][data-y="${selectedCell.y}"]`);
    const input = cell.querySelector('input');
    
    input.value = correctLetter;
    input.style.color = '#8e44ad';
    
    checkWinCondition();
    startCooldown(15);
}

function startCooldown(seconds) {
    revealCooldown = true;
    const btn = document.getElementById('btn-reveal');
    btn.disabled = true;
    
    let remaining = seconds;
    btn.innerHTML = `Wait ${remaining}s`;

    const interval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(interval);
            revealCooldown = false;
            btn.disabled = false;
            btn.innerHTML = `Reveal Letter`;
        } else {
            btn.innerHTML = `Wait ${remaining}s`;
        }
    }, 1000);
}

function checkWinCondition() {
    const inputs = document.querySelectorAll('.cell input');
    let allCorrect = true;
    inputs.forEach(input => {
        const x = parseInt(input.dataset.x);
        const y = parseInt(input.dataset.y);
        if (input.value.toUpperCase() !== grid[y][x]) allCorrect = false;
    });

    if (allCorrect) {
        setTimeout(() => {
            document.getElementById('victory-modal').style.display = 'block';
        }, 500);
    }
}

function nextLevel() {
    loadLevel(currentLevel + 1);
}

// --- UTILITIES ---

function generateGrid(wordList) {
    let tempGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    let placed = [];
    
    // Sort longest words first
    wordList.sort((a, b) => b.word.length - a.word.length);
    
    let first = wordList[0];
    let startX = Math.floor((GRID_SIZE - first.word.length) / 2);
    let startY = Math.floor(GRID_SIZE / 2);
    placeWord(tempGrid, first, startX, startY, 'across');
    placed.push({ ...first, startX, startY, direction: 'across' });
    
    for (let i = 1; i < wordList.length; i++) {
        if (placed.length >= 12) break;
        let current = wordList[i];
        let placedObj = tryPlaceWord(tempGrid, current, placed);
        if (placedObj) placed.push(placedObj);
    }
    
    return { words: placed };
}

function tryPlaceWord(grid, wordObj, placedList) {
    for (let p of placedList) {
        for (let i = 0; i < p.word.length; i++) {
            for (let j = 0; j < wordObj.word.length; j++) {
                if (p.word[i] === wordObj.word[j]) {
                    let newDir = p.direction === 'across' ? 'down' : 'across';
                    let newX = p.direction === 'across' ? p.startX + i : p.startX - j;
                    let newY = p.direction === 'across' ? p.startY - j : p.startY + i;
                    
                    if (canPlace(grid, wordObj.word, newX, newY, newDir)) {
                        placeWord(grid, wordObj, newX, newY, newDir);
                        return { ...wordObj, startX: newX, startY: newY, direction: newDir };
                    }
                }
            }
        }
    }
    return null;
}

function canPlace(grid, word, x, y, dir) {
    if (x < 0 || y < 0) return false;
    if (dir === 'across') {
        if (x + word.length > GRID_SIZE) return false;
        if (x > 0 && grid[y][x-1] !== null) return false;
        if (x + word.length < GRID_SIZE && grid[y][x+word.length] !== null) return false;
        for (let i = 0; i < word.length; i++) {
            let cell = grid[y][x+i];
            if (cell !== null && cell !== word[i]) return false;
            if (cell === null) {
                if (y > 0 && grid[y-1][x+i] !== null) return false;
                if (y < GRID_SIZE - 1 && grid[y+1][x+i] !== null) return false;
            }
        }
    } else {
        if (y + word.length > GRID_SIZE) return false;
        if (y > 0 && grid[y-1][x] !== null) return false;
        if (y + word.length < GRID_SIZE && grid[y+word.length][x] !== null) return false;
        for (let i = 0; i < word.length; i++) {
            let cell = grid[y+i][x];
            if (cell !== null && cell !== word[i]) return false;
            if (cell === null) {
                if (x > 0 && grid[y+i][x-1] !== null) return false;
                if (x < GRID_SIZE - 1 && grid[y+i][x+1] !== null) return false;
            }
        }
    }
    return true;
}

function placeWord(grid, wordObj, x, y, dir) {
    for (let i = 0; i < wordObj.word.length; i++) {
        if (dir === 'across') grid[y][x+i] = wordObj.word[i];
        else grid[y+i][x] = wordObj.word[i];
    }
}

function shuffle(array, seed) {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(random(seed) * m--);
        seed++;
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

function random(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
