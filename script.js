let allWords = [];
let currentLevel = 1;
const GRID_SIZE = 13;
let grid = []; // Stores the correct letter for each cell
let placedWords = [];
let selectedInput = null; // Track which cell the user clicked
let revealCooldown = false;

window.onload = function() {
    // CHANGE THIS TO MATCH YOUR FILENAME
    Papa.parse("nytcrosswords.csv", {
        download: true, header: true,
        complete: function(results) { processData(results.data); },
        error: function(err) { alert("Error loading CSV."); }
    });
};

function processData(data) {
    let seen = new Set();
    let uniqueData = [];
    data.forEach(row => {
        if (!row.Word || !row.Clue) return;
        let cleanWord = row.Word.toString().toUpperCase().replace(/[^A-Z]/g, '');
        if (cleanWord.length >= 3 && cleanWord.length <= 6) {
            if (!seen.has(cleanWord)) {
                seen.add(cleanWord);
                uniqueData.push({ word: cleanWord, clue: row.Clue });
            }
        }
    });
    // Shuffle with fixed seed
    allWords = shuffle(uniqueData, 12345);
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    loadLevel(1);
}

function loadLevel(level) {
    currentLevel = level;
    document.getElementById('current-level').innerText = level;
    document.getElementById('victory-modal').style.display = 'none';
    
    // Get words (20 per level)
    const startIndex = (level - 1) * 20;
    const levelWords = allWords.slice(startIndex, startIndex + 20);
    
    if (levelWords.length < 5) { alert("End of Game!"); return; }

    const puzzleData = generateGrid(levelWords);
    placedWords = puzzleData.words;
    renderBoard();
}

function renderBoard() {
    const board = document.getElementById('crossword-board');
    const acrossList = document.getElementById('across-clues');
    const downList = document.getElementById('down-clues');
    
    board.innerHTML = ''; acrossList.innerHTML = ''; downList.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 38px)`;
    board.style.gridTemplateRows = `repeat(${GRID_SIZE}, 38px)`;
    
    // Init Grid Data
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    
    // Create DOM Cells
    let domCells = [];
    for(let y=0; y<GRID_SIZE; y++) {
        let row = [];
        for(let x=0; x<GRID_SIZE; x++) {
            let cell = document.createElement('div');
            cell.className = 'cell block';
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
            num.className = 'number'; num.innerText = clueNum++;
            startCell.appendChild(num);
        }
        let numText = startCell.querySelector('.number').innerText;
        
        for (let i = 0; i < w.word.length; i++) {
            let x = w.direction === 'across' ? w.startX + i : w.startX;
            let y = w.direction === 'across' ? w.startY : w.startY + i;
            let cell = domCells[y][x];
            
            // Store correct letter in our logical grid
            grid[y][x] = w.word[i];
            
            cell.classList.remove('block');
            if (!cell.querySelector('input')) {
                let input = document.createElement('input');
                input.maxLength = 1;
                input.dataset.x = x;
                input.dataset.y = y;
                // EVENT: On Input (Typing)
                input.addEventListener('input', (e) => handleInput(e.target));
                // EVENT: On Focus (Clicking)
                input.addEventListener('focus', (e) => {
                    selectedInput = e.target;
                    // Highlight logic could go here
                });
                cell.appendChild(input);
            }
        }
        
        let li = document.createElement('li');
        li.innerHTML = `<b>${numText}.</b> ${w.clue}`;
        if (w.direction === 'across') acrossList.appendChild(li);
        else downList.appendChild(li);
    });
}

// --- CORE GAMEPLAY LOGIC ---

function handleInput(input) {
    const x = parseInt(input.dataset.x);
    const y = parseInt(input.dataset.y);
    const correctLetter = grid[y][x];
    const userLetter = input.value.toUpperCase();

    // Reset styles
    input.parentElement.classList.remove('shake');
    input.style.color = 'black';

    if (userLetter === '') return;

    if (userLetter === correctLetter) {
        // CORRECT: Green & Lock
        input.style.color = '#27ae60';
        input.style.fontWeight = 'bold';
        checkWinCondition();
    } else {
        // WRONG: Shake & Clear
        input.style.color = 'red';
        input.parentElement.classList.add('shake');
        // Clear wrong letter after 500ms so they can try again
        setTimeout(() => {
            input.value = '';
            input.parentElement.classList.remove('shake');
        }, 500);
    }
}

function revealSelectedSquare() {
    if (revealCooldown) return; // Button is cooling down
    if (!selectedInput) {
        alert("Please click a white square first!");
        return;
    }

    const x = parseInt(selectedInput.dataset.x);
    const y = parseInt(selectedInput.dataset.y);
    const correctLetter = grid[y][x];

    // Fill correct letter
    selectedInput.value = correctLetter;
    selectedInput.style.color = '#8e44ad'; // Purple for revealed
    
    // Trigger Win Check
    checkWinCondition();

    // Start Cooldown
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
    // Check if all inputs match grid
    const inputs = document.querySelectorAll('.cell input');
    let allCorrect = true;
    
    inputs.forEach(input => {
        const x = parseInt(input.dataset.x);
        const y = parseInt(input.dataset.y);
        if (input.value.toUpperCase() !== grid[y][x]) {
            allCorrect = false;
        }
    });

    if (allCorrect) {
        setTimeout(() => {
            document.getElementById('victory-modal').style.display = 'block';
        }, 300);
    }
}

function nextLevel() {
    loadLevel(currentLevel + 1);
}

// --- UTILITIES (Grid Gen + Shuffle) ---
function generateGrid(wordList) {
    let tempGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    let placed = [];
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
    } return null;
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
    } return true;
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
        seed++; t = array[m]; array[m] = array[i]; array[i] = t;
    } return array;
}
function random(seed) { var x = Math.sin(seed++) * 10000; return x - Math.floor(x); }
