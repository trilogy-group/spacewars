import * as THREE from 'three';

export class DeathStar {
    constructor(scene) {
        // References
        this.scene = scene;
        
        // Death Star properties
        this.mesh = null;
        this.position = new THREE.Vector3(0, 0, -500);
        this.radius = 100;
        
        // Health system
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
        this.isDestroyed = false;
        
        // Health bar
        this.healthBar = null;
        this.healthBarWidth = 200;
        this.healthBarHeight = 20;
        
        // Exhaust port (weak point)
        this.exhaustPort = null;
        this.exhaustPortRadius = 5;
        this.exhaustPortPosition = new THREE.Vector3(0, 0, -this.radius - 1);
        
        // Explosion effects
        this.explosionParticles = [];
        this.shockwave = null;
        
        // Exhaust port glow
        this.exhaustPortGlow = null;
        this.exhaustPortAngle = 0;
        this.exhaustPortMovementRadius = 0;
        this.exhaustPortMovementSpeed = 0;
    }
    
    async init() {
        // Create the Death Star mesh
        this.createDeathStar();
        
        // Position the Death Star much further away
        this.mesh.position.set(0, 0, -2000); // Changed from a closer position to -2000
        
        // Create the exhaust port
        this.createExhaustPort();
        
        this.createHealthBar();
    }
    
    createDeathStar() {
        // Create a sphere for the Death Star
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        
        // Create a texture loader
        const textureLoader = new THREE.TextureLoader();
        
        // Load Death Star texture (we'll use a simple material for now)
        const material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 10,
            bumpScale: 0.5,
            emissive: 0x222222
        });
        
        // Create the mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the Death Star
        this.mesh.position.copy(this.position);
        
        // Rotate the Death Star so the flat part (equator) is facing up
        this.mesh.rotation.x = Math.PI / 2;
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Add surface details
        this.addSurfaceDetails();
    }
    
    addSurfaceDetails() {
        // Add a trench
        const trenchWidth = 10;
        const trenchDepth = 5;
        const trenchLength = this.radius * 2;
        
        const trenchGeometry = new THREE.BoxGeometry(trenchWidth, trenchDepth, trenchLength);
        const trenchMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
        
        // Position the trench on the surface
        trench.position.set(0, -this.radius + trenchDepth / 2, 0);
        
        // Add the trench to the Death Star
        this.mesh.add(trench);
        
        // Add some random surface details
        for (let i = 0; i < 50; i++) {
            const detailSize = Math.random() * 5 + 2;
            const detailGeometry = new THREE.BoxGeometry(detailSize, detailSize, detailSize);
            const detailMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
            const detail = new THREE.Mesh(detailGeometry, detailMaterial);
            
            // Random position on the surface
            const phi = Math.random() * Math.PI / 2;
            const theta = Math.random() * Math.PI * 2;
            
            const x = this.radius * Math.sin(phi) * Math.cos(theta);
            const y = -this.radius * Math.cos(phi);
            const z = this.radius * Math.sin(phi) * Math.sin(theta);
            
            detail.position.set(x, y, z);
            
            // Orient the detail to be perpendicular to the surface
            detail.lookAt(0, 0, 0);
            detail.rotateX(Math.PI / 2);
            
            this.mesh.add(detail);
        }
    }
    
    createExhaustPort() {
        // Create a cylinder for the exhaust port
        const geometry = new THREE.CylinderGeometry(this.exhaustPortRadius, this.exhaustPortRadius, 5, 16);
        const material = new THREE.MeshPhongMaterial({ color: 0x444444 });
        
        this.exhaustPort = new THREE.Mesh(geometry, material);
        
        // Position the exhaust port on the Death Star surface
        this.exhaustPort.position.copy(this.exhaustPortPosition);
        this.exhaustPort.rotation.x = Math.PI / 2;
        
        // Add the exhaust port to the Death Star mesh
        this.mesh.add(this.exhaustPort);
        
        // Add a subtle glow to the exhaust port
        this.addExhaustPortGlow();
        
        // Start the exhaust port movement
        this.startExhaustPortMovement();
    }
    
    addExhaustPortGlow() {
        // Create a subtle glow around the exhaust port
        const glowGeometry = new THREE.CylinderGeometry(this.exhaustPortRadius * 1.2, this.exhaustPortRadius * 1.2, 6, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ff88,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.exhaustPortGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.exhaustPortGlow.position.set(0, 0, 0);
        this.exhaustPortGlow.rotation.x = Math.PI / 2;
        
        this.exhaustPort.add(this.exhaustPortGlow);
    }
    
    startExhaustPortMovement() {
        // Set initial position
        this.exhaustPortAngle = 0;
        this.exhaustPortRadius = 5;
        this.exhaustPortMovementRadius = this.radius * 0.3; // Movement radius on the Death Star surface
        this.exhaustPortMovementSpeed = 0.0005; // Speed of movement
        
        // Start the movement animation
        this.updateExhaustPortPosition();
    }
    
    updateExhaustPortPosition() {
        if (this.isDestroyed) return;
        
        // Move the exhaust port in a circular pattern on the Death Star surface
        this.exhaustPortAngle += this.exhaustPortMovementSpeed;
        
        // Calculate new position
        const x = Math.sin(this.exhaustPortAngle) * this.exhaustPortMovementRadius;
        const y = Math.cos(this.exhaustPortAngle) * this.exhaustPortMovementRadius;
        const z = -this.radius - 1; // Keep it on the surface
        
        // Update exhaust port position
        this.exhaustPort.position.set(x, y, z);
        
        // Continue the animation
        requestAnimationFrame(() => this.updateExhaustPortPosition());
    }
    
    createHealthBar() {
        // Create a container for the health bar
        this.healthBar = document.createElement('div');
        this.healthBar.id = 'death-star-health';
        this.healthBar.style.position = 'absolute';
        this.healthBar.style.top = '50px';
        this.healthBar.style.left = '50%';
        this.healthBar.style.transform = 'translateX(-50%)';
        this.healthBar.style.width = `${this.healthBarWidth}px`;
        this.healthBar.style.height = `${this.healthBarHeight}px`;
        this.healthBar.style.backgroundColor = '#333';
        this.healthBar.style.border = '2px solid #666';
        this.healthBar.style.borderRadius = '4px';
        this.healthBar.style.overflow = 'hidden';
        this.healthBar.style.zIndex = '100';
        
        // Create the health fill
        const healthFill = document.createElement('div');
        healthFill.id = 'death-star-health-fill';
        healthFill.style.width = '100%';
        healthFill.style.height = '100%';
        healthFill.style.backgroundColor = '#f00';
        healthFill.style.transition = 'width 0.3s ease-in-out';
        
        // Add label
        const healthLabel = document.createElement('div');
        healthLabel.id = 'death-star-health-label';
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
        healthLabel.textContent = 'Death Star Health: 100%';
        
        // Add to the DOM
        this.healthBar.appendChild(healthFill);
        this.healthBar.appendChild(healthLabel);
        document.body.appendChild(this.healthBar);
    }
    
    updateHealthBar() {
        const healthPercentage = (this.currentHealth / this.maxHealth) * 100;
        const healthFill = document.getElementById('death-star-health-fill');
        const healthLabel = document.getElementById('death-star-health-label');
        
        if (healthFill && healthLabel) {
            healthFill.style.width = `${healthPercentage}%`;
            healthLabel.textContent = `Death Star Health: ${Math.round(healthPercentage)}%`;
            
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
        if (this.isDestroyed) return;
        
        this.currentHealth -= amount;
        
        // Update health bar
        this.updateHealthBar();
        
        // Visual feedback
        this.flashDamage();
        
        // Check if destroyed
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.destroy();
        }
    }
    
    flashDamage() {
        // Flash the Death Star red when hit
        const originalColor = this.mesh.material.color.clone();
        this.mesh.material.color.set(0xff0000);
        
        // Reset color after a short delay
        setTimeout(() => {
            this.mesh.material.color.copy(originalColor);
        }, 100);
    }
    
    destroy() {
        this.isDestroyed = true;
        
        // Explosion effect
        this.createExplosion();
        
        // Hide the Death Star
        setTimeout(() => {
            this.mesh.visible = false;
            
            // Show victory message
            this.showVictoryMessage();
        }, 2000);
    }
    
    createExplosion() {
        // Create multiple explosion stages
        this.createInitialExplosion();
        
        // Create shockwave
        this.createShockwave();
        
        // Schedule secondary explosions
        setTimeout(() => this.createSecondaryExplosion(), 500);
        setTimeout(() => this.createFinalExplosion(), 1200);
        
        // Add explosion sound
        this.playExplosionSound();
    }
    
    createInitialExplosion() {
        // Create particle system for initial explosion
        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within sphere
            const x = (Math.random() - 0.5) * this.radius;
            const y = (Math.random() - 0.5) * this.radius;
            const z = (Math.random() - 0.5) * this.radius;
            
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
            size: 4,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        particleSystem.position.copy(this.mesh.position);
        this.scene.add(particleSystem);
        this.explosionParticles.push({ system: particleSystem, geometry: particles, material: particleMaterial });
        
        // Animate the explosion
        const startTime = Date.now();
        const duration = 1500; // 1.5 seconds
        
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
                const index = this.explosionParticles.findIndex(p => p.system === particleSystem);
                if (index !== -1) {
                    this.explosionParticles.splice(index, 1);
                }
            }
        };
        
        animateExplosion();
    }
    
    createSecondaryExplosion() {
        // Create particle system for secondary explosions (multiple smaller ones)
        for (let j = 0; j < 5; j++) {
            const particleCount = 200;
            const particles = new THREE.BufferGeometry();
            
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            
            const color = new THREE.Color();
            
            // Random offset from center
            const offsetX = (Math.random() - 0.5) * this.radius * 1.5;
            const offsetY = (Math.random() - 0.5) * this.radius * 1.5;
            const offsetZ = (Math.random() - 0.5) * this.radius * 1.5;
            
            for (let i = 0; i < particleCount; i++) {
                // Random position within smaller sphere
                const radius = this.radius * 0.3;
                const x = (Math.random() - 0.5) * radius;
                const y = (Math.random() - 0.5) * radius;
                const z = (Math.random() - 0.5) * radius;
                
                positions[i * 3] = x + offsetX;
                positions[i * 3 + 1] = y + offsetY;
                positions[i * 3 + 2] = z + offsetZ;
                
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
                size: 3,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                transparent: true,
                sizeAttenuation: true
            });
            
            const particleSystem = new THREE.Points(particles, particleMaterial);
            particleSystem.position.copy(this.mesh.position);
            this.scene.add(particleSystem);
            this.explosionParticles.push({ system: particleSystem, geometry: particles, material: particleMaterial });
            
            // Animate the explosion
            const startTime = Date.now();
            const duration = 1000 + Math.random() * 500; // 1-1.5 seconds
            
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
                        
                        positions[ix] *= 1.03;
                        positions[iy] *= 1.03;
                        positions[iz] *= 1.03;
                    }
                    
                    particles.attributes.position.needsUpdate = true;
                    
                    // Fade out
                    particleMaterial.opacity = 1 - progress;
                    
                    requestAnimationFrame(animateExplosion);
                } else {
                    // Remove particle system when animation is complete
                    this.scene.remove(particleSystem);
                    const index = this.explosionParticles.findIndex(p => p.system === particleSystem);
                    if (index !== -1) {
                        this.explosionParticles.splice(index, 1);
                    }
                }
            };
            
            animateExplosion();
        }
    }
    
    createFinalExplosion() {
        // Create particle system for final massive explosion
        const particleCount = 1500;
        const particles = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within sphere
            const x = (Math.random() - 0.5) * this.radius * 2;
            const y = (Math.random() - 0.5) * this.radius * 2;
            const z = (Math.random() - 0.5) * this.radius * 2;
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Random color (orange/red/yellow/white)
            const colorChoice = Math.random();
            if (colorChoice < 0.25) {
                color.setRGB(1, 0.5, 0); // Orange
            } else if (colorChoice < 0.5) {
                color.setRGB(1, 0, 0); // Red
            } else if (colorChoice < 0.75) {
                color.setRGB(1, 1, 0); // Yellow
            } else {
                color.setRGB(1, 1, 1); // White (hot center)
            }
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 5,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        particleSystem.position.copy(this.mesh.position);
        this.scene.add(particleSystem);
        this.explosionParticles.push({ system: particleSystem, geometry: particles, material: particleMaterial });
        
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
                const index = this.explosionParticles.findIndex(p => p.system === particleSystem);
                if (index !== -1) {
                    this.explosionParticles.splice(index, 1);
                }
            }
        };
        
        animateExplosion();
    }
    
    createShockwave() {
        // Create a ring geometry for the shockwave
        const geometry = new THREE.RingGeometry(0.1, 5, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        this.shockwave = new THREE.Mesh(geometry, material);
        this.shockwave.position.copy(this.mesh.position);
        
        // Orient the ring to face the camera
        this.shockwave.lookAt(new THREE.Vector3(0, 0, 0));
        
        this.scene.add(this.shockwave);
        
        // Animate the shockwave
        const startTime = Date.now();
        const duration = 2000; // 2 seconds
        
        const animateShockwave = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Expand the ring
                const scale = this.radius * 3 * progress;
                this.shockwave.scale.set(scale, scale, scale);
                
                // Fade out
                this.shockwave.material.opacity = 0.7 * (1 - progress);
                
                requestAnimationFrame(animateShockwave);
            } else {
                // Remove shockwave when animation is complete
                this.scene.remove(this.shockwave);
                this.shockwave.geometry.dispose();
                this.shockwave.material.dispose();
                this.shockwave = null;
            }
        };
        
        animateShockwave();
    }
    
    playExplosionSound() {
        // Create an audio element for the explosion sound
        const audio = new Audio();
        audio.src = 'https://freesound.org/data/previews/273/273580_5150380-lq.mp3'; // Replace with actual sound file
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    showVictoryMessage() {
        // Create victory message
        const victoryMessage = document.createElement('div');
        victoryMessage.id = 'victory-message';
        victoryMessage.style.position = 'absolute';
        victoryMessage.style.top = '50%';
        victoryMessage.style.left = '50%';
        victoryMessage.style.transform = 'translate(-50%, -50%)';
        victoryMessage.style.color = '#FFD700';
        victoryMessage.style.fontFamily = 'Arial, sans-serif';
        victoryMessage.style.fontSize = '48px';
        victoryMessage.style.fontWeight = 'bold';
        victoryMessage.style.textAlign = 'center';
        victoryMessage.style.textShadow = '2px 2px 4px #000';
        victoryMessage.style.zIndex = '200';
        victoryMessage.innerHTML = 'VICTORY!<br>The Death Star has been destroyed!';
        
        document.body.appendChild(victoryMessage);
    }
    
    checkProjectileCollision(projectile) {
        const projectilePosition = projectile.mesh.position.clone();
        const distance = projectilePosition.distanceTo(this.mesh.position);
        
        // Check if projectile is within the Death Star's radius
        if (distance < this.radius + 5) {
            // Check if it hit the exhaust port (critical hit)
            const exhaustPortWorldPos = new THREE.Vector3();
            this.exhaustPort.getWorldPosition(exhaustPortWorldPos);
            
            const distanceToExhaustPort = projectilePosition.distanceTo(exhaustPortWorldPos);
            
            if (distanceToExhaustPort < this.exhaustPortRadius * 2) {
                // Critical hit on exhaust port!
                this.takeDamage(20);
                
                // Visual feedback for hitting the exhaust port
                this.showExhaustPortHitEffect();
                
                return true;
            } else {
                // Regular hit on surface
                this.takeDamage(5);
                return true;
            }
        }
        
        return false;
    }
    
    showExhaustPortHitEffect() {
        // Create a flash effect when the exhaust port is hit
        if (!this.exhaustPort) return;
        
        // Store original color
        const originalColor = this.exhaustPort.material.color.clone();
        
        // Flash the exhaust port
        this.exhaustPort.material.color.set(0xff0000);
        
        // Create a burst effect
        const burstGeometry = new THREE.SphereGeometry(this.exhaustPortRadius * 2, 16, 16);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.7
        });
        
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        const exhaustPortWorldPos = new THREE.Vector3();
        this.exhaustPort.getWorldPosition(exhaustPortWorldPos);
        burst.position.copy(exhaustPortWorldPos);
        this.scene.add(burst);
        
        // Animate the burst
        let scale = 1.0;
        const expandBurst = () => {
            scale += 0.2;
            burst.scale.set(scale, scale, scale);
            burst.material.opacity -= 0.1;
            
            if (burst.material.opacity > 0) {
                requestAnimationFrame(expandBurst);
            } else {
                this.scene.remove(burst);
                burstGeometry.dispose();
                burstMaterial.dispose();
            }
        };
        
        expandBurst();
        
        // Reset color after a short delay
        setTimeout(() => {
            if (this.exhaustPort && !this.isDestroyed) {
                this.exhaustPort.material.color.copy(originalColor);
            }
        }, 200);
    }
    
    update() {
        // Slowly rotate the Death Star
        if (this.mesh && !this.isDestroyed) {
            this.mesh.rotation.z += 0.001;
            
            // Pulse the exhaust port glow
            if (this.exhaustPortGlow) {
                const pulseFactor = 0.5 + 0.5 * Math.sin(Date.now() * 0.003);
                this.exhaustPortGlow.material.opacity = 0.2 + 0.2 * pulseFactor;
            }
        }
    }
    
    dispose() {
        // Remove health bar from DOM
        if (this.healthBar && this.healthBar.parentNode) {
            this.healthBar.parentNode.removeChild(this.healthBar);
        }
        
        // Remove victory message if it exists
        const victoryMessage = document.getElementById('victory-message');
        if (victoryMessage && victoryMessage.parentNode) {
            victoryMessage.parentNode.removeChild(victoryMessage);
        }
        
        // Clean up explosion particles
        this.explosionParticles.forEach(particle => {
            if (particle.system) {
                this.scene.remove(particle.system);
                if (particle.geometry) particle.geometry.dispose();
                if (particle.material) particle.material.dispose();
            }
        });
        
        // Clean up shockwave
        if (this.shockwave) {
            this.scene.remove(this.shockwave);
            if (this.shockwave.geometry) this.shockwave.geometry.dispose();
            if (this.shockwave.material) this.shockwave.material.dispose();
        }
    }
    
    getRandomSurfacePosition() {
        // Generate a random position on the Death Star surface
        const radius = this.radius;
        
        // Exclude the exhaust port area (bottom hemisphere)
        let phi = Math.random() * Math.PI; // 0 to PI (full range)
        
        // Bias towards the upper hemisphere (where turrets would be)
        if (phi > Math.PI / 2) {
            phi = Math.random() * Math.PI / 2; // 0 to PI/2
        }
        
        const theta = Math.random() * Math.PI * 2; // 0 to 2*PI
        
        // Convert spherical coordinates to Cartesian
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        // Offset by Death Star position
        const position = new THREE.Vector3(x, y, z);
        position.add(this.mesh.position);
        
        return position;
    }
} 