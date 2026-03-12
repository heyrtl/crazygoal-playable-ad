import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';
import { createStriker } from '../utils/striker';
import { createGoalie } from '../utils/goalie';

export type GameState = 'Idle' | 'Aiming' | 'Action' | 'EndCard';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onGoal: () => void;
  playAudio: (type: 'kick' | 'goal' | 'bounce') => void;
  isViewable: boolean;
}

export const GameCanvas = ({ gameState, setGameState, onGoal, playAudio, isViewable }: GameCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isViewableRef = useRef(isViewable);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    isViewableRef.current = isViewable;
  }, [isViewable]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#3b4cca'); // Brighter blue/purple
    
    // Stadium background plane
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 1024;
    bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d')!;
    
    // Stadium wall / sky
    bgCtx.fillStyle = '#3b4cca'; 
    bgCtx.fillRect(0, 0, 1024, 512);
    
    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ map: bgTexture }));
    bgPlane.position.set(0, 10, -15);
    scene.add(bgPlane);

    // SVG Gallery
    const gallerySvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="192">
        <defs>
          <pattern id="crowd" width="60" height="30" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="5" fill="#111122" />
            <path d="M3,30 L3,20 C3,15 17,15 17,20 L17,30 Z" fill="#111122" />
            <circle cx="30" cy="14" r="4" fill="#1a1a3a" />
            <path d="M24,30 L24,22 C24,18 36,18 36,22 L36,30 Z" fill="#1a1a3a" />
            <circle cx="50" cy="8" r="4.5" fill="#0a0a1a" />
            <path d="M43,30 L43,18 C43,14 57,14 57,18 L57,30 Z" fill="#0a0a1a" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1024" height="192" fill="#2a2a4a" />
        <path d="M0,0 L1024,0" stroke="#1a1a2e" stroke-width="8" />
        <rect x="0" y="12" width="1024" height="30" fill="url(#crowd)" />
        <rect x="0" y="42" width="1024" height="30" fill="url(#crowd)" />
        <rect x="0" y="72" width="1024" height="30" fill="url(#crowd)" />
        <rect x="0" y="102" width="1024" height="30" fill="url(#crowd)" />
        <rect x="0" y="132" width="1024" height="30" fill="url(#crowd)" />
        <rect x="0" y="162" width="1024" height="30" fill="url(#crowd)" />
        <circle cx="120" cy="50" r="2" fill="#ffffff" />
        <circle cx="340" cy="80" r="1.5" fill="#ffffff" />
        <circle cx="560" cy="110" r="2.5" fill="#ffffff" />
        <circle cx="780" cy="40" r="1.5" fill="#ffffff" />
        <circle cx="910" cy="140" r="2" fill="#ffffff" />
        <circle cx="250" cy="120" r="1.5" fill="#ffffff" />
        <circle cx="670" cy="70" r="2" fill="#ffffff" />
      </svg>
    `;
    const img = new Image();
    img.onload = () => {
      bgCtx.drawImage(img, 0, 320);
      bgTexture.needsUpdate = true;
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(gallerySvg);
    
    // Seats (original top seats)
    bgCtx.fillStyle = '#5c4b99';
    bgCtx.fillRect(0, 50, 1024, 150);
    bgCtx.fillStyle = '#7a67c2';
    for(let i=0; i<10; i++) {
        bgCtx.fillRect(i*110 + 20, 70, 80, 40);
        bgCtx.fillRect(i*110 + 20, 130, 80, 40);
    }
    
    // Wall trim
    bgCtx.fillStyle = '#2c3e50';
    bgCtx.fillRect(0, 200, 1024, 20);
    
    // Yellow Flags
    bgCtx.fillStyle = '#ffeb3b';
    for(let i=0; i<5; i++) {
        const x = i * 250 + 50;
        bgCtx.beginPath();
        bgCtx.moveTo(x, 220);
        bgCtx.lineTo(x + 60, 220);
        bgCtx.lineTo(x + 60, 320);
        bgCtx.lineTo(x + 30, 290);
        bgCtx.lineTo(x, 320);
        bgCtx.fill();
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0, -4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85); // Brighter ambient
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Pitch (Real Grass Texture)
    const pitchCanvas = document.createElement('canvas');
    pitchCanvas.width = 512;
    pitchCanvas.height = 512;
    const pCtx = pitchCanvas.getContext('2d')!;
    
    // Stripes - Brighter casual green
    for (let i = 0; i < 8; i++) {
        pCtx.fillStyle = i % 2 === 0 ? '#5cdb5c' : '#4bc94b';
        pCtx.fillRect(0, i * 64, 512, 64);
    }
    
    const pitchTexture = new THREE.CanvasTexture(pitchCanvas);
    pitchTexture.wrapS = THREE.RepeatWrapping;
    pitchTexture.wrapT = THREE.RepeatWrapping;
    pitchTexture.repeat.set(1, 10);
    pitchTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    const pitchGeometry = new THREE.PlaneGeometry(30, 60);
    const pitchMaterial = new THREE.MeshStandardMaterial({ map: pitchTexture, roughness: 0.8 });
    const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.z = -5;
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Pitch Markings (Three.js meshes for perfect alignment)
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Penalty Box (Rectangle)
    const penBoxGeo = new THREE.RingGeometry(4.9, 5.0, 4, 1, Math.PI/4, Math.PI*2);
    // Wait, RingGeometry for a rectangle is tricky. Let's use planes.
    
    const createLine = (w: number, h: number, x: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lineMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.01, z);
      scene.add(mesh);
    };

    // Penalty Box Lines (Goal is at z = -6)
    createLine(10, 0.1, 0, -2); // Front line
    createLine(0.1, 4, -5, -4); // Left line
    createLine(0.1, 4, 5, -4);  // Right line

    // Goal Area Lines
    createLine(4, 0.1, 0, -4.5); // Front line
    createLine(0.1, 1.5, -2, -5.25); // Left
    createLine(0.1, 1.5, 2, -5.25);  // Right

    // D-Box (Arc outside penalty box)
    const arcGeometry = new THREE.RingGeometry(2, 2.1, 32, 1, Math.PI, Math.PI);
    const arc = new THREE.Mesh(arcGeometry, lineMaterial);
    arc.position.set(0, 0.01, -2);
    arc.rotation.x = -Math.PI / 2;
    scene.add(arc);

    // Penalty Spot
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), lineMaterial);
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(0, 0.01, -3.5);
    scene.add(spot);

    // Halfway line
    createLine(30, 0.1, 0, 8);
    
    // Center Circle
    const centerCircle = new THREE.Mesh(new THREE.RingGeometry(3, 3.1, 32), lineMaterial);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.set(0, 0.01, 8);
    scene.add(centerCircle);

    // Goalpost
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
    
    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(-3, 1.5, -6);
    leftPost.castShadow = true;
    scene.add(leftPost);

    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(3, 1.5, -6);
    rightPost.castShadow = true;
    scene.add(rightPost);

    const crossbarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6.2);
    const crossbar = new THREE.Mesh(crossbarGeometry, postMaterial);
    crossbar.position.set(0, 3, -6);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.castShadow = true;
    scene.add(crossbar);

    // Back supports
    const supportGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.5);
    const leftSupport = new THREE.Mesh(supportGeo, postMaterial);
    leftSupport.position.set(-3, 1.5, -7.5);
    leftSupport.rotation.x = -Math.PI / 6;
    scene.add(leftSupport);
    
    const rightSupport = new THREE.Mesh(supportGeo, postMaterial);
    rightSupport.position.set(3, 1.5, -7.5);
    rightSupport.rotation.x = -Math.PI / 6;
    scene.add(rightSupport);

    const backBarGeo = new THREE.CylinderGeometry(0.05, 0.05, 6.2);
    const backBar = new THREE.Mesh(backBarGeo, postMaterial);
    backBar.position.set(0, 0.05, -9);
    backBar.rotation.z = Math.PI / 2;
    scene.add(backBar);

    // Net
    const netCanvas = document.createElement('canvas');
    netCanvas.width = 256;
    netCanvas.height = 256;
    const nCtx = netCanvas.getContext('2d')!;
    nCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    nCtx.lineWidth = 4;
    for(let i=0; i<=256; i+=32) {
        nCtx.beginPath(); nCtx.moveTo(i, 0); nCtx.lineTo(i, 256); nCtx.stroke();
        nCtx.beginPath(); nCtx.moveTo(0, i); nCtx.lineTo(256, i); nCtx.stroke();
    }
    const netTexture = new THREE.CanvasTexture(netCanvas);
    netTexture.wrapS = THREE.RepeatWrapping;
    netTexture.wrapT = THREE.RepeatWrapping;
    netTexture.repeat.set(3, 2);
    
    const netMaterial = new THREE.MeshBasicMaterial({ map: netTexture, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    
    const backNet = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.5), netMaterial);
    backNet.position.set(0, 1.5, -7.5);
    backNet.rotation.x = Math.PI / 6;
    scene.add(backNet);

    const sideNetGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        0, 3, 0,   0, 0, 0,   0, 0, -3,
        0, 3, 0,   0, 0, -3,  0, 0, 0
    ]);
    sideNetGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    sideNetGeo.computeVertexNormals();
    
    const leftSideNet = new THREE.Mesh(sideNetGeo, netMaterial);
    leftSideNet.position.set(-3, 0, -6);
    scene.add(leftSideNet);
    
    const rightSideNet = new THREE.Mesh(sideNetGeo, netMaterial);
    rightSideNet.position.set(3, 0, -6);
    scene.add(rightSideNet);

    // Goal Billboard
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 512, 256);
    
    // CRAZY
    const grad1 = ctx.createLinearGradient(0, 50, 0, 120);
    grad1.addColorStop(0, '#f1c40f'); // Yellow
    grad1.addColorStop(1, '#e67e22'); // Orange
    ctx.fillStyle = grad1;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.font = '80px "GameFont", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText('CRAZY', 256, 110);
    ctx.fillText('CRAZY', 256, 110);
    
    // GOAAL!
    const grad2 = ctx.createLinearGradient(0, 130, 0, 220);
    grad2.addColorStop(0, '#85c1e9'); // Light blue
    grad2.addColorStop(1, '#2e86c1'); // Dark blue
    ctx.fillStyle = grad2;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 6;
    ctx.font = '100px "GameFont", sans-serif';
    ctx.strokeText('GOAAL!', 256, 210);
    ctx.fillText('GOAAL!', 256, 210);

    const billboardTexture = new THREE.CanvasTexture(canvas);
    const billboardMaterial = new THREE.MeshBasicMaterial({ map: billboardTexture });
    const billboard = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), billboardMaterial);
    billboard.position.set(0, 4.5, -6);
    scene.add(billboard);

    // Characters
    const striker = createStriker();
    striker.group.position.set(0, 0, 2);
    striker.group.rotation.y = Math.PI;
    scene.add(striker.group);

    const goalie = createGoalie();
    goalie.group.position.set(0, 0, -3.8);
    scene.add(goalie.group);

    // Ball
    const ballCanvas = document.createElement('canvas');
    ballCanvas.width = 128;
    ballCanvas.height = 128;
    const bCtx = ballCanvas.getContext('2d')!;
    bCtx.fillStyle = 'white';
    bCtx.fillRect(0, 0, 128, 128);
    bCtx.fillStyle = 'black';
    for(let i=0; i<6; i++) {
        for(let j=0; j<3; j++) {
            bCtx.beginPath();
            bCtx.arc(i*25 + (j%2)*12, j*42, 8, 0, Math.PI*2);
            bCtx.fill();
        }
    }
    const ballTexture = new THREE.CanvasTexture(ballCanvas);
    const ballGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: ballTexture });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0.5, 0.2, 1.5);
    ball.castShadow = true;
    scene.add(ball);

    // Trajectory Points
    const trajectoryPoints: THREE.Mesh[] = [];
    const pointGeo = new THREE.SphereGeometry(0.05);
    const pointMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 15; i++) {
      const pt = new THREE.Mesh(pointGeo, pointMat);
      pt.visible = false;
      scene.add(pt);
      trajectoryPoints.push(pt);
    }

    // Particles
    const particles: { mesh: THREE.Mesh, velocity: THREE.Vector3, life: number }[] = [];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
    const spawnParticles = () => {
      for (let i = 0; i < 100; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)], side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), mat);
        mesh.position.set(Math.random() > 0.5 ? 3 : -3, 3, -6);
        scene.add(mesh);
        particles.push({
          mesh,
          velocity: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 5 + 2, (Math.random() - 0.5) * 5),
          life: 1.0
        });
      }
    };

    // State variables
    let dragStart = new THREE.Vector2();
    let dragCurrent = new THREE.Vector2();
    let isDragging = false;
    let ballVelocity = new THREE.Vector3();
    let ballActive = false;
    let goalieDiving = false;
    let goalScored = false;
    let animationFrameId: number;
    let actionTime = 0;
    let shakeTime = 0;
    let shakeIntensity = 0;
    let isKicking = false;
    let kickTime = 0;

    // Input Handling
    const onPointerDown = (e: PointerEvent) => {
      if (e.target !== renderer.domElement) return;
      if (gameStateRef.current !== 'Idle' && gameStateRef.current !== 'Aiming') return;
      isDragging = true;
      dragStart.set(e.clientX, e.clientY);
      dragCurrent.set(e.clientX, e.clientY);
      if (gameStateRef.current === 'Idle') setGameState('Aiming');
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      dragCurrent.set(e.clientX, e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      
      const dx = dragStart.x - dragCurrent.x;
      const dy = dragCurrent.y - dragStart.y; // Drag down = positive dy
      
      if (dy > 10) {
        setGameState('Action');
        
        // Calculate velocity
        const power = Math.min(dy / 20, 15);
        const angle = dx / 50;
        
        ballVelocity.set(angle, power * 0.4, -power);
        ballActive = true;
        playAudio('kick');
        
        // Striker animation
        isKicking = true;
        kickTime = 0;
      } else {
        setGameState('Idle');
      }
      
      trajectoryPoints.forEach(pt => pt.visible = false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Resize
    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 100));
    if (typeof (window as any).mraid !== 'undefined') {
      (window as any).mraid.addEventListener('sizeChange', onResize);
    }

    // Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      if (!isViewableRef.current) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap dt
      lastTime = now;

      if (gameStateRef.current === 'Aiming') {
        const dx = dragStart.x - dragCurrent.x;
        const dy = dragCurrent.y - dragStart.y;
        const power = Math.min(dy / 20, 15);
        const angle = dx / 50;
        
        const v = new THREE.Vector3(angle, power * 0.4, -power);
        const pos = ball.position.clone();
        
        for (let i = 0; i < 15; i++) {
          const t = i * 0.1;
          const px = pos.x + v.x * t;
          const py = pos.y + v.y * t - 0.5 * 9.8 * t * t;
          const pz = pos.z + v.z * t;
          
          if (py > 0) {
            trajectoryPoints[i].position.set(px, py, pz);
            trajectoryPoints[i].visible = true;
          } else {
            trajectoryPoints[i].visible = false;
          }
        }

        // Animate striker prep
        const pullBackAngle = Math.min(power * 0.1, Math.PI / 3);
        striker.rightLeg.rotation.x = -pullBackAngle;
        striker.leftArm.rotation.x = -Math.PI / 6 - pullBackAngle * 0.5;
        striker.rightArm.rotation.x = Math.PI / 6 + pullBackAngle * 0.5;
      } else if (gameStateRef.current === 'Idle') {
        // Reset pose smoothly
        striker.rightLeg.rotation.x = THREE.MathUtils.lerp(striker.rightLeg.rotation.x, 0, dt * 10);
        striker.leftArm.rotation.x = THREE.MathUtils.lerp(striker.leftArm.rotation.x, -Math.PI / 6, dt * 10);
        striker.rightArm.rotation.x = THREE.MathUtils.lerp(striker.rightArm.rotation.x, Math.PI / 6, dt * 10);
      }

      if (isKicking) {
        kickTime += dt;
        if (kickTime < 0.1) {
          // Swing forward
          striker.rightLeg.rotation.x = THREE.MathUtils.lerp(striker.rightLeg.rotation.x, Math.PI / 4, dt * 30);
          striker.leftArm.rotation.x = THREE.MathUtils.lerp(striker.leftArm.rotation.x, Math.PI / 4, dt * 30);
          striker.rightArm.rotation.x = THREE.MathUtils.lerp(striker.rightArm.rotation.x, -Math.PI / 4, dt * 30);
        } else if (kickTime < 0.5) {
          // Follow through and return
          striker.rightLeg.rotation.x = THREE.MathUtils.lerp(striker.rightLeg.rotation.x, 0, dt * 10);
          striker.leftArm.rotation.x = THREE.MathUtils.lerp(striker.leftArm.rotation.x, -Math.PI / 6, dt * 10);
          striker.rightArm.rotation.x = THREE.MathUtils.lerp(striker.rightArm.rotation.x, Math.PI / 6, dt * 10);
        } else {
          isKicking = false;
        }
      }

      if (gameStateRef.current === 'Action' && !goalScored) {
        actionTime += dt;
        if (actionTime > 3) {
          goalScored = true;
          onGoal();
        }
      }

      if (ballActive) {
        ball.position.addScaledVector(ballVelocity, dt);
        ballVelocity.y -= 9.8 * dt;
        ball.rotation.x -= ballVelocity.z * dt;
        ball.rotation.z += ballVelocity.x * dt;

        if (!goalieDiving && ball.position.z < -1) {
          goalieDiving = true;
        }
        if (goalieDiving) {
          const targetX = ball.position.x > 0 ? 2 : -2;
          goalie.group.position.x = THREE.MathUtils.lerp(goalie.group.position.x, targetX, dt * 5);
          goalie.group.scale.x = targetX > 0 ? 1 : -1;
        }

        // Goal collision
        if (!goalScored && ball.position.z < -6 && ball.position.x > -3 && ball.position.x < 3 && ball.position.y < 3) {
          goalScored = true;
          ballActive = false;
          playAudio('goal');
          spawnParticles();
          shakeTime = 0.5;
          shakeIntensity = 0.3;
          onGoal();
        }

        // Floor collision
        if (ball.position.y < 0.2) {
          ball.position.y = 0.2;
          ballVelocity.y *= -0.6;
          ballVelocity.x *= 0.8;
          ballVelocity.z *= 0.8;
          if (Math.abs(ballVelocity.y) > 1) {
            playAudio('bounce');
            shakeTime = 0.2;
            shakeIntensity = 0.1;
          }
        }
      }

      // Goalie Animation Update
      let goalieState: 'idle' | 'ready' | 'diving' = 'idle';
      if (gameStateRef.current === 'Aiming') {
        goalieState = 'ready';
      } else if (goalieDiving) {
        goalieState = 'diving';
      }
      goalie.update(dt, goalieState);

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= 9.8 * dt;
        p.mesh.rotation.x += dt * 5;
        p.mesh.rotation.y += dt * 5;
        p.life -= dt;
        if (p.life <= 0 || p.mesh.position.y < 0) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }

      // Screen Shake
      if (shakeTime > 0) {
        shakeTime -= dt;
        camera.position.set(
          0 + (Math.random() - 0.5) * shakeIntensity,
          4 + (Math.random() - 0.5) * shakeIntensity,
          8 + (Math.random() - 0.5) * shakeIntensity
        );
      } else {
        camera.position.set(0, 4, 8);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (typeof (window as any).mraid !== 'undefined') {
        (window as any).mraid.removeEventListener('sizeChange', onResize);
      }
      cancelAnimationFrame(animationFrameId);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
};
