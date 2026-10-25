// routebuilder.js - Complete updated version
import { 
    getStations, 
    getCurrentMetroLine, 
    getCurrentCard, 
    getStationById,
    getBuiltSegments,
    getRouteBuildingState,
    setRouteBuildingState,
    addBuiltSegment,
    getCurrentMetroLineId,
    getCurrentMetroLineColor,
    getMetroLines,
    drawCard,
    shouldEndRound,
    startNewRound,
    getCurrentRound,
    resetValuesForNextGame,
    getRemainingLines,
    startTimer,
    stopTimer,
    resetTimer,
    getFormattedTime
} from './state.js';
import { drawInitialGrid, updateCardDisplay, updateCardCounts, updateGameInfo, gridToPixel, canvasConfig } from './canvas.js';

export function initRouteBuilding() {
    console.log('Initializing route building...');
    
    const routeBuilding = getRouteBuildingState();
    const currentCard = getCurrentCard();
    
    if (!currentCard) {
        console.log('No card drawn yet');
        const cardDisplay = document.querySelector('#card-display');
        if (cardDisplay) {
            cardDisplay.innerHTML += '<div style="color: red; text-align: center; margin-top: 10px;">Először húzz egy kártyát!</div>';
        }
        return;
    }
    
    routeBuilding.isActive = true;
    routeBuilding.mode = 'select-first';
    routeBuilding.firstStation = null;
    routeBuilding.validSecondStations = [];
    routeBuilding.currentCard = currentCard;
    
    setRouteBuildingState(routeBuilding);
    
    console.log('Route building started - select first station');
    enableStationSelection();
    
    // Update UI to show instructions
    updateRouteBuildingUI();
    
    // Redraw to show available starting stations
    const stations = getStations();
    const metroLines = getMetroLines();
    drawInitialGrid(stations, metroLines);
}

function updateRouteBuildingUI() {
    const routeBuilding = getRouteBuildingState();
    const cardDisplay = document.querySelector('#card-display');
    
    if (!cardDisplay) return;
    
    let instruction = '';
    
    if (routeBuilding.mode === 'select-first') {
        instruction = '<div style="color: blue; text-align: center; margin-top: 10px;">Válassz egy kiinduló állomást!</div>';
    } else if (routeBuilding.mode === 'select-second' && routeBuilding.firstStation) {
        instruction = `<div style="color: blue; text-align: center; margin-top: 10px;">Válassz célállomást!</div>`;
    }
    
    // Keep the original card content and add instruction
    const currentCard = getCurrentCard();
    if (currentCard) {
        const typeText = currentCard.type === '?' ? 'Joker' : `Állomás ${currentCard.type}`;
        const peronBackground = currentCard.peron === 'middle' ? 'MiddlePeron.svg' : 'SidePeron.svg';
        const stationLogo = currentCard.type === '?' ? 'CardJoker.svg' : `Card${currentCard.type}.svg`;
        
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
            ${instruction}
        `;
    }
}

function enableStationSelection() {
    const canvas = document.querySelector('#game-canvas');
    if (canvas) {
        canvas.style.cursor = 'pointer';
        canvas.addEventListener('click', handleCanvasClick);
    }
}

function disableStationSelection() {
    const canvas = document.querySelector('#game-canvas');
    if (canvas) {
        canvas.style.cursor = 'default';
        canvas.removeEventListener('click', handleCanvasClick);
    }
}

function handleCanvasClick(event) {
    const routeBuilding = getRouteBuildingState();
    if (!routeBuilding.isActive) return;
    
    const clickedStation = getStationAtClick(event);
    
    if (!clickedStation) {
        console.log('No station clicked');
        return;
    }
    
    // If we have a first station selected, try to build segment
    if (routeBuilding.firstStation) {
        // Check if this is a valid segment
        if (isValidSegment(routeBuilding.firstStation, clickedStation, routeBuilding.currentCard)) {
            buildSegment(routeBuilding.firstStation, clickedStation);
        } else {
            // Invalid segment, reset selection
            routeBuilding.firstStation = null;
            routeBuilding.mode = 'select-first';
            setRouteBuildingState(routeBuilding);
            updateRouteBuildingUI();
            console.log('Invalid segment, resetting selection');
        }
    } else {
        // Select first station if it's a valid starting point
        if (isValidFirstStation(clickedStation)) {
            routeBuilding.firstStation = clickedStation;
            routeBuilding.mode = 'select-second';
            routeBuilding.validSecondStations = calculateValidSecondStations(clickedStation);
            setRouteBuildingState(routeBuilding);
            updateRouteBuildingUI();
            console.log(`First station selected: ${clickedStation.id} (${clickedStation.type})`);
        } else {
            console.log('Invalid first station');
        }
    }
}

function calculateValidSecondStations(firstStation) {
    const stations = getStations();
    const currentCard = getRouteBuildingState().currentCard;
    let validStations = [];
    
    console.log(`=== CALCULATING VALID SECOND STATIONS ===`);
    console.log(`From station: ${firstStation.id} (${firstStation.type}) at (${firstStation.x},${firstStation.y})`);
    console.log(`Card: ${currentCard.type} (${currentCard.peron})`);
    
    stations.forEach(secondStation => {
        if (isValidSegment(firstStation, secondStation, currentCard)) {
            validStations.push(secondStation);
        }
    });
    
    console.log(`Found ${validStations.length} valid second stations`);
    return validStations;
}

function isValidSegment(station1, station2, card) {
    // Can't build to the same station
    if (station2.id === station1.id) return false;
    
    // Check if segment already exists
    if (isSegmentBuilt(station1, station2)) return false;
    
    // Check card type match for SECOND station (first station can be any type from existing line)
    // SPECIAL CASE: Deák station (ID 30) accepts any card type
    if (station2.id !== 30 && !isCardTypeMatch(station2, card)) return false;
    
    // Check if path is straight line (horizontal, vertical, or diagonal)
    if (!isStraightLine(station1, station2)) return false;
    
    // Check if path doesn't cross other stations
    if (crossesOtherStations(station1, station2)) return false;
    
    // Check if this extends the current metro line properly
    if (!isValidLineExtension(station1, station2)) return false;
    
    // NEW: Check if this segment would cross any existing segments (except at stations)
    if (wouldCrossExistingSegments(station1, station2)) return false;
    
    return true;
}

function isValidLineExtension(station1, station2) {
    const builtSegments = getBuiltSegments();
    const currentLineId = getCurrentMetroLineId();
    const currentLineSegments = builtSegments.filter(segment => segment.line === currentLineId);
    
    // If no segments built yet, station1 must be the starting station of the current line
    if (currentLineSegments.length === 0) {
        const startingStation = getStartingStationForCurrentLine();
        return station1.id === startingStation.id;
    }
    
    // If segments exist, station1 must be an end station of the current line
    const endStations = findLineEndStations(currentLineSegments);
    return endStations.some(endStation => endStation.id === station1.id);
}

function isCardTypeMatch(station, card) {
    // SPECIAL CASE: Deák station (ID 30) accepts any card type
    if (station.id === 30) return true;
    
    // Joker card can connect to any station (except when station has specific requirements)
    if (card.type === '?') return true;
    
    // Regular cards must match station type
    return station.type === card.type;
}

function isStraightLine(start, end) {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    
    // Allow horizontal, vertical, AND 45-degree diagonal lines
    return dx === 0 || dy === 0 || dx === dy;
}

function isSegmentBuilt(station1, station2) {
    const segments = getBuiltSegments();
    
    return segments.some(segment => 
        (segment.start === station1.id && segment.end === station2.id) ||
        (segment.start === station2.id && segment.end === station1.id)
    );
}

// In routebuilder.js - Update crossesOtherStations function
function crossesOtherStations(start, end) {
    const stations = getStations();
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    // For single-step moves (distance of 1), there can't be any stations in between
    if (steps <= 1) {
        return false;
    }
    
    for (let i = 1; i < steps; i++) {
        const x = start.x + Math.round((dx / steps) * i);
        const y = start.y + Math.round((dy / steps) * i);
        
        // Check if there's a station at this grid position (that's not start or end)
        const stationAtPos = stations.find(station => 
            station.x === x && 
            station.y === y && 
            station.id !== start.id && 
            station.id !== end.id
        );
        
        if (stationAtPos) return true;
    }
    
    return false;
}

function getStartingStationForCurrentLine() {
    const currentLine = getCurrentMetroLine();
    const stations = getStations();
    return stations.find(station => station.id === currentLine.start);
}

function findLineEndStations(segments) {
    const stationConnections = {};
    
    // Build connection graph
    segments.forEach(segment => {
        if (!stationConnections[segment.start]) stationConnections[segment.start] = [];
        if (!stationConnections[segment.end]) stationConnections[segment.end] = [];
        
        stationConnections[segment.start].push(segment.end);
        stationConnections[segment.end].push(segment.start);
    });
    
    // Find stations with only one connection (end points)
    const endStations = [];
    Object.keys(stationConnections).forEach(stationId => {
        if (stationConnections[stationId].length === 1) {
            const station = getStationById(parseInt(stationId));
            if (station) endStations.push(station);
        }
    });
    
    return endStations;
}

function getStationAtClick(event) {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to grid coordinates
    const gridPos = pixelToGrid(x, y);
    
    const stations = getStations();
    return stations.find(station => station.x === gridPos.x && station.y === gridPos.y);
}

function pixelToGrid(pixelX, pixelY) {
    const canvas = document.querySelector('#game-canvas');
    if (!canvas) return { x: -1, y: -1 };
    
    const canvasConfig = {
        gridSize: 10,
        padding: 20
    };
    
    const availableWidth = canvas.width - (canvasConfig.padding * 2);
    const availableHeight = canvas.height - (canvasConfig.padding * 2);
    const cellSize = Math.min(availableWidth / canvasConfig.gridSize, availableHeight / canvasConfig.gridSize);
    
    const offsetX = (availableWidth - (canvasConfig.gridSize * cellSize)) / 2;
    const offsetY = (availableHeight - (canvasConfig.gridSize * cellSize)) / 2;
    
    const gridX = Math.floor((pixelX - canvasConfig.padding - offsetX) / cellSize);
    const gridY = Math.floor((pixelY - canvasConfig.padding - offsetY) / cellSize);
    
    return { x: gridX, y: gridY };
}

export function buildSegment(startStation, endStation) {
    const segment = {
        start: startStation.id,
        end: endStation.id,
        line: getCurrentMetroLineId(),
        color: getCurrentMetroLineColor()
    };
    
    console.log('Building segment:', segment);
    
    addBuiltSegment(segment);
    
    // Auto-draw new card
    const newCard = drawCard();
    console.log('Auto-drew new card:', newCard);
    
    // End route building
    const routeBuilding = getRouteBuildingState();
    routeBuilding.isActive = false;
    routeBuilding.mode = 'select-first';
    routeBuilding.firstStation = null;
    routeBuilding.validSecondStations = [];
    setRouteBuildingState(routeBuilding);
    
    disableStationSelection();
    
    // Update UI
    updateCardDisplay();
    updateCardCounts();
    
    // Enable/disable build route button based on new card
    const buildRouteButton = document.querySelector('#build-route');
    if (buildRouteButton) {
        buildRouteButton.disabled = !newCard;
    }
    
    // Redraw the grid
    const stations = getStations();
    const metroLines = getMetroLines();
    drawInitialGrid(stations, metroLines);
    
    console.log('Segment built successfully, new card drawn');
    
    // Check round end condition
    if (shouldEndRound()) {
        console.log('=== KÖR VÉGE! ===');
        endRound();
    }
    
    return segment;
}

export function cancelRouteBuilding() {
    const routeBuilding = getRouteBuildingState();
    routeBuilding.isActive = false;
    routeBuilding.mode = 'select-first';
    routeBuilding.firstStation = null;
    routeBuilding.validSecondStations = [];
    setRouteBuildingState(routeBuilding);
    disableStationSelection();
    
    // Redraw to remove highlights
    const stations = getStations();
    const metroLines = getMetroLines();
    drawInitialGrid(stations, metroLines);
    
    // Reset card display
    updateCardDisplay();
}

export function endRound() {
    console.log('Round ended! Preparing for next round...');

    // Check if this was the final round (4th round)
    const isGameComplete = getCurrentRound() >= 4;

    // Stop timer if game is complete
    if (isGameComplete) {
        stopTimer();
    }

    const cardDisplay = document.querySelector('#card-display');
    if (cardDisplay) {
        if (isGameComplete) {
            const totalTime = getFormattedTime();
            cardDisplay.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h3>Játék vége!</h3>
                    <p>Teljes idő: ${totalTime}</p>
                    <p>Minden metróvonalat befejeztél!</p>
                    <button id="new-game-btn" class="btn btn-primary" style="margin-top: 10px;">Új játék</button>
                </div>
            `;

            setTimeout(() => {
                const newGameBtn = document.querySelector('#new-game-btn');
                if (newGameBtn) {
                    newGameBtn.addEventListener('click', startNewGame);
                }
            }, 100);
        } else {
            cardDisplay.innerHTML = `
                <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h3>Kör vége!</h3>
                    <button id="next-round-btn" class="btn btn-primary" style="margin-top: 10px;">Következő kör</button>
                </div>
            `;

            setTimeout(() => {
                const nextRoundBtn = document.querySelector('#next-round-btn');
                if (nextRoundBtn) {
                    nextRoundBtn.addEventListener('click', startNextRound);
                }
            }, 100);
        }
    }
}

export function startNewGame(){
    resetTimer();
    startTimer();

    resetValuesForNextGame();
    startNextRound();
}

// Add startNextRound function
export function startNextRound() {
    console.log('Starting next round...');
    
    // Start new round
    const newLine = startNewRound();
    
    if (!newLine) {
        console.error('Failed to start new round');
        return;
    }
    
    // Update UI
    updateGameInfo();
    updateCardDisplay();
    updateCardCounts();
    
    // Reset build route button
    const buildRouteButton = document.querySelector('#build-route');
    if (buildRouteButton) {
        buildRouteButton.disabled = true;
    }
    
    console.log(`Started round ${getCurrentRound()} with line: ${newLine.name}`);
    console.log(`Remaining lines for this game:`, getRemainingLines().map(l => l.name));
}

function isValidFirstStation(station) {
    const builtSegments = getBuiltSegments();
    const currentLineId = getCurrentMetroLineId();
    const currentLineSegments = builtSegments.filter(segment => segment.line === currentLineId);
    
    if (currentLineSegments.length === 0) {
        // First segment - must be the starting station
        const startingStation = getStartingStationForCurrentLine();
        return station.id === startingStation.id;
    }
    
    // Subsequent segments - must be an end station
    const endStations = findLineEndStations(currentLineSegments);
    return endStations.some(endStation => endStation.id === station.id);
}

function segmentsCross(segment1, segment2) {
    // Don't count crossings at stations as intersections
    const segment1Start = getStationById(segment1.start);
    const segment1End = getStationById(segment1.end);
    const segment2Start = getStationById(segment2.start);
    const segment2End = getStationById(segment2.end);
    
    // If segments share a station, they don't "cross" in the forbidden sense
    if (segment1Start.id === segment2Start.id || segment1Start.id === segment2End.id ||
        segment1End.id === segment2Start.id || segment1End.id === segment2End.id) {
        return false;
    }
    
    // Convert to pixel coordinates for line intersection calculation
    const p1 = gridToPixel(segment1Start.x, segment1Start.y);
    const p2 = gridToPixel(segment1End.x, segment1End.y);
    const p3 = gridToPixel(segment2Start.x, segment2Start.y);
    const p4 = gridToPixel(segment2End.x, segment2End.y);
    
    // Adjust to center of cells
    const centerOffset = canvasConfig.cellSize / 2;
    const a = { x: p1.x + centerOffset, y: p1.y + centerOffset };
    const b = { x: p2.x + centerOffset, y: p2.y + centerOffset };
    const c = { x: p3.x + centerOffset, y: p3.y + centerOffset };
    const d = { x: p4.x + centerOffset, y: p4.y + centerOffset };
    
    // Check if line segments AB and CD intersect
    return doLineSegmentsIntersect(a, b, c, d);
}

// Add line segment intersection detection
function doLineSegmentsIntersect(a, b, c, d) {
    // Calculate determinants
    const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    
    // If lines are parallel, no intersection
    if (det === 0) return false;
    
    // Calculate intersection parameters
    const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
    const u = -((a.x - c.x) * (b.y - a.y) - (a.y - c.y) * (b.x - a.x)) / det;
    
    // Check if intersection point is within both segments
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function wouldCrossExistingSegments(station1, station2) {
    const builtSegments = getBuiltSegments();
    const proposedSegment = { start: station1.id, end: station2.id };
    
    for (const existingSegment of builtSegments) {
        if (segmentsCross(proposedSegment, existingSegment)) {
            console.log(`Segment would cross existing segment: ${existingSegment.start}-${existingSegment.end}`);
            return true;
        }
    }
    
    return false;
}
