// scripts/main.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Lizard Button Logic ---
    const lizardButton = document.querySelector('.lizardButton');
    const lizardSound = document.getElementById('lizardSound');

    lizardButton.addEventListener('click', () => {
        lizardSound.currentTime = 0;
        lizardSound.play();
        createFallingLizards();
    });

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

    // --- New Rat Button Logic ---
    // Get a reference to the new rat button
    const ratButton = document.querySelector('.ratButton');

    // Add a click event listener
    ratButton.addEventListener('click', () => {
        // Add the 'tiled-bg' class to the body to change the background
        document.body.classList.add('tiled-bg');
    });

});