import * as THREE from 'three';

export class Turret {
    constructor(scene, player, position, parentObject) {
        // References
        this.scene = scene;
        this.player = player;
        this.parentObject = parentObject; // The object this turret is attached to (Death Star)
        
        // Turret properties
        this.base = null;
        this.gun = null;
        this.position = position || new THREE.Vector3(0, 0, 0);
        
        // Combat properties
        this.canFire = true;
        this.fireRate = 2000; // ms between shots
        this.projectiles = [];
        this.firingRange = 300; // Distance at which turret will start firing
        this.rotationSpeed = 0.01;
        
        // State
        this.isDestroyed = false;
        this.health = 30;
    }
    
    init() {
        this.createTurret();
    }
    
    createTurret() {
        // Create the base
        const baseGeometry = new THREE.CylinderGeometry(3, 3, 2, 16);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
        this.base = new THREE.Mesh(baseGeometry, baseMaterial);
        
        // Create the gun
        const gunGeometry = new THREE.BoxGeometry(1, 1, 8);
        const gunMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        this.gun = new THREE.Mesh(gunGeometry, gunMaterial);
        this.gun.position.set(0, 2, 0);
        this.gun.rotation.x = Math.PI / 2;
        
        // Add gun to base
        this.base.add(this.gun);
        
        // Position the turret
        this.base.position.copy(this.position);
        
        // Add to parent object or scene
        if (this.parentObject) {
            this.parentObject.add(this.base);
        } else {
            this.scene.add(this.base);
        }
    }
    
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // Track player
        this.trackPlayer();
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Check if should fire
        this.checkFiring();
    }
    
    trackPlayer() {
        if (!this.player || !this.player.ship) return;
        
        // Get world position of player and turret
        const playerWorldPos = new THREE.Vector3();
        this.player.ship.getWorldPosition(playerWorldPos);
        
        const turretWorldPos = new THREE.Vector3();
        this.base.getWorldPosition(turretWorldPos);
        
        // Calculate direction to player
        const direction = playerWorldPos.clone().sub(turretWorldPos).normalize();
        
        // Convert direction to local space of the turret's parent
        const localDirection = direction.clone();
        if (this.parentObject) {
            const inverseParentMatrix = new THREE.Matrix4().copy(this.parentObject.matrixWorld).invert();
            localDirection.applyMatrix4(inverseParentMatrix);
        }
        
        // Calculate rotation to face player
        const targetRotation = new THREE.Euler().setFromQuaternion(
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                localDirection
            )
        );
        
        // Smoothly rotate towards player
        this.base.rotation.x += (targetRotation.x - this.base.rotation.x) * this.rotationSpeed;
        this.base.rotation.z += (targetRotation.z - this.base.rotation.z) * this.rotationSpeed;
    }
    
    checkFiring() {
        if (!this.canFire || !this.player || !this.player.ship) return;
        
        // Get world positions
        const playerWorldPos = new THREE.Vector3();
        this.player.ship.getWorldPosition(playerWorldPos);
        
        const turretWorldPos = new THREE.Vector3();
        this.base.getWorldPosition(turretWorldPos);
        
        // Calculate distance to player
        const distanceToPlayer = playerWorldPos.distanceTo(turretWorldPos);
        
        // Check if player is in firing range
        if (distanceToPlayer < this.firingRange) {
            this.fire();
        }
    }
    
    fire() {
        // Create a laser projectile
        const projectileGeometry = new THREE.BoxGeometry(0.5, 0.5, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        
        // Get world position and direction of the gun
        const gunWorldPos = new THREE.Vector3();
        this.gun.getWorldPosition(gunWorldPos);
        
        const gunDirection = new THREE.Vector3(0, 0, 1);
        gunDirection.applyQuaternion(this.gun.getWorldQuaternion(new THREE.Quaternion()));
        
        // Position the projectile at the end of the gun
        const offset = gunDirection.clone().multiplyScalar(4);
        projectile.position.copy(gunWorldPos).add(offset);
        
        // Set the projectile's rotation to match the gun's
        projectile.quaternion.copy(this.gun.getWorldQuaternion(new THREE.Quaternion()));
        
        // Add the projectile to the scene and the projectiles array
        this.scene.add(projectile);
        this.projectiles.push({
            mesh: projectile,
            velocity: gunDirection.multiplyScalar(3), // Projectile speed
            lifeTime: 3000, // Time in ms before the projectile is removed
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
            projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));
            
            // Check for collision with player
            const distance = projectile.position.distanceTo(this.scene.player.position);
            if (distance < 10 && !this.scene.player.isInvulnerable) {
                // Hit player
                this.scene.player.takeDamage(5);
                this.createHitEffect(projectile.position.clone());
                
                // Show damage message
                this.scene.game.showDamageMessage("Turret hit! -5 Health", "#ff0000");
                
                // Remove projectile
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Remove projectile if it's too old
            projectile.lifetime += deltaTime;
            if (projectile.lifetime > this.projectileLifetime) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    createHitEffect(position) {
        // Create a flash effect at the hit position
        const geometry = new THREE.SphereGeometry(1.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff5500,
            transparent: true,
            opacity: 0.8
        });
        
        const hitEffect = new THREE.Mesh(geometry, material);
        hitEffect.position.copy(position);
        this.scene.add(hitEffect);
        
        // Animate the hit effect
        const startTime = Date.now();
        const duration = 250; // ms
        
        const animateHit = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                hitEffect.scale.set(1 + progress, 1 + progress, 1 + progress);
                hitEffect.material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(animateHit);
            } else {
                this.scene.remove(hitEffect);
                geometry.dispose();
                material.dispose();
            }
        };
        
        animateHit();
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
        // Flash the turret red when hit
        const originalColor = this.base.material.color.clone();
        this.base.material.color.set(0xff0000);
        this.gun.material.color.set(0xff0000);
        
        // Reset color after a short delay
        setTimeout(() => {
            if (this.base && this.base.material) {
                this.base.material.color.copy(originalColor);
            }
            if (this.gun && this.gun.material) {
                this.gun.material.color.set(0x333333);
            }
        }, 100);
    }
    
    destroy() {
        this.isDestroyed = true;
        
        // Create explosion effect
        this.createExplosion();
        
        // Remove from scene after explosion
        setTimeout(() => {
            if (this.base) {
                if (this.parentObject) {
                    this.parentObject.remove(this.base);
                } else {
                    this.scene.remove(this.base);
                }
                this.base = null;
                this.gun = null;
            }
        }, 1000);
    }
    
    createExplosion() {
        // Get world position of the turret
        const turretWorldPos = new THREE.Vector3();
        this.base.getWorldPosition(turretWorldPos);
        
        // Create particle system for explosion
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within sphere
            const x = (Math.random() - 0.5) * 8;
            const y = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            
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
            size: 1.5,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        particleSystem.position.copy(turretWorldPos);
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
        if (this.isDestroyed || !this.base) return false;
        
        // Get world position of the turret
        const turretWorldPos = new THREE.Vector3();
        this.base.getWorldPosition(turretWorldPos);
        
        // Check if projectile hits the turret
        const projectilePosition = projectile.mesh.position.clone();
        const distance = projectilePosition.distanceTo(turretWorldPos);
        
        // Simple collision detection
        if (distance < 5) { // Adjust based on turret size
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
        
        // Remove turret from scene
        if (this.base) {
            if (this.parentObject) {
                this.parentObject.remove(this.base);
            } else {
                this.scene.remove(this.base);
            }
            this.base = null;
            this.gun = null;
        }
    }
} 