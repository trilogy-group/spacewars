# Space Wars: X-Wing vs Death Star

A 3D space shooter game where players pilot an X-wing fighter on a mission to destroy the Death Star.

## Play the Game

You can play the game online at: [https://trilogy-group-1.github.io/spacewars/](https://trilogy-group-1.github.io/spacewars/)

## Project Overview

Space Wars is a browser-based 3D game built with Three.js that recreates the iconic trench run scene from Star Wars. Players navigate through the Death Star's surface, avoid obstacles and enemy fire, and ultimately attempt to hit the thermal exhaust port to destroy the Death Star.

## Features (Planned)

- 3D environment with the Death Star surface and trench
- Controllable X-wing fighter with realistic flight physics
- Enemy TIE fighters and turret defenses
- Collision detection and damage system
- Power-ups and special abilities
- Sound effects and background music
- Score tracking and high score system

## Development Roadmap

### Phase 1: Basic Setup and Environment
- Set up the project structure and dependencies
- Create a basic 3D scene with Three.js
- Implement camera controls and basic rendering

### Phase 2: Player Ship and Controls
- Create or import an X-wing 3D model
- Implement player controls (keyboard/mouse)
- Add basic flight physics and boundaries

### Phase 3: Death Star Environment
- Create the Death Star surface environment
- Design the trench run path
- Add obstacles and collision detection

### Phase 4: Combat System
- Add weapons system for the X-wing
- Implement enemy TIE fighters with basic AI
- Add turret defenses along the trench

### Phase 5: Game Logic
- Create game states (start, play, game over)
- Implement scoring system
- Add win/lose conditions

### Phase 6: Polish and Refinement
- Add sound effects and music
- Implement visual effects (explosions, laser blasts)
- Optimize performance
- Add menu and instructions

## Technologies

- HTML5, CSS3, JavaScript
- Three.js for 3D rendering
- WebGL for graphics acceleration
- Howler.js for sound management (optional)

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/spacewars.git
   cd spacewars
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To build the project for production:

```
npm run build
```

The built files will be in the `dist` directory.

## Deployment to GitHub Pages

This project is set up to automatically deploy to GitHub Pages when you push to the main branch.

To set up GitHub Pages deployment:

1. Go to your GitHub repository settings
2. Navigate to "Pages"
3. Under "Build and deployment", select "GitHub Actions" as the source
4. The workflow will automatically build and deploy your site

## Game Controls

- W/S: Pitch up/down
- A/D: Roll left/right
- Q/E: Yaw left/right
- Shift: Boost speed
- Space: Fire weapons

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Star Wars and the iconic Death Star trench run scene
- Thanks to the Three.js community for their excellent documentation and examples 