// scripts/main.js

function createFallingLizards() {
    const lizardCount = 20;
    for (let i = 0; i < lizardCount; i++) {
        const lizard = document.createElement('div');
        lizard.classList.add('falling-lizard');
        lizard.innerText = '🦎';
        lizard.style.left = Math.random() * 100 + 'vw';
        lizard.style.fontSize = Math.random() * 20 + 20 + 'px';
        lizard.style.animationDuration = Math.random() * 2 + 3 + 's';
        lizard.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(lizard);
        lizard.addEventListener('animationend', () => {
            lizard.remove();
        });
    }
}

function createFallingRats() {
    const ratCount = 20;
    for (let i = 0; i < ratCount; i++) {
        const rat = document.createElement('div');
        rat.classList.add('falling-lizard'); // Re-using the same animation
        rat.innerText = '🐀';
        rat.style.left = Math.random() * 100 + 'vw';
        rat.style.fontSize = Math.random() * 20 + 20 + 'px';
        rat.style.animationDuration = Math.random() * 2 + 3 + 's';
        rat.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(rat);
        rat.addEventListener('animationend', () => {
            rat.remove();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // --- Lizard Button Logic ---
    const lizardButton = document.querySelector('.lizardButton');
    const lizardSound = document.getElementById('lizardSound');

    if (lizardButton && lizardSound) {
        lizardButton.addEventListener('click', () => {
            lizardSound.currentTime = 0;
            lizardSound.play();
            createFallingLizards();
        });
    }

    // --- New Rat Button Logic ---
    const ratButton = document.querySelector('.ratButton');
    const ratSound = document.getElementById('ratSound');

    if (ratButton && ratSound) {
        ratButton.addEventListener('click', () => {
            ratSound.currentTime = 0;
            ratSound.play();
            createFallingRats();
            document.body.classList.add('tiled-bg');
        });
    }

});