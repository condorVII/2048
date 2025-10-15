import { useState, useEffect, useRef } from 'react';
import reactLogo from './assets/setting.png';
import './App.css';
import './Tiles.css';
import { useArrowInput } from "./arrowInput";

function App() {
  const createEmptyGrid = () => Array(4).fill(null).map(() => Array(4).fill(0));
  const [grid, setGrid] = useState(createEmptyGrid());
  const [vis, setVis] = useState("hidden");
  const [gameOver , setGameOver] = useState(true);
  const [gameWin , setGameWin] = useState(false);
  const [doubleMerge, setDoubleMerge] = useState(false); 
  const [disableAnim, setDisableAnim] = useState(false);
  const [score , setScore] = useState(0);
  const animFlags = useRef([]);

  useEffect(() => {
    newGame();
  }, []);

  useArrowInput((key) => {
    const possibleMoves = getPossibleMoves(grid);
    if (vis === "hidden"){
      if (key === "ArrowLeft" && possibleMoves.left){
        move(0);
      }
      else if (key === "ArrowRight" && possibleMoves.right){
        move(1);
      }
      else if (key === "ArrowUp" && possibleMoves.up){
        move(2);
      }
      else if (key === "ArrowDown" && possibleMoves.down){
        move(3);
      }
    }
  });

  const newGame = () => {
    let emptyGrid = createEmptyGrid();
    emptyGrid = generateNew(emptyGrid);
    emptyGrid = generateNew(emptyGrid);
    setGameOver(false);
    setGameWin(false);
    setGrid(emptyGrid);
    setScore(0);
  };

  const generateNew = (grid) => {
    const copy = JSON.parse(JSON.stringify(grid));
    let emptyCells = [];
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        if (copy[x][y] === 0) emptyCells.push({ x, y });
      }
    }
    if (emptyCells.length === 0) return copy;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newValue = Math.random() < 0.2 ? 4 : 2;
    copy[randomCell.x][randomCell.y] = newValue;
    animFlags.current.push(`x${randomCell.x}y${randomCell.y}`);
    if (checkGameOver(copy)) {
      setTimeout(() => {
        setGameOver(true);
      }, 150);
    }
    if (checkGameWin(copy)) {
      setTimeout(() => {
        setGameWin(true);
      }, 150);
    }
    return copy;
  };

  const moveTo = (id , x , y) => {
    let origin = getXY(id);
    let dest = {x:x , y:y};
    let delta = {
      x: dest.x - origin.x,
      y: dest.y - origin.y,
    };
    const tile = document.getElementById(id);
    if (tile){
      const moveX = (delta.x) * 19 + "vh";
      const moveY = (delta.y) * 19 + "vh";
      tile.classList.add('tileanim');
      tile.style.transform = `translate(${moveY} , ${moveX})`;
      setTimeout(() => {
        tile.classList.remove('tileanim'); //koniec animacji
        tile.style.transform = '';
      }, 160);
    }
  };

  const getXY = (id) => {
    let i = 1;
    let x = '';
    let y = '';
    while (id[i] != 'y'){
      x += id[i];
      i++;
    }
    i++;
    while (id[i]){
      y += id[i];
      i++;
    }
    return {x:x , y:y};
  };
  
  const transformCoords = (x, y, dir) => {
    switch (dir) {
      case 0: return { x, y };
      case 1: return { x: x, y: 3 - y };
      case 2: return { x: y, y: x };
      case 3: return { x: 3 - y, y: x };
      default: return { x, y };
    }
  };

  const animate = (newGrid , dir) => {
    if (!disableAnim){
      let copy = JSON.parse(JSON.stringify(grid));
      let newCopy = JSON.parse(JSON.stringify(newGrid));
      if (dir === 0) {
        for (let x = 0; x < 4; x++) {
          animateRow(newCopy[x] , copy[x] , dir , x);
        }
      } else if (dir === 1) {
        for (let x = 0; x < 4; x++) {
          animateRow(newCopy[x].slice().reverse() , copy[x].slice().reverse() , dir , x);
        }
      } else if (dir === 2) {
        for (let y = 0; y < 4; y++) {
          let newcol = [newCopy[0][y], newCopy[1][y], newCopy[2][y], newCopy[3][y]];
          let oldcol = [copy[0][y], copy[1][y], copy[2][y], copy[3][y]];
          animateRow(newcol , oldcol , dir , y);
        }
      } else if (dir === 3) { // down
        for (let y = 0; y < 4; y++) {
          let newcol = [newCopy[0][y], newCopy[1][y], newCopy[2][y], newCopy[3][y]].reverse();
          let oldcol = [copy[0][y], copy[1][y], copy[2][y], copy[3][y]].reverse();
          animateRow(newcol , oldcol , dir , y);
        }
      }
      const gridWithNew = generateNew(newGrid);
      setTimeout(() => {
        setGrid(gridWithNew);
      }, 150);
    }
    else{
      const gridWithNew = generateNew(newGrid);
      setGrid(gridWithNew);
    }
  };

  const animateRow = (newRow , oldRow , dir , x) => {
    let workRow = [oldRow[0] , 0 , 0 , 0];
    let y2;
    for (let y = 1 ; y < 4 ; y++){
      y2 = 0;
      while (workRow[y2] + oldRow[y] > newRow[y2] || newRow[y2] === 0){
        y2++;
      }
      workRow[y2] += oldRow[y];
      if (y2 != y && oldRow[y] != 0){
        const from = transformCoords(x , y ,dir);
        const to = transformCoords(x , y2 , dir);
        const id = `x${from.x}y${from.y}`;
        if (oldRow[y] != newRow[y2]){
          animFlags.current.push(`x${to.x}y${to.y}`);
        }
        moveTo(id, to.x, to.y);
      }
    }
  };

  const popIn = () => {
    animFlags.current.forEach(id => {
      const tile = document.getElementById(id);
      if (tile) {
        tile.classList.add('tilepop');
      } else {
        console.error("Element not found for id: " + id);
      }
    });
    setTimeout(() => {
      animFlags.current.forEach(id => {
        const tile = document.getElementById(id);
        if (tile) {
          tile.classList.remove('tilepop'); // koniec animacji
        }
      });
      animFlags.current = [];
    }, 160);
  };

  useEffect(() => {
    if (!disableAnim) {
      popIn();
    }
  }, [grid]);

  const slideAndMerge = (row) => {
    let newRow = row.filter(val => val !== 0);
    for (let i = 0; i < newRow.length - 1; i++) {
      if (newRow[i] === newRow[i + 1]) {
        newRow[i] *= 2;
        setScore(score + newRow[i]);
        newRow.splice(i + 1, 1);
      }
    }
    newRow.filter(val => val !== 0);
    if (doubleMerge){
      for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1]) {
          newRow[i] *= 2;
          setScore(score + newRow[i]);
          newRow.splice(i + 1, 1);
        }
      }
    }
    
    while (newRow.length < 4) newRow.push(0);
    return newRow;
  };

  const move = (dir) => {
    const newGrid = JSON.parse(JSON.stringify(grid));

    if (dir === 0) { // left
      for (let x = 0; x < 4; x++) {
        newGrid[x] = slideAndMerge(newGrid[x]);
      }
    } else if (dir === 1) { // right
      for (let x = 0; x < 4; x++) {
        newGrid[x] = slideAndMerge(newGrid[x].slice().reverse()).reverse();
      }
    } else if (dir === 2) { // up
      for (let y = 0; y < 4; y++) {
        let col = [newGrid[0][y], newGrid[1][y], newGrid[2][y], newGrid[3][y]];
        col = slideAndMerge(col);
        for (let x = 0; x < 4; x++) newGrid[x][y] = col[x];
      }
    } else if (dir === 3) { // down
      for (let y = 0; y < 4; y++) {
        let col = [newGrid[0][y], newGrid[1][y], newGrid[2][y], newGrid[3][y]].reverse();
        col = slideAndMerge(col).reverse();
        for (let x = 0; x < 4; x++) newGrid[x][y] = col[x];
      }
    }
    animate(newGrid , dir);
  };

  const settings = () => {
    if (vis === "hidden"){
      setVis("visible");
    }
    else setVis("hidden");
  };

  const handleMergeChange = (event) => {
    setDoubleMerge(event.target.checked);
  };

  const handleDisableAnim = (event) => {
    setDisableAnim(event.target.checked);
  };


  const getPossibleMoves = (grid) => {
    const canMoveRow = (row) => {
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === 0 && row[i + 1] !== 0) return true;
        if (row[i] !== 0 && row[i] === row[i + 1]) return true;
      }
      return false;
    };

    const canMoveLeft = () => {
      return grid.some(row => canMoveRow(row));
    };

    const canMoveRight = () => {
      return grid.some(row => canMoveRow([...row].reverse()));
    };

    const canMoveUp = () => {
      for (let y = 0; y < 4; y++) {
        let col = [grid[0][y], grid[1][y], grid[2][y], grid[3][y]];
        if (canMoveRow(col)) return true;
      }
      return false;
    };

    const canMoveDown = () => {
      for (let y = 0; y < 4; y++) {
        let col = [grid[0][y], grid[1][y], grid[2][y], grid[3][y]].reverse();
        if (canMoveRow(col)) return true;
      }
      return false;
    };

    return {
      left: canMoveLeft(),
      right: canMoveRight(),
      up: canMoveUp(),
      down: canMoveDown(),
    };
  };

  const checkGameOver = (grid) => {
    const moves = getPossibleMoves(grid);
    return !(moves.left || moves.right || moves.up || moves.down);
  };

  const checkGameWin = (grid) => {
    for (let row of grid) {
      if (row.includes(2048)) {
        return true;
      }
    }
    return false;
  };
  
  return (
    <div className="main">
      <div className="gameOverBg" style={{ visibility: gameOver ? "visible" : "hidden" }}>
        <div className="gameOver">
          <h1 className="gameOverText">Game Over!</h1>
          <div className="gameOverButtonContainer">
            <button onClick={newGame}>Restart</button>
          </div>
        </div>
      </div>
      <div className="gameOverBg" style={{ visibility: gameWin ? "visible" : "hidden" }}>
        <div className="gameOver">
          <h1 className="gameOverText">Win!</h1>
          <div className="gameOverButtonContainer">
            <button onClick={newGame}>Restart</button>
          </div>
        </div>
      </div>
      <div className={`settings ${vis === "visible" ? "visible" : ""}`}>
        <h1 className="settingsHeader">Settings</h1>
        <div className="settingsOption">
          <label className="switch">
            <input type="checkbox" checked={doubleMerge} onChange={handleMergeChange}></input>
            <span className="slider round"></span>
          </label>
          <span className="optionName"> Double Merging </span>
        </div>
        <div className="settingsOption">
          <label className="switch">
            <input type="checkbox" checked={disableAnim} onChange={handleDisableAnim}></input>
            <span className="slider round"></span>
          </label>
          <span className="optionName"> Disable Animations </span>
        </div>
      </div>
      <img src={reactLogo} className="settingsbutton" onClick={settings}></img>
      <div className="center">
        <div className="scoreBoard">Score: {score}</div>
        <button onClick={newGame}>Restart</button>
        <table>
          <tbody>
            {grid.map((row, x) => (
              <tr key={x}>
                {row.map((cell, y) => (
                  <td key={y}>
                    <div className="overcell">
                      <div className={`cell ${cell ? 'tile tile' + cell : ''}`} id={'x' + x + 'y' + y}>
                        {cell !== 0 ? cell : ''}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;