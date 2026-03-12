import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';
import { createStriker } from '../utils/striker';
import { createGoalie } from '../utils/goalie';
import {
  createPitchTexture,
  createNetTexture,
  createBallTexture,
  createCrowdTexture,
  createBillboardTexture
} from '../utils/textureUtils';

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

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#3b4cca');

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0, -4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(512, 512); // Reduced from 1024 for faster init
    scene.add(dirLight);

    // --- Environment Assets (Procedural & Optimized) ---

    // Background Stadium
    const stadiumTexture = createCrowdTexture();
    const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ map: stadiumTexture }));
    bgPlane.position.set(0, 10, -15);
    scene.add(bgPlane);

    // Pitch
    const pitchTexture = createPitchTexture();
    pitchTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 60),
      new THREE.MeshStandardMaterial({ map: pitchTexture, roughness: 0.8 })
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.z = -5;
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Pitch Markings
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const createLine = (w: number, h: number, x: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lineMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.01, z);
      scene.add(mesh);
    };
    createLine(10, 0.1, 0, -2);   // Penalty Box
    createLine(0.1, 4, -5, -4);
    createLine(0.1, 4, 5, -4);
    createLine(4, 0.1, 0, -4.5); // Goal Area
    createLine(0.1, 1.5, -2, -5.25);
    createLine(0.1, 1.5, 2, -5.25);
    createLine(30, 0.1, 0, 8);   // Halfway

    const arc = new THREE.Mesh(new THREE.RingGeometry(2, 2.1, 24, 1, Math.PI, Math.PI), lineMaterial);
    arc.position.set(0, 0.01, -2);
    arc.rotation.x = -Math.PI / 2;
    scene.add(arc);

    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.15, 8), lineMaterial);
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(0, 0.01, -3.5);
    scene.add(spot);

    // Goal Architecture
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3), postMaterial);
    leftPost.position.set(-3, 1.5, -6);
    scene.add(leftPost);

    const rightPost = leftPost.clone();
    rightPost.position.set(3, 1.5, -6);
    scene.add(rightPost);

    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6.2), postMaterial);
    crossbar.position.set(0, 3, -6);
    crossbar.rotation.z = Math.PI / 2;
    scene.add(crossbar);

    // Net
    const netMaterial = new THREE.MeshBasicMaterial({
      map: createNetTexture(),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const backNet = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.5), netMaterial);
    backNet.position.set(0, 1.5, -7.5);
    backNet.rotation.x = Math.PI / 6;
    scene.add(backNet);

    // Billboard
    const billboard = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 2),
      new THREE.MeshBasicMaterial({ map: createBillboardTexture('GameFont') })
    );
    billboard.position.set(0, 4.5, -6);
    scene.add(billboard);

    // --- Characters & Ball ---
    const striker = createStriker();
    const goalie = createGoalie();
    scene.add(striker.group, goalie.group);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      new THREE.MeshStandardMaterial({ map: createBallTexture() })
    );
    ball.position.set(0.5, 0.2, 1.5);
    ball.castShadow = true;
    scene.add(ball);

    // --- Deferred Non-Critical Object Creation ---
    const trajectoryPoints: THREE.Mesh[] = [];
    const particles: { mesh: THREE.Mesh, velocity: THREE.Vector3, life: number }[] = [];
    const trailPoints: THREE.Mesh[] = [];
    let trailIndex = 0;

    // Use a small timeout to let the primary scene render first
    setTimeout(() => {
      const ptGeo = new THREE.SphereGeometry(0.05, 8, 8);
      const ptMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (let i = 0; i < 15; i++) {
        const pt = new THREE.Mesh(ptGeo, ptMat);
        pt.visible = false;
        scene.add(pt);
        trajectoryPoints.push(pt);
      }

      const trailGeo = new THREE.SphereGeometry(0.15, 6, 6);
      const trailMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      for (let i = 0; i < 15; i++) {
        const mesh = new THREE.Mesh(trailGeo, trailMat.clone());
        mesh.visible = false;
        scene.add(mesh);
        trailPoints.push(mesh);
      }
    }, 100);

    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
    const spawnParticles = () => {
      for (let i = 0; i < 60; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)], side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), mat);
        mesh.position.set(Math.random() > 0.5 ? 3 : -3, 3, -6);
        scene.add(mesh);
        particles.push({
          mesh,
          velocity: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 5 + 2, (Math.random() - 0.5) * 4),
          life: 1.0
        });
      }
    };

    // --- Action State Logic ---
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

    let isApproaching = false;
    let approachProgress = 0;
    const strikerStartPos = new THREE.Vector3(-2.5, 0, 3.5);
    const kickPos = new THREE.Vector3(0.5, 0, 1.8);

    striker.group.position.copy(strikerStartPos);
    striker.group.lookAt(ball.position.x, 0, ball.position.z);

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
      const dy = dragCurrent.y - dragStart.y;
      if (dy > 10) {
        setGameState('Action');
        isApproaching = true;
        approachProgress = 0;
        const power = Math.min(dy / 20, 15);
        const angle = (dragStart.x - dragCurrent.x) / 50;
        ballVelocity.set(angle, power * 0.4, -power);
      } else {
        setGameState('Idle');
      }
      trajectoryPoints.forEach(pt => pt.visible = false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // --- Animation Loop ---
    let lastTime = performance.now();
    const animate = () => {
      if (!isViewableRef.current) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (gameStateRef.current === 'Aiming') {
        goalie.update(dt, 'ready');
        striker.update(dt, 'aiming');
        const v = new THREE.Vector3((dragStart.x - dragCurrent.x)/50, Math.min((dragCurrent.y-dragStart.y)/20, 15)*0.4, -Math.min((dragCurrent.y-dragStart.y)/20, 15));
        const pos = ball.position.clone();
        for (let i = 0; i < trajectoryPoints.length; i++) {
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
      } else if (gameStateRef.current === 'Idle') {
        goalie.update(dt, 'idle');
        striker.update(dt, 'idle');
        striker.group.position.lerp(strikerStartPos, dt * 5);
        striker.group.lookAt(ball.position.x, 0, ball.position.z);
      }

      if (isApproaching) {
        approachProgress += dt * 2.5;
        if (approachProgress < 1) {
          striker.update(dt, 'approaching');
          striker.group.position.lerpVectors(strikerStartPos, kickPos, approachProgress);
          striker.group.lookAt(ball.position.x, 0, ball.position.z);
        } else {
          isApproaching = false;
          ballActive = true;
          isKicking = true;
          kickTime = 0;
          playAudio('kick');
        }
      }

      if (isKicking) {
        kickTime += dt;
        striker.update(dt, 'kicking');
        striker.rightLeg.rotation.x = kickTime < 0.1 ? THREE.MathUtils.lerp(striker.rightLeg.rotation.x, Math.PI / 4, dt * 30) : THREE.MathUtils.lerp(striker.rightLeg.rotation.x, 0, dt * 10);
        if (kickTime >= 0.5) isKicking = false;
      }

      if (gameStateRef.current === 'Action' && !goalScored) {
        actionTime += dt;
        if (actionTime > 5) { // Longer timeout to allow for approach
          goalScored = true;
          onGoal();
        }
      }

      if (ballActive) {
        ball.position.addScaledVector(ballVelocity, dt);
        ballVelocity.y -= 9.8 * dt;
        ball.rotation.x -= ballVelocity.z * dt;
        ball.rotation.z += ballVelocity.x * dt;

        if (trailPoints.length > 0) {
          const tMesh = trailPoints[trailIndex];
          tMesh.position.copy(ball.position);
          tMesh.visible = true;
          (tMesh.material as THREE.MeshBasicMaterial).opacity = 0.5;
          trailIndex = (trailIndex + 1) % trailPoints.length;
        }

        const ballDistToGoal = ball.position.z - (-6);
        if (!goalieDiving && ballDistToGoal < 4) goalieDiving = true;
        if (goalieDiving) {
          const targetX = THREE.MathUtils.clamp(ball.position.x * 1.5, -2.8, 2.8);
          const diveDirection = targetX > goalie.group.position.x ? 1 : -1;
          goalie.update(dt, diveDirection > 0 ? 'saveRight' : 'saveLeft');
          goalie.group.position.x = THREE.MathUtils.lerp(goalie.group.position.x, targetX, dt * 8);
          goalie.group.position.y = THREE.MathUtils.lerp(goalie.group.position.y, 0.4, dt * 5);
          goalie.group.rotation.z = THREE.MathUtils.lerp(goalie.group.rotation.z, -diveDirection * Math.PI / 2.2, dt * 10);
        } else {
          goalie.update(dt, 'ready');
        }

        if (!goalScored && ball.position.z < -6 && Math.abs(ball.position.x) < 3 && ball.position.y < 3) {
          goalScored = true; ballActive = false;
          playAudio('goal'); spawnParticles();
          shakeTime = 0.5; shakeIntensity = 0.3;
          onGoal();
        }

        if (ball.position.y < 0.2) {
          ball.position.y = 0.2; ballVelocity.y *= -0.6;
          ballVelocity.x *= 0.8; ballVelocity.z *= 0.8;
          if (Math.abs(ballVelocity.y) > 1) {
            playAudio('bounce'); shakeTime = 0.2; shakeIntensity = 0.1;
          }
        }
      }

      for (let i = 0; i < trailPoints.length; i++) {
        if (trailPoints[i].visible) {
          const mat = trailPoints[i].material as THREE.MeshBasicMaterial;
          mat.opacity -= dt * 1.5;
          if (mat.opacity <= 0) trailPoints[i].visible = false;
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= 9.8 * dt;
        p.life -= dt;
        if (p.life <= 0 || p.mesh.position.y < 0) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }

      if (shakeTime > 0) {
        shakeTime -= dt;
        camera.position.set((Math.random()-0.5)*shakeIntensity, 4+(Math.random()-0.5)*shakeIntensity, 8+(Math.random()-0.5)*shakeIntensity);
      } else { camera.position.set(0, 4, 8); }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      pitchTexture.dispose();
      stadiumTexture.dispose();
      netMaterial.map?.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
};
