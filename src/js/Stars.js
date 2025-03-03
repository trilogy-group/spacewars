import * as THREE from 'three';

export class Stars {
    constructor(scene) {
        this.scene = scene;
        this.stars = null;
        this.starCount = 5000;
    }
    
    init() {
        // Create a starfield using points
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            sizeAttenuation: false
        });
        
        // Generate random star positions
        const starsVertices = [];
        for (let i = 0; i < this.starCount; i++) {
            const x = THREE.MathUtils.randFloatSpread(2000);
            const y = THREE.MathUtils.randFloatSpread(2000);
            const z = THREE.MathUtils.randFloatSpread(2000);
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
        
        // Create some larger, brighter stars
        this.createBrightStars();
        
        return this;
    }
    
    createBrightStars() {
        // Create a smaller number of larger, brighter stars
        const brightStarsGeometry = new THREE.BufferGeometry();
        const brightStarsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: false
        });
        
        // Generate random positions for bright stars
        const brightStarsVertices = [];
        for (let i = 0; i < 200; i++) {
            const x = THREE.MathUtils.randFloatSpread(2000);
            const y = THREE.MathUtils.randFloatSpread(2000);
            const z = THREE.MathUtils.randFloatSpread(2000);
            brightStarsVertices.push(x, y, z);
        }
        
        brightStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(brightStarsVertices, 3));
        const brightStars = new THREE.Points(brightStarsGeometry, brightStarsMaterial);
        this.scene.add(brightStars);
        
        // Create a few colored stars
        this.createColoredStars();
    }
    
    createColoredStars() {
        // Create a few colored stars (red, blue, yellow)
        const colors = [0xff0000, 0x0000ff, 0xffff00];
        
        colors.forEach(color => {
            const coloredStarsGeometry = new THREE.BufferGeometry();
            const coloredStarsMaterial = new THREE.PointsMaterial({
                color: color,
                size: 2,
                sizeAttenuation: false
            });
            
            // Generate random positions for colored stars
            const coloredStarsVertices = [];
            for (let i = 0; i < 50; i++) {
                const x = THREE.MathUtils.randFloatSpread(2000);
                const y = THREE.MathUtils.randFloatSpread(2000);
                const z = THREE.MathUtils.randFloatSpread(2000);
                coloredStarsVertices.push(x, y, z);
            }
            
            coloredStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(coloredStarsVertices, 3));
            const coloredStars = new THREE.Points(coloredStarsGeometry, coloredStarsMaterial);
            this.scene.add(coloredStars);
        });
    }
    
    update() {
        // If we want to animate the stars, we can add that here
        // For example, slowly rotating the starfield
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
        }
    }
    
    dispose() {
        // Clean up resources
        if (this.stars) {
            this.scene.remove(this.stars);
            this.stars.geometry.dispose();
            this.stars.material.dispose();
        }
    }
} 