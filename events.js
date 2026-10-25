// events.js - Fixed version
import { setPlayerName, drawCard, getCurrentCard, shouldEndRound} from './state.js';
import { initializeElements, showInstructions, showMainMenu } from './screens.js';
import { updateCardCounts, updateCardDisplay } from './canvas.js';
import { initRouteBuilding, cancelRouteBuilding, endRound } from './routebuilder.js';

// Initialize elements first
const elements = initializeElements();

export function handleStartGame() {
    const playerName = elements.playerNameInput.value.trim();
    
    if (playerName === '') {
        elements.playerNameInput.focus();
        return;
    }

    setPlayerName(playerName);
    
    // Start the timer when game begins
    startTimer();
    
    window.location.href = 'game.html';
}

export function handleViewInstructions() {
    showInstructions();
}

export function handleBackToMenu() {
    showMainMenu();
}

// Handle skip turn - draw a new card
export function handleSkipTurn() {
    console.log('Skip turn clicked - drawing new card');
    
    // Check if round should end before drawing
    if (shouldEndRound()) {
        console.log('Round should end, cannot draw more cards');
        endRound();
        return;
    }
    
    cancelRouteBuilding();
    
    const card = drawCard();
    updateCardDisplay();
    updateCardCounts();
    
    // Check if round ended after drawing this card
    if (shouldEndRound()) {
        console.log('Round ended after drawing card');
        endRound();
        return;
    }
    
    // Enable build route button if we have a valid card
    const buildRouteButton = document.querySelector('#build-route');
    if (buildRouteButton) {
        buildRouteButton.disabled = !card;
    }
}


export function setupEventListeners() {
    // Menu events
    if (elements.startGameButton) {
        elements.startGameButton.addEventListener('click', handleStartGame);
    }
    if (elements.viewInstructionsButton) {
        elements.viewInstructionsButton.addEventListener('click', handleViewInstructions);
    }
    
    // Back buttons
    if (elements.backButtons) {
        elements.backButtons.forEach(button => {
            button.addEventListener('click', handleBackToMenu);
        });
    }
}

export function handleBuildRoute() {
    // Check if round should end
    if (shouldEndRound()) {
        console.log('Round should end, cannot build more routes');
        endRound();
        return;
    }
    
    const currentCard = getCurrentCard();
    
    if (!currentCard) {
        console.log('Először húzz egy kártyát!');
        const cardDisplay = document.querySelector('#card-display');
        if (cardDisplay) {
            cardDisplay.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Először húzz egy kártyát a "Kör kihagyása" gombbal!</div>';
        }
        return;
    }
    
    initRouteBuilding();
}