// Game board module using IIFE (module pattern)
const Gameboard = (function() {
    // Private board array
    let board = Array(9).fill(null);
    
    // Public methods
    const getBoard = () => [...board]; // Return a copy to prevent direct manipulation
    
    const makeMove = (index, marker) => {
        if (index < 0 || index > 8 || board[index] !== null) {
            return false; // Invalid move
        }
        board[index] = marker;
        return true;
    };
    
    const resetBoard = () => {
        board = Array(9).fill(null);
    };
    
    // Check for a win
    const checkWin = () => {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return {
                    winner: board[a],
                    winningCells: pattern
                };
            }
        }
        return null;
    };
    
    // Check for a tie
    const checkTie = () => {
        return board.every(cell => cell !== null) && !checkWin();
    };
    
    return { getBoard, makeMove, resetBoard, checkWin, checkTie };
})();

// Player factory function
const Player = (name, marker) => {
    const getName = () => name;
    const getMarker = () => marker;
    
    return { getName, getMarker };
};

// Game controller module
const GameController = (function() {
    let players = [];
    let currentPlayerIndex = 0;
    let gameActive = false;
    
    const getCurrentPlayer = () => players[currentPlayerIndex];
    
    const switchTurn = () => {
        currentPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
    };
    
    const initGame = (player1Name, player2Name) => {
        players = [
            Player(player1Name || "Player 1", "X"),
            Player(player2Name || "Player 2", "O")
        ];
        currentPlayerIndex = 0;
        Gameboard.resetBoard();
        gameActive = true;
        
        return { players, currentPlayer: getCurrentPlayer() };
    };
    
    const playTurn = (index) => {
        if (!gameActive) return { validMove: false };
        
        const currentPlayer = getCurrentPlayer();
        const validMove = Gameboard.makeMove(index, currentPlayer.getMarker());
        
        if (!validMove) return { validMove: false };
        
        const winResult = Gameboard.checkWin();
        const isTie = Gameboard.checkTie();
        
        if (winResult) {
            gameActive = false;
            return { 
                validMove: true, 
                gameOver: true, 
                winner: currentPlayer, 
                winningCells: winResult.winningCells 
            };
        }
        
        if (isTie) {
            gameActive = false;
            return { validMove: true, gameOver: true, tie: true };
        }
        
        switchTurn();
        return { 
            validMove: true, 
            gameOver: false, 
            currentPlayer: getCurrentPlayer() 
        };
    };
    
    const isGameActive = () => gameActive;
    
    const resetGame = () => {
        if (players.length) {
            Gameboard.resetBoard();
            currentPlayerIndex = 0;
            gameActive = true;
            return { currentPlayer: getCurrentPlayer() };
        }
        return null;
    };
    
    return { initGame, playTurn, isGameActive, resetGame, getCurrentPlayer };
})();

// Display controller module
const DisplayController = (function() {
    const playerSetupDiv = document.getElementById('player-setup');
    const gameContainerDiv = document.getElementById('game-container');
    const boardDiv = document.getElementById('board');
    const statusDiv = document.getElementById('status');
    const cells = document.querySelectorAll('.cell');
    const startBtn = document.getElementById('start-game');
    const restartBtn = document.getElementById('restart');
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    
    // Initially hide the game board
    gameContainerDiv.style.display = 'none';
    
    const updateBoard = () => {
        const board = Gameboard.getBoard();
        cells.forEach((cell, index) => {
            cell.textContent = board[index] || '';
            cell.className = 'cell'; // Reset cell classes
            if (board[index]) {
                cell.classList.add(board[index].toLowerCase());
            }
        });
    };
    
    const setStatus = (message) => {
        statusDiv.textContent = message;
    };
    
    const highlightWinningCells = (winningCells) => {
        winningCells.forEach(index => {
            cells[index].classList.add('winning-cell');
        });
    };
    
    const bindEvents = () => {
        // Start game button
        startBtn.addEventListener('click', () => {
            const player1Name = player1Input.value.trim();
            const player2Name = player2Input.value.trim();
            
            const gameData = GameController.initGame(player1Name, player2Name);
            
            playerSetupDiv.style.display = 'none';
            gameContainerDiv.style.display = 'block';
            
            setStatus(`${gameData.currentPlayer.getName()}'s turn (${gameData.currentPlayer.getMarker()})`);
            updateBoard();
        });
        
        // Cell click events
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                if (!GameController.isGameActive()) return;
                
                const index = parseInt(cell.getAttribute('data-index'));
                const result = GameController.playTurn(index);
                
                if (result.validMove) {
                    updateBoard();
                    
                    if (result.gameOver) {
                        if (result.tie) {
                            setStatus("It's a tie!");
                        } else {
                            setStatus(`${result.winner.getName()} (${result.winner.getMarker()}) wins!`);
                            highlightWinningCells(result.winningCells);
                        }
                    } else {
                        setStatus(`${result.currentPlayer.getName()}'s turn (${result.currentPlayer.getMarker()})`);
                    }
                }
            });
        });
        
        // Restart button
        restartBtn.addEventListener('click', () => {
            const gameData = GameController.resetGame();
            if (gameData) {
                cells.forEach(cell => {
                    cell.className = 'cell'; // Reset all cell classes
                });
                setStatus(`${gameData.currentPlayer.getName()}'s turn (${gameData.currentPlayer.getMarker()})`);
                updateBoard();
            } else {
                // If no players are set up, go back to player setup screen
                playerSetupDiv.style.display = 'block';
                gameContainerDiv.style.display = 'none';
            }
        });
    };
    
    const init = () => {
        bindEvents();
    };
    
    return { init };
})();

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    DisplayController.init();
});