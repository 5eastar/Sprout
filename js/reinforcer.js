
// Balloon Reinforcer
function initializeBalloons() {
    const balloons = document.querySelectorAll(".balloons img");
    let balloonClick = 0;
    const triangle = confetti.shapeFromPath({ path: 'M0 10 L5 0 L10 10z' });

    balloons.forEach((balloon) => {
        balloon.addEventListener("click", () => {
            balloon.style.visibility = "hidden";
            soundFX.playPop();

            confetti({
                particleCount: 60,
                spread: 45,
                scalar: 1.5,
                shapes: [triangle],
                origin: {
                    x: balloon.getBoundingClientRect().left / window.innerWidth,
                    y: balloon.getBoundingClientRect().top / window.innerHeight,
                },
                colors: ["#ffaa00", "#ff00aa", "#aa00ff", "#aaff00", "#00aaff"],
                gravity: 0.8,
            });

            balloonClick++;

            if (balloonClick === balloons.length) {
                setTimeout(() => {
                    resetBalloons();
                }, 600);
            }
        });
    });

    function resetBalloons() {
        balloons.forEach((balloon) => {
            balloon.style.visibility = "visible";
            const parent = balloon.parentNode;
            parent.removeChild(balloon);
            parent.appendChild(balloon);
        });
        balloonClick = 0;
    }
}

// Particles Reinforcer
function initializeParticles() {
    const canvas = document.getElementById('particleCanvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext("2d");
    // Arrays to hold various particle types
    // (General particles, fireworks, dusty background, and ripples)
    const particles = [];
    const fireworkParticles = [];
    const dustParticles = [];
    const ripples = [];
    const techRipples = [];

    // A simple mouse state object to track the user's cursor
    const mouse = (() => {
    let state = { x: null, y: null };
    return {
        get x() {
        return state.x;
        },
        get y() {
        return state.y;
        },
        set({ x, y }) {
        // Update the mouse position whenever the user moves the cursor
        state = { x, y };
        },
        reset() {
        // Clear mouse position when it leaves the canvas
        state = { x: null, y: null };
        }
    };
    })();

    // Some global state variables for background shifting and frame counting
    let backgroundHue = 0;
    let frameCount = 0;
    let autoDrift = true; // If true, particles gently drift on their own

    // Dynamically adjust the number of particles based on canvas size
    function adjustParticleCount() {
    const particleConfig = {
        heightConditions: [200, 300, 400, 500, 600],
        widthConditions: [450, 600, 900, 1200, 1600],
        particlesForHeight: [40, 60, 70, 90, 110],
        particlesForWidth: [40, 50, 70, 90, 110]
    };

    let numParticles = 130;

    // Check the height and pick a suitable particle count
    for (let i = 0; i < particleConfig.heightConditions.length; i++) {
        if (canvas.height < particleConfig.heightConditions[i]) {
        numParticles = particleConfig.particlesForHeight[i];
        break;
        }
    }

    // Check the width and try to lower the particle count if needed
    for (let i = 0; i < particleConfig.widthConditions.length; i++) {
        if (canvas.width < particleConfig.widthConditions[i]) {
        numParticles = Math.min(
            numParticles,
            particleConfig.particlesForWidth[i]
        );
        break;
        }
    }

    return numParticles;
    }

    // Particle class handles both "normal" and "firework" particles
    // I ended up combining them to avoid duplicating similar code
    class Particle {
    constructor(x, y, isFirework = false) {
        const baseSpeed = isFirework
        ? Math.random() * 2 + 1 // fireworks move faster
        : Math.random() * 0.5 + 0.3; // regular particles move slowly

        // Assign various properties to give each particle some randomness
        Object.assign(this, {
        isFirework,
        x,
        y,
        vx: Math.cos(Math.random() * Math.PI * 2) * baseSpeed,
        vy: Math.sin(Math.random() * Math.PI * 2) * baseSpeed,
        size: isFirework ? Math.random() * 2 + 2 : Math.random() * 3 + 1,
        hue: Math.random() * 360,
        alpha: 1,
        sizeDirection: Math.random() < 0.5 ? -1 : 1,
        trail: []
        });
    }

    update(mouse) {
        // Calculate distance from mouse to apply interactive forces (if any)
        const dist =
        mouse.x !== null ? (mouse.x - this.x) ** 2 + (mouse.y - this.y) ** 2 : 0;

        if (!this.isFirework) {
        // Apply a force pushing particles away or toward the mouse if it's on screen
        const force = dist && dist < 22500 ? (22500 - dist) / 22500 : 0;

        // If mouse is not present and autoDrift is true, particles gently meander
        if (mouse.x === null && autoDrift) {
            this.vx += (Math.random() - 0.5) * 0.03;
            this.vy += (Math.random() - 0.5) * 0.03;
        }

        if (dist) {
            const sqrtDist = Math.sqrt(dist);
            // Slightly nudge particles toward the mouse position
            this.vx += ((mouse.x - this.x) / sqrtDist) * force * 0.1;
            this.vy += ((mouse.y - this.y) / sqrtDist) * force * 0.1;
        }

        // Dampen velocities a bit so they don't run off too wildly
        this.vx *= mouse.x !== null ? 0.99 : 0.998;
        this.vy *= mouse.y !== null ? 0.99 : 0.998;
        } else {
        // Firework particles fade out over time
        this.alpha -= 0.02;
        }

        // Update particle position
        this.x += this.vx;
        this.y += this.vy;

        // Bounce particles off canvas edges with a bit of energy loss
        if (this.x <= 0 || this.x >= canvas.width - 1) this.vx *= -0.9;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -0.9;

        // Make the particle pulse in size just a bit
        this.size += this.sizeDirection * 0.1;
        if (this.size > 4 || this.size < 1) this.sizeDirection *= -1;

        // Cycle through hue to create a shifting color effect
        this.hue = (this.hue + 0.3) % 360;

        // Leave a trail of previous positions to create a motion blur effect
        if (
        frameCount % 2 === 0 &&
        (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1)
        ) {
        this.trail.push({
            x: this.x,
            y: this.y,
            hue: this.hue,
            alpha: this.alpha
        });
        if (this.trail.length > 15) this.trail.shift();
        }
    }

    draw(ctx) {
        // Draw a gradient-based circle to represent the particle
        const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.size
        );
        gradient.addColorStop(
        0,
        `hsla(${this.hue}, 80%, 60%, ${Math.max(this.alpha, 0)})`
        );
        gradient.addColorStop(
        1,
        `hsla(${this.hue + 30}, 80%, 30%, ${Math.max(this.alpha, 0)})`
        );

        ctx.fillStyle = gradient;
        // Add a slight glow if the screen is large
        ctx.shadowBlur = canvas.width > 900 ? 10 : 0;
        ctx.shadowColor = `hsl(${this.hue}, 80%, 60%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw the particle's trail as a faint line
        if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        for (let i = 0; i < this.trail.length - 1; i++) {
            const { x: x1, y: y1, hue: h1, alpha: a1 } = this.trail[i];
            const { x: x2, y: y2 } = this.trail[i + 1];
            ctx.strokeStyle = `hsla(${h1}, 80%, 60%, ${Math.max(a1, 0)})`;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.stroke();
        }
    }

    isDead() {
        // Firework particles "die" when they fade out
        return this.isFirework && this.alpha <= 0;
    }
    }

    // Dust particles are static, background-like elements to add depth and interest
    class DustParticle {
    constructor() {
        Object.assign(this, {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        hue: Math.random() * 360,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05
        });
    }

    update() {
        // Wrap around the edges so dust just cycles across the screen
        this.x = (this.x + this.vx + canvas.width) % canvas.width;
        this.y = (this.y + this.vy + canvas.height) % canvas.height;
        // Slowly shift hue for a subtle shimmering effect
        this.hue = (this.hue + 0.1) % 360;
    }

    draw(ctx) {
        // Draw faint circles
        ctx.fillStyle = `hsla(${this.hue}, 30%, 70%, 0.3)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    }

    // Ripples expand outward from a point and fade out, used for click and mouse effects
    class Ripple {
    constructor(x, y, hue = 0, maxRadius = 30) {
        Object.assign(this, { x, y, radius: 0, maxRadius, alpha: 0.5, hue });
    }

    update() {
        // Ripples grow in radius and fade in alpha
        this.radius += 1.5;
        this.alpha -= 0.01;
        this.hue = (this.hue + 5) % 360;
    }

    draw(ctx) {
        ctx.strokeStyle = `hsla(${this.hue}, 80%, 60%, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    isDone() {
        return this.alpha <= 0;
    }
    }

    // Create initial sets of particles whenever we resize the canvas
    function createParticles() {
    particles.length = 0;
    dustParticles.length = 0;

    const numParticles = adjustParticleCount();
    // Scatter some normal particles randomly around the canvas
    for (let i = 0; i < numParticles; i++) {
        particles.push(
        new Particle(Math.random() * canvas.width, Math.random() * canvas.height)
        );
    }
    // Add a bunch of dust particles to give some "texture" to the background
    for (let i = 0; i < 200; i++) {
        dustParticles.push(new DustParticle());
    }
    }

    // Keep canvas full size to fill the browser window
    function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
    }

    // Draw a shifting background gradient
    function drawBackground() {
    backgroundHue = (backgroundHue + 0.2) % 360;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, `hsl(${backgroundHue}, 40%, 15%)`);
    gradient.addColorStop(1, `hsl(${(backgroundHue + 120) % 360}, 40%, 25%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Connect nearby particles with lines to form a kind of web or network
    // I partitioned the space into grids to avoid checking every particle against every other particle.
    function connectParticles() {
    const gridSize = 120;
    const grid = new Map();

    particles.forEach((p) => {
        const key = `${Math.floor(p.x / gridSize)},${Math.floor(p.y / gridSize)}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(p);
    });

    ctx.lineWidth = 1.5;
    particles.forEach((p) => {
        const gridX = Math.floor(p.x / gridSize);
        const gridY = Math.floor(p.y / gridSize);

        for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const key = `${gridX + dx},${gridY + dy}`;
            if (grid.has(key)) {
            grid.get(key).forEach((neighbor) => {
                if (neighbor !== p) {
                const diffX = neighbor.x - p.x;
                const diffY = neighbor.y - p.y;
                const dist = diffX * diffX + diffY * diffY;
                if (dist < 10000) {
                    // Use a hue mix of the two particles for the line color
                    ctx.strokeStyle = `hsla(${
                    (p.hue + neighbor.hue) / 2
                    }, 80%, 60%, ${1 - Math.sqrt(dist) / 100})`;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(neighbor.x, neighbor.y);
                    ctx.stroke();
                }
                }
            });
            }
        }
        }
    });
    }

    // Main animation loop: draw background, update & draw all entities, and connect particles
    function animate() {
    drawBackground();

    // Update and draw all entities. Loop backwards in case we remove items.
    [dustParticles, particles, ripples, techRipples, fireworkParticles].forEach(
        (arr) => {
        for (let i = arr.length - 1; i >= 0; i--) {
            const obj = arr[i];
            // Pass mouse because some objects depend on mouse position
            obj.update(mouse);
            obj.draw(ctx);
            // Remove done or dead objects to free up resources
            if (obj.isDone?.() || obj.isDead?.()) arr.splice(i, 1);
        }
        }
    );

    connectParticles();
    frameCount++;
    requestAnimationFrame(animate);
    }

    // Mousemove: set mouse position and add a ripple effect
    canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.set({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    techRipples.push(new Ripple(mouse.x, mouse.y));
    autoDrift = false; // Stop auto drifting when user actively moves the mouse
    });

    // Mouse leaves: reset mouse position and re-enable auto drift
    canvas.addEventListener("mouseleave", () => {
    mouse.reset();
    autoDrift = true;
    });

    // Click to create a ripple and firework-like explosion at the click point
    canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    ripples.push(new Ripple(clickX, clickY, 0, 60));

    // Add some spark-like particles shooting out
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        const particle = new Particle(clickX, clickY, true);
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        fireworkParticles.push(particle);
    }
    });

    // Touch support
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        mouse.set({ x: touchX, y: touchY });
        ripples.push(new Ripple(touchX, touchY, 0, 60));
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            const particle = new Particle(touchX, touchY, true);
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            fireworkParticles.push(particle);
        }
        autoDrift = false;
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouse.set({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
        techRipples.push(new Ripple(mouse.x, mouse.y));
        autoDrift = false;
    }, { passive: false });

    canvas.addEventListener("touchend", () => {
        mouse.reset();
        autoDrift = true;
    });

    // Whenever the window is resized, adjust canvas and particles
    window.addEventListener("resize", resizeCanvas);

    // Initialize everything
    resizeCanvas();
    animate();
}

// Ballpit Reinforcer - Interactive 3D sphere packing
// Licence CC BY-NC-SA 4.0
// Attribution — You must give appropriate credit.
// Non Commercial — You may not use the material for commercial purposes.
// https://codepen.io/soju22/pen/PLbRLO
async function initializeBallpit() {
    const canvas = document.createElement('canvas');
    canvas.id = 'ballpitCanvas';

    // Gravity toggle button
    const gravBtn = document.createElement('button');
    gravBtn.id = 'ballpit-grav-btn';

    const style = document.createElement('style');
    style.textContent = `
        #ballpitCanvas {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            overflow: hidden;
            z-index: 5;
        }
        #ballpit-grav-btn {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 20 !important;
            background: rgba(255,255,255,0.25);
            border: 2px solid rgba(255,255,255,0.6);
            border-radius: 50%;
            width: 56px;
            height: 56px;
            font-size: 1.6rem;
            cursor: pointer;
            backdrop-filter: blur(4px);
            transition: background 0.2s, transform 0.15s;
        }
        #ballpit-grav-btn:active { transform: scale(0.9); }
    `;
    document.head.appendChild(style);

    document.body.appendChild(canvas);
    document.body.appendChild(gravBtn);

    let bg = null;
    let clickHandler = null;
    let touchHandler = null;

    const updateGravBtn = () => {
        gravBtn.textContent = bg && bg.spheres.config.gravity === 0 ? '🔽' : '🔼';
    };

    try {
        const { default: Spheres1Background } = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.17/build/backgrounds/spheres1.cdn.min.js');

        bg = Spheres1Background(canvas, {
            count: 300,
            minSize: 0.3,
            maxSize: 1,
            gravity: 0.5
        });
        updateGravBtn();

        // Tap canvas = change colours only
        clickHandler = () => {
            bg.spheres.setColors([
                0xffffff * Math.random(),
                0xffffff * Math.random(),
                0xffffff * Math.random()
            ]);
        };
        touchHandler = (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) clickHandler();
        };

        document.body.addEventListener('click', clickHandler);
        document.body.addEventListener('touchend', touchHandler);

        // Gravity button toggles gravity, does NOT propagate to colour handler
        gravBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            bg.spheres.config.gravity = bg.spheres.config.gravity === 0 ? 0.5 : 0;
            updateGravBtn();
        });
        gravBtn.addEventListener('touchend', (e) => {
            e.stopPropagation();
            bg.spheres.config.gravity = bg.spheres.config.gravity === 0 ? 0.5 : 0;
            updateGravBtn();
        });

    } catch (error) {
        console.error('Failed to load ballpit effect:', error);
    }

    return () => {
        if (bg && bg.dispose) bg.dispose();
        if (clickHandler) document.body.removeEventListener('click', clickHandler);
        if (touchHandler) document.body.removeEventListener('touchend', touchHandler);
        style.remove();
        canvas.remove();
        gravBtn.remove();
    };
}




// Pond Reinforcer - Interactive liquid/koi pond effect
// Licence CC BY-NC-SA 4.0
// Attribution — You must give appropriate credit.
// Non Commercial — You may not use the material for commercial purposes.
// https://codepen.io/soju22/pen/myVWBGa
async function initializePond() {
    // Create container matching original HTML structure
    const container = document.createElement('div');
    container.id = 'pond-container';

    const canvas = document.createElement('canvas');
    canvas.id = 'pondCanvas';
    container.appendChild(canvas);

    // Add styles matching original CSS
    const style = document.createElement('style');
    style.textContent = `
        #pond-container {
            position: fixed;
            top: 0;
            left: 0;
            margin: 0;
            width: 100%;
            height: 100%;
            z-index: 5;
            touch-action: none;
            font-family: "Montserrat", serif;
        }
        #pondCanvas {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            overflow: hidden;
        }
        #pond-container a {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            color: #fff;
            text-decoration: none;
            text-shadow: 1px 1px 2px black;
            z-index: 6;
        }
    `;
    document.head.appendChild(style);

    const endScreen = document.getElementById('end-screen');
    endScreen.appendChild(container);

    // Sound effects for pond
    const pondSounds = {
        bubbleAudio: null,
        splashAudio: null,
        lastDragTime: 0,
        
        playBubble() {
            if (this.bubbleAudio && !this.bubbleAudio.paused) return; // Prevent overlap
            
            const bubbleNum = Math.floor(Math.random() * 2) + 1; // Random 1-2
            this.bubbleAudio = new Audio(`${window.ASSET_BASE || ''}audio/sounds/bubble${bubbleNum}.wav`);
            this.bubbleAudio.volume = 1.0;
            this.bubbleAudio.play().catch(e => console.log('Bubble sound failed:', e));
        },
        
        playSplash() {
            if (this.splashAudio && !this.splashAudio.paused) return; // Prevent overlap
            
            const splashNum = Math.floor(Math.random() * 3) + 1; // Random 1-3
            this.splashAudio = new Audio(`${window.ASSET_BASE || ''}audio/sounds/splash${splashNum}.wav`);
            this.splashAudio.volume = 1.0;
            this.splashAudio.play().catch(e => console.log('Splash sound failed:', e));
        }
    };

    // Rain sound
    let rainAudio = null;
    let rainEnabled = false;

    function toggleRain() {
        rainEnabled = !rainEnabled;
        app.setRain(rainEnabled);
        
        if (rainEnabled) {
            // Start rain sound
            if (!rainAudio) {
                rainAudio = new Audio((window.ASSET_BASE || '') + 'audio/sounds/rain.mp3');
                rainAudio.loop = true;
                rainAudio.volume = 1.0;
            }
            rainAudio.play().catch(e => console.log('Rain sound failed:', e));
            rainBtn.textContent = '🌧️ Rain ON';
            rainBtn.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        } else {
            // Stop rain sound
            if (rainAudio) {
                rainAudio.pause();
                rainAudio.currentTime = 0;
            }
            rainBtn.textContent = '☀️ Rain OFF';
            rainBtn.style.background = 'linear-gradient(135deg, #ffd93d 0%, #ff6b35 100%)';
        }
}

    // Create rain toggle button
    const rainBtn = document.createElement('button');
    rainBtn.textContent = '☀️ Rain OFF';
    rainBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 30px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #ffd93d 0%, #ff6b35 100%);
        color: white;
        border: none;
        border-radius: 25px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 10;
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: 'Fredoka', sans-serif;
    `;

    rainBtn.addEventListener('mouseenter', () => {
        rainBtn.style.transform = 'scale(1.05)';
        rainBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    });

    rainBtn.addEventListener('mouseleave', () => {
        rainBtn.style.transform = 'scale(1)';
        rainBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    });

    rainBtn.addEventListener('click', toggleRain);

    container.appendChild(rainBtn);

    let isDragging = false;
    let dragInterval = null;

    let app = null;

    try {
        const { default: LiquidBackground } = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.27/build/backgrounds/liquid1.min.js');

        app = LiquidBackground(document.getElementById('pondCanvas'));

        app.loadImage(POND_IMAGE_BASE64);
        app.liquidPlane.material.metalness = 0.75;
        app.liquidPlane.material.roughness = 0.25;
        app.liquidPlane.uniforms.displacementScale.value = 5;
        app.setRain(false);

        // Mouse events
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            pondSounds.playSplash();
            pondSounds.lastDragTime = Date.now();
            
            // Repeat splash every 1.5s during long drag
            dragInterval = setInterval(() => {
                if (isDragging) {
                    pondSounds.playSplash();
                }
            }, 1500);
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            if (dragInterval) {
                clearInterval(dragInterval);
                dragInterval = null;
            }
        });

        canvas.addEventListener('click', (e) => {
            if (!isDragging) {
                pondSounds.playBubble();
            }
        });

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            isDragging = true;
            pondSounds.playSplash();
            pondSounds.lastDragTime = Date.now();
            
            dragInterval = setInterval(() => {
                if (isDragging) {
                    pondSounds.playSplash();
                }
            }, 1500);
        });

        canvas.addEventListener('touchend', () => {
            isDragging = false;
            if (dragInterval) {
                clearInterval(dragInterval);
                dragInterval = null;
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            // Touch move is handled by the liquid background
        });

    } catch (error) {
        console.error('Failed to load pond effect:', error);
        container.style.background = `url(${POND_IMAGE_BASE64}) center/cover no-repeat`;
    }

    return () => {
        if (dragInterval) {
            clearInterval(dragInterval);
        }
        if (rainAudio) {
            rainAudio.pause();
            rainAudio = null;
        }
        if (app && app.dispose) {
            app.dispose();
        }
        style.remove();
        container.remove();
    };
}

    // Snowy Window Reinforcer
    function initializeWindow() {
        const container = document.createElement('div');
        container.id = 'window-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 5;
            overflow: hidden;
        `;

        // Create three layered canvases
        const bgCanvas = document.createElement('canvas');
        bgCanvas.id = 'bg-canvas';
        const snowCanvas = document.createElement('canvas');
        snowCanvas.id = 'snow-canvas';
        const frostCanvas = document.createElement('canvas');
        frostCanvas.id = 'frost-canvas';

        // Canvas layering styles
        const canvasStyle = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;';
        bgCanvas.style.cssText = canvasStyle + 'z-index: 1;';
        snowCanvas.style.cssText = canvasStyle + 'z-index: 2;';
        frostCanvas.style.cssText = canvasStyle + 'z-index: 3;';

        container.appendChild(bgCanvas);
        container.appendChild(snowCanvas);
        container.appendChild(frostCanvas);

        // Freeze button
        const freezeBtn = document.createElement('button');
        freezeBtn.textContent = '❄️ Freeze Window';
        freezeBtn.style.cssText = `
            position: absolute;
            top: 30px;
            left: 30px;
            z-index: 10;
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            font-family: 'Fredoka', sans-serif;
        `;
        freezeBtn.addEventListener('mouseenter', () => {
            freezeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        freezeBtn.addEventListener('mouseleave', () => {
            freezeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        container.appendChild(freezeBtn);

        const endScreen = document.getElementById('end-screen');
        endScreen.appendChild(container);

        const PI2 = Math.PI * 2;
        const config = {
            snowCount: 800,
            windSpeed: 7.5, 
            freezeRate: 2, 
            frostColor: '220, 235, 255',
            autoFade: true,
            fadeDelay: 3000
        };

        const bgCtx = bgCanvas.getContext('2d');
        const snowCtx = snowCanvas.getContext('2d');
        const frostCtx = frostCanvas.getContext('2d');

        let width, height, animationFrame, frostPattern;
        let lastInteraction = Date.now();

        const bgImage = new Image();
        bgImage.src = (window.ASSET_BASE || '') + 'images/animation/snow.jpg';

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            [bgCanvas, snowCanvas, frostCanvas].forEach(c => {
                c.width = width;
                c.height = height;
            });
            bgCtx.drawImage(bgImage, 0, 0, width, height);
            initFrost();
        }

        class Snowflake {
            constructor() {
                this.init();
            }
            init() {
                this.x = Math.random() * width;
                this.y = Math.random() * height - height;
                this.size = Math.random() * 3 + 1;
                this.speed = Math.random() * 1 + 0.5;
                this.wobble = Math.random() * PI2;
                this.wobbleSpeed = Math.random() * 0.05 + 0.01;
                this.opacity = Math.random() * 0.5 + 0.3;
            }
            update() {
                this.y += this.speed;
                this.x += Math.sin(this.wobble) * 0.5 + (config.windSpeed * 0.2);
                this.wobble += this.wobbleSpeed;
                if (this.y > height) {
                    this.y = -10;
                    this.x = Math.random() * width;
                }
                if (this.x > width) this.x = -10;
                else if (this.x < -10) this.x = width + 10;
            }
            draw() {
                snowCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                snowCtx.beginPath();
                snowCtx.arc(this.x, this.y, this.size, 0, PI2);
                snowCtx.fill();
            }
        }

        const snowflakes = [];
        
        function initSnow() {
            snowflakes.length = 0;
            for (let i = 0; i < config.snowCount; i++) {
                const flake = new Snowflake();
                flake.y = Math.random() * height;
                snowflakes.push(flake);
            }
        }

        function animateSnow() {
            snowCtx.clearRect(0, 0, width, height);
            snowflakes.forEach(flake => {
                flake.update();
                flake.draw();
            });
        }

        function initFrost() {
            const offCanvas = document.createElement('canvas');
            offCanvas.width = 100;
            offCanvas.height = 100;
            const offCtx = offCanvas.getContext('2d');
            const idata = offCtx.createImageData(100, 100);
            const buffer32 = new Uint32Array(idata.data.buffer);
            for (let i = 0; i < buffer32.length; i++) {
                if (Math.random() < 0.5) {
                    buffer32[i] = 0x15ffffff;
                } else {
                    buffer32[i] = 0x00000000;
                }
            }
            offCtx.putImageData(idata, 0, 0);
            frostPattern = frostCtx.createPattern(offCanvas, 'repeat');
            resetFrost();
        }

        function resetFrost() {
            frostCtx.globalCompositeOperation = 'source-over';
            frostCtx.fillStyle = `rgba(${config.frostColor}, 0.95)`;
            frostCtx.fillRect(0, 0, width, height);
            frostCtx.fillStyle = frostPattern;
            frostCtx.fillRect(0, 0, width, height);
            lastInteraction = Date.now();
        }

        const mouse = { x: 0, y: 0, isDown: false, px: 0, py: 0 };

        function meltFrost(x, y) {
            frostCtx.globalCompositeOperation = 'destination-out';
            const radius = 60;
            const gradient = frostCtx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            gradient.addColorStop(0.5, 'rgba(0,0,0,0.5)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            frostCtx.fillStyle = gradient;
            frostCtx.beginPath();
            frostCtx.arc(x, y, radius, 0, PI2);
            frostCtx.fill();
            frostCtx.globalCompositeOperation = 'source-over';
            lastInteraction = Date.now();
        }

        function updateFrost() {
            // Auto-fade check: reset if no interaction for fadeDelay
            if (config.autoFade && (Date.now() - lastInteraction > config.fadeDelay)) {
                resetFrost();
            }

            if (config.freezeRate > 0) {
                frostCtx.globalCompositeOperation = 'source-over';
                frostCtx.fillStyle = `rgba(${config.frostColor}, ${0.002 * config.freezeRate})`;
                frostCtx.fillRect(0, 0, width, height);
                if (Math.random() < 0.1) {
                    frostCtx.fillStyle = frostPattern;
                    frostCtx.globalAlpha = 0.01 * config.freezeRate;
                    frostCtx.fillRect(0, 0, width, height);
                    frostCtx.globalAlpha = 1.0;
                }
            }

            if (mouse.isDown) {
                meltFrost(mouse.x, mouse.y);
            }
            
            mouse.px = mouse.x;
            mouse.py = mouse.y;
        }

        function handleStart(e) {
            mouse.isDown = true;
            handleMove(e);
        }

        function handleEnd() {
            mouse.isDown = false;
        }

        function handleMove(e) {
            if (e.touches) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            } else {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            }
        }

        window.addEventListener('mousedown', handleStart);
        window.addEventListener('touchstart', handleStart, {passive: false});
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, {passive: false});

        freezeBtn.addEventListener('click', resetFrost);

        function loop() {
            animateSnow();
            updateFrost();
            animationFrame = requestAnimationFrame(loop);
        }

        bgImage.onload = () => {
        resize();
        initSnow();
        loop();
    };
    bgImage.onerror = () => console.error('Image failed to load:', bgImage.src);

        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('mousedown', handleStart);
            window.removeEventListener('touchstart', handleStart);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            container.remove();
        };
    }

    function initializeXylophone() {
        const NOTE_LABELS  = ['C','D','E','F','G','A','B','C'];
        const NOTE_COLORS  = ['#c61a10','#da4d18','#e8c210','#a0ca3a','#1cbbe5','#0a5c96','#584790','#d7729a'];
        const NOTE_HEIGHTS = [300, 280, 260, 240, 220, 200, 180, 160];
        const AUDIO_SRCS   = [
            'https://raw.githubusercontent.com/NestorPlasencia/sound/master/C.mp3',
            'https://raw.githubusercontent.com/NestorPlasencia/sound/master/D.mp3',
            'https://raw.githubusercontent.com/NestorPlasencia/sound/master/E.mp3',
            'https://raw.githubusercontent.com/NestorPlasencia/sound/master/F.mp3',
            'https://raw.githubusercontent.com/NestorPlasencia/sound/master/G.mp3',
            'https://raw.githubusercontent.com/NestorPlasencia/sound/master/A.mp3',
            'https://raw.githubusercontent.com/NestorPlasencia/sound/master/B.mp3',
            'https://raw.githubusercontent.com/NestorPlasencia/sound/master/C2.mp3',
        ];
        const SONGS = {
            hickory: {
                name: 'Hickory Dickory Dock',
                //       E F G  G A B  C    E F  G A B  C   G  C  C  B   B A  A  G   G A G  F E D  C
                notes: [2,3,4,4,5,6,7, 2,3,4,5,6,7, 4,7,7,6, 6,5,5,4, 4,5,4,3,2,1,0]            },
            baa: {
                name: 'Baa Baa Black Sheep',
            //      CC GG ABCAG FF EE DDC GGGFF EEED GGGFGAFE DDC
            notes: [0,0,4,4,5,6,7,5,4,3,3,2,2,1,1,0,4,4,4,3,3,2,2,2,1,4,4,4,3,4,5,3,2,1,1,0]    },
            twinkle: {
                name: 'Twinkle Twinkle Little Star',
                //       C C G G A A G    F F E E D D C     G G F F E E D     G G F F E E D     C C G G A A G
                notes: [0,0,4,4,5,5,4, 3,3,2,2,1,1,0, 4,4,3,3,2,2,1, 4,4,3,3,2,2,1,]      }
        };

        const container  = document.getElementById('xylophone-reinforcer');
        if (!container) return;
        container.classList.remove('hidden');
        const keysEl     = container.querySelector('.xy-keys');
        keysEl.innerHTML = '';
        const songSelect = container.querySelector('.xy-song-select');
        const mallet     = container.querySelector('.xy-mallet');

        // Build keys
        const keyEls = NOTE_LABELS.map((label, i) => {
            const key = document.createElement('div');
            key.className = 'xy-key';
            key.dataset.index = i;
            key.style.cssText = `background:${NOTE_COLORS[i]};height:${NOTE_HEIGHTS[i]}px`;
            key.textContent = label;
            keysEl.appendChild(key);
            return key;
        });

        // Build audio
        const sounds = AUDIO_SRCS.map(src => new Audio(src));

        // State
        let currentSong = null;
        let step = 0;

        function highlight(index) {
            keyEls.forEach(k => k.classList.remove('xy-highlight'));
            if (index !== null) keyEls[index]?.classList.add('xy-highlight');
        }

        function playNote(index) {
            const s = sounds[index];
            s.pause();
            s.currentTime = 0;
            s.play();
            keyEls[index].classList.add('xy-pressed');
            setTimeout(() => keyEls[index].classList.remove('xy-pressed'), 150);
        }

        const handleKeyPress = (index) => {
            playNote(index);
            if (!currentSong) return;
            if (index === currentSong.notes[step]) {
                step++;
                if (step >= currentSong.notes.length) {
                    highlight(null);
                    currentSong = null;
                    step = 0;
                    songSelect.querySelectorAll('button[data-song]').forEach(b => {
                        if (b.dataset.song) b.disabled = false;
                    });
                } else {
                    highlight(currentSong.notes[step]);
                }
            }
            // Wrong key: sound plays, highlight stays on correct note
        };

        keysEl.addEventListener('click', e => {
            const key = e.target.closest('.xy-key');
            if (!key) return;
            handleKeyPress(parseInt(key.dataset.index));
        });

        keysEl.addEventListener('touchstart', e => {
            const key = e.target.closest('.xy-key');
            if (!key) return;
            e.preventDefault();
            handleKeyPress(parseInt(key.dataset.index));
        }, { passive: false });

        songSelect.querySelectorAll('button[data-song]').forEach(btn => {
            btn.addEventListener('click', () => {
                const song = SONGS[btn.dataset.song];
                if (!song) return;
                currentSong = song;
                step = 0;
                highlight(currentSong.notes[0]);
                songSelect.querySelectorAll('button[data-song]').forEach(b => {
                    if (b.dataset.song) b.disabled = true;
                });
            });
        });

        // Mallet follows pointer — offset so handle midpoint tracks the cursor
        // Handle ::before: 10×240px at top:42px left:72px → midpoint at (77, 162) in mallet coords
        const moveMallet = (pageX, pageY) => {
            mallet.style.left = `${pageX - 77}px`;
            mallet.style.top  = `${pageY - 162}px`;
        };
        const onMouseMove = e => moveMallet(e.pageX, e.pageY);
        const onTouchMove = e => {
            if (e.touches.length > 0) moveMallet(e.touches[0].pageX, e.touches[0].pageY);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: true });

        // Return cleanup function (consistent with other reinforcers)
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('touchmove', onTouchMove);
            keysEl.innerHTML = '';
            currentSong = null;
        };
    }
   

const REINFORCER_SLIDES = (() => {
    const ab = window.ASSET_BASE || '';
    return [
        { type: 'balloons',  img: ab + 'images/animation/rBalloon.jpg',   label: 'Balloons'     },
        { type: 'particles', img: ab + 'images/animation/rParticles.jpg', label: 'Sparkles'     },
        { type: 'ballpit',   img: ab + 'images/animation/rBallpit.jpg',   label: 'Ball Pit'     },
        { type: 'pond',      img: ab + 'images/animation/rPond.jpg',      label: 'Pond'         },
        { type: 'window',    img: ab + 'images/animation/rWindow.jpg',    label: 'Snowy Window' },
        { type: 'xylophone', img: ab + 'images/animation/rXylophone.jpg', label: 'Xylophone'   },
    ];
})();

function populateSliderTracks() {
    const settings = typeof getReinforceSettings === 'function' ? getReinforceSettings() : {};
    const enabledSlides = REINFORCER_SLIDES.filter(s => settings[s.type] !== false);
    const count = enabledSlides.length || 1;

    // Override scroll animation for actual enabled slide count
    let scrollStyle = document.getElementById('slider-scroll-style');
    if (!scrollStyle) {
        scrollStyle = document.createElement('style');
        scrollStyle.id = 'slider-scroll-style';
        document.head.appendChild(scrollStyle);
    }
    scrollStyle.textContent = `
        .slide-track { width: calc(200px * ${count * 2}); animation-duration: ${count * 5}s; }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-200px * ${count})); } }
    `;

    document.querySelectorAll('.slide-track').forEach(track => {
        track.innerHTML = '';
        [...enabledSlides, ...enabledSlides].forEach(({ type, img, label }) => {
            const div = document.createElement('div');
            div.className = 'slide';
            div.dataset.reinforcer = type;
            div.innerHTML = `<img src="${img}" alt="${label}"><span>${label}</span>`;
            track.appendChild(div);
        });
    });
}

document.addEventListener('DOMContentLoaded', populateSliderTracks);

    window.initializeBalloons = initializeBalloons;
    window.initializeParticles = initializeParticles;
    window.initializeBallpit = initializeBallpit;
    window.initializePond = initializePond;
    window.initializeWindow = initializeWindow;
    window.initializeXylophone = initializeXylophone;

// Routes to the correct reinforcer init and strips the page container chrome for full-screen display
function initializeReinforcer(reinforcerType) {
    reinforcerType = reinforcerType || 'balloons';

    // Strip .container card chrome so the body gradient shows seamlessly behind the reinforcer
    const pageContainer = document.querySelector('.container');
    if (pageContainer) {
        pageContainer.style.background = 'transparent';
        pageContainer.style.borderRadius = '0';
        pageContainer.style.margin = '0';
        pageContainer.style.padding = '0';
        pageContainer.style.width = '100%';
        pageContainer.style.maxWidth = '100%';
        pageContainer.style.overflow = 'visible';
    }

    const balloonsEl = document.querySelector('.balloons');
    const particleCanvas = document.getElementById('particleCanvas');

    // Hide balloons by default — only shown for the balloons reinforcer
    if (balloonsEl) balloonsEl.style.display = 'none';

    switch (reinforcerType) {
        case 'balloons':
            if (balloonsEl) balloonsEl.style.display = 'block';
            initializeBalloons();
            break;
        case 'particles':
            if (particleCanvas) particleCanvas.style.display = 'block';
            initializeParticles();
            break;
        case 'ballpit':
            initializeBallpit();
            break;
        case 'pond':
            initializePond();
            break;
        case 'window':
            initializeWindow();
            break;
        case 'xylophone': {
            const xyEl = document.getElementById('xylophone-reinforcer');
            if (xyEl) xyEl.classList.remove('hidden');
            initializeXylophone();
            break;
        }
        default:
            if (balloonsEl) balloonsEl.style.display = 'block';
            initializeBalloons();
    }
}
window.initializeReinforcer = initializeReinforcer;