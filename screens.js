// A DOM elemek inicializacioja es modositasa zajlik ebben a szkriptben
import { getPlayerName, getTimer, setCurrentScreen } from './state.js';

const elements = {};

export function initializeElements(){
    elements.menuScreen = document.querySelector('#menu-screen');
    elements.gameScreen = document.querySelector('#game-screen');
    elements.playerNameInput = document.querySelector('#player-name');
    elements.startGameButton = document.querySelector('#start-game');
    elements.viewInstructionsButton = document.querySelector('#view-instructions');
    elements.instructionsSection = document.querySelector('#instructions');
    elements.backButtons = document.querySelectorAll('.back-btn');
    elements.currentPlayer = document.querySelector('#current-player');
    elements.timer = document.querySelector('#timer');
    elements.currentRound = document.querySelector('#current-round');
    elements.currentLine = document.querySelector('#current-line');
    elements.buildRouteButton = document.querySelector('#build-route');
    elements.skipTurnButton = document.querySelector('#skip-turn');
    elements.cardDisplay = document.querySelector('#card-display');
    
    return elements;
}

// a parameterben megadott kepernyonek megfelelore allitja az allapotban a kepernyot, ennek megfeleloen jelenik meg a kezdokepernyo vagy a jatek
export function showScreen(screenName){

    //eloszor elrejtjuk mindket kepernyot
    elements.menuScreen.classList.remove('active');
    elements.gameScreen.classList.remove('active');

    //valamint a menupontokat is
    elements.instructionsSection.classList.add('hidden');

    //a parameterben megadott kepernyot elohozzuk
    switch(screenName){
        case 'menu':
            elements.menuScreen.classList.add('active');
            break;
        case 'game':
            elements.gameScreen.classList.add('active');
            break;
        default:
            //ez csak kodolasi hiba eseten fordulhatna elo, ezert helyes mukodes eseten a vegrehajtas nem er el ide
    }
    
    setCurrentScreen(screenName);
}

//menupontok kezelese

export function showInstructions() {
    elements.instructionsSection.classList.remove('hidden');
}

export function showMainMenu() {
    elements.instructionsSection.classList.add('hidden');
}

// UI frissitese

export function updatePlayerInfo() {
    elements.currentPlayer.textContent = `Játékos: ${getPlayerName()}`;
}

export function updateTimer() {
    const timerElement = document.querySelector('#timer');
    if (timerElement) {
        timerElement.textContent = `Idő: ${getFormattedTime()}`;
    }
}

export { elements };