# 🎮 Neon Racer - Retro Arcade Racing Game

A modern take on classic arcade racing games with stunning neon aesthetics, built as a Progressive Web App (PWA) using pure HTML5, CSS3, and JavaScript.

## ✨ Features

### Gameplay
- **Endless Runner**: Dodge traffic and collect coins in this addictive endless racing game
- **Progressive Difficulty**: Game speed and traffic density increase as you level up
- **Power-Ups System**: 
  - 🛡️ Shield: Temporary invincibility
  - 🧲 Magnet: Auto-collect nearby coins
  - ⚡ Multiplier: 2x score boost
- **Coins & Scoring**: Collect coins and compete for high scores
- **Level System**: 10 levels of increasing difficulty

### Visual Design
- **Retro Arcade Aesthetic**: Inspired by 80s neon cyberpunk style
- **Particle Effects**: Explosions, trails, and visual feedback
- **Smooth Animations**: 60 FPS gameplay with optimized rendering
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Technical Features
- **Progressive Web App (PWA)**: Install and play offline
- **Touch Controls**: Native mobile support with on-screen buttons
- **Keyboard Controls**: Arrow keys or WASD for desktop
- **Local Storage**: Saves high scores and progress
- **Audio System**: Sound effects and music (with Web Audio API fallback)
- **Performance Optimized**: Efficient rendering and collision detection

## 🎮 How to Play

### Controls
- **Desktop**: Use Arrow Keys (← →) or A/D keys to move between lanes
- **Mobile**: Tap the on-screen left/right buttons
- **Pause**: Click/tap the pause button or press ESC

### Objective
1. Dodge enemy vehicles on the highway
2. Collect coins for points
3. Grab power-ups for special abilities
4. Survive as long as possible to reach higher levels
5. Beat your high score!

## 🚀 Installation

### Local Development
1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. No build process required - just pure HTML/CSS/JS!

### As a PWA
1. Open the game in a PWA-compatible browser (Chrome, Edge, Safari)
2. Look for the "Install" prompt in your browser
3. Click "Install" to add to your home screen/app menu
4. Play offline anytime!

### Deploy to Web Server
Simply upload all files to your web server. The game requires:
- A web server (Apache, Nginx, or any static file server)
- HTTPS for PWA features (or localhost for testing)

## 📁 Project Structure

```
Car-game/
│
├── index.html                 # Main HTML file
├── manifest.json             # PWA manifest
├── sw.js                     # Service Worker for offline support
├── README.md                 # This file
│
├── css/
│   ├── style.css            # Core styling and layout
│   └── ui.css               # UI components and menus
│
├── js/
│   ├── core/
│   │   ├── engine.js        # Game rendering engine
│   │   ├── loop.js          # Game loop management
│   │   └── collision.js     # Collision detection
│   │
│   ├── game/
│   │   ├── player.js        # Player vehicle logic
│   │   ├── enemy.js         # Enemy vehicles and spawning
│   │   ├── road.js          # Road rendering and scrolling
│   │   ├── coins.js         # Coin collection system
│   │   ├── powerups.js      # Power-up system
│   │   └── levels.js        # Level progression
│   │
│   ├── system/
│   │   ├── sprite.js        # Sprite management
│   │   ├── audio.js         # Audio system
│   │   ├── controls.js      # Input handling
│   │   ├── storage.js       # LocalStorage management
│   │   └── particles.js     # Particle effects
│   │
│   ├── ui/
│   │   └── ui-manager.js    # UI state management
│   │
│   └── main.js              # Game initialization
│
├── assets/                   # Game assets (optional)
│   ├── sprites/             # Sprite images (uses generated sprites)
│   └── sounds/              # Sound effects (uses Web Audio API)
│
└── icons/                    # PWA icons
    ├── icon-192.png
    └── icon-512.png
```

## 🎨 Customization

### Colors
Edit CSS variables in `css/style.css`:
```css
:root {
    --neon-pink: #ff006e;
    --neon-cyan: #00f5ff;
    --neon-purple: #8338ec;
    --neon-yellow: #ffbe0b;
    /* ... more colors */
}
```

### Game Difficulty
Adjust in `js/game/levels.js`:
```javascript
this.scorePerLevel = 500;        // Score needed per level
this.speedIncreasePerLevel = 0.5; // Speed increase per level
this.maxLevel = 10;               // Maximum level
```

### Spawn Rates
Modify in respective manager classes:
- `js/game/enemy.js` - Enemy spawn interval
- `js/game/coins.js` - Coin spawn interval
- `js/game/powerups.js` - Power-up spawn interval

## 🔧 Browser Compatibility

- ✅ Chrome/Edge 80+
- ✅ Firefox 75+
- ✅ Safari 13.1+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Required Features
- HTML5 Canvas
- ES6 JavaScript
- LocalStorage
- Service Workers (for PWA features)
- Web Audio API (optional, has fallback)

## 📱 PWA Features

### Offline Support
- All game assets cached for offline play
- High scores saved locally
- Works without internet connection

### Installable
- Add to home screen on mobile
- Desktop app on Windows/Mac/Linux
- Full-screen immersive experience

## 🐛 Known Issues & Limitations

- Asset loading: Currently uses generated sprites (placeholder for actual images)
- Audio: Uses Web Audio API beeps (replace with actual sound files)
- No backend: All data stored locally (no cloud saves)

## 🚧 Future Enhancements

- [ ] Add custom vehicle skins
- [ ] Implement different road environments
- [ ] Add more power-up types
- [ ] Create boss encounters
- [ ] Add multiplayer support
- [ ] Implement achievements system
- [ ] Add actual sprite sheets
- [ ] Include background music tracks

## 📄 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Feel free to fork, modify, and improve this game! Some areas for contribution:
- Custom sprites and animations
- Sound effects and music
- Additional power-ups
- New game modes
- Performance optimizations

## 💡 Credits

Built with:
- Pure HTML5 Canvas for rendering
- Vanilla JavaScript (ES6+)
- CSS3 for UI styling
- Google Fonts (Orbitron, Rajdhani)

Inspired by classic arcade racing games like:
- Traffic Racer
- Highway Rider
- 80s arcade aesthetics

---

## 🎯 Quick Start

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the directory
cd Car-game

# Open in browser
# Option 1: Double-click index.html
# Option 2: Use a local server (recommended for PWA features)
python -m http.server 8000
# Then open http://localhost:8000 in your browser
```

---

**Enjoy the game! 🏎️💨**

For issues or questions, please open an issue in the repository.
