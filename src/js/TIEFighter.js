import * as THREE from 'three';

export class TIEFighter {
    constructor(scene, player, position) {
        // References
        this.scene = scene;
        this.player = player;
        
        // TIE Fighter properties
        this.mesh = null;
        this.position = position || new THREE.Vector3(0, 0, -300);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        // Movement parameters
        this.speed = 1.2;
        this.rotationSpeed = 0.02;
        this.minDistance = 150; // Minimum distance to keep from player
        this.maxDistance = 300; // Maximum distance to keep from player
        
        // Combat properties
        this.canFire = true;
        this.fireRate = 1500; // ms between shots
        this.projectiles = [];
        this.firingRange = 200; // Distance at which TIE fighter will start firing
        
        // State
        this.isDestroyed = false;
        this.health = 20;
    }
    
    init() {
        this.createTIEFighter();
    }
    
    createTIEFighter() {
        // Create the main body (sphere)
        const bodyGeometry = new THREE.SphereGeometry(5, 16, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Create the cockpit window
        const windowGeometry = new THREE.SphereGeometry(3, 16, 16);
        const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const cockpitWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        this.mesh.add(cockpitWindow);
        
        // Create the wings (hexagonal panels)
        const wingGeometry = new THREE.BoxGeometry(20, 20, 1);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-10, 0, 0);
        leftWing.rotation.y = Math.PI / 2;
        this.mesh.add(leftWing);
        
        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(10, 0, 0);
        rightWing.rotation.y = Math.PI / 2;
        this.mesh.add(rightWing);
        
        // Add wing connectors
        const connectorGeometry = new THREE.CylinderGeometry(1, 1, 20, 8);
        const connectorMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        
        const leftConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
        leftConnector.position.set(-5, 0, 0);
        leftConnector.rotation.z = Math.PI / 2;
        this.mesh.add(leftConnector);
        
        const rightConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
        rightConnector.position.set(5, 0, 0);
        rightConnector.rotation.z = Math.PI / 2;
        this.mesh.add(rightConnector);
        
        // Position the TIE Fighter
        this.mesh.position.copy(this.position);
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // Update position based on AI behavior
        this.updateMovement(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Check if should fire
        this.checkFiring();
    }
    
    updateMovement(deltaTime) {
        if (!this.player || !this.player.ship) return;
        
        // Calculate direction to player
        const playerPosition = this.player.ship.position.clone();
        const toPlayer = playerPosition.sub(this.mesh.position);
        const distanceToPlayer = toPlayer.length();
        
        // Normalize direction
        this.direction = toPlayer.normalize();
        
        // Determine behavior based on distance to player
        if (distanceToPlayer < this.minDistance) {
            // Too close, back away
            this.velocity.copy(this.direction).multiplyScalar(-this.speed);
        } else if (distanceToPlayer > this.maxDistance) {
            // Too far, move closer
            this.velocity.copy(this.direction).multiplyScalar(this.speed);
        } else {
            // In the sweet spot, circle around the player
            const circleDirection = new THREE.Vector3().crossVectors(this.direction, new THREE.Vector3(0, 1, 0)).normalize();
            this.velocity.copy(circleDirection).multiplyScalar(this.speed);
        }
        
        // Apply velocity to position
        this.mesh.position.add(this.velocity);
        
        // Make the TIE Fighter face the player
        const lookAtPosition = this.player.ship.position.clone();
        this.mesh.lookAt(lookAtPosition);
        
        // Add some randomness to movement
        if (Math.random() < 0.02) {
            this.velocity.x += (Math.random() - 0.5) * 0.5;
            this.velocity.y += (Math.random() - 0.5) * 0.5;
            this.velocity.z += (Math.random() - 0.5) * 0.5;
        }
    }
    
    checkFiring() {
        if (!this.canFire || !this.player || !this.player.ship) return;
        
        // Calculate distance to player
        const playerPosition = this.player.ship.position.clone();
        const distanceToPlayer = playerPosition.distanceTo(this.mesh.position);
        
        // Check if player is in firing range
        if (distanceToPlayer < this.firingRange) {
            this.fire();
        }
    }
    
    fire() {
        // Create a laser projectile
        const projectileGeometry = new THREE.BoxGeometry(0.2, 0.2, 5);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green lasers for TIE fighters
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        
        // Position the projectile at the front of the TIE Fighter
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.mesh.quaternion);
        
        const offset = direction.clone().multiplyScalar(7); // Adjust based on TIE Fighter size
        projectile.position.copy(this.mesh.position).add(offset);
        
        // Set the projectile's rotation to match the TIE Fighter's
        projectile.quaternion.copy(this.mesh.quaternion);
        
        // Add the projectile to the scene and the projectiles array
        this.scene.add(projectile);
        this.projectiles.push({
            mesh: projectile,
            velocity: direction.multiplyScalar(3), // Projectile speed
            lifeTime: 2000, // Time in ms before the projectile is removed
            created: Date.now(),
            hasHit: false
        });
        
        // Set a cooldown for firing
        this.canFire = false;
        setTimeout(() => {
            this.canFire = true;
        }, this.fireRate);
    }
    
    updateProjectiles(deltaTime) {
        // Update each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Update projectile position
            projectile.mesh.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));
            
            // Check for collision with player
            if (this.scene && this.scene.player && this.scene.player.position) {
                const distance = projectile.mesh.position.distanceTo(this.scene.player.position);
                if (distance < 10 && !this.scene.player.isInvulnerable) {
                    // Hit player
                    this.scene.player.takeDamage(10);
                    this.createHitEffect(projectile.mesh.position.clone());
                    
                    // Show damage message
                    if (this.scene.game) {
                        this.scene.game.showDamageMessage("TIE Fighter hit! -10 Health", "#ff0000");
                    }
                    
                    // Remove projectile
                    if (this.scene) {
                        this.scene.remove(projectile.mesh);
                    }
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }
            
            // Check if projectile is out of bounds or too old
            const now = Date.now();
            if (now - projectile.created > projectile.lifeTime) {
                if (this.scene) {
                    this.scene.remove(projectile.mesh);
                }
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check if projectile is too far from origin
            if (projectile.mesh.position.distanceTo(this.mesh.position) > 500) {
                if (this.scene) {
                    this.scene.remove(projectile.mesh);
                }
                this.projectiles.splice(i, 1);
                continue;
            }
        }
    }
    
    takeDamage(amount) {
        if (this.isDestroyed) return;
        
        this.health -= amount;
        
        // Visual feedback
        this.flashDamage();
        
        // Check if destroyed
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    flashDamage() {
        // Flash the TIE Fighter red when hit
        const originalColor = this.mesh.material.color.clone();
        this.mesh.material.color.set(0xff0000);
        
        // Reset color after a short delay
        setTimeout(() => {
            if (this.mesh && this.mesh.material) {
                this.mesh.material.color.copy(originalColor);
            }
        }, 100);
    }
    
    destroy() {
        this.isDestroyed = true;
        
        // Create explosion effect
        this.createExplosion();
        
        // Remove from scene after explosion
        setTimeout(() => {
            if (this.mesh) {
                this.scene.remove(this.mesh);
                this.mesh = null;
            }
        }, 1000);
    }
    
    createExplosion() {
        // Create particle system for explosion
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within sphere
            const x = (Math.random() - 0.5) * 10;
            const y = (Math.random() - 0.5) * 10;
            const z = (Math.random() - 0.5) * 10;
            
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
        particleSystem.position.copy(this.mesh.position);
        this.scene.add(particleSystem);
        
        // Animate the explosion
        const startTime = Date.now();
        const duration = 1000; // 1 second
        
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
                    
                    positions[ix] *= 1.05;
                    positions[iy] *= 1.05;
                    positions[iz] *= 1.05;
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
    
    checkProjectileCollision(projectile) {
        if (this.isDestroyed || !this.mesh) return false;
        
        // Check if projectile hits the TIE Fighter
        const projectilePosition = projectile.mesh.position.clone();
        const distance = projectilePosition.distanceTo(this.mesh.position);
        
        // Simple collision detection
        if (distance < 10) { // Adjust based on TIE Fighter size
            this.takeDamage(10);
            return true;
        }
        
        return false;
    }
    
    dispose() {
        // Clean up projectiles
        this.projectiles.forEach(projectile => {
            if (projectile.mesh) {
                this.scene.remove(projectile.mesh);
            }
        });
        this.projectiles = [];
        
        // Remove TIE Fighter from scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }
    }
    
    createHitEffect(position) {
        if (!this.scene) return;
        
        // Create a flash effect at the hit position
        const geometry = new THREE.SphereGeometry(2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        
        const hitEffect = new THREE.Mesh(geometry, material);
        hitEffect.position.copy(position);
        this.scene.add(hitEffect);
        
        // Animate the hit effect
        const startTime = Date.now();
        const duration = 300; // ms
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                // Remove the hit effect when animation is complete
                if (this.scene) {
                    this.scene.remove(hitEffect);
                }
                return;
            }
            
            // Scale down and fade out
            const scale = 1 + progress * 2;
            hitEffect.scale.set(scale, scale, scale);
            material.opacity = 0.8 * (1 - progress);
            
            // Continue animation
            requestAnimationFrame(animate);
        };
        
        animate();
    }
} 