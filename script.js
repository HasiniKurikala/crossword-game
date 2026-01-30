body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #e9ecef;
    display: flex;
    justify-content: center;
    padding: 20px;
}
.game-container {
    background: white;
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    max-width: 950px;
    width: 100%;
}
h1 { text-align: center; color: #2c3e50; margin-top: 0; }

/* Level Controls */
.level-control {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-bottom: 25px;
    background: #f8f9fa;
    padding: 15px;
    border-radius: 10px;
}
.level-display { text-align: center; }
.level-display label { display: block; font-size: 12px; font-weight: bold; color: #7f8c8d; }
input[type="number"] {
    width: 60px; font-size: 24px; text-align: center;
    border: 2px solid #bdc3c7; border-radius: 5px; padding: 5px;
}
.nav-btn {
    background: #34495e; color: white; border: none;
    width: 40px; height: 40px; border-radius: 50%;
    font-size: 20px; cursor: pointer; transition: 0.2s;
}
.nav-btn:hover { background: #2c3e50; transform: scale(1.1); }

/* Layout */
.main-layout { display: flex; gap: 30px; flex-wrap: wrap; justify-content: center; }
#crossword-board {
    display: grid;
    background: #2c3e50;
    border: 5px solid #2c3e50;
    gap: 1px;
    width: fit-content;
}
.cell {
    width: 38px; height: 38px;
    background: white; position: relative;
    display: flex; justify-content: center; align-items: center;
}
.cell.block { background: #2c3e50; }
.cell input {
    width: 100%; height: 100%; border: none;
    text-align: center; font-size: 20px; font-weight: bold;
    text-transform: uppercase; color: #2c3e50; background: transparent;
}
.cell input:focus { background: #e8f6f3; outline: none; }
.cell .number {
    position: absolute; top: 2px; left: 3px;
    font-size: 10px; font-weight: bold; color: #7f8c8d; pointer-events: none;
}

/* Clues */
.clue-section { flex: 1; min-width: 300px; display: flex; gap: 20px; }
.clue-column { flex: 1; }
h3 { border-bottom: 2px solid #3498db; padding-bottom: 8px; color: #2980b9; }
ul { list-style: none; padding: 0; height: 400px; overflow-y: auto; }
li { padding: 5px; font-size: 14px; line-height: 1.4; border-bottom: 1px solid #eee; }

/* Bottom Buttons */
.controls { margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
button { padding: 12px 25px; font-size: 16px; border-radius: 6px; cursor: pointer; border: none; margin: 0 5px; transition: 0.2s; }
.action-btn { background: #27ae60; color: white; }
.action-btn:hover { background: #219150; }
.secondary-btn { background: #95a5a6; color: white; }
.new-btn { background: #e67e22; color: white; }
