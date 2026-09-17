// Game state
let gameState = {
    playerName: '',
    difficulty: '',
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    startTime: null,
    timerInterval: null,
    canFlip: true
};

// simboliai kortelems
const symbols = {
    easy: ['🍎', '🍊', '🍋', '🍌', '🍇', '🍓'],
    hard: ['🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🍑', '🍒', '🥝', '🥑']
};

// Nielsen principai:
// 1. Visibility of system status (laikas, ėjimai, poros)
// 2. Error prevention (kortelės neaktyvios kol neužsidaro poros)
// 3. User control and freedom (galima baigti žaidimą bet kada)
// 4. Recognition rather than recall (aiški informacija ekrane)

// kas buna kai site'as uzkraunamas
document.addEventListener('DOMContentLoaded', function() {
    displayLeaderboard();
    // Enter -> start game (easy mode)
    document.getElementById('playerName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const name = this.value.trim();
            if (name) {
                startGame('easy');
            }
        }
    });
});

// Start game
function startGame(difficulty) {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        alert('Prašome įvesti savo vardą!');
        playerNameInput.focus();
        return;
    }
    
    // nunuliuoti game state
    gameState.playerName = playerName;
    gameState.difficulty = difficulty;
    gameState.moves = 0;
    gameState.matchedPairs = 0;
    gameState.flippedCards = [];
    gameState.canFlip = true;
    
    // korteliu sukūrimas
    const symbolSet = difficulty === 'easy' ? symbols.easy : symbols.hard;
    gameState.cards = createCards(symbolSet);
    
    // Atvaizduoti žaidimą
    showScreen('gameScreen');
    renderGame();
    startTimer();
}

// Sukurti kortelių masyvą
function createCards(symbolSet) {
    const cards = [];
    
    // Sukuriame pora su tuo paciu simboliu
    symbolSet.forEach((symbol, index) => {
        cards.push({
            id: index * 2,
            symbol: symbol,
            matched: false
        });
        cards.push({
            id: index * 2 + 1,
            symbol: symbol,
            matched: false
        });
    });
    
    // Sumaisyti korteles random naudojant Fisher-Yates algoritma
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    return cards;
}

// atvaizduoja info ir korteles
function renderGame() {
    // Atnaujinti informaciją
    document.getElementById('currentPlayer').textContent = gameState.playerName;
    document.getElementById('currentDifficulty').textContent = 
        gameState.difficulty === 'easy' ? 'Lengvas' : 'Sunkus';
    document.getElementById('moves').textContent = gameState.moves;
    
    const totalPairs = gameState.cards.length / 2;
    document.getElementById('pairs').textContent = `${gameState.matchedPairs}/${totalPairs}`;
    
    // Sukurti lentą (grid'a) (isvalo lenta pries tai)
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    gameBoard.className = `game-board ${gameState.difficulty}`;
    
    gameState.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = index;
        
        if (card.matched) {
            cardElement.classList.add('matched');
        }
        
        cardElement.innerHTML = `
            <div class="card-front">?</div>
            <div class="card-back">${card.symbol}</div>
        `;
        
        cardElement.addEventListener('click', () => flipCard(index));
        gameBoard.appendChild(cardElement);
    });
}

// Apversti kortelę
function flipCard(index) {
    if (!gameState.canFlip) return;
    
    const card = gameState.cards[index];
    if (card.matched) return;
    
    const cardElement = document.querySelector(`[data-index="${index}"]`);
    if (cardElement.classList.contains('flipped')) return;
    
    // Apversti kortelę
    cardElement.classList.add('flipped');
    gameState.flippedCards.push({ index, symbol: card.symbol });
    
    // Tikrinti, ar apverstos dvi kortelės
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        document.getElementById('moves').textContent = gameState.moves;
        gameState.canFlip = false;
        
        setTimeout(checkMatch, 800);
    }
}

// Tikrinam ar pora sutampa
function checkMatch() {
    const [card1, card2] = gameState.flippedCards;
    
    if (card1.symbol === card2.symbol) {
        // Sutampa tai tada pazymeti kaip rasta pora
        gameState.cards[card1.index].matched = true;
        gameState.cards[card2.index].matched = true;
        gameState.matchedPairs++;
        
        const card1Element = document.querySelector(`[data-index="${card1.index}"]`);
        const card2Element = document.querySelector(`[data-index="${card2.index}"]`);
        
        card1Element.classList.add('matched');
        card2Element.classList.add('matched');
        
        document.getElementById('pairs').textContent = `${gameState.matchedPairs}/${gameState.cards.length / 2}`;
        
        // Tikrinti ar rasto visos poros, jei rastos tai end game
        if (gameState.matchedPairs === gameState.cards.length / 2) {
            setTimeout(endGame, 500);
        }
    } else {
        // Jei nesutampa tada apversti atgal
        const card1Element = document.querySelector(`[data-index="${card1.index}"]`);
        const card2Element = document.querySelector(`[data-index="${card2.index}"]`);
        
        card1Element.classList.remove('flipped');
        card2Element.classList.remove('flipped');
    }
    
    gameState.flippedCards = [];
    gameState.canFlip = true;
}

// Laikmatis
function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    // Laikas sekundemis
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    
    // Konvertuojama i MM:SS formata
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// End game
function endGame() {
    stopTimer();
    
    //Bendras laikas
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    const timeStr = `${minutes}:${seconds}`;
    
    // Apskaiciuoti ivertinima
    const totalCards = gameState.cards.length;
    const perfectMoves = totalCards / 2;
    const rating = calculateRating(gameState.moves, perfectMoves);
    
    // Atvaizduoti rezultatus
    document.getElementById('finalMoves').textContent = gameState.moves;
    document.getElementById('finalTime').textContent = timeStr;
    document.getElementById('rating').textContent = rating;
    
    // Save rezultata
    saveScore(gameState.playerName, gameState.difficulty, gameState.moves, elapsed, rating);
    
    showScreen('winScreen');
}

// Ivertinimo skaiciavimas
function calculateRating(moves, perfectMoves) {
    const ratio = moves / perfectMoves;
    
    if (ratio <= 1.2) return '⭐⭐⭐⭐⭐ Puiku!';
    if (ratio <= 1.5) return '⭐⭐⭐⭐ Labai gerai!';
    if (ratio <= 2.0) return '⭐⭐⭐ Gerai!';
    if (ratio <= 2.5) return '⭐⭐ Neblogai!';
    return '⭐ Bandykite dar kartą!';
}

// Issaugoti rezultata i sessionStorage
function saveScore(name, difficulty, moves, time, rating) {
    const scores = JSON.parse(sessionStorage.getItem('memoryGameScores') || '[]');
    
    // Pridedamas naujas rezultatas
    scores.push({
        name: name,
        difficulty: difficulty,
        moves: moves,
        time: time,
        rating: rating,
        timestamp: Date.now()
    });
    
    // Rūšiuoti: pirma pagal sudėtingumą, tada ėjimus, tada laiką
    scores.sort((a, b) => {
        if (a.difficulty !== b.difficulty) {
            return a.difficulty === 'easy' ? -1 : 1;
        }
        if (a.moves !== b.moves) {
            return a.moves - b.moves;
        }
        return a.time - b.time;
    });
    
    // Issaugoti tik top 5
    sessionStorage.setItem('memoryGameScores', JSON.stringify(scores.slice(0, 5)));
}

// vaizduoti leaderboard
function displayLeaderboard() {
    const scores = JSON.parse(sessionStorage.getItem('memoryGameScores') || '[]');
    const leaderboardContent = document.getElementById('leaderboardContent');
    
    // Jei nieko nera tai 0
    if (scores.length === 0) {
        leaderboardContent.innerHTML = '<p class="no-results">Dar nėra rezultatų</p>';
        return;
    }
    
    let html = '';
    scores.slice(0, 5).forEach((score, index) => {
        const minutes = Math.floor(score.time / 60).toString().padStart(2, '0');
        const seconds = (score.time % 60).toString().padStart(2, '0');
        const timeStr = `${minutes}:${seconds}`;
        
        const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const difficultyText = score.difficulty === 'easy' ? 'Lengvas' : 'Sunkus';
        
        html += `
            <div class="leaderboard-item ${medalClass}">
                <div>
                    <strong>${index + 1}. ${score.name}</strong>
                    <span style="margin-left: 8px; color: #999;">[${difficultyText}]</span>
                </div>
                <div>Ėjimų skaičius: ${score.moves} | Laikas: ${timeStr}</div>
            </div>
        `;
    });
    
    leaderboardContent.innerHTML = html;
}

// End game
function quitGame() {
    if (confirm('Ar tikrai norite baigti žaidimą?')) {
        stopTimer();
        showStartScreen();
    }
}

// Restart
function restartGame() {
    startGame(gameState.difficulty);
}

// Grįžti į pradžią
function showStartScreen() {
    stopTimer();
    displayLeaderboard();
    showScreen('startScreen');
}

// Ekranų valdymas
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}