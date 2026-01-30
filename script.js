let allWords = [];
let currentLevel = 1;
const GRID_SIZE = 13; // 13x13 Grid
let grid = [];
let placedWords = [];

// 1. LOAD AND PARSE CSV
window.onload = function() {
    console.log("Fetching CSV...");
    Papa.parse("nytcrosswords.csv", {
        download: true,
        header: true,
        complete: function(results) {
            console.log("CSV Loaded. Processing...");
            processData(results.data);
        },
        error: function(err) {
            alert("Error loading CSV file. Make sure 'nytcrosswords.csv' is uploaded to your repo.");
            console.error(err);
        }
    });
};

// 2. PROCESS & SHUFFLE DATA
function processData(data) {
    // Filter for valid words (3-6 letters, A-Z only)
    // We filter strictly to make the grid generation easier
    let validData = data.filter(row => {
        if (!row.Word || !row.Clue) return false;
        let w = row.Word.toString().toUpperCase().replace(/[^A-Z]/g, '');
        return w.length >= 3 && w.length <= 6;
    });

    // Remove duplicates (keep one clue per word)
    let seen = new Set();
    let uniqueData = [];
    validData.forEach(item => {
        let cleanWord = item.Word.toUpperCase().replace(/[^A-Z]/g, '');
        if (!seen.has(cleanWord)) {
            seen.add(cleanWord);
            uniqueData.push({
                word: cleanWord,
                clue: item.Clue
            });
        }
    });

    console.log(`Found ${uniqueData.length} unique valid words.`);

    // Shuffle Deterministically (Seed = 12345)
    // This ensures everyone gets the same "Random" order
    allWords = shuffle(uniqueData, 12345);

    // Hide Loading, Show Game
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';

    // Start Level 1
    loadLevel(1);
}

// Seeded Shuffle Function
function shuffle(array, seed) {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(random(seed) * m--);
        seed++; // Increment seed to change random value
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

// Simple seeded random number generator
function random(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// 3. GENERATE LEVEL
function loadLevel(level) {
    currentLevel = level;
    document.getElementById('level-input').value = level;
    
    // Slice words for this level
    // Level 1: 0-25, Level 2: 25-50, etc.
    const wordsPerLevel = 25; 
    const startIndex = (level - 1) * wordsPerLevel;
    const levelWords = allWords.slice(startIndex, startIndex + wordsPerLevel);
    
    if (levelWords.length < 5) {
        alert("You have reached the end of the dataset! Amazing!");
        return;
    }

    // Generate the Puzzle
    const puzzleData = generateGrid(levelWords);
    placedWords = puzzleData.words;
    
    renderBoard();
}

// 4. GRID GENERATOR ALGORITHM
function generateGrid(wordList) {
    let tempGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    let placed = [];
    
    // Sort by length (Longest first helps placement)
    wordList.sort((a, b) => b.word.length - a.word.length);
    
    // Place First Word
    let first = wordList[0];
    let startX = Math.floor((GRID_SIZE - first.word.length) / 2);
    let startY = Math.floor(GRID_SIZE / 2);
    placeWord(tempGrid, first, startX, startY, 'across');
    placed.push({ ...first, startX, startY, direction: 'across' });
    
    // Try to place others
    for (let i = 1; i < wordList.length; i++) {
        if (placed.length >= 12) break; // Limit to 12 words per puzzle
        
        let current = wordList[i];
        let placedObj = tryPlaceWord(tempGrid, current, placed);
        if (placedObj) {
            placed.push(placedObj);
        }
    }
    
    return { words: placed };
}

function tryPlaceWord(grid, wordObj, placedList) {
    // Try to intersect with every placed word
    for (let p of placedList) {
        // Find common letters
        for (let i = 0; i < p.word.length; i++) {
            for (let j = 0; j < wordObj.word.length; j++) {
                if (p.word[i] === wordObj.word[j]) {
                    // Intersection found
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

// 5. RENDER BOARD
const board = document.getElementById('crossword-board');
const acrossList = document.getElementById('across-clues');
const downList = document.getElementById('down-clues');

function renderBoard() {
    board.innerHTML = '';
    acrossList.innerHTML = '';
    downList.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 38px)`;
    board.style.gridTemplateRows = `repeat(${GRID_SIZE}, 38px)`;
    
    // Create Grid Array for Lookup
    let displayGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    
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
    grid = domCells; // Global reference

    // Fill Words
    let clueNum = 1;
    // Sort to keep numbering clean (top-left to bottom-right)
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
            cell.classList.remove('block');
            if (!cell.querySelector('input')) {
                let input = document.createElement('input');
                input.maxLength = 1;
                cell.appendChild(input);
            }
        }
        
        let li = document.createElement('li');
        li.innerHTML = `<b>${numText}.</b> ${w.clue}`;
        if (w.direction === 'across') acrossList.appendChild(li);
        else downList.appendChild(li);
    });
}

function checkAnswers() {
    let correct = 0;
    placedWords.forEach(w => {
        let isCorrect = true;
        for (let i = 0; i < w.word.length; i++) {
            let x = w.direction === 'across' ? w.startX + i : w.startX;
            let y = w.direction === 'across' ? w.startY : w.startY + i;
            let input = grid[y][x].querySelector('input');
            if (input.value.toUpperCase() !== w.word[i]) {
                input.style.color = 'red'; isCorrect = false;
            } else { input.style.color = 'green'; }
        }
        if (isCorrect) correct++;
    });
    if (correct === placedWords.length) alert("Level Complete!");
}

function revealAnswers() {
    placedWords.forEach(w => {
        for (let i = 0; i < w.word.length; i++) {
            let x = w.direction === 'across' ? w.startX + i : w.startX;
            let y = w.direction === 'across' ? w.startY : w.startY + i;
            let input = grid[y][x].querySelector('input');
            input.value = w.word[i]; input.style.color = 'blue';
        }
    });
}

function nextLevel() { loadLevel(currentLevel + 1); }
function prevLevel() { if(currentLevel > 1) loadLevel(currentLevel - 1); }
function loadLevelFromInput() { loadLevel(parseInt(document.getElementById('level-input').value)); }
