import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
    constructor(scene, camera) {
        // References
        this.scene = scene;
        this.camera = camera;
        
        // Ship properties
        this.ship = null;
        this.model = null;
        this.mixer = null;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // Collision properties
        this.collisionSphere = null;
        this.collisionRadius = 15; // Radius for power-up collection
        
        // Movement parameters
        this.speed = 0.1; // Changed from 0.5 to 0.1 for initial speed of 5 km/h
        this.maxSpeed = 2.0;
        this.minSpeed = 0.1;
        this.acceleration = 0.01;
        this.deceleration = 0.01;
        this.turnSpeed = 0.03;
        this.pitchSpeed = 0.02;
        this.rollSpeed = 0.03;
        this.yawSpeed = 0.02;
        
        // Boundary constraints
        this.boundaries = {
            minX: -500,
            maxX: 500,
            minY: -500,
            maxY: 500,
            minZ: -500,
            maxZ: 500
        };
        
        // Control state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            q: false,
            e: false,
            space: false
        };
        
        // Weapon properties
        this.canFire = true;
        this.fireRate = 300; // ms between shots
        this.projectiles = [];
        this.damageMultiplier = 1; // For power-ups
        
        // Target (Death Star)
        this.target = null;
        
        // Health system
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
        this.isDestroyed = false;
        this.healthBar = null;
        this.healthBarWidth = 150;
        this.healthBarHeight = 15;
        this.invulnerable = false;
        this.invulnerabilityTime = 1000; // ms of invulnerability after taking damage
        
        // Power-up effects
        this.hasShield = false;
        this.shieldMesh = null;
        
        // Targeting system
        this.targetingSystem = null;
        this.targetingDistance = 0;
        this.isTargetingExhaustPort = false;
        this.targetingReticle = null;
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Set up event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Debug log to verify event listeners are attached
        console.log('Player initialized, event listeners attached');
    }
    
    async init() {
        // Create a temporary ship (cube) until we load the model
        this.createTemporaryShip();
        
        try {
            // Load the X-wing model
            await this.loadModel();
            console.log('X-wing model loaded');
        } catch (error) {
            console.error('Error loading X-wing model:', error);
        }
        
        // Create health bar
        this.createHealthBar();
        
        // Create targeting system
        this.createTargetingSystem();
    }
    
    setTarget(target) {
        this.target = target;
    }
    
    createTemporaryShip() {
        // Create a simple geometric shape as a placeholder
        const geometry = new THREE.BoxGeometry(5, 2, 10);
        const material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
        this.ship = new THREE.Mesh(geometry, material);
        
        // Add a cone for the front to indicate direction
        const noseGeometry = new THREE.ConeGeometry(1, 4, 8);
        const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.z = -7;
        nose.rotation.x = Math.PI / 2;
        this.ship.add(nose);
        
        // Add wings
        const wingGeometry = new THREE.BoxGeometry(15, 0.5, 5);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-7.5, 0, 0);
        this.ship.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(7.5, 0, 0);
        this.ship.add(rightWing);
        
        // Position the ship
        this.ship.position.set(0, 0, 0);
        this.scene.add(this.ship);
        
        // Create collision sphere for power-up collection
        this.createCollisionSphere();
    }
    
    createCollisionSphere() {
        // Create an invisible sphere for collision detection
        const geometry = new THREE.SphereGeometry(this.collisionRadius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.0, // Invisible in game
            wireframe: false
        });
        
        this.collisionSphere = new THREE.Mesh(geometry, material);
        this.ship.add(this.collisionSphere);
        
        // For debugging, uncomment to make the collision sphere visible
        // this.collisionSphere.material.opacity = 0.2;
    }
    
    async loadModel() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            
            // We'll replace this with an actual X-wing model later
            // For now, we'll use the temporary ship
            resolve();
            
            // Uncomment this when you have a model file
            /*
            loader.load(
                './models/x-wing.glb',
                (gltf) => {
                    this.model = gltf.scene;
                    this.model.scale.set(0.1, 0.1, 0.1); // Adjust scale as needed
                    
                    // Replace the temporary ship with the loaded model
                    this.scene.remove(this.ship);
                    this.ship = this.model;
                    this.scene.add(this.ship);
                    
                    // Set up animations if any
                    if (gltf.animations && gltf.animations.length) {
                        this.mixer = new THREE.AnimationMixer(this.model);
                        gltf.animations.forEach((clip) => {
                            this.mixer.clipAction(clip).play();
                        });
                    }
                    
                    resolve();
                },
                undefined,
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
            */
        });
    }
    
    createHealthBar() {
        // Create a container for the health bar
        this.healthBar = document.createElement('div');
        this.healthBar.id = 'player-health';
        this.healthBar.style.position = 'absolute';
        this.healthBar.style.bottom = '20px';
        this.healthBar.style.right = '20px';
        this.healthBar.style.width = `${this.healthBarWidth}px`;
        this.healthBar.style.height = `${this.healthBarHeight}px`;
        this.healthBar.style.backgroundColor = '#333';
        this.healthBar.style.border = '2px solid #666';
        this.healthBar.style.borderRadius = '4px';
        this.healthBar.style.overflow = 'hidden';
        this.healthBar.style.zIndex = '100';
        
        // Create the health fill
        const healthFill = document.createElement('div');
        healthFill.id = 'player-health-fill';
        healthFill.style.width = '100%';
        healthFill.style.height = '100%';
        healthFill.style.backgroundColor = '#0f0';
        healthFill.style.transition = 'width 0.3s ease-in-out';
        
        // Add label
        const healthLabel = document.createElement('div');
        healthLabel.id = 'player-health-label';
        healthLabel.style.position = 'absolute';
        healthLabel.style.top = '0';
        healthLabel.style.left = '0';
        healthLabel.style.width = '100%';
        healthLabel.style.height = '100%';
        healthLabel.style.display = 'flex';
        healthLabel.style.justifyContent = 'center';
        healthLabel.style.alignItems = 'center';
        healthLabel.style.color = 'white';
        healthLabel.style.fontFamily = 'Arial, sans-serif';
        healthLabel.style.fontSize = '12px';
        healthLabel.style.fontWeight = 'bold';
        healthLabel.style.textShadow = '1px 1px 1px #000';
        healthLabel.textContent = 'Health: 100%';
        
        // Add to the DOM
        this.healthBar.appendChild(healthFill);
        this.healthBar.appendChild(healthLabel);
        document.body.appendChild(this.healthBar);
    }
    
    updateHealthBar() {
        const healthPercentage = (this.currentHealth / this.maxHealth) * 100;
        const healthFill = document.getElementById('player-health-fill');
        const healthLabel = document.getElementById('player-health-label');
        
        if (healthFill && healthLabel) {
            healthFill.style.width = `${healthPercentage}%`;
            healthLabel.textContent = `Health: ${Math.round(healthPercentage)}%`;
            
            // Change color based on health
            if (healthPercentage > 60) {
                healthFill.style.backgroundColor = '#0f0'; // Green
            } else if (healthPercentage > 30) {
                healthFill.style.backgroundColor = '#ff0'; // Yellow
            } else {
                healthFill.style.backgroundColor = '#f00'; // Red
            }
        }
    }
    
    takeDamage(amount) {
        // If invulnerable, don't take damage
        if (this.invulnerable) {
            return;
        }
        
        // If shield is active, don't reduce health but show shield hit effect
        if (this.hasShield) {
            this.showShieldHitEffect();
            return;
        }
        
        // Reduce health
        this.currentHealth -= amount;
        
        // Update health bar
        this.updateHealthBar();
        
        // Visual feedback
        this.flashDamage();
        
        // Play damage sound
        this.playDamageSound();
        
        // Set invulnerability
        this.invulnerable = true;
        setTimeout(() => {
            this.invulnerable = false;
        }, this.invulnerabilityTime);
        
        // Check if destroyed
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.isDestroyed = true;
            this.destroy();
        }
    }
    
    playDamageSound() {
        // Create audio element
        const audio = new Audio();
        audio.src = 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3'; // Short damage sound
        audio.volume = 0.3;
        audio.play().catch(error => {
            console.warn('Could not play damage sound:', error);
        });
    }
    
    createShield() {
        // Remove existing shield if there is one
        if (this.shieldMesh) {
            this.scene.remove(this.shieldMesh);
            this.shieldMesh.geometry.dispose();
            this.shieldMesh.material.dispose();
        }
        
        // Create shield geometry (slightly larger than the ship)
        const geometry = new THREE.SphereGeometry(10, 32, 32);
        
        // Create shield material (transparent blue)
        const material = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        // Create shield mesh
        this.shieldMesh = new THREE.Mesh(geometry, material);
        
        // Add to scene
        this.scene.add(this.shieldMesh);
        
        console.log("Shield activated");
    }
    
    showShieldHitEffect() {
        if (!this.shieldMesh) return;
        
        // Store original opacity
        const originalOpacity = this.shieldMesh.material.opacity;
        
        // Flash the shield (increase opacity)
        this.shieldMesh.material.opacity = 0.8;
        
        // Create a glow effect
        const glowGeometry = new THREE.SphereGeometry(11, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.copy(this.shieldMesh.position);
        this.scene.add(glowMesh);
        
        // Animate the glow
        let scale = 1.0;
        const expandGlow = () => {
            scale += 0.05;
            glowMesh.scale.set(scale, scale, scale);
            glowMesh.material.opacity -= 0.05;
            
            if (glowMesh.material.opacity > 0) {
                requestAnimationFrame(expandGlow);
            } else {
                this.scene.remove(glowMesh);
                glowGeometry.dispose();
                glowMaterial.dispose();
            }
        };
        
        expandGlow();
        
        // Return to original opacity after a short delay
        setTimeout(() => {
            if (this.shieldMesh) {
                this.shieldMesh.material.opacity = originalOpacity;
            }
        }, 300);
    }
    
    flashDamage() {
        // Flash the ship red when hit
        const originalMaterials = [];
        
        // Store original materials and set to red
        this.ship.traverse((child) => {
            if (child.isMesh && child.material) {
                originalMaterials.push({
                    mesh: child,
                    material: child.material.clone()
                });
                child.material.color.set(0xff0000);
            }
        });
        
        // Reset materials after a short delay
        setTimeout(() => {
            originalMaterials.forEach(item => {
                if (item.mesh) {
                    item.mesh.material.color.copy(item.material.color);
                }
            });
        }, 100);
    }
    
    destroy() {
        this.isDestroyed = true;
        
        // Create explosion effect
        this.createExplosion();
        
        // Hide the ship
        setTimeout(() => {
            if (this.ship) {
                this.ship.visible = false;
            }
            
            // Show game over message
            this.showGameOverMessage();
        }, 2000);
    }
    
    createExplosion() {
        // Create particle system for explosion
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within sphere
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 20;
            const z = (Math.random() - 0.5) * 20;
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Random color (orange/red/yellow)
            const colorChoice = Math.random();
            if (colorChoice < 0.33) {
                color.setRGB(1, 0.5, 0); // Orange
            } else if (colorChoice < 0.66) {
                color.setRGB(1, 0, 0); // Red
            } else {
                color.setRGB(1, 1, 0); // Yellow
            }
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        particleSystem.position.copy(this.ship.position);
        this.scene.add(particleSystem);
        
        // Animate the explosion
        const startTime = Date.now();
        const duration = 2000; // 2 seconds
        
        const animateExplosion = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Expand particles
                const positions = particles.attributes.position.array;
                
                for (let i = 0; i < particleCount; i++) {
                    const ix = i * 3;
                    const iy = i * 3 + 1;
                    const iz = i * 3 + 2;
                    
                    positions[ix] *= 1.02;
                    positions[iy] *= 1.02;
                    positions[iz] *= 1.02;
                }
                
                particles.attributes.position.needsUpdate = true;
                
                // Fade out
                particleMaterial.opacity = 1 - progress;
                
                requestAnimationFrame(animateExplosion);
            } else {
                // Remove particle system when animation is complete
                this.scene.remove(particleSystem);
            }
        };
        
        animateExplosion();
    }
    
    showGameOverMessage() {
        // Create game over message
        const gameOverMessage = document.createElement('div');
        gameOverMessage.id = 'game-over-message';
        gameOverMessage.style.position = 'absolute';
        gameOverMessage.style.top = '50%';
        gameOverMessage.style.left = '50%';
        gameOverMessage.style.transform = 'translate(-50%, -50%)';
        gameOverMessage.style.color = '#FF0000';
        gameOverMessage.style.fontFamily = 'Arial, sans-serif';
        gameOverMessage.style.fontSize = '48px';
        gameOverMessage.style.fontWeight = 'bold';
        gameOverMessage.style.textAlign = 'center';
        gameOverMessage.style.textShadow = '2px 2px 4px #000';
        gameOverMessage.style.zIndex = '200';
        gameOverMessage.innerHTML = 'GAME OVER<br>Your X-wing was destroyed!';
        
        document.body.appendChild(gameOverMessage);
        
        // Add restart button
        const restartButton = document.createElement('button');
        restartButton.id = 'restart-button';
        restartButton.style.position = 'absolute';
        restartButton.style.top = 'calc(50% + 100px)';
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
        restartButton.textContent = 'Restart Game';
        
        restartButton.addEventListener('click', () => {
            window.location.reload();
        });
        
        document.body.appendChild(restartButton);
    }
    
    handleKeyDown(event) {
        if (this.isDestroyed) return;
        
        console.log('Key down event:', event.key.toLowerCase());
        
        switch (event.key.toLowerCase()) {
            case 'w':
                this.keys.w = true;
                break;
            case 'a':
                this.keys.a = true;
                break;
            case 's':
                this.keys.s = true;
                break;
            case 'd':
                this.keys.d = true;
                break;
            case 'q':
                this.keys.q = true;
                break;
            case 'e':
                this.keys.e = true;
                break;
            case ' ':
                this.keys.space = true;
                this.fire();
                break;
        }
    }
    
    handleKeyUp(event) {
        switch (event.key.toLowerCase()) {
            case 'w':
                this.keys.w = false;
                break;
            case 'a':
                this.keys.a = false;
                break;
            case 's':
                this.keys.s = false;
                break;
            case 'd':
                this.keys.d = false;
                break;
            case 'q':
                this.keys.q = false;
                break;
            case 'e':
                this.keys.e = false;
                break;
            case ' ':
                this.keys.space = false;
                break;
        }
    }
    
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // Debug log for update method (only log occasionally to avoid console spam)
        if (Math.random() < 0.01) {
            console.log('Player update called, keys state:', this.keys);
        }
        
        // Handle speed changes (Q/E)
        if (this.keys.q && this.speed > this.minSpeed) {
            this.speed -= this.acceleration;
        }
        if (this.keys.e && this.speed < this.maxSpeed) {
            this.speed += this.acceleration;
        }
        
        // Handle pitch (W/S)
        if (this.keys.w) {
            this.ship.rotation.x -= this.pitchSpeed;
        }
        if (this.keys.s) {
            this.ship.rotation.x += this.pitchSpeed;
        }
        
        // Handle turning (A/D)
        if (this.keys.a) {
            this.ship.rotation.y += this.turnSpeed;
        }
        if (this.keys.d) {
            this.ship.rotation.y -= this.turnSpeed;
        }
        
        // Update position based on current rotation and speed
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.ship.quaternion);
        direction.normalize();
        
        this.velocity.copy(direction).multiplyScalar(this.speed);
        
        // Store previous position for collision detection
        const previousPosition = this.ship.position.clone();
        
        // Apply movement
        this.ship.position.add(this.velocity);
        
        // Check for collisions with Death Star
        if (this.target && !this.invulnerable) {
            const collided = this.checkCollisionWithDeathStar();
            if (collided) {
                // Revert to previous position
                this.ship.position.copy(previousPosition);
                
                // Take damage
                this.takeDamage(20);
            }
        }
        
        // Apply boundary constraints
        this.applyBoundaryConstraints();
        
        // Update camera to follow the ship
        this.updateCamera();
        
        // Update projectiles and check for collisions
        this.updateProjectiles(deltaTime);
        
        // Update animations if any
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // Update shield position if active
        if (this.hasShield && this.shieldMesh) {
            this.shieldMesh.position.copy(this.ship.position);
            
            // Add subtle shield animation (pulsing)
            const time = Date.now() * 0.001;
            const pulseAmount = Math.sin(time * 2) * 0.1 + 0.9;
            this.shieldMesh.scale.set(pulseAmount, pulseAmount, pulseAmount);
        }
        
        // Update targeting system
        this.updateTargetingSystem();
        
        // Update collision sphere position
        if (this.collisionSphere) {
            this.collisionSphere.position.set(0, 0, 0); // Keep centered on the ship
        }
    }
    
    checkCollisionWithDeathStar() {
        if (!this.target || !this.target.mesh) return false;
        
        // Get Death Star position and radius
        const deathStarPosition = this.target.mesh.position.clone();
        const deathStarRadius = this.target.radius;
        
        // Calculate distance between ship and Death Star surface
        const distanceToCenter = this.ship.position.distanceTo(deathStarPosition);
        const distanceToSurface = distanceToCenter - deathStarRadius;
        
        // Check if ship is too close to the Death Star surface
        // Using a small buffer (5 units) to account for ship size
        if (distanceToSurface < 5) {
            console.log('Collision with Death Star!');
            return true;
        }
        
        return false;
    }
    
    applyBoundaryConstraints() {
        // Constrain X position
        if (this.ship.position.x < this.boundaries.minX) {
            this.ship.position.x = this.boundaries.minX;
        } else if (this.ship.position.x > this.boundaries.maxX) {
            this.ship.position.x = this.boundaries.maxX;
        }
        
        // Constrain Y position
        if (this.ship.position.y < this.boundaries.minY) {
            this.ship.position.y = this.boundaries.minY;
        } else if (this.ship.position.y > this.boundaries.maxY) {
            this.ship.position.y = this.boundaries.maxY;
        }
        
        // Constrain Z position
        if (this.ship.position.z < this.boundaries.minZ) {
            this.ship.position.z = this.boundaries.minZ;
        } else if (this.ship.position.z > this.boundaries.maxZ) {
            this.ship.position.z = this.boundaries.maxZ;
        }
    }
    
    updateCamera() {
        if (!this.ship || !this.camera) return;
        
        // Position the camera behind the ship
        const cameraOffset = new THREE.Vector3(0, 5, 20);
        const cameraPosition = this.ship.localToWorld(cameraOffset.clone());
        
        // Smoothly move the camera to the new position
        this.camera.position.lerp(cameraPosition, 0.1);
        
        // Look at a point ahead of the ship
        const lookAtOffset = new THREE.Vector3(0, 0, -100);
        const lookAtPoint = this.ship.localToWorld(lookAtOffset.clone());
        this.camera.lookAt(lookAtPoint);
    }
    
    fire() {
        if (!this.canFire || this.isDestroyed) return;
        
        // Create a laser projectile
        const projectileGeometry = new THREE.BoxGeometry(0.2, 0.2, 5);
        const projectileMaterial = new THREE.MeshBasicMaterial({ 
            color: this.isTargetingExhaustPort ? 0x00ff00 : 0xff0000 // Green if targeting exhaust port, red otherwise
        });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        
        // Position the projectile at the front of the ship
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.ship.quaternion);
        
        const offset = direction.clone().multiplyScalar(7); // Adjust based on ship size
        projectile.position.copy(this.ship.position).add(offset);
        
        // Set the projectile's rotation to match the ship's
        projectile.quaternion.copy(this.ship.quaternion);
        
        // Add the projectile to the scene and the projectiles array
        this.scene.add(projectile);
        this.projectiles.push({
            mesh: projectile,
            velocity: direction.multiplyScalar(5), // Projectile speed
            lifeTime: 2000, // Time in ms before the projectile is removed
            created: Date.now(),
            hasHit: false,
            damage: this.isTargetingExhaustPort ? 20 * this.damageMultiplier : 10 * this.damageMultiplier // More damage if targeting exhaust port
        });
        
        // Set a cooldown for firing
        this.canFire = false;
        setTimeout(() => {
            this.canFire = true;
        }, this.fireRate);
    }
    
    updateProjectiles(deltaTime) {
        const now = Date.now();
        const projectilesToRemove = [];
        
        // Update each projectile
        this.projectiles.forEach((projectile, index) => {
            // Skip if projectile has already hit something
            if (projectile.hasHit) {
                projectilesToRemove.push(index);
                return;
            }
            
            // Move the projectile
            projectile.mesh.position.add(projectile.velocity);
            
            // Check for collision with the Death Star
            if (this.target && !projectile.hasHit) {
                const hasHit = this.target.checkProjectileCollision(projectile);
                if (hasHit) {
                    projectile.hasHit = true;
                    projectilesToRemove.push(index);
                }
            }
            
            // Check if the projectile should be removed due to lifetime
            if (now - projectile.created > projectile.lifeTime) {
                projectilesToRemove.push(index);
            }
        });
        
        // Remove expired or hit projectiles (in reverse order to avoid index issues)
        for (let i = projectilesToRemove.length - 1; i >= 0; i--) {
            const index = projectilesToRemove[i];
            const projectile = this.projectiles[index];
            
            this.scene.remove(projectile.mesh);
            this.projectiles.splice(index, 1);
        }
    }
    
    createTargetingSystem() {
        // Create a targeting reticle
        const reticleGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
        const reticleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        this.targetingReticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
        this.targetingReticle.visible = false;
        this.scene.add(this.targetingReticle);
        
        // Create targeting HUD element
        this.targetingHUD = document.createElement('div');
        this.targetingHUD.id = 'targeting-hud';
        this.targetingHUD.style.position = 'absolute';
        this.targetingHUD.style.bottom = '20px';
        this.targetingHUD.style.left = '50%';
        this.targetingHUD.style.transform = 'translateX(-50%)';
        this.targetingHUD.style.color = '#ff0000';
        this.targetingHUD.style.fontFamily = 'monospace';
        this.targetingHUD.style.fontSize = '14px';
        this.targetingHUD.style.textAlign = 'center';
        this.targetingHUD.style.padding = '5px 10px';
        this.targetingHUD.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.targetingHUD.style.borderRadius = '5px';
        this.targetingHUD.style.display = 'none';
        this.targetingHUD.style.zIndex = '100';
        document.body.appendChild(this.targetingHUD);
    }
    
    updateTargetingSystem() {
        if (!this.target || !this.target.exhaustPort || !this.ship || this.isDestroyed) {
            if (this.targetingReticle) this.targetingReticle.visible = false;
            if (this.targetingHUD) this.targetingHUD.style.display = 'none';
            return;
        }
        
        // Get exhaust port world position
        const exhaustPortWorldPos = new THREE.Vector3();
        this.target.exhaustPort.getWorldPosition(exhaustPortWorldPos);
        
        // Calculate distance to exhaust port
        const distanceToExhaustPort = this.ship.position.distanceTo(exhaustPortWorldPos);
        this.targetingDistance = distanceToExhaustPort;
        
        // Check if we're within targeting range (500 units)
        if (distanceToExhaustPort < 500) {
            // Position the reticle at the exhaust port position
            this.targetingReticle.position.copy(exhaustPortWorldPos);
            
            // Make the reticle face the camera
            this.targetingReticle.lookAt(this.camera.position);
            
            // Scale the reticle based on distance
            const scale = Math.max(distanceToExhaustPort * 0.02, 5);
            this.targetingReticle.scale.set(scale, scale, scale);
            
            // Show the reticle
            this.targetingReticle.visible = true;
            
            // Check if we're aligned with the exhaust port
            const shipDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.ship.quaternion);
            const toExhaustPort = exhaustPortWorldPos.clone().sub(this.ship.position).normalize();
            const alignment = shipDirection.dot(toExhaustPort);
            
            // If alignment is close to 1, we're pointing at the exhaust port
            this.isTargetingExhaustPort = alignment > 0.98;
            
            // Update targeting HUD
            this.targetingHUD.style.display = 'block';
            if (this.isTargetingExhaustPort) {
                this.targetingHUD.style.color = '#00ff00';
                this.targetingHUD.textContent = 'EXHAUST PORT LOCKED - FIRE!';
                
                // Make the reticle pulse when locked
                const pulseFactor = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
                this.targetingReticle.material.color.setRGB(0, 1, 0);
                this.targetingReticle.material.opacity = 0.5 + 0.5 * pulseFactor;
            } else {
                this.targetingHUD.style.color = '#ff0000';
                this.targetingHUD.textContent = 'TARGETING EXHAUST PORT - ALIGN SHOT';
                this.targetingReticle.material.color.setRGB(1, 0, 0);
                this.targetingReticle.material.opacity = 0.7;
            }
        } else {
            // Hide the reticle if we're too far
            this.targetingReticle.visible = false;
            this.targetingHUD.style.display = 'none';
            this.isTargetingExhaustPort = false;
        }
    }
    
    // Clean up event listeners and DOM elements when the player is destroyed
    dispose() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        // Remove health bar from DOM
        if (this.healthBar && this.healthBar.parentNode) {
            this.healthBar.parentNode.removeChild(this.healthBar);
        }
        
        // Remove game over message if it exists
        const gameOverMessage = document.getElementById('game-over-message');
        if (gameOverMessage && gameOverMessage.parentNode) {
            gameOverMessage.parentNode.removeChild(gameOverMessage);
        }
        
        // Remove restart button if it exists
        const restartButton = document.getElementById('restart-button');
        if (restartButton && restartButton.parentNode) {
            restartButton.parentNode.removeChild(restartButton);
        }
        
        // Clean up shield
        if (this.shieldMesh) {
            this.scene.remove(this.shieldMesh);
            this.shieldMesh.geometry.dispose();
            this.shieldMesh.material.dispose();
            this.shieldMesh = null;
        }
        
        // Remove targeting HUD
        if (this.targetingHUD && this.targetingHUD.parentNode) {
            this.targetingHUD.parentNode.removeChild(this.targetingHUD);
        }
        
        // Remove targeting reticle
        if (this.targetingReticle) {
            this.scene.remove(this.targetingReticle);
            if (this.targetingReticle.geometry) this.targetingReticle.geometry.dispose();
            if (this.targetingReticle.material) this.targetingReticle.material.dispose();
        }
    }
    
    // Add a method to get the world position of the collision sphere
    getCollisionSphereWorldPosition() {
        if (!this.collisionSphere) return null;
        
        const position = new THREE.Vector3();
        this.collisionSphere.getWorldPosition(position);
        return position;
    }
    
    // Add a method to check if a point is within the collision sphere
    isPointInCollisionSphere(point) {
        if (!this.collisionSphere || !this.ship) return false;
        
        const spherePosition = this.getCollisionSphereWorldPosition();
        if (!spherePosition) return false;
        
        const distance = spherePosition.distanceTo(point);
        return distance <= this.collisionRadius;
    }
} 