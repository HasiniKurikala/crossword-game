// --- CONFIGURATION ---
const GEMINI_API_KEY = "AIzaSyDWb5PKPGH3_14qH9XTGuUg_tZV2Zn_qJg"; 
// ^^^ STEP 1: PASTE YOUR KEY ABOVE ^^^

let currentLevel = 1;
const GRID_SIZE = 13;
let grid = []; 
let placedWords = [];
let currentDirection = 'across'; 
let selectedCell = { x: -1, y: -1 };
let cooldowns = { letter: false, word: false };
let isLoading = false;

// --- FALLBACK DATA (If AI fails or quota exceeded) ---
const FALLBACK_WORDS = [
    {word: "VIRAT", clue: "King of Cricket"}, {word: "CHAI", clue: "Tapri drink"},
    {word: "MUMBAI", clue: "City of Dreams"}, {word: "SRK", clue: "King Khan"},
    {word: "DOSA", clue: "South Indian crepe"}, {word: "PUNE", clue: "IT hub near Mumbai"},
    {word: "GOLMAAL", clue: "Rohit Shetty comedy"}, {word: "PYTHON", clue: "Coding language"},
    {word: "SAMOSA", clue: "Tea time snack"}, {word: "DELHI", clue: "Capital city"},
    {word: "MODI", clue: "Indian PM"}, {word: "DHONI", clue: "Captain Cool"},
    {word: "LUDO", clue: "Lockdown board game"}, {word: "ROTI", clue: "Daily bread"},
    {word: "AUTO", clue: "Three wheeler"}, {word: "OLA", clue: "Uber rival"},
    {word: "UPI", clue: "Digital payment"}, {word: "GOA", clue: "Party state"},
    {word: "ISRO", clue: "Indian Space Agency"}, {word: "REELS", clue: "Instagram addiction"}
];

window.onload = function() {
    // Start game immediately
    loadLevel(1);
};

async function loadLevel(level) {
    if (isLoading) return;
    isLoading = true;
    currentLevel = level;
    
    document.getElementById('current-level').innerText = level;
    document.getElementById('victory-modal').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'block';
    document.getElementById('game-area').style.display = 'none';

    let words = [];

    // IF KEY IS MISSING, USE FALLBACK
    if (GEMINI_API_KEY === "PASTE_YOUR_KEY_HERE" || GEMINI_API_KEY === "") {
        console.warn("No API Key found. Using fallback data.");
        words = shuffle(FALLBACK_WORDS, level).slice(0, 15);
        startGame(words);
        return;
    }

    try {
        words = await fetchWordsFromAI(level);
    } catch (error) {
        console.error("AI Error:", error);
        alert("AI Generation failed. Loading backup words.");
        words = shuffle(FALLBACK_WORDS, level).slice(0, 15);
    }

    startGame(words);
}

// --- AI GENERATION LOGIC ---
async function fetchWordsFromAI(level) {
    const prompt = `
        Generate a valid JSON array of 20 crossword objects. 
        Format: [{"word": "WORD", "clue": "Clue text"}]. 
        Constraints:
        1. Words must be 3 to 7 letters long. Uppercase only.
        2. TARGET AUDIENCE: INDIANS (Gen Z/Millennials).
        3. TOPICS: Bollywood, Indian Cricket (IPL), Indian Food, Indian Cities, Tech/Coding, Daily Indian Life, Slang.
        4. STRICTLY AVOID: Philosophy, obscure history, Latin, complex biology, American politics.
        5. CLUE STYLE: Fun, witty, relatable, hinglish allowed.
        6. Level difficulty: ${level} (1 is easy/common, 50 is harder).
        7. Output ONLY the JSON. No markdown formatting.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    
    // Clean up if AI wraps it in markdown code blocks
    const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonText);
}

function startGame(wordList) {
    isLoading = false;
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';

    if (wordList.length < 5) { alert("Not enough words generated."); return; }

    const puzzleData = generateGrid(wordList);
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
    
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    selectedCell = { x: -1, y: -1 };

    let domCells = [];
    for(let y=0; y<GRID_SIZE; y++) {
        let row = [];
        for(let x=0; x<GRID_SIZE; x++) {
            let cell = document.createElement('div');
            cell.className = 'cell block';
            cell.dataset.x = x; cell.dataset.y = y;
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
            num.className = 'number'; num.innerText = clueNum++;
            startCell.appendChild(num);
        }
        let numText = startCell.querySelector('.number').innerText;
        
        for (let i = 0; i < w.word.length; i++) {
            let x = w.direction === 'across' ? w.startX + i : w.startX;
            let y = w.direction === 'across' ? w.startY : w.startY + i;
            let cell = domCells[y][x];
            grid[y][x] = w.word[i];
            cell.classList.remove('block');
            
            if (!cell.querySelector('input')) {
                let input = document.createElement('input');
                input.maxLength = 1;
                input.dataset.x = x; input.dataset.y = y;
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

function selectCell(x, y) {
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (cell.classList.contains('block')) return;

    // Smart Direction Switching
    const wordAcross = placedWords.find(w => w.direction === 'across' && w.startY === y && x >= w.startX && x < w.startX + w.word.length);
    const wordDown = placedWords.find(w => w.direction === 'down' && w.startX === x && y >= w.startY && y < w.startY + w.word.length);

    if (selectedCell.x === x && selectedCell.y === y) {
        currentDirection = currentDirection === 'across' ? 'down' : 'across';
    } else {
        selectedCell = { x, y };
        if (currentDirection === 'across' && !wordAcross && wordDown) currentDirection = 'down';
        else if (currentDirection === 'down' && !wordDown && wordAcross) currentDirection = 'across';
    }
    highlightBoard();
    const input = cell.querySelector('input');
    if (input) input.focus();
}

function highlightBoard() {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('active', 'highlight'));
    const activeCell = document.querySelector(`.cell[data-x="${selectedCell.x}"][data-y="${selectedCell.y}"]`);
    if (activeCell) activeCell.classList.add('active');
    
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
    let nextX = selectedCell.x; let nextY = selectedCell.y;
    if (currentDirection === 'across') nextX++; else nextY++;
    const nextCell = document.querySelector(`.cell[data-x="${nextX}"][data-y="${nextY}"]`);
    if (nextCell && !nextCell.classList.contains('block')) selectCell(nextX, nextY);
    checkCurrentWord();
}

function handleKeyDown(e, x, y) {
    if (e.key === 'Backspace' && e.target.value === '') {
        let prevX = x; let prevY = y;
        if (currentDirection === 'across') prevX--; else prevY--;
        const prevCell = document.querySelector(`.cell[data-x="${prevX}"][data-y="${prevY}"]`);
        if (prevCell && !prevCell.classList.contains('block')) {
            selectCell(prevX, prevY); e.preventDefault();
        }
    }
}

function checkCurrentWord() {
    const wordObj = getActiveWordObj();
    if (!wordObj) return;
    let userWord = ""; let inputs = [];
    for(let i=0; i<wordObj.word.length; i++) {
        let x = wordObj.direction === 'across' ? wordObj.startX + i : wordObj.startX;
        let y = wordObj.direction === 'across' ? wordObj.startY : wordObj.startY + i;
        let input = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"] input`);
        userWord += input.value; inputs.push(input);
    }
    if (userWord.length === wordObj.word.length) {
        if (userWord === wordObj.word) {
            inputs.forEach(inp => inp.parentElement.classList.add('correct'));
            checkWinCondition();
        } else {
            inputs.forEach(inp => {
                inp.parentElement.classList.add('shake');
                setTimeout(() => { inp.parentElement.classList.remove('shake'); inp.value = ''; }, 500);
            });
        }
    }
}

function revealSelectedSquare() {
    if (cooldowns.letter) return;
    if (selectedCell.x === -1) { alert("Select a square!"); return; }
    const correctLetter = grid[selectedCell.y][selectedCell.x];
    const cell = document.querySelector(`.cell[data-x="${selectedCell.x}"][data-y="${selectedCell.y}"]`);
    const input = cell.querySelector('input');
    input.value = correctLetter; input.style.color = '#8e44ad';
    checkWinCondition();
    startLiquidCooldown('btn-reveal-letter', 'letter', 15);
}

function revealSelectedWord() {
    if (cooldowns.word) return;
    if (selectedCell.x === -1) { alert("Select a word!"); return; }
    const wordObj = getActiveWordObj();
    if (!wordObj) { alert("No word selected!"); return; }
    for(let i=0; i<wordObj.word.length; i++) {
        let x = wordObj.direction === 'across' ? wordObj.startX + i : wordObj.startX;
        let y = wordObj.direction === 'across' ? wordObj.startY : wordObj.startY + i;
        let input = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"] input`);
        input.value = wordObj.word[i]; 
        input.style.color = '#e67e22'; 
        input.parentElement.classList.add('correct');
    }
    checkWinCondition();
    startLiquidCooldown('btn-reveal-word', 'word', 20);
}

function startLiquidCooldown(btnId, type, seconds) {
    cooldowns[type] = true;
    const btn = document.getElementById(btnId);
    const liquid = btn.querySelector('.liquid');
    btn.disabled = true;
    liquid.style.transition = 'none'; liquid.style.height = '100%'; liquid.offsetHeight; 
    liquid.style.transition = `height ${seconds}s linear`; liquid.style.height = '0%';
    setTimeout(() => { cooldowns[type] = false; btn.disabled = false; }, seconds * 1000);
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
        setTimeout(() => document.getElementById('victory-modal').style.display = 'block', 500);
    }
}

function nextLevel() { loadLevel(currentLevel + 1); }

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
