import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Player } from './Player.js';
import { DeathStar } from './DeathStar.js';
import { TIEFighter } from './TIEFighter.js';
import { Turret } from './Turret.js';
import { Stars } from './Stars.js';
import { PowerUp } from './PowerUp.js';

export class Game {
    constructor() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 10, 30);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Lighting
        this.setupLights();
        
        // Game objects
        this.player = null;
        this.deathStar = null;
        this.tieFighters = [];
        this.turrets = [];
        this.powerUps = [];
        this.maxTIEFighters = 5;
        this.maxTurrets = 8;
        this.maxPowerUps = 3;
        this.enemySpawnInterval = 5000; // ms between enemy spawns
        this.powerUpSpawnInterval = 15000; // ms between power-up spawns
        this.lastEnemySpawnTime = 0;
        this.lastPowerUpSpawnTime = 0;
        
        // Game state
        this.gameOver = false;
        this.gameWon = false;
        this.difficulty = 1; // Starting difficulty level
        this.difficultyIncreaseInterval = 30000; // Increase difficulty every 30 seconds
        this.lastDifficultyIncreaseTime = 0;
        
        // HUD elements
        this.speedDisplay = null;
        this.scoreDisplay = null;
        this.distanceDisplay = null;
        this.controlsDisplay = null;
        this.score = 0;
        
        // Animation
        this.clock = new THREE.Clock();
        
        // Bind methods
        this.onWindowResize = this.onWindowResize.bind(this);
        this.animate = this.animate.bind(this);
        
        // Event listeners
        window.addEventListener('resize', this.onWindowResize);
    }
    
    async init() {
        // Create starfield
        const stars = new Stars(this.scene);
        stars.init();
        
        // Create player
        this.player = new Player(this.scene, this.camera);
        await this.player.init();
        
        // Create Death Star
        this.deathStar = new DeathStar(this.scene);
        await this.deathStar.init();
        
        // Set Death Star as player's target
        this.player.setTarget(this.deathStar);
        
        // Create HUD
        this.createHUD();
        
        // Start animation loop
        this.animate();
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(100, 100, 100);
        sunLight.castShadow = true;
        
        // Adjust shadow properties for better quality
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(sunLight);
    }
    
    createHUD() {
        // Create HUD container
        const hudContainer = document.createElement('div');
        hudContainer.style.position = 'absolute';
        hudContainer.style.top = '10px';
        hudContainer.style.left = '10px';
        hudContainer.style.color = '#fff';
        hudContainer.style.fontFamily = 'Arial, sans-serif';
        hudContainer.style.fontSize = '16px';
        hudContainer.style.textShadow = '1px 1px 1px #000';
        hudContainer.style.userSelect = 'none';
        document.body.appendChild(hudContainer);
        
        // Create speed display
        this.speedDisplay = document.createElement('div');
        this.speedDisplay.style.marginBottom = '5px';
        hudContainer.appendChild(this.speedDisplay);
        
        // Create score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.textContent = `Score: ${this.score}`;
        this.scoreDisplay.style.marginBottom = '5px';
        hudContainer.appendChild(this.scoreDisplay);
        
        // Create distance display
        this.distanceDisplay = document.createElement('div');
        this.distanceDisplay.style.marginBottom = '5px';
        hudContainer.appendChild(this.distanceDisplay);
        
        // Create damage indicator container
        this.damageIndicator = document.createElement('div');
        this.damageIndicator.style.position = 'absolute';
        this.damageIndicator.style.top = '50%';
        this.damageIndicator.style.left = '50%';
        this.damageIndicator.style.transform = 'translate(-50%, -50%)';
        this.damageIndicator.style.width = '100%';
        this.damageIndicator.style.height = '100%';
        this.damageIndicator.style.pointerEvents = 'none';
        this.damageIndicator.style.display = 'none';
        this.damageIndicator.style.border = '5px solid rgba(255, 0, 0, 0.5)';
        this.damageIndicator.style.boxSizing = 'border-box';
        document.body.appendChild(this.damageIndicator);
        
        // Create message container
        this.messageContainer = document.createElement('div');
        this.messageContainer.style.position = 'absolute';
        this.messageContainer.style.top = '50%';
        this.messageContainer.style.left = '50%';
        this.messageContainer.style.transform = 'translate(-50%, -50%)';
        this.messageContainer.style.color = '#fff';
        this.messageContainer.style.fontFamily = 'Arial, sans-serif';
        this.messageContainer.style.fontSize = '24px';
        this.messageContainer.style.textAlign = 'center';
        this.messageContainer.style.textShadow = '2px 2px 2px #000';
        this.messageContainer.style.opacity = '0';
        this.messageContainer.style.transition = 'opacity 0.3s ease-in-out';
        this.messageContainer.style.pointerEvents = 'none';
        this.messageContainer.style.zIndex = '1000';
        document.body.appendChild(this.messageContainer);
        
        // Create controls display
        this.controlsDisplay = document.createElement('div');
        this.controlsDisplay.style.position = 'absolute';
        this.controlsDisplay.style.bottom = '10px';
        this.controlsDisplay.style.left = '10px';
        this.controlsDisplay.style.color = '#fff';
        this.controlsDisplay.style.fontFamily = 'Arial, sans-serif';
        this.controlsDisplay.style.fontSize = '14px';
        this.controlsDisplay.style.textShadow = '1px 1px 1px #000';
        this.controlsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.controlsDisplay.style.padding = '10px';
        this.controlsDisplay.style.borderRadius = '5px';
        this.controlsDisplay.style.userSelect = 'none';
        this.controlsDisplay.style.zIndex = '1000';
        this.controlsDisplay.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">Controls:</div>
            <div>W/S - Pitch up/down</div>
            <div>A/D - Roll left/right</div>
            <div>Q/E - Yaw left/right</div>
            <div>Shift - Boost speed</div>
            <div>Space - Fire weapons</div>
        `;
        document.body.appendChild(this.controlsDisplay);
        
        // Update the initial displays
        if (this.player) {
            this.speedDisplay.textContent = `Speed: ${Math.round(this.player.speed * 50)} km/h`;
        }
    }
    
    updateScore(points) {
        this.score += points;
        this.scoreDisplay.textContent = `Score: ${this.score}`;
    }
    
    spawnEnemies() {
        const now = Date.now();
        
        // Check if it's time to spawn a new enemy
        if (now - this.lastEnemySpawnTime > this.enemySpawnInterval / this.difficulty) {
            // Decide what type of enemy to spawn
            const spawnType = Math.random();
            
            if (spawnType < 0.7 && this.tieFighters.length < this.maxTIEFighters) {
                // Spawn a TIE Fighter
                this.spawnTIEFighter();
            } else if (this.turrets.length < this.maxTurrets) {
                // Spawn a Turret
                this.spawnTurret();
            }
            
            this.lastEnemySpawnTime = now;
        }
        
        // Check if it's time to spawn a power-up
        if (now - this.lastPowerUpSpawnTime > this.powerUpSpawnInterval && this.powerUps.length < this.maxPowerUps) {
            this.spawnPowerUp();
            this.lastPowerUpSpawnTime = now;
        }
        
        // Check if it's time to increase difficulty
        if (now - this.lastDifficultyIncreaseTime > this.difficultyIncreaseInterval) {
            this.increaseDifficulty();
            this.lastDifficultyIncreaseTime = now;
        }
    }
    
    increaseDifficulty() {
        this.difficulty += 0.2;
        console.log(`Difficulty increased to level ${this.difficulty.toFixed(1)}`);
        
        // Show difficulty increase message
        this.showMessage(`Difficulty Increased!`, '#ff0000');
        
        // Increase max enemies based on difficulty
        this.maxTIEFighters = Math.min(10, Math.floor(5 + this.difficulty));
        this.maxTurrets = Math.min(12, Math.floor(8 + this.difficulty / 2));
    }
    
    showMessage(text, color) {
        // Create message element
        const message = document.createElement('div');
        message.style.position = 'absolute';
        message.style.top = '30%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.color = color || '#ffffff';
        message.style.fontFamily = 'Arial, sans-serif';
        message.style.fontSize = '24px';
        message.style.fontWeight = 'bold';
        message.style.textShadow = '2px 2px 4px #000000';
        message.style.pointerEvents = 'none';
        message.style.zIndex = '100';
        message.textContent = text;
        
        document.body.appendChild(message);
        
        // Animate the message
        let opacity = 1;
        const fadeOut = () => {
            opacity -= 0.02;
            message.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                document.body.removeChild(message);
            }
        };
        
        // Start fade out after a delay
        setTimeout(() => {
            fadeOut();
        }, 1000);
    }
    
    spawnTIEFighter() {
        // Create a random position around the player
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 100;
        const x = this.player.ship.position.x + Math.cos(angle) * distance;
        const y = this.player.ship.position.y + (Math.random() - 0.5) * 100;
        const z = this.player.ship.position.z + Math.sin(angle) * distance;
        
        // Create the TIE Fighter
        const tieFighter = new TIEFighter(this.scene, this.player, new THREE.Vector3(x, y, z));
        tieFighter.init();
        
        // Add to the array
        this.tieFighters.push(tieFighter);
    }
    
    spawnTurret() {
        // Create a position on the Death Star surface
        const position = this.deathStar.getRandomSurfacePosition();
        
        // Create the Turret
        const turret = new Turret(this.scene, this.player, position, this.deathStar.mesh);
        turret.init();
        
        // Add to the array
        this.turrets.push(turret);
    }
    
    spawnPowerUp() {
        // Create a random position further from the player
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 100; // Increased from 50+50 to 100+100
        const x = this.player.ship.position.x + Math.cos(angle) * distance;
        const y = this.player.ship.position.y + (Math.random() - 0.5) * 30;
        const z = this.player.ship.position.z + Math.sin(angle) * distance;
        
        // Create the power-up
        const powerUp = new PowerUp(
            this.scene, 
            this.player, 
            new THREE.Vector3(x, y, z)
        );
        
        powerUp.init();
        
        // Add to the array
        this.powerUps.push(powerUp);
        
        console.log(`Spawned ${powerUp.type} power-up at position (${x.toFixed(0)}, ${y.toFixed(0)}, ${z.toFixed(0)})`);
    }
    
    updateEnemies(deltaTime) {
        // Update TIE Fighters
        for (let i = this.tieFighters.length - 1; i >= 0; i--) {
            const tieFighter = this.tieFighters[i];
            tieFighter.update(deltaTime);
            
            // Check for collision with player
            if (this.player && !this.player.isDestroyed && !this.player.invulnerable && tieFighter.mesh) {
                const playerPosition = this.player.ship.position.clone();
                const tieFighterPosition = tieFighter.mesh.position.clone();
                const distance = playerPosition.distanceTo(tieFighterPosition);
                
                // Simple collision detection (adjust the value based on ship sizes)
                if (distance < 15) {
                    // Player takes damage
                    this.player.takeDamage(15);
                    
                    // TIE Fighter takes damage
                    tieFighter.takeDamage(20);
                    
                    // Visual and audio feedback
                    this.showDamageMessage("Ship Collision! -15 Health", "#ff0000");
                }
            }
            
            // Check if destroyed
            if (tieFighter.isDestroyed) {
                // Add to score
                this.updateScore(100);
                
                // Remove from array
                this.tieFighters.splice(i, 1);
            }
        }
        
        // Update Turrets
        for (let i = this.turrets.length - 1; i >= 0; i--) {
            const turret = this.turrets[i];
            turret.update(deltaTime);
            
            // Check for collision with player
            if (this.player && !this.player.isDestroyed && !this.player.invulnerable && turret.base) {
                const playerPosition = this.player.ship.position.clone();
                const turretWorldPos = new THREE.Vector3();
                turret.base.getWorldPosition(turretWorldPos);
                const distance = playerPosition.distanceTo(turretWorldPos);
                
                // Simple collision detection (adjust the value based on sizes)
                if (distance < 10) {
                    // Player takes damage
                    this.player.takeDamage(10);
                    
                    // Turret takes damage
                    turret.takeDamage(20);
                    
                    // Visual and audio feedback
                    this.showDamageMessage("Turret Collision! -10 Health", "#ff0000");
                }
            }
            
            // Check if destroyed
            if (turret.isDestroyed) {
                // Add to score
                this.updateScore(50);
                
                // Remove from array
                this.turrets.splice(i, 1);
            }
        }
        
        // Update Power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            const removed = powerUp.update(deltaTime);
            
            // Remove collected or expired power-ups
            if (removed || powerUp.isCollected || !powerUp.mesh) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    checkGameState() {
        // Check if player is destroyed
        if (this.player.isDestroyed && !this.gameOver) {
            this.gameOver = true;
            // Game over logic is handled by the Player class
        }
        
        // Check if Death Star is destroyed
        if (this.deathStar.isDestroyed && !this.gameOver && !this.gameWon) {
            this.gameWon = true;
            this.showVictoryMessage();
        }
    }
    
    showVictoryMessage() {
        // Create victory message
        const victoryMessage = document.createElement('div');
        victoryMessage.id = 'victory-message';
        victoryMessage.style.position = 'absolute';
        victoryMessage.style.top = '50%';
        victoryMessage.style.left = '50%';
        victoryMessage.style.transform = 'translate(-50%, -50%)';
        victoryMessage.style.color = '#FFD700'; // Gold
        victoryMessage.style.fontFamily = 'Arial, sans-serif';
        victoryMessage.style.fontSize = '48px';
        victoryMessage.style.fontWeight = 'bold';
        victoryMessage.style.textAlign = 'center';
        victoryMessage.style.textShadow = '2px 2px 4px #000';
        victoryMessage.style.zIndex = '200';
        victoryMessage.innerHTML = 'VICTORY!<br>The Death Star has been destroyed!';
        
        document.body.appendChild(victoryMessage);
        
        // Create final score display
        const finalScore = document.createElement('div');
        finalScore.id = 'final-score';
        finalScore.style.position = 'absolute';
        finalScore.style.top = 'calc(50% + 80px)';
        finalScore.style.left = '50%';
        finalScore.style.transform = 'translateX(-50%)';
        finalScore.style.color = '#FFFFFF';
        finalScore.style.fontFamily = 'Arial, sans-serif';
        finalScore.style.fontSize = '24px';
        finalScore.style.textAlign = 'center';
        finalScore.style.textShadow = '1px 1px 2px #000';
        finalScore.style.zIndex = '200';
        finalScore.innerHTML = `Final Score: ${this.score}`;
        
        document.body.appendChild(finalScore);
        
        // Create restart button
        const restartButton = document.createElement('button');
        restartButton.id = 'restart-button';
        restartButton.style.position = 'absolute';
        restartButton.style.top = 'calc(50% + 130px)';
        restartButton.style.left = '50%';
        restartButton.style.transform = 'translateX(-50%)';
        restartButton.style.padding = '10px 20px';
        restartButton.style.backgroundColor = '#333';
        restartButton.style.color = 'white';
        restartButton.style.border = '2px solid #666';
        restartButton.style.borderRadius = '5px';
        restartButton.style.fontSize = '18px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.zIndex = '200';
        restartButton.textContent = 'Play Again';
        
        restartButton.addEventListener('click', () => {
            window.location.reload();
        });
        
        document.body.appendChild(restartButton);
        
        // Play victory sound
        this.playVictorySound();
    }
    
    playVictorySound() {
        // Create an audio element for the victory sound
        const audio = new Audio();
        audio.src = 'https://freesound.org/data/previews/320/320655_5260872-lq.mp3'; // Replace with actual sound file
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    onWindowResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate);
        
        // Calculate delta time
        const deltaTime = this.clock.getDelta();
        
        // Skip if game is over
        if (this.gameOver || this.gameWon) {
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        // Debug log for animation loop (only log occasionally to avoid console spam)
        if (Math.random() < 0.01) {
            console.log('Game animate loop running');
        }
        
        // Update player
        if (this.player) {
            this.player.update(deltaTime);
            
            // Update speed display
            if (this.speedDisplay) {
                this.speedDisplay.textContent = `Speed: ${Math.round(this.player.speed * 50)} km/h`;
            }
            
            // Update distance display
            this.updateDistanceDisplay();
        }
        
        // Update Death Star
        if (this.deathStar) {
            this.deathStar.update(deltaTime);
        }
        
        // Spawn and update enemies
        this.spawnEnemies();
        this.updateEnemies(deltaTime);
        
        // Update power-up screen indicators
        this.updatePowerUpIndicators();
        
        // Check game state
        this.checkGameState();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    updateDistanceDisplay() {
        if (!this.player || !this.player.ship || !this.deathStar || !this.deathStar.mesh) return;
        
        // Calculate distance to Death Star
        const playerPos = this.player.ship.position.clone();
        const deathStarPos = this.deathStar.mesh.position.clone();
        const distance = playerPos.distanceTo(deathStarPos);
        
        // Update distance text
        if (this.distanceDisplay) {
            this.distanceDisplay.textContent = `Distance to Death Star: ${Math.round(distance)} units`;
        }
        
        // Update distance bar
        if (this.distanceBar) {
            // Calculate percentage (assuming initial distance is around 2000)
            const initialDistance = 2000;
            const percentage = Math.max(0, Math.min(100, (1 - distance / initialDistance) * 100));
            this.distanceBar.style.width = `${percentage}%`;
            
            // Change color based on distance
            if (percentage < 30) {
                this.distanceBar.style.backgroundColor = '#ff3333'; // Red when far
            } else if (percentage < 70) {
                this.distanceBar.style.backgroundColor = '#ffff33'; // Yellow when medium
            } else {
                this.distanceBar.style.backgroundColor = '#33ff33'; // Green when close
            }
        }
    }
    
    updatePowerUpIndicators() {
        if (!this.player || !this.camera) return;
        
        // Update each power-up's screen indicator
        for (const powerUp of this.powerUps) {
            if (powerUp && typeof powerUp.updateScreenIndicator === 'function') {
                try {
                    powerUp.updateScreenIndicator(this.camera);
                } catch (error) {
                    console.warn('Error updating power-up indicator:', error);
                }
            }
        }
    }
    
    dispose() {
        // Clean up event listeners
        window.removeEventListener('resize', this.onWindowResize);
        
        // Clean up player
        if (this.player) {
            this.player.dispose();
        }
        
        // Clean up Death Star
        if (this.deathStar) {
            this.deathStar.dispose();
        }
        
        // Clean up TIE Fighters
        this.tieFighters.forEach(tieFighter => {
            tieFighter.dispose();
        });
        
        // Clean up Turrets
        this.turrets.forEach(turret => {
            turret.dispose();
        });
        
        // Clean up Power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.dispose();
        });
        
        // Remove HUD elements
        if (this.speedDisplay && this.speedDisplay.parentNode) {
            this.speedDisplay.parentNode.removeChild(this.speedDisplay);
        }
        
        if (this.scoreDisplay && this.scoreDisplay.parentNode) {
            this.scoreDisplay.parentNode.removeChild(this.scoreDisplay);
        }
        
        if (this.distanceDisplay && this.distanceDisplay.parentNode) {
            this.distanceDisplay.parentNode.removeChild(this.distanceDisplay);
        }
        
        // Remove controls display
        if (this.controlsDisplay && this.controlsDisplay.parentNode) {
            this.controlsDisplay.parentNode.removeChild(this.controlsDisplay);
        }
        
        // Remove damage indicator
        if (this.damageIndicator && this.damageIndicator.parentNode) {
            this.damageIndicator.parentNode.removeChild(this.damageIndicator);
        }
        
        // Remove message container
        if (this.messageContainer && this.messageContainer.parentNode) {
            this.messageContainer.parentNode.removeChild(this.messageContainer);
        }
        
        // Remove victory message if it exists
        const victoryMessage = document.getElementById('victory-message');
        if (victoryMessage && victoryMessage.parentNode) {
            victoryMessage.parentNode.removeChild(victoryMessage);
        }
        
        // Remove final score if it exists
        const finalScore = document.getElementById('final-score');
        if (finalScore && finalScore.parentNode) {
            finalScore.parentNode.removeChild(finalScore);
        }
        
        // Remove restart button if it exists
        const restartButton = document.getElementById('restart-button');
        if (restartButton && restartButton.parentNode) {
            restartButton.parentNode.removeChild(restartButton);
        }
        
        // Remove renderer from DOM
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
    
    // Show damage message and flash damage indicator
    showDamageMessage(message, color = "#ff0000") {
        // Display message
        this.messageContainer.textContent = message;
        this.messageContainer.style.color = color;
        this.messageContainer.style.opacity = "1";
        
        // Show damage indicator
        this.damageIndicator.style.display = "block";
        
        // Clear previous timeouts
        if (this.messageTimeout) clearTimeout(this.messageTimeout);
        if (this.damageIndicatorTimeout) clearTimeout(this.damageIndicatorTimeout);
        
        // Hide message after delay
        this.messageTimeout = setTimeout(() => {
            this.messageContainer.style.opacity = "0";
        }, 1500);
        
        // Hide damage indicator after delay
        this.damageIndicatorTimeout = setTimeout(() => {
            this.damageIndicator.style.display = "none";
        }, 300);
    }
} 