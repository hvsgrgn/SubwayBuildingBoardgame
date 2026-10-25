// index.js - Menu navigation

const startButton = document.querySelector('#start-game');
const playerNameInput = document.querySelector('#player-name');
const viewInstructionsButton = document.querySelector('#view-instructions');
const instructionsDiv = document.querySelector('#instructions');
const backButtons = document.querySelectorAll('.back-btn');

// Start game
startButton.addEventListener('click', function() {
    const playerName = playerNameInput.value.trim();

    if (playerName === '') {
        return;
    }

    localStorage.setItem('playerName', playerName);
    window.location.href = 'game.html';
});

// Show instructions
viewInstructionsButton.addEventListener('click', function() {
    instructionsDiv.classList.remove('hidden');
});

// Hide instructions (back buttons)
backButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        instructionsDiv.classList.add('hidden');
    });
});
