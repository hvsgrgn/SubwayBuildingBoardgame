//ebben a fajlban az aktualis jatekallapot leirasa, eltarolasa es modositasa zajlik



const gameState = {
    playerName: '',
    currentScreen: 'menu',
    currentRound: 0,
    totalRounds: 4,
    timer: 0,
    timerInterval: null,

    stations: [],
    metroLines: [],

    currentMetroLine: null,
    builtSegments: [],
    currentCard: null,
    middleStationsPlaced: 0,
    sideStationsPlaced: 0,

    trainStationsVisited: 0,
    completedLines: [],

    routeBuilding : {
    isActive: false,
    startStation: null,
    endStation: null,
    currentSegment: [],
    validDestinations: [],

    timer: 0,
    }
}


const cardTypes = {
    STATION_A: 'A',
    STATION_B: 'B', 
    STATION_C: 'C',
    STATION_D: 'D',
    JOKER: '?'
};

const peronTypes = {
    MIDDLE: 'middle',
    SIDE: 'side'
};

// Card deck - 10 cards total
const baseDeck = [
    { type: cardTypes.STATION_A, peron: peronTypes.SIDE },
    { type: cardTypes.STATION_B, peron: peronTypes.SIDE },
    { type: cardTypes.STATION_C, peron: peronTypes.SIDE },
    { type: cardTypes.STATION_D, peron: peronTypes.SIDE },
    { type: cardTypes.JOKER, peron: peronTypes.SIDE },
    { type: cardTypes.STATION_A, peron: peronTypes.MIDDLE },
    { type: cardTypes.STATION_B, peron: peronTypes.MIDDLE },
    { type: cardTypes.STATION_C, peron: peronTypes.MIDDLE },
    { type: cardTypes.STATION_D, peron: peronTypes.MIDDLE },
    { type: cardTypes.JOKER, peron: peronTypes.MIDDLE }
];


// Load JSON data asynchronously
function loadJSON(filePath, callback) {
    const request = new XMLHttpRequest();
    request.open('GET', filePath, true); // true makes it asynchronous
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {
            callback(JSON.parse(request.responseText));
        } else if (request.readyState === 4) {
            console.error('Failed to load JSON:', filePath, request.status, request.statusText);
            callback([]);
        }
    };
    request.send(null);
}

// Initialize game data from JSON files
export function initializeGameData(callback) {
    let stationsLoaded = false;
    let linesLoaded = false;
    let stationsData = [];
    let linesData = [];

    function checkAllLoaded() {
        if (stationsLoaded && linesLoaded) {
            gameState.stations = stationsData;
            gameState.metroLines = linesData;
            
            console.log('Game data initialized:');
            console.log('- Stations:', gameState.stations.length);
            console.log('- Metro lines:', gameState.metroLines.length);
            
            if (callback) {
                callback({
                    stations: gameState.stations,
                    metroLines: gameState.metroLines
                });
            }
        }
    }

    loadJSON('./stations.json', function(data) {
        stationsData = data;
        stationsLoaded = true;
        checkAllLoaded();
    });

    loadJSON('./lines.json', function(data) {
        linesData = data;
        linesLoaded = true;
        checkAllLoaded();
    });
}

// Get all stations
export function getStations() {
    return gameState.stations;
}

// Get all metro lines
export function getMetroLines() {
    return gameState.metroLines;
}

// Get a specific station by ID
export function getStationById(id) {
    return gameState.stations.find(station => station.id === id);
}

// Get a specific metro line by ID
export function getMetroLineById(id) {
    return gameState.metroLines.find(line => line.id === id);
}

// Get starting station for a metro line
export function getStartingStation(lineId) {
    const line = getMetroLineById(lineId);
    if (!line) return null;
    return getStationById(line.start);
}

export function getPlayerName() {
    return gameState.playerName;
}

export function getCurrentScreen() {
    return gameState.currentScreen;
}

export function getCardDeck(){
    return cardDeck;
}

export function getMiddleStationsPlaced(){
    return middleStationsPlaced;
}

export function getSideStationsPlaced(){
    return sideStationsPlaced;
}

export function setPlayerName(name) {
    gameState.playerName = name;
}

export function setCurrentScreen(screen) {
    gameState.currentScreen = screen;
}

// Add to state.js - Round management functions

// Get a random metro line for the current round
export function startNewRound() {
    console.log('=== STARTING NEW ROUND ===');
    
    // Safety check - ensure we have metro lines data
    if (!gameState.metroLines || gameState.metroLines.length === 0) {
        console.error('No metro lines data available');
        return null;
    }
    
    // Initialize completedLines array if it doesn't exist
    if (!gameState.completedLines) {
        gameState.completedLines = [];
    }
    
    // If we've completed all 4 rounds, reset for a new game
    if (gameState.currentRound >= gameState.totalRounds) {
        console.log('All 4 rounds completed, starting new game');
        gameState.currentRound = 0;
        gameState.completedLines = [];
    }
    
    // Get available metro lines (ones we haven't used yet in this game)
    const availableLines = gameState.metroLines.filter(line => 
        !gameState.completedLines.includes(line.id)
    );
    
    console.log(`Available lines: ${availableLines.length}`);
    console.log(`Completed lines:`, gameState.completedLines);
    console.log(`All lines:`, gameState.metroLines.map(l => l.name));
    
    if (availableLines.length === 0) {
        // This should not happen if we're managing rounds properly
        console.error('No available lines found, resetting');
        gameState.completedLines = [];
        gameState.currentMetroLine = gameState.metroLines[0];
    } else {
        // Pick a random available line
        const randomIndex = Math.floor(Math.random() * availableLines.length);
        gameState.currentMetroLine = availableLines[randomIndex];
        
        // Mark this line as completed for this game
        gameState.completedLines.push(gameState.currentMetroLine.id);
        console.log(`Selected line: ${gameState.currentMetroLine.name}, added to completed lines`);
    }
    
    gameState.currentRound++;
    
    // RESET COUNTERS FOR NEW ROUND (but keep built segments)
    gameState.middleStationsPlaced = 0;
    gameState.sideStationsPlaced = 0;
    gameState.currentCard = null;
    
    // Reinitialize deck for the new round
    initializeDeck();
    
    console.log(`=== Started round ${gameState.currentRound}/4 with line: ${gameState.currentMetroLine.name} ===`);
    console.log(`Completed lines so far:`, gameState.completedLines);
    console.log(`Remaining lines:`, gameState.metroLines.filter(line => 
        !gameState.completedLines.includes(line.id)
    ).map(l => l.name));
    
    return gameState.currentMetroLine;
}

export function shouldEndRound() {
    const shouldEnd = gameState.middleStationsPlaced >= 5 || gameState.sideStationsPlaced >= 5;
    
    if (shouldEnd) {
        console.log(`=== ROUND END TRIGGERED ===`);
        console.log(`Middle stations: ${gameState.middleStationsPlaced}/5`);
        console.log(`Side stations: ${gameState.sideStationsPlaced}/5`);
    }
    
    return shouldEnd;
}

// Get current metro line
export function getCurrentMetroLine() {
    return gameState.currentMetroLine;
}

// Get current round number
export function getCurrentRound() {
    return gameState.currentRound;
}

// Mark current line as completed
export function completeCurrentLine() {
    if (!gameState.completedLines) {
        gameState.completedLines = [];
    }
    gameState.completedLines.push(gameState.currentMetroLine.id);
}

export function initializeDeck() {
    gameState.cardDeck = [...baseDeck];
    gameState.discardPile = [];
    shuffleDeck(gameState.cardDeck);
    gameState.currentCard = null;
    
    console.log('Deck initialized with', gameState.cardDeck.length, 'cards');
}

// Shuffle deck using Fisher-Yates algorithm
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Draw a card from the deck
export function drawCard() {
    if (gameState.cardDeck.length === 0) {
        // Reshuffle discard pile if deck is empty
        gameState.cardDeck = [...gameState.discardPile];
        gameState.discardPile = [];
        shuffleDeck(gameState.cardDeck);
        console.log('Reshuffled discard pile into deck');
    }
    
    if (gameState.cardDeck.length === 0) {
        console.error('No cards available to draw');
        return null;
    }
    
    // Draw the top card
    gameState.currentCard = gameState.cardDeck.pop();
    gameState.discardPile.push(gameState.currentCard);
    
    // ALWAYS count the card when drawn, regardless of how it's used
    if (gameState.currentCard.peron === peronTypes.MIDDLE) {
        gameState.middleStationsPlaced++;
    } else {
        gameState.sideStationsPlaced++;
    }
    
    console.log('Drew card:', gameState.currentCard);
    console.log(`Card counts - middle: ${gameState.middleStationsPlaced}/5, side: ${gameState.sideStationsPlaced}/5`);
    
    return gameState.currentCard;
}

// Get current card
export function getCurrentCard() {
    return gameState.currentCard;
}

// Get card counts for UI
export function getCardCounts() {
    return {
        middle: gameState.middleStationsPlaced,
        side: gameState.sideStationsPlaced,
        totalMiddle: 5,
        totalSide: 5
    };
}

export function getBuiltSegments() {
    return gameState.builtSegments || [];
}

export function getRouteBuildingState() {
    if (!gameState.routeBuilding) {
        gameState.routeBuilding = {
            isActive: false,
            startStation: null,
            endStation: null,
            currentSegment: [],
            validDestinations: []
        };
    }
    return gameState.routeBuilding;
}

export function setRouteBuildingState(newState) {
    gameState.routeBuilding = newState;
}

export function addBuiltSegment(segment) {
    if (!gameState.builtSegments) {
        gameState.builtSegments = [];
    }
    gameState.builtSegments.push(segment);
}

export function getCurrentMetroLineId() {
    return gameState.currentMetroLine ? gameState.currentMetroLine.id : null;
}

export function getCurrentMetroLineColor() {
    return gameState.currentMetroLine ? gameState.currentMetroLine.color : null;
}

export function cancelRouteBuilding() {
    if (gameState.routeBuilding) {
        gameState.routeBuilding.isActive = false;
    }
}

export function areAllLinesCompleted() {
    if (!gameState.completedLines || !gameState.metroLines) {
        return false;
    }
    return gameState.completedLines.length >= gameState.metroLines.length;
}

export function getRemainingLines() {
    if (!gameState.completedLines || !gameState.metroLines) {
        return gameState.metroLines || [];
    }
    return gameState.metroLines.filter(line => 
        !gameState.completedLines.includes(line.id)
    );
}

export function resetValuesForNextGame() {
    console.log('Starting completely new game...');

    // Reset game state completely
    gameState.currentRound = 0;
    gameState.completedLines = [];
    gameState.builtSegments = [];
}

let timerInterval = null;

export function startTimer() {
    // Reset timer to 0
    gameState.timer = 0;
    
    // Clear any existing interval
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Start new interval
    timerInterval = setInterval(() => {
        gameState.timer++;
        updateTimerDisplay();
    }, 1000); // Update every second
    
    console.log('Timer started');
}

export function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log('Timer stopped at:', gameState.timer, 'seconds');
    }
}

export function resetTimer() {
    stopTimer();
    gameState.timer = 0;
    updateTimerDisplay();
}

export function getTimer() {
    return gameState.timer;
}

export function getFormattedTime() {
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const timerElement = document.querySelector('#timer');
    if (timerElement) {
        timerElement.textContent = `Idő: ${getFormattedTime()}`;
    }
}

export function cleanupTimer() {
    stopTimer();
}

