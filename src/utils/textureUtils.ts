import * as THREE from 'three';

/**
 * Creates a procedural grass texture for the pitch.
 */
export const createPitchTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Use slightly different shades of green for stripes
    for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#5cdb5c' : '#4bc94b';
        ctx.fillRect(0, i * 64, 512, 64);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 10);
    return texture;
};

/**
 * Creates a procedural net texture for the goal.
 */
export const createNetTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Reduced size for optimization
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    for(let i=0; i<=128; i+=16) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 4);
    return texture;
};

/**
 * Creates a procedural ball texture.
 */
export const createBallTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = 'black';
    // Hexagonal-like pattern
    for(let i=0; i<6; i++) {
        for(let j=0; j<4; j++) {
            ctx.beginPath();
            ctx.arc(i*25 + (j%2)*12, j*32, 7, 0, Math.PI*2);
            ctx.fill();
        }
    }
    return new THREE.CanvasTexture(canvas);
};

/**
 * Creates an optimized procedural crowd texture for the background.
 * Much faster than SVG-to-Base64 conversion.
 */
export const createCrowdTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Background
    ctx.fillStyle = '#3b4cca';
    ctx.fillRect(0, 0, 1024, 512);

    // Optimized crowd (simple circles)
    const colors = ['#111122', '#1a1a3a', '#0a0a1a', '#5c4b99', '#2a2a4a'];
    for(let y = 320; y < 512; y += 30) {
        for(let x = 0; x < 1024; x += 20) {
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.beginPath();
            ctx.arc(x + Math.random() * 5, y + Math.random() * 5, 4 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Subtle "bodies"
            ctx.fillRect(x - 5, y + 5, 15, 20);
        }
    }

    // Wall trim
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 200, 1024, 20);

    // Flags
    ctx.fillStyle = '#ffeb3b';
    for(let i=0; i<5; i++) {
        const fx = i * 250 + 50;
        ctx.beginPath();
        ctx.moveTo(fx, 220);
        ctx.lineTo(fx + 60, 220);
        ctx.lineTo(fx + 60, 320);
        ctx.lineTo(fx + 30, 290);
        ctx.lineTo(fx, 320);
        ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
};

/**
 * Creates the billboard texture with "CRAZY GOAAL!" text.
 */
export const createBillboardTexture = (fontFamily: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 512, 256);
    
    ctx.textAlign = 'center';
    
    // CRAZY
    const grad1 = ctx.createLinearGradient(0, 50, 0, 120);
    grad1.addColorStop(0, '#f1c40f');
    grad1.addColorStop(1, '#e67e22');
    ctx.fillStyle = grad1;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.font = `80px "${fontFamily}", sans-serif`;
    ctx.strokeText('CRAZY', 256, 110);
    ctx.fillText('CRAZY', 256, 110);
    
    // GOAAL!
    const grad2 = ctx.createLinearGradient(0, 130, 0, 220);
    grad2.addColorStop(0, '#85c1e9');
    grad2.addColorStop(1, '#2e86c1');
    ctx.fillStyle = grad2;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 6;
    ctx.font = `100px "${fontFamily}", sans-serif`;
    ctx.strokeText('GOAAL!', 256, 210);
    ctx.fillText('GOAAL!', 256, 210);

    return new THREE.CanvasTexture(canvas);
};
