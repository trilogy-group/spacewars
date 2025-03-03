import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Game } from './js/Game.js';

// Hide loading message when the game is initialized
window.addEventListener('load', () => {
    document.getElementById('loading').style.display = 'none';
});

// Initialize the game
const game = new Game();
game.init(); 