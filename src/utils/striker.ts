import * as THREE from 'three';

export const createStriker = () => {
  const color = '#00ffff';
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1, emissive: '#00ffff', emissiveIntensity: 0.2 });
  
  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), material);
  head.position.y = 1.6;
  head.castShadow = true;
  group.add(head);

  // Eyes
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const eyeGeo = new THREE.SphereGeometry(0.05, 16, 16);
  
  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.1, 1.65, 0.25);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.1, 1.65, 0.25);
  group.add(rightEye);

  // Highlight
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  const highlightGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
  leftHighlight.position.set(-0.12, 1.67, 0.28);
  group.add(leftHighlight);
  
  const rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
  rightHighlight.position.set(0.08, 1.67, 0.28);
  group.add(rightHighlight);

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 4, 16), material);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  // Limb geometries
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.35, 4, 16);
  const legGeo = new THREE.CapsuleGeometry(0.1, 0.4, 4, 16);
  const handGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const footGeo = new THREE.CapsuleGeometry(0.1, 0.15, 4, 16);

  // Left Arm
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.3, 1.25, 0);
  const leftArm = new THREE.Mesh(armGeo, material);
  leftArm.position.set(0, -0.175, 0);
  leftArm.castShadow = true;
  const leftHand = new THREE.Mesh(handGeo, material);
  leftHand.position.set(0, -0.4, 0);
  leftHand.castShadow = true;
  leftArmPivot.add(leftArm, leftHand);
  group.add(leftArmPivot);

  // Right Arm
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.3, 1.25, 0);
  const rightArm = new THREE.Mesh(armGeo, material);
  rightArm.position.set(0, -0.175, 0);
  rightArm.castShadow = true;
  const rightHand = new THREE.Mesh(handGeo, material);
  rightHand.position.set(0, -0.4, 0);
  rightHand.castShadow = true;
  rightArmPivot.add(rightArm, rightHand);
  group.add(rightArmPivot);

  // Left Leg
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.15, 0.7, 0);
  const leftLeg = new THREE.Mesh(legGeo, material);
  leftLeg.position.set(0, -0.2, 0);
  leftLeg.castShadow = true;
  const leftFoot = new THREE.Mesh(footGeo, material);
  leftFoot.position.set(0, -0.45, 0.05);
  leftFoot.rotation.x = Math.PI / 2;
  leftFoot.castShadow = true;
  leftLegPivot.add(leftLeg, leftFoot);
  group.add(leftLegPivot);

  // Right Leg
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.15, 0.7, 0);
  const rightLeg = new THREE.Mesh(legGeo, material);
  rightLeg.position.set(0, -0.2, 0);
  rightLeg.castShadow = true;
  const rightFoot = new THREE.Mesh(footGeo, material);
  rightFoot.position.set(0, -0.45, 0.05);
  rightFoot.rotation.x = Math.PI / 2;
  rightFoot.castShadow = true;
  rightLegPivot.add(rightLeg, rightFoot);
  group.add(rightLegPivot);

  // Default pose
  leftArmPivot.rotation.x = -Math.PI / 6;
  rightArmPivot.rotation.x = Math.PI / 6;

  let elapsed = 0;
  const update = (dt: number, state: 'idle' | 'aiming' | 'approaching' | 'kicking') => {
    elapsed += dt;
    
    if (state === 'idle') {
      const bounce = Math.abs(Math.sin(elapsed * 4)) * 0.05;
      group.position.y = bounce;
      
      const swing = Math.sin(elapsed * 4) * 0.2;
      leftArmPivot.rotation.set(swing, 0, 0.1);
      rightArmPivot.rotation.set(-swing, 0, -0.1);
      leftLegPivot.rotation.set(-swing * 0.5, 0, 0);
      rightLegPivot.rotation.set(swing * 0.5, 0, 0);
      torso.rotation.x = 0;
    } else if (state === 'aiming') {
      // Small weighted breathing
      group.position.y = Math.sin(elapsed * 2) * 0.02;
    } else if (state === 'approaching') {
      // High-speed run cycle
      const runSpeed = 15;
      const legSwing = Math.sin(elapsed * runSpeed) * 0.8;
      const armSwing = Math.sin(elapsed * runSpeed) * 1.2;
      
      leftLegPivot.rotation.x = legSwing;
      rightLegPivot.rotation.x = -legSwing;
      leftArmPivot.rotation.x = -armSwing;
      rightArmPivot.rotation.x = armSwing;
      
      // Lean forward while running
      torso.rotation.x = 0.3;
      group.position.y = Math.abs(Math.cos(elapsed * runSpeed)) * 0.15;
    } else if (state === 'kicking') {
      // Kicking animation handled partially in GameCanvas, 
      // but we add base posture here
      torso.rotation.x = -0.2; // Lean back on kick
    }
  };

  return { 
    group, 
    head,
    torso,
    leftArm: leftArmPivot, 
    rightArm: rightArmPivot, 
    leftLeg: leftLegPivot, 
    rightLeg: rightLegPivot,
    update
  };
};
