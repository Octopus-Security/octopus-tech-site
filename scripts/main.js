// scripts/main.js

document.addEventListener('DOMContentLoaded', () => {

    // Get references to the button and the audio element
    const lizardButton = document.querySelector('.lizardButton');
    const lizardSound = document.getElementById('lizardSound');

    // Add a click event listener to the button
    lizardButton.addEventListener('click', () => {

        // --- 1. Play the sound ---
        // Rewind the sound to the beginning in case it's already playing
        lizardSound.currentTime = 0;
        lizardSound.play();

        // --- 2. Create the falling lizards ---
        createFallingLizards();
    });

    function createFallingLizards() {
        const lizardCount = 20; // How many lizards to create

        for (let i = 0; i < lizardCount; i++) {
            const lizard = document.createElement('div');
            lizard.classList.add('falling-lizard');
            lizard.innerText = '🦎';

            // Randomize the lizard's starting position and animation
            lizard.style.left = Math.random() * 100 + 'vw'; // Random horizontal start
            lizard.style.fontSize = Math.random() * 20 + 20 + 'px'; // Random size
            lizard.style.animationDuration = Math.random() * 2 + 3 + 's'; // Random fall speed (3-5 seconds)
            lizard.style.animationDelay = Math.random() * 0.5 + 's'; // Random start delay

            // Add the new lizard to the page
            document.body.appendChild(lizard);

            // --- 3. Clean up ---
            // Remove the lizard from the DOM after its animation finishes
            lizard.addEventListener('animationend', () => {
                lizard.remove();
            });
        }
    }
});