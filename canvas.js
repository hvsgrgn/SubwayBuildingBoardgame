// canvas.js - Using actual SVG images
import { initializeElements, updatePlayerInfo } from './screens.js';
import {
    getPlayerName,
    setPlayerName,
    initializeGameData,
    getStations,
    getMetroLines,
    startNewRound,
    getCurrentMetroLine,
    getCurrentRound,
    initializeDeck,
    getCurrentCard,
    getCardCounts,
    getBuiltSegments,
    getStationById,
    startTimer
} from './state.js';
import { handleSkipTurn, handleBuildRoute } from './events.js';
// Canvas configuration
export const canvasConfig = {
    gridSize: 10,
    cellSize: 0,
    padding: 20,
    stationImageSize: 60
};

let canvas;
let ctx;

// Image cache
const images = {
    gridCell: null,
    stationA: null,
    stationB: null,
    stationC: null,
    stationD: null,
    stationDeak: null,
    trainAStation: null,
    trainCStation: null,
    trainDStation: null,

    //cards
    cardJoker: null,
    cardA: null,
    cardB: null,
    cardC: null,
    cardD: null,
    
    // Peron symbols
    middlePeron: null,
    sidePeron: null
};

let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

// Initialize game
function initGame() {
    console.log('Game screen loading...');
    
    // Initialize DOM elements
    console.log("Before initializeElements:", document.querySelector('#game-canvas'));
    const elements = initializeElements();
    console.log('DOM elements initialized:', elements);
    console.log("After initializeElements:", document.querySelector('#game-canvas'));

    setupGameControls();

    // Load player name from localStorage
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        setPlayerName(savedName);
    }

    // Update player info if name exists
    if (getPlayerName()) {
        updatePlayerInfo();
    }
    
    // Make sure timer is running
    startTimer();
    
    // Initialize canvas first (we need it for drawing)
    initializeCanvas();
    
    testSegmentDrawing();

    initializeGameData(function(gameData) {
        console.log('JSON data loaded callback executed');
    
        // Start the first round
        startNewRound();
    
        // Initialize card deck
        initializeDeck();
        updateCardCounts();
    
        // Update UI with round and line info
        updateGameInfo();

        // Show initial card display (no card drawn yet)
        updateCardDisplay();
        console.log('Initial card display should show "Húzz egy kártyát!"');
    
        // Load images and draw the map
        loadImages();
    
        console.log('Game initialized - Round started');
    });
}

// Initialize canvas
function initializeCanvas() {
    canvas = document.querySelector('#game-canvas');
    const container = canvas.parentElement;
    
    // Force square based on container height
    const size = container.clientHeight;
    canvas.width = size;
    canvas.height = size;
    
    ctx = canvas.getContext('2d');
    
    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);
    
    const availableWidth = canvas.width - (canvasConfig.padding * 2);
    const availableHeight = canvas.height - (canvasConfig.padding * 2);
    canvasConfig.cellSize = Math.min(availableWidth / canvasConfig.gridSize, availableHeight / canvasConfig.gridSize);
}

// Load all SVG images
function loadImages() {
    const imageFiles = {
        gridCell: 'basic',
        stationA: 'BlackAStation',
        stationB: 'BlackBStation',
        stationC: 'BlackCStation',
        stationD: 'BlackDStation',
        stationDeak: 'DeakStation',
        trainAStation: 'TrainAStation',
        trainCStation: 'TrainCStation',
        trainDStation: 'TrainDStation',

        cardA: 'CardA',
        cardB: 'CardB',
        cardC: 'CardC',
        cardD: 'CardD',
        cardJoker: 'CardJoker',

        middlePeron: 'MiddlePeron',
        sidePeron: 'SidePeron'
    };

    Object.keys(imageFiles).forEach(key => {
        images[key] = new Image();
        images[key].src = `./images/${imageFiles[key]}.svg`;
        images[key].onload = () => {
            imagesLoaded++;
            console.log(`Loaded: ${imageFiles[key]}.svg (${imagesLoaded}/${totalImages})`);
            
            // When all images are loaded, draw the grid
            if (imagesLoaded === totalImages) {
                console.log('All images loaded, drawing grid...');
                const stations = getStations();
                const metroLines = getMetroLines();
                drawInitialGrid(stations, metroLines);
            }
        };
        images[key].onerror = () => {
            console.error(`Failed to load: ./images/${imageFiles[key]}.svg`);
            imagesLoaded++;
            // Continue even if some images fail to load
            if (imagesLoaded === totalImages) {
                const stations = getStations();
                const metroLines = getMetroLines();
                drawInitialGrid(stations, metroLines);
            }
        };
    });
}

export function drawInitialGrid(stations, metroLines) {
    if (!canvas || !ctx) {
        console.error('Canvas not available');
        return;
    }
    
    // Clear canvas
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid background with basic.svg
    drawGridBackground();
    
    // Draw Danube river
    drawDanube();
    
    // Draw all metro segments
    drawMetroSegments();
    
    // Draw all stations
    drawAllStations(stations, metroLines);
    
    // REMOVE THIS LINE: drawRouteBuildingFeedback();
    
    console.log('Grid drawn with', stations.length, 'stations and', getBuiltSegments().length, 'segments');
}

// Draw grid background using basic.svg
function drawGridBackground() {
    for (let x = 0; x < canvasConfig.gridSize; x++) {
        for (let y = 0; y < canvasConfig.gridSize; y++) {
            const pos = gridToPixel(x, y);
            
            if (images.gridCell && images.gridCell.complete) {
                ctx.drawImage(
                    images.gridCell,
                    pos.x,
                    pos.y,
                    canvasConfig.cellSize,
                    canvasConfig.cellSize
                );
            } else {
                // Fallback: white square
                ctx.fillStyle = 'white';
                ctx.fillRect(pos.x, pos.y, canvasConfig.cellSize, canvasConfig.cellSize);
                ctx.strokeStyle = '#bdc3c7';
                ctx.strokeRect(pos.x, pos.y, canvasConfig.cellSize, canvasConfig.cellSize);
            }
        }
    }
}

// Convert grid coordinates to pixel coordinates
export function gridToPixel(gridX, gridY) {
    const availableWidth = canvas.width - (canvasConfig.padding * 2);
    const availableHeight = canvas.height - (canvasConfig.padding * 2);
    
    const offsetX = (availableWidth - (canvasConfig.gridSize * canvasConfig.cellSize)) / 2;
    const offsetY = (availableHeight - (canvasConfig.gridSize * canvasConfig.cellSize)) / 2;
    
    return {
        x: canvasConfig.padding + offsetX + (gridX * canvasConfig.cellSize),
        y: canvasConfig.padding + offsetY + (gridY * canvasConfig.cellSize)
    };
}

// Draw Danube river
function drawDanube() {
    const centerX = canvasConfig.padding + (5 * canvasConfig.cellSize);

    ctx.save();
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
      
    ctx.beginPath();
    ctx.moveTo(centerX, canvasConfig.padding);
    ctx.lineTo(centerX, canvas.height - canvasConfig.padding);
    ctx.stroke();
    
    ctx.restore();
}

// Draw all stations with SVG images
function drawAllStations(stations, metroLines) {
    stations.forEach(station => {
        let color = null;
        metroLines.forEach(line => {
            if(line.start === station.id){
                color = line.color;
            }
        })
        drawStation(station, color);
    });

}

// Draw a single station with SVG image, optionally colored
function drawStation(station, lineColor = null) {
    const pos = gridToPixel(station.x, station.y);
    
    // Determine which image to use based on station type and train status
    let imageKey;
    
    if (station.train) {
        // Train stations
        if (station.type === 'A') imageKey = 'trainAStation';
        else if (station.type === 'C') imageKey = 'trainCStation';
        else if (station.type === 'D') imageKey = 'trainDStation';
        else imageKey = 'station' + station.type; // Fallback for train B
    } else {
        // Regular stations
        if (station.type === '?') imageKey = 'stationDeak';
        else imageKey = 'station' + station.type;
    }
    
    const image = images[imageKey];
    
    if (image && image.complete) {
        if (lineColor) {
            // Create temporary canvas for color manipulation
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = image.width;
            tempCanvas.height = image.height;
            
            // Draw the base image onto temporary canvas
            tempCtx.drawImage(image, 0, 0);
            
            // Get pixel data
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            // Convert hex color to RGB
            const rgb = hexToRgb(lineColor);
            
            // Replace black pixels with the line color
            for (let i = 0; i < data.length; i += 4) {
                // Check if pixel is mostly black and not transparent
                if (data[i] < 50 && data[i+1] < 50 && data[i+2] < 50 && data[i+3] > 0) {
                    data[i] = rgb.r;     // Red
                    data[i+1] = rgb.g;   // Green
                    data[i+2] = rgb.b;   // Blue
                }
            }
            
            // Put modified pixels back and draw to main canvas
            tempCtx.putImageData(imageData, 0, 0);
            ctx.drawImage(
                tempCanvas,
                pos.x + (canvasConfig.cellSize - canvasConfig.stationImageSize) / 2,
                pos.y + (canvasConfig.cellSize - canvasConfig.stationImageSize) / 2,
                canvasConfig.stationImageSize,
                canvasConfig.stationImageSize
            );
        } else {
            // Draw the original SVG image
            ctx.drawImage(
                image,
                pos.x + (canvasConfig.cellSize - canvasConfig.stationImageSize) / 2,
                pos.y + (canvasConfig.cellSize - canvasConfig.stationImageSize) / 2,
                canvasConfig.stationImageSize,
                canvasConfig.stationImageSize
            );
        }
    }
}

// Convert hex color to RGB
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
}

// Update game info display - improved version
export function updateGameInfo() {
    const currentLine = getCurrentMetroLine();
    const currentRound = getCurrentRound();
    
    // Don't update if data isn't ready yet
    if (!currentLine || currentRound === 0) {
        console.log('Game data not ready yet, skipping UI update');
        return;
    }
    
    // Update round info
    const roundElement = document.querySelector('#current-round');
    const lineElement = document.querySelector('#current-line');
    const coloredLineElement = document.querySelector('#colored-line-name');
    
    if (roundElement) {
        roundElement.textContent = `Kör ${currentRound}/4`;
    }
    
    if (lineElement && coloredLineElement) {
        coloredLineElement.textContent = currentLine.name;
        coloredLineElement.style.color = currentLine.color;

        console.log('Updated line to:', coloredLineElement.textContent);
        console.log('Updated color to:', coloredLineElement.style.color);
    }
}

// HTML version with peron background and station logo
export function updateCardDisplay() {
    const currentCard = getCurrentCard();
    const cardDisplay = document.querySelector('#card-display');
    
    if (!cardDisplay) {
        console.error('Card display element not found');
        return;
    }
    
    if (!currentCard) {
        cardDisplay.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Kattints az "Új kártya húzása" gombra a játék indításához!</div>';
        return;
    }
    
    // Determine which images to use
    const peronBackground = currentCard.peron === 'middle' ? 'MiddlePeron.svg' : 'SidePeron.svg';
    let stationLogo;
    
    if (currentCard.type === '?') {
        stationLogo = 'CardJoker.svg';
    } else {
        stationLogo = `Card${currentCard.type}.svg`;
    }
    
    const typeText = currentCard.type === '?' ? 'Joker' : `Állomás ${currentCard.type}`;

    cardDisplay.innerHTML = `
        <div style="
            position: relative;
            width: 100%;
            height: 250px;
            background-image: url('./images/${peronBackground}');
            background-size: cover;
            background-position: center;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">
            <img src="./images/${stationLogo}" 
                 style="width: 27%; height: 27%px; margin-bottom: 5px;">
            <div style="
                position: absolute;
                bottom: 10px;
                color: black;
                font-weight: bold;
                font-size: 30px;
                text-align: center;
            ">${typeText}</div>
        </div>
    `;
}


// Update setupGameControls in canvas.js
function setupGameControls() {
    const buildRouteButton = document.querySelector('#build-route');
    const skipTurnButton = document.querySelector('#skip-turn');
    const testDrawButton = document.querySelector('#test-draw');
    
    if (buildRouteButton) {
        buildRouteButton.addEventListener('click', handleBuildRoute);
        buildRouteButton.disabled = true; // Start disabled until card is drawn
    }
    
    if (skipTurnButton) {
        skipTurnButton.addEventListener('click', handleSkipTurn);
    }
    console.log('Game controls setup complete');
}

// Update card count display
export function updateCardCounts() {
    const counts = getCardCounts();
    
    const middleCount = document.querySelector('#middle-count');
    const sideCount = document.querySelector('#side-count');
    
    if (middleCount) {
        middleCount.textContent = `${counts.middle}/${counts.totalMiddle}`;
    }
    
    if (sideCount) {
        sideCount.textContent = `${counts.side}/${counts.totalSide}`;
    }
    
    console.log('Card counts updated:', counts);
}

function drawMetroSegments() {
    const segments = getBuiltSegments();
    
    console.log('Drawing ALL segments:', segments.length, 'segments found');
    
    segments.forEach((segment, index) => {
        console.log(`Segment ${index}:`, segment);
        const startStation = getStationById(segment.start);
        const endStation = getStationById(segment.end);
        
        console.log(`  Start station:`, startStation);
        console.log(`  End station:`, endStation);
        console.log(`  Color:`, segment.color);
        
        if (startStation && endStation) {
            drawSegment(startStation, endStation, segment.color);
        } else {
            console.warn('Could not find stations for segment:', segment);
        }
    });
}

function drawSegment(start, end, color) {
    const startPos = gridToPixel(start.x, start.y);
    const endPos = gridToPixel(end.x, end.y);
    
    console.log(`=== DRAWING SEGMENT DEBUG ===`);
    console.log(`From: ${start.id}(${start.x},${start.y}) to ${end.id}(${end.x},${end.y})`);
    console.log(`Pixel: (${startPos.x},${startPos.y}) to (${endPos.x},${endPos.y})`);
    console.log(`Color: ${color}`);
    console.log(`Distance: ${Math.abs(end.x - start.x)},${Math.abs(end.y - start.y)}`);
    
    // Adjust to center of cells
    const centerOffset = canvasConfig.cellSize / 2;
    const adjustedStartX = startPos.x + centerOffset;
    const adjustedStartY = startPos.y + centerOffset;
    const adjustedEndX = endPos.x + centerOffset;
    const adjustedEndY = endPos.y + centerOffset;
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(adjustedStartX, adjustedStartY);
    ctx.lineTo(adjustedEndX, adjustedEndY);
    ctx.stroke();
    
    ctx.restore();
    
    console.log(`Segment drawn successfully`);
}

function testSegmentDrawing() {
    console.log('=== TESTING SEGMENT DRAWING ===');
    
    // Get some stations to test with
    const stations = getStations();
    if (stations.length < 2) {
        console.log('Not enough stations for testing');
        return;
    }
    
    // Pick two stations that are in a straight line
    const startStation = stations[0];
    const endStation = stations.find(station => 
        (station.x === startStation.x || station.y === startStation.y) && 
        station.id !== startStation.id
    );
    
    if (!endStation) {
        console.log('No straight-line stations found for testing');
        return;
    }
    
    console.log('Test stations:', startStation, endStation);
    
    // Test drawing a segment
    drawSegment(startStation, endStation, '#ff0000');
    console.log('Test segment drawn in red');
}

// Start the game
initGame();
