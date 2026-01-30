let allWords = [];
let currentLevel = 1;
let maxLevelReached = 1; // Track the highest level unlocked
const GRID_SIZE = 13;
let grid = [];
let placedWords = [];

window.onload = function() {
    console.log("Fetching CSV...");
    // MAKE SURE THIS MATCHES YOUR FILENAME ON GITHUB
    Papa.parse("nytcrosswords.csv", {
        download: true,
        header: true,
        complete: function(results) {
            console.log("CSV Loaded.");
            processData(results.data);
        },
        error: function(err) {
            alert("Error loading CSV. Check filename!");
        }
    });
};

function processData(data) {
    let seen = new Set();
    let uniqueData = [];
    
    // Filter and clean data
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

    // Shuffle once deterministically
    allWords = shuffle(uniqueData, 12345);
    
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    
    loadLevel(1);
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

function loadLevel(level) {
    currentLevel = level;
    document.getElementById('level-input').value = level;
    
    // Manage Buttons
    document.getElementById('btn-prev').disabled = (level === 1);
    
    // Only enable Next if we have already beaten this level before
    // OR if we solve it now.
    updateNextButtonState();

    // Get words for this level (20 words per level)
    const wordsPerLevel = 20; 
    const startIndex = (level - 1) * wordsPerLevel;
    const levelWords = allWords.slice(startIndex, startIndex + wordsPerLevel);
    
    if (levelWords.length < 5) {
        alert("End of Game Data!");
        return;
    }

    const puzzleData = generateGrid(levelWords);
    placedWords = puzzleData.words;
    renderBoard();
}

function updateNextButtonState() {
    // Enable next button ONLY if we are re-playing an old level
    // Otherwise, it stays disabled until we solve it.
    const btnNext = document.getElementById('btn-next');
    if (currentLevel < maxLevelReached) {
        btnNext.disabled = false;
    } else {
        btnNext.disabled = true;
    }
}

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
        if (placed.length >= 10) break; // Keep puzzles slightly smaller to ensure they fit
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

function renderBoard() {
    const board = document.getElementById('crossword-board');
    const acrossList = document.getElementById('across-clues');
    const downList = document.getElementById('down-clues');
    
    board.innerHTML = '';
    acrossList.innerHTML = '';
    downList.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 38px)`;
    board.style.gridTemplateRows = `repeat(${GRID_SIZE}, 38px)`;
    
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
    grid = domCells;

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
    
    if (correct === placedWords.length) {
        // UNLOCK NEXT LEVEL
        if (currentLevel === maxLevelReached) {
            maxLevelReached++;
        }
        document.getElementById('btn-next').disabled = false;
        alert("🎉 Level Complete! 'Next Level' button is now unlocked.");
    }
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

function nextLevel() { 
    if (currentLevel < maxLevelReached) {
        loadLevel(currentLevel + 1); 
    }
}

function prevLevel() { 
    if (currentLevel > 1) {
        loadLevel(currentLevel - 1); 
    }
}
