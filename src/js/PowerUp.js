import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class PowerUp {
    constructor(scene, player, position, type) {
        // References
        this.scene = scene;
        this.player = player;
        this.position = position.clone();
        this.type = type || this.getRandomType();
        
        // PowerUp properties
        this.mesh = null;
        this.rotationSpeed = 0.02;
        this.bobSpeed = 1.5;
        this.bobHeight = 0.5;
        this.initialY = position.y;
        this.time = Math.random() * Math.PI * 2; // Random start time for bobbing
        this.size = 5;
        this.isCollected = false;
        this.lifeTime = 15000; // PowerUp disappears after 15 seconds
        this.creationTime = Date.now();
        
        // Screen indicator properties
        this.screenIndicator = null;
        this.isVisible = false;
        
        // PowerUp effects
        this.effects = {
            health: {
                color: 0xff0000, // Red
                amount: 30,
                duration: 0 // Instant effect
            },
            shield: {
                color: 0x0088ff, // Blue
                duration: 10000 // 10 seconds
            },
            rapidFire: {
                color: 0xffff00, // Yellow
                duration: 8000, // 8 seconds
                fireRateMultiplier: 3
            },
            doubleDamage: {
                color: 0xff8800, // Orange
                duration: 10000, // 10 seconds
                damageMultiplier: 2
            }
        };
    }
    
    init() {
        this.createPowerUp();
        
        // Position the power-up
        this.mesh.position.copy(this.position);
        
        // Create screen indicator
        this.createScreenIndicator();
    }
    
    getRandomType() {
        const types = ['health', 'shield', 'rapidFire', 'doubleDamage'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    createPowerUp() {
        // Create geometry based on power-up type
        let geometry;
        const effect = this.effects[this.type];
        
        switch (this.type) {
            case 'health':
                // Create a cross shape for health power-up
                const horizontalBar = new THREE.BoxGeometry(this.size, this.size / 3, this.size / 3);
                const verticalBar = new THREE.BoxGeometry(this.size / 3, this.size, this.size / 3);
                geometry = BufferGeometryUtils.mergeBufferGeometries([
                    horizontalBar,
                    verticalBar
                ]);
                break;
            case 'shield':
                // Sphere for shield power-up
                geometry = new THREE.SphereGeometry(this.size / 2, 16, 16);
                break;
            case 'rapidFire':
                // Octahedron for rapid fire power-up
                geometry = new THREE.OctahedronGeometry(this.size / 2);
                break;
            case 'doubleDamage':
                // Tetrahedron for double damage power-up
                geometry = new THREE.TetrahedronGeometry(this.size / 2);
                break;
            default:
                // Default cube
                geometry = new THREE.BoxGeometry(this.size / 2, this.size / 2, this.size / 2);
        }
        
        // Create material with glow effect
        const material = new THREE.MeshPhongMaterial({
            color: effect.color,
            emissive: effect.color,
            emissiveIntensity: 0.8, // Increased from 0.5
            transparent: true,
            opacity: 0.9, // Increased from 0.8
            shininess: 100
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Create glow effect
        this.createGlowEffect();
    }
    
    createGlowEffect() {
        // Create a larger, transparent version of the mesh for the glow effect
        const glowSize = this.size * 1.5;
        let glowGeometry;
        
        switch (this.type) {
            case 'health':
                glowGeometry = new THREE.BoxGeometry(glowSize, glowSize / 3, glowSize / 3);
                const verticalGlow = new THREE.BoxGeometry(glowSize / 3, glowSize, glowSize / 3);
                glowGeometry = BufferGeometryUtils.mergeBufferGeometries([
                    glowGeometry,
                    verticalGlow
                ]);
                break;
            case 'shield':
                glowGeometry = new THREE.SphereGeometry(glowSize / 2, 16, 16);
                break;
            case 'rapidFire':
                glowGeometry = new THREE.OctahedronGeometry(glowSize / 2);
                break;
            case 'doubleDamage':
                glowGeometry = new THREE.TetrahedronGeometry(glowSize / 2);
                break;
            default:
                glowGeometry = new THREE.BoxGeometry(glowSize / 2, glowSize / 2, glowSize / 2);
        }
        
        const effect = this.effects[this.type];
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: effect.color,
            transparent: true,
            opacity: 0.7,
            side: THREE.BackSide
        });
        
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glowMesh);
        
        // Add pulsing animation to the glow
        this.glowPulseTime = 0;
        this.glowPulseSpeed = 2.0; // Speed of pulsing
        this.glowPulseMin = 0.7; // Minimum opacity
        this.glowPulseMax = 1.0; // Maximum opacity
    }
    
    createScreenIndicator() {
        this.screenIndicator = document.createElement('div');
        this.screenIndicator.style.position = 'absolute';
        this.screenIndicator.style.width = '30px';
        this.screenIndicator.style.height = '30px';
        this.screenIndicator.style.borderRadius = '50%';
        this.screenIndicator.style.backgroundColor = this.getColorForType();
        this.screenIndicator.style.border = '2px solid white';
        this.screenIndicator.style.boxShadow = `0 0 10px ${this.getColorForType()}`;
        this.screenIndicator.style.display = 'none';
        this.screenIndicator.style.zIndex = '1000';
        this.screenIndicator.style.opacity = '0.8';
        this.screenIndicator.style.transition = 'transform 0.2s ease-in-out';
        
        // Add pulsing animation
        this.screenIndicator.style.animation = 'pulse 1.5s infinite';
        
        // Add CSS keyframes for pulsing animation if not already added
        if (!document.getElementById('power-up-animations')) {
            const style = document.createElement('style');
            style.id = 'power-up-animations';
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1) translate(-50%, -50%); opacity: 0.8; }
                    50% { transform: scale(1.2) translate(-50%, -50%); opacity: 1; }
                    100% { transform: scale(1) translate(-50%, -50%); opacity: 0.8; }
                }
                
                @keyframes arrow-pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add inner circle for visual appeal
        const innerCircle = document.createElement('div');
        innerCircle.style.position = 'absolute';
        innerCircle.style.top = '50%';
        innerCircle.style.left = '50%';
        innerCircle.style.transform = 'translate(-50%, -50%)';
        innerCircle.style.width = '15px';
        innerCircle.style.height = '15px';
        innerCircle.style.borderRadius = '50%';
        innerCircle.style.backgroundColor = 'white';
        innerCircle.style.opacity = '0.6';
        this.screenIndicator.appendChild(innerCircle);
        
        // Add directional arrow
        const arrow = document.createElement('div');
        arrow.style.position = 'absolute';
        arrow.style.top = '50%';
        arrow.style.left = '50%';
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.borderLeft = '8px solid transparent';
        arrow.style.borderRight = '8px solid transparent';
        arrow.style.borderBottom = `12px solid ${this.getColorForType()}`;
        arrow.style.transform = 'translate(-50%, -50%)';
        arrow.style.animation = 'arrow-pulse 1.5s infinite';
        arrow.style.filter = 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))';
        arrow.className = 'power-up-arrow';
        this.screenIndicator.appendChild(arrow);
        
        // Function to get the appropriate label for the power-up type
        const getLabelForType = (type) => {
            switch(type) {
                case 'health':
                    return 'Health';
                case 'shield':
                    return 'Shield';
                case 'rapidFire':
                    return 'Rapid Fire';
                case 'doubleDamage':
                    return 'Double Damage';
                default:
                    return 'Power-Up';
            }
        };
        
        // Add a label for the power-up type
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.top = '100%';
        label.style.left = '50%';
        label.style.transform = 'translateX(-50%)';
        label.style.color = 'white';
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        label.style.textShadow = '1px 1px 2px black';
        label.style.marginTop = '5px';
        label.textContent = getLabelForType(this.type);
        this.screenIndicator.appendChild(label);
        
        document.body.appendChild(this.screenIndicator);
    }
    
    getColorForType() {
        switch(this.type) {
            case 'health':
                return '#ff0000'; // Red
            case 'shield':
                return '#0088ff'; // Blue
            case 'rapidFire':
                return '#ffff00'; // Yellow
            case 'doubleDamage':
                return '#ff8800'; // Orange
            default:
                return '#ffffff'; // White
        }
    }
    
    getLabelForType() {
        switch(this.type) {
            case 'health':
                return 'Health';
            case 'shield':
                return 'Shield';
            case 'rapidFire':
                return 'Rapid Fire';
            case 'doubleDamage':
                return 'Double Damage';
            default:
                return 'Power-Up';
        }
    }
    
    updateScreenIndicator(camera) {
        if (this.isCollected || !this.screenIndicator || !this.mesh) return;
        
        // Check if power-up is in view
        const powerUpPosition = this.mesh.position.clone();
        const screenPosition = powerUpPosition.project(camera);
        
        // Convert to screen coordinates
        const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(screenPosition.y * 0.5) + 0.5) * window.innerHeight;
        
        // Check if power-up is in front of the camera (z < 1 in NDC space)
        const isBehindCamera = screenPosition.z > 1;
        
        // Check if power-up is within screen bounds
        const isOnScreen = (
            x >= 0 && x <= window.innerWidth &&
            y >= 0 && y <= window.innerHeight &&
            !isBehindCamera
        );
        
        this.isVisible = isOnScreen;
        
        if (isOnScreen) {
            // If on screen, hide the indicator
            this.screenIndicator.style.display = 'none';
        } else {
            // If off screen, show the indicator at the edge of the screen
            this.screenIndicator.style.display = 'block';
            
            // Calculate distance for indicator size (closer = bigger)
            let size = 30; // Default size
            
            // Check if player ship exists
            if (this.scene && this.scene.player && this.scene.player.ship) {
                // Calculate distance for indicator size (closer = bigger)
                const distance = this.mesh.position.distanceTo(this.scene.player.ship.position);
                size = Math.max(20, Math.min(40, 40 * (200 / distance)));
            }
            
            // Update indicator size based on distance
            this.screenIndicator.style.width = `${size}px`;
            this.screenIndicator.style.height = `${size}px`;
            
            // Update inner circle size proportionally
            const innerCircle = this.screenIndicator.querySelector('div:first-child');
            if (innerCircle) {
                const innerSize = size * 0.5;
                innerCircle.style.width = `${innerSize}px`;
                innerCircle.style.height = `${innerSize}px`;
            }
            
            // Calculate position at screen edge
            let indicatorX = x;
            let indicatorY = y;
            
            // Calculate angle from center of screen to power-up
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const angle = Math.atan2(y - centerY, x - centerX);
            
            // Find intersection with screen edge
            const padding = 40; // Padding from screen edge
            
            // Calculate screen bounds accounting for padding
            const minX = padding;
            const maxX = window.innerWidth - padding;
            const minY = padding;
            const maxY = window.innerHeight - padding;
            
            // Calculate intersection with screen edges
            if (x < minX) {
                // Left edge
                indicatorX = minX;
                indicatorY = centerY + Math.tan(angle) * (minX - centerX);
            } else if (x > maxX) {
                // Right edge
                indicatorX = maxX;
                indicatorY = centerY + Math.tan(angle) * (maxX - centerX);
            }
            
            if (indicatorY < minY || indicatorY > maxY) {
                if (indicatorY < minY) {
                    // Top edge
                    indicatorY = minY;
                } else {
                    // Bottom edge
                    indicatorY = maxY;
                }
                indicatorX = centerX + (indicatorY - centerY) / Math.tan(angle);
                
                // Handle edge case for vertical angles
                if (!isFinite(indicatorX)) {
                    indicatorX = x > centerX ? maxX : minX;
                }
            }
            
            // Constrain to screen edges with padding (final safety check)
            indicatorX = Math.max(minX, Math.min(maxX, indicatorX));
            indicatorY = Math.max(minY, Math.min(maxY, indicatorY));
            
            // Position the indicator (centered on the calculated point)
            this.screenIndicator.style.left = `${indicatorX}px`;
            this.screenIndicator.style.top = `${indicatorY}px`;
            this.screenIndicator.style.transform = 'translate(-50%, -50%)';
            
            // Rotate arrow to point toward the power-up
            const arrow = this.screenIndicator.querySelector('.power-up-arrow');
            if (arrow) {
                // Calculate angle from indicator to power-up position
                const arrowAngle = Math.atan2(y - indicatorY, x - indicatorX);
                // Convert to degrees and adjust for the arrow's default orientation
                const arrowRotation = (arrowAngle * 180 / Math.PI) + 90;
                arrow.style.transform = `translate(-50%, -50%) rotate(${arrowRotation}deg)`;
            }
        }
    }
    
    update(deltaTime) {
        if (this.isCollected) return true;
        
        // Rotate the power-up
        if (this.mesh) {
            this.mesh.rotation.y += this.rotationSpeed;
            
            // Bob up and down
            this.time += deltaTime * this.bobSpeed;
            this.mesh.position.y = this.initialY + Math.sin(this.time) * this.bobHeight;
            
            // Animate glow effect
            if (this.glowMesh) {
                // Pulse the glow opacity
                if (this.glowPulseTime !== undefined) {
                    this.glowPulseTime += deltaTime * this.glowPulseSpeed;
                    const pulseValue = (Math.sin(this.glowPulseTime) + 1) / 2; // 0 to 1
                    const opacity = this.glowPulseMin + pulseValue * (this.glowPulseMax - this.glowPulseMin);
                    this.glowMesh.material.opacity = opacity;
                }
                
                // Slowly rotate the glow in a different direction for visual effect
                this.glowMesh.rotation.y -= this.rotationSpeed * 0.5;
                this.glowMesh.rotation.x += this.rotationSpeed * 0.3;
            }
        }
        
        // Check for collision with player
        this.checkPlayerCollision();
        
        // Check if the power-up should be removed due to lifetime
        if (Date.now() - this.creationTime > this.lifeTime) {
            this.dispose();
            return true; // Signal that this power-up was removed
        }
        
        return false;
    }
    
    checkPlayerCollision() {
        if (!this.player || !this.player.ship || !this.mesh || this.player.isDestroyed || this.isCollected) return;
        
        // Use the player's collision sphere for detection
        if (this.player.isPointInCollisionSphere && typeof this.player.isPointInCollisionSphere === 'function') {
            if (this.player.isPointInCollisionSphere(this.mesh.position)) {
                this.collect();
                return;
            }
        }
        
        // Fallback to direct distance calculation
        const playerPosition = this.player.ship.position.clone();
        const distance = playerPosition.distanceTo(this.mesh.position);
        
        // If player is close enough, collect the power-up
        // Use a larger collision radius to make it easier to collect
        const collectionRadius = this.size * 2.5;
        if (distance < collectionRadius) {
            console.log(`Power-up collected! Type: ${this.type}, Distance: ${distance}`);
            this.collect();
        }
    }
    
    collect() {
        this.isCollected = true;
        
        // Apply effect based on type
        switch (this.type) {
            case 'health':
                this.applyHealthEffect();
                break;
            case 'shield':
                this.applyShieldEffect();
                break;
            case 'rapidFire':
                this.applyRapidFireEffect();
                break;
            case 'doubleDamage':
                this.applyDoubleDamageEffect();
                break;
        }
        
        // Show collection effect
        this.showCollectionEffect();
        
        // Remove the power-up from the scene
        this.dispose();
    }
    
    applyHealthEffect() {
        const effect = this.effects.health;
        
        // Heal the player
        if (this.player.currentHealth < this.player.maxHealth) {
            this.player.currentHealth = Math.min(
                this.player.maxHealth, 
                this.player.currentHealth + effect.amount
            );
            this.player.updateHealthBar();
        }
        
        // Show message
        this.showMessage('Health Restored!', '#ff0000');
    }
    
    applyShieldEffect() {
        const effect = this.effects.shield;
        
        // Apply shield effect
        this.player.hasShield = true;
        
        // Create shield visual
        this.createShieldVisual();
        
        // Set timeout to remove shield
        setTimeout(() => {
            this.player.hasShield = false;
            
            // Remove shield visual
            if (this.player.shieldMesh && this.player.ship) {
                this.player.ship.remove(this.player.shieldMesh);
                this.player.shieldMesh = null;
            }
        }, effect.duration);
        
        // Show message
        this.showMessage('Shield Activated!', '#0088ff');
    }
    
    createShieldVisual() {
        // Create shield mesh if it doesn't exist
        if (!this.player.shieldMesh && this.player.ship) {
            const shieldGeometry = new THREE.SphereGeometry(15, 32, 32);
            const shieldMaterial = new THREE.MeshBasicMaterial({
                color: 0x0088ff,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            
            this.player.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
            this.player.ship.add(this.player.shieldMesh);
        }
    }
    
    applyRapidFireEffect() {
        const effect = this.effects.rapidFire;
        
        // Store original fire rate
        const originalFireRate = this.player.fireRate;
        
        // Apply rapid fire effect
        this.player.fireRate = originalFireRate / effect.fireRateMultiplier;
        
        // Set timeout to restore original fire rate
        setTimeout(() => {
            this.player.fireRate = originalFireRate;
        }, effect.duration);
        
        // Show message
        this.showMessage('Rapid Fire!', '#ffff00');
    }
    
    applyDoubleDamageEffect() {
        const effect = this.effects.doubleDamage;
        
        // Apply double damage effect
        this.player.damageMultiplier = effect.damageMultiplier;
        
        // Set timeout to restore original damage
        setTimeout(() => {
            this.player.damageMultiplier = 1;
        }, effect.duration);
        
        // Show message
        this.showMessage('Double Damage!', '#ff8800');
    }
    
    showCollectionEffect() {
        // Create particle effect at power-up position
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const effect = this.effects[this.type];
        const color = new THREE.Color(effect.color);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within sphere
            const x = (Math.random() - 0.5) * this.size * 2;
            const y = (Math.random() - 0.5) * this.size * 2;
            const z = (Math.random() - 0.5) * this.size * 2;
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Set color
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        particleSystem.position.copy(this.mesh.position);
        this.scene.add(particleSystem);
        
        // Animate the particles
        const startTime = Date.now();
        const duration = 1000; // 1 second
        
        const animateParticles = () => {
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
                
                requestAnimationFrame(animateParticles);
            } else {
                // Remove particle system when animation is complete
                this.scene.remove(particleSystem);
            }
        };
        
        animateParticles();
    }
    
    showMessage(text, color) {
        // Create message element
        const message = document.createElement('div');
        message.style.position = 'absolute';
        message.style.top = '50%';
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
    
    dispose() {
        // Remove meshes from scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
        
        if (this.glowMesh) {
            this.scene.remove(this.glowMesh);
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
            this.glowMesh = null;
        }
        
        // Remove screen indicator
        if (this.screenIndicator && this.screenIndicator.parentNode) {
            this.screenIndicator.parentNode.removeChild(this.screenIndicator);
        }
    }
} 