import * as THREE from 'three';

const generateGoalieSVG = (frame: 'idle1' | 'idle2' | 'ready' | 'dive') => {
  let armLeft = '';
  let armRight = '';
  let bodyY = 0;
  let scaleY = 1;
  let legLeft = '';
  let legRight = '';
  let bodyRot = 0;
  let shadowWidth = 40;

  if (frame === 'idle1') {
    armLeft = '<path d="M 40 70 Q 20 90 30 130" stroke="#e74c3c" stroke-width="16" stroke-linecap="round" fill="none"/>';
    armRight = '<path d="M 160 70 Q 180 90 170 130" stroke="#e74c3c" stroke-width="16" stroke-linecap="round" fill="none"/>';
    legLeft = '<path d="M 80 140 L 80 180" stroke="#e74c3c" stroke-width="18" stroke-linecap="round" fill="none"/>';
    legRight = '<path d="M 120 140 L 120 180" stroke="#e74c3c" stroke-width="18" stroke-linecap="round" fill="none"/>';
  } else if (frame === 'idle2') {
    bodyY = 5;
    scaleY = 0.95;
    armLeft = '<path d="M 40 70 Q 10 80 20 120" stroke="#e74c3c" stroke-width="16" stroke-linecap="round" fill="none"/>';
    armRight = '<path d="M 160 70 Q 190 80 180 120" stroke="#e74c3c" stroke-width="16" stroke-linecap="round" fill="none"/>';
    legLeft = '<path d="M 80 140 Q 70 160 80 180" stroke="#e74c3c" stroke-width="18" stroke-linecap="round" fill="none"/>';
    legRight = '<path d="M 120 140 Q 130 160 120 180" stroke="#e74c3c" stroke-width="18" stroke-linecap="round" fill="none"/>';
  } else if (frame === 'ready') {
    bodyY = 10;
    scaleY = 0.9;
    shadowWidth = 60;
    armLeft = '<path d="M 40 70 Q 10 50 10 90" stroke="#e74c3c" stroke-width="16" stroke-linecap="round" fill="none"/>';
    armRight = '<path d="M 160 70 Q 190 50 190 90" stroke="#e74c3c" stroke-width="16" stroke-linecap="round" fill="none"/>';
    legLeft = '<path d="M 80 140 Q 60 160 70 180" stroke="#e74c3c" stroke-width="18" stroke-linecap="round" fill="none"/>';
    legRight = '<path d="M 120 140 Q 140 160 130 180" stroke="#e74c3c" stroke-width="18" stroke-linecap="round" fill="none"/>';
  } else if (frame === 'dive') {
    bodyY = 0;
    scaleY = 1;
    bodyRot = 90;
    shadowWidth = 80;
    armLeft = '<path d="M 40 70 Q 10 30 10 10" stroke="#e74c3c" stroke-width="16" stroke-linecap="round" fill="none"/>';
    armRight = '<path d="M 160 70 Q 190 30 190 10" stroke="#e74c3c" stroke-width="16" stroke-linecap="round" fill="none"/>';
    legLeft = '<path d="M 80 140 Q 80 170 60 190" stroke="#e74c3c" stroke-width="18" stroke-linecap="round" fill="none"/>';
    legRight = '<path d="M 120 140 Q 120 170 140 190" stroke="#e74c3c" stroke-width="18" stroke-linecap="round" fill="none"/>';
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.3)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.3)" />
        </linearGradient>
      </defs>
      <!-- Shadow -->
      <ellipse cx="100" cy="190" rx="${shadowWidth}" ry="10" fill="rgba(0,0,0,0.3)" />
      
      <g transform="translate(100, 100) rotate(${bodyRot}) translate(-100, -100)">
        <g transform="translate(0, ${bodyY}) scale(1, ${scaleY})">
          <!-- Legs -->
          ${legLeft}
          ${legRight}
          
          <!-- Arms -->
          ${armLeft}
          ${armRight}
          
          <!-- Body -->
          <rect x="50" y="60" width="100" height="90" rx="40" fill="#e74c3c" />
          <rect x="50" y="60" width="100" height="90" rx="40" fill="url(#bodyGrad)" />
          
          <!-- Belly highlight -->
          <ellipse cx="100" cy="110" rx="30" ry="20" fill="rgba(255,255,255,0.15)" />
          
          <!-- Head -->
          <circle cx="100" cy="40" r="35" fill="#e74c3c" />
          
          <!-- Eyes -->
          <circle cx="85" cy="35" r="6" fill="#1a1a2e" />
          <circle cx="115" cy="35" r="6" fill="#1a1a2e" />
          
          <!-- Eye highlights -->
          <circle cx="83" cy="33" r="2" fill="#ffffff" />
          <circle cx="113" cy="33" r="2" fill="#ffffff" />
          
          <!-- Head highlight -->
          <path d="M 75 15 Q 100 5 125 15 A 35 35 0 0 0 75 15" fill="rgba(255,255,255,0.3)" />
        </g>
      </g>
    </svg>
  `;
};

export const createGoalie = () => {
  const group = new THREE.Group();
  
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  
  const material = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true, 
    depthWrite: false,
    alphaTest: 0.1
  });
  
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), material);
  plane.position.y = 1.5;
  group.add(plane);

  const frames = ['idle1', 'idle2', 'ready', 'dive'] as const;
  const images: Record<string, HTMLImageElement> = {};
  
  frames.forEach(frame => {
    const img = new Image();
    img.onload = () => {
      if (frame === currentFrame) {
        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(img, 0, 0);
        texture.needsUpdate = true;
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(generateGoalieSVG(frame));
    images[frame] = img;
  });

  let currentFrame = 'idle1';
  let time = 0;

  const update = (dt: number, state: 'idle' | 'ready' | 'diving') => {
    time += dt;
    let nextFrame = currentFrame;
    
    if (state === 'diving') {
      nextFrame = 'dive';
    } else if (state === 'ready') {
      nextFrame = 'ready';
    } else {
      // Idle animation
      nextFrame = (time % 1 > 0.5) ? 'idle2' : 'idle1';
    }

    if (nextFrame !== currentFrame) {
      currentFrame = nextFrame;
      const img = images[currentFrame];
      if (img && img.complete) {
        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(img, 0, 0);
        texture.needsUpdate = true;
      }
    }
  };

  return { 
    group, 
    update
  };
};
