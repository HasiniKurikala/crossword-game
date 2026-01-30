const levels = {
  "1": {
    "gridSize": 10,
    "words": [
      { "word": "GMS", "clue": "Baseball V.I.P.'s", "startX": 4, "startY": 5, "direction": "across" },
      { "word": "SEEMS", "clue": "Is apparent", "startX": 6, "startY": 5, "direction": "down" },
      { "word": "EDU", "clue": "University URL ending", "startX": 6, "startY": 6, "direction": "across" },
      { "word": "HALLE", "clue": "Berry that's much sought after?", "startX": 2, "startY": 7, "direction": "across" },
      { "word": "CHAI", "clue": "Spiced milk tea", "startX": 2, "startY": 6, "direction": "down" },
      { "word": "VIAL", "clue": "Vaccine holder", "startX": 1, "startY": 9, "direction": "across" },
      { "word": "SAE", "clue": "Encl. to an editor", "startX": 6, "startY": 9, "direction": "across" },
      { "word": "ECUS", "clue": "Old French coins", "startX": 8, "startY": 4, "direction": "down" }
    ]
  },
  "2": {
    "gridSize": 12,
    "words": [
      { "word": "NLE", "clue": "Phillies' div.", "startX": 5, "startY": 6, "direction": "across" },
      { "word": "INERT", "clue": "Like some gases", "startX": 7, "startY": 4, "direction": "down" },
      { "word": "RIB", "clue": "Josh", "startX": 6, "startY": 4, "direction": "across" },
      { "word": "SNOOTY", "clue": "Hoity-toity", "startX": 5, "startY": 5, "direction": "down" },
      { "word": "TOXIN", "clue": "Benzene or lead", "startX": 7, "startY": 8, "direction": "across" },
      { "word": "WHATS", "clue": "Preceder of his name?", "startX": 1, "startY": 5, "direction": "across" },
      { "word": "SNATCH", "clue": "Grab", "startX": 3, "startY": 3, "direction": "down" },
      { "word": "TRI", "clue": "Prefix with athlete", "startX": 10, "startY": 6, "direction": "down" },
      { "word": "OVER", "clue": "In the strike zone", "startX": 6, "startY": 1, "direction": "down" },
      { "word": "NOONTIDE", "clue": "When shadows disappear", "startX": 4, "startY": 1, "direction": "across" },
      { "word": "RIGA", "clue": "Latvia's capital", "startX": 9, "startY": 0, "direction": "down" },
      { "word": "ADA", "clue": "Org. fighting decay", "startX": 9, "startY": 3, "direction": "across" }
    ]
  },
  "3": {
    "gridSize": 15,
    "words": [
      { "word": "ETON", "clue": "Prep school for some English princes", "startX": 5, "startY": 7, "direction": "across" },
      { "word": "CEDE", "clue": "Grant", "startX": 5, "startY": 6, "direction": "down" },
      { "word": "ELYSIAN", "clue": "Heavenly", "startX": 8, "startY": 1, "direction": "down" },
      { "word": "DARKEN", "clue": "Shade in", "startX": 1, "startY": 9, "direction": "across" },
      { "word": "RDS", "clue": "Places for forks: Abbr.", "startX": 6, "startY": 4, "direction": "across" },
      { "word": "HANOI", "clue": "World capital NE of Vientiane", "startX": 2, "startY": 8, "direction": "down" },
      { "word": "NEGATOR", "clue": "Undoer", "startX": 7, "startY": 1, "direction": "across" },
      { "word": "PAPERBAG", "clue": "Makeshift mask", "startX": 10, "startY": 0, "direction": "down" },
      { "word": "NAST", "clue": "Conde ___", "startX": 6, "startY": 9, "direction": "down" },
      { "word": "AMITY", "clue": "Goodwill", "startX": 0, "startY": 12, "direction": "across" },
      { "word": "ALERT", "clue": "Argus-eyed", "startX": 10, "startY": 6, "direction": "across" },
      { "word": "CEDES", "clue": "Gives up", "startX": 12, "startY": 5, "direction": "down" },
      { "word": "EASE", "clue": "Naturalness", "startX": 10, "startY": 3, "direction": "across" },
      { "word": "KARO", "clue": "Corn syrup brand", "startX": 6, "startY": 2, "direction": "down" },
      { "word": "OLA", "clue": "Rock-___ (jukebox brand)", "startX": 0, "startY": 10, "direction": "down" }
    ]
  }
};

let currentLevel = 1;
let grid = [];
const board = document.getElementById('crossword-board');
const acrossList = document.getElementById('across-clues');
const downList = document.getElementById('down-clues');

function loadLevel(levelId) {
    currentLevel = levelId;
    const data = levels[levelId];
    board.innerHTML = '';
    acrossList.innerHTML = '';
    downList.innerHTML = '';
    grid = [];
    board.style.gridTemplateColumns = `repeat(${data.gridSize}, 35px)`;
    board.style.gridTemplateRows = `repeat(${data.gridSize}, 35px)`;
    
    for (let y = 0; y < data.gridSize; y++) {
        let row = [];
        for (let x = 0; x < data.gridSize; x++) {
            let cell = document.createElement('div');
            cell.classList.add('cell', 'block');
            cell.dataset.x = x;
            cell.dataset.y = y;
            board.appendChild(cell);
            row.push(cell);
        }
        grid.push(row);
    }

    let wordCount = 1;
    data.words.forEach((w) => {
        let startCell = grid[w.startY][w.startX];
        if (!startCell.querySelector('.number')) {
            let num = document.createElement('span');
            num.className = 'number';
            num.innerText = wordCount++;
            startCell.appendChild(num);
        }
        for (let i = 0; i < w.word.length; i++) {
            let x = w.direction === 'across' ? w.startX + i : w.startX;
            let y = w.direction === 'across' ? w.startY : w.startY + i;
            let cell = grid[y][x];
            cell.classList.remove('block');
            if (!cell.querySelector('input')) {
                let input = document.createElement('input');
                input.maxLength = 1;
                cell.appendChild(input);
            }
        }
        let li = document.createElement('li');
        li.innerText = `${startCell.querySelector('.number').innerText}. ${w.clue}`;
        if (w.direction === 'across') acrossList.appendChild(li);
        else downList.appendChild(li);
    });
}

function changeLevel() {
    loadLevel(parseInt(document.getElementById('level-select').value));
}

function checkAnswers() {
    let correctCount = 0;
    const data = levels[currentLevel];
    data.words.forEach(w => {
        let isCorrect = true;
        for (let i = 0; i < w.word.length; i++) {
            let x = w.direction === 'across' ? w.startX + i : w.startX;
            let y = w.direction === 'across' ? w.startY : w.startY + i;
            let input = grid[y][x].querySelector('input');
            if (input.value.toUpperCase() !== w.word[i]) {
                isCorrect = false; input.style.color = 'red';
            } else { input.style.color = 'black'; }
        }
        if (isCorrect) correctCount++;
    });
    if (correctCount === data.words.length) alert("Level Complete!");
}

function revealAnswers() {
    const data = levels[currentLevel];
    data.words.forEach(w => {
        for (let i = 0; i < w.word.length; i++) {
            let x = w.direction === 'across' ? w.startX + i : w.startX;
            let y = w.direction === 'across' ? w.startY : w.startY + i;
            let input = grid[y][x].querySelector('input');
            input.value = w.word[i]; input.style.color = 'blue';
        }
    });
}

loadLevel(1);
