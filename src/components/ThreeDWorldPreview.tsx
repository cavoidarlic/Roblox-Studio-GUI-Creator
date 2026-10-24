import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RobloxElement,
  GuiRootType,
  RootProperties
} from '../types/roblox';
import {
  calculatePixelBounds,
  hexToRgb
} from '../utils/robloxMath';
import {
  ArrowLeft,
  RotateCw,
  Sun,
  Eye,
  Sliders
} from 'lucide-react';

interface ThreeDWorldPreviewProps {
  rootType: 'SurfaceGui' | 'BillboardGui';
  rootProperties: RootProperties;
  elements: RobloxElement[];
  onBackTo2D: () => void;
  onUpdateRootProperties: (updated: RootProperties) => void;
}

export const ThreeDWorldPreview: React.FC<ThreeDWorldPreviewProps> = ({
  rootType,
  rootProperties,
  elements,
  onBackTo2D,
  onUpdateRootProperties
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const guiMeshRef = useRef<THREE.Mesh | null>(null);
  const billboardRef = useRef<THREE.Mesh | null>(null);
  const [orbitAngle, setOrbitAngle] = useState({ phi: 0.3, theta: 0.8 });
  const [distance, setDistance] = useState(12);

  // Helper to render current GUI elements onto an HTML5 2D canvas texture
  const drawGuiTexture = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render elements in order
    elements.forEach(el => {
      if (el.visible === false) return;
      const bounds = calculatePixelBounds(el, { w: canvas.width, h: canvas.height });

      const bgRgb = hexToRgb(el.backgroundColor || '#393939');
      const bgTrans = el.backgroundTransparency ?? 0;
      const alpha = Math.max(0, Math.min(1, 1 - bgTrans));

      ctx.save();

      // Rounded corners clipping if UICorner
      if (el.modifiers?.UICorner) {
        const radius = el.modifiers.UICorner.cornerRadiusOffset || 8;
        ctx.beginPath();
        ctx.roundRect(bounds.x, bounds.y, bounds.w, bounds.h, radius);
        ctx.clip();
      }

      // Background
      if (el.modifiers?.UIGradient) {
        const g = el.modifiers.UIGradient;
        const grad = ctx.createLinearGradient(
          bounds.x,
          bounds.y,
          bounds.x + bounds.w,
          bounds.y + bounds.h
        );
        grad.addColorStop(0, g.color1 || '#ff007f');
        grad.addColorStop(1, g.color2 || '#7928ca');
        ctx.fillStyle = grad;
        ctx.globalAlpha = alpha;
        ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
      } else {
        ctx.fillStyle = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${alpha})`;
        ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
      }

      // Stroke
      if (el.modifiers?.UIStroke) {
        const s = el.modifiers.UIStroke;
        ctx.strokeStyle = s.color || '#00a2ff';
        ctx.lineWidth = s.thickness || 2;
        ctx.globalAlpha = 1 - (s.transparency || 0);
        ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
      }

      // Text
      if (
        (el.type === 'TextLabel' || el.type === 'TextButton' || el.type === 'TextBox') &&
        el.text
      ) {
        const textRgb = hexToRgb(el.textColor || '#ffffff');
        ctx.fillStyle = `rgb(${textRgb.r}, ${textRgb.g}, ${textRgb.b})`;
        ctx.globalAlpha = 1;
        ctx.font = `${el.font?.includes('Bold') ? 'bold ' : ''}${el.textSize || 16}px sans-serif`;
        ctx.textAlign =
          el.textXAlignment === 'Left'
            ? 'left'
            : el.textXAlignment === 'Right'
            ? 'right'
            : 'center';
        ctx.textBaseline = 'middle';

        const textX =
          el.textXAlignment === 'Left'
            ? bounds.x + 8
            : el.textXAlignment === 'Right'
            ? bounds.x + bounds.w - 8
            : bounds.x + bounds.w / 2;
        const textY = bounds.y + bounds.h / 2;

        ctx.fillText(el.text, textX, textY);
      }

      // Image placeholder icon or preview
      if (el.type === 'ImageLabel' || el.type === 'ImageButton') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(bounds.x + 4, bounds.y + 4, bounds.w - 8, bounds.h - 8);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🖼️ Image', bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
      }

      ctx.restore();
    });
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 500;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1015);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(8, 15, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Roblox Baseplate Grid
    const grid = new THREE.GridHelper(40, 40, 0x00a2ff, 0x27272a);
    grid.position.y = -1;
    scene.add(grid);

    // Create Offscreen Texture Canvas for GUI
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    drawGuiTexture(canvas);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    textureRef.current = texture;

    if (rootType === 'SurfaceGui') {
      // 3D Brick Part
      const boxGeo = new THREE.BoxGeometry(6, 4.5, 1);
      const materials = [
        new THREE.MeshStandardMaterial({ color: 0x2d2d35, roughness: 0.5 }), // right
        new THREE.MeshStandardMaterial({ color: 0x2d2d35, roughness: 0.5 }), // left
        new THREE.MeshStandardMaterial({ color: 0x2d2d35, roughness: 0.5 }), // top
        new THREE.MeshStandardMaterial({ color: 0x2d2d35, roughness: 0.5 }), // bottom
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }), // front
        new THREE.MeshStandardMaterial({ color: 0x2d2d35, roughness: 0.5 })  // back
      ];

      const partMesh = new THREE.Mesh(boxGeo, materials);
      partMesh.position.set(0, 1.5, 0);
      partMesh.castShadow = true;
      scene.add(partMesh);
      guiMeshRef.current = partMesh;
    } else {
      // BillboardGui mode: Build a 3D Roblox Avatar block model
      const avatarGroup = new THREE.Group();

      // Torso
      const torsoGeo = new THREE.BoxGeometry(2, 2, 1);
      const torsoMat = new THREE.MeshStandardMaterial({ color: 0x007acc, roughness: 0.4 });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = 1;
      avatarGroup.add(torso);

      // Head
      const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 2.6;
      avatarGroup.add(head);

      // Arms & Legs
      const limbGeo = new THREE.BoxGeometry(1, 2, 1);
      const limbMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

      const leftLeg = new THREE.Mesh(limbGeo, limbMat);
      leftLeg.position.set(-0.5, -1, 0);
      avatarGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(limbGeo, limbMat);
      rightLeg.position.set(0.5, -1, 0);
      avatarGroup.add(rightLeg);

      scene.add(avatarGroup);

      // Floating BillboardGui plane
      const planeGeo = new THREE.PlaneGeometry(3.5, 1.5);
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: !rootProperties.BillboardGui.AlwaysOnTop
      });
      const billboardMesh = new THREE.Mesh(planeGeo, planeMat);
      const offset = rootProperties.BillboardGui.StudsOffset;
      billboardMesh.position.set(offset.x, head.position.y + offset.y, offset.z);
      scene.add(billboardMesh);
      billboardRef.current = billboardMesh;
    }

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Update camera position from spherical orbit
      camera.position.x = distance * Math.sin(orbitAngle.theta) * Math.cos(orbitAngle.phi);
      camera.position.y = distance * Math.sin(orbitAngle.phi) + 1.5;
      camera.position.z = distance * Math.cos(orbitAngle.theta) * Math.cos(orbitAngle.phi);
      camera.lookAt(0, 1.5, 0);

      // Billboard must always rotate to face camera
      if (billboardRef.current) {
        billboardRef.current.lookAt(camera.position);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [rootType, elements, orbitAngle, distance]);

  // Orbit drag controls
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    setOrbitAngle(prev => ({
      theta: prev.theta - dx * 0.01,
      phi: Math.max(-0.5, Math.min(1.2, prev.phi + dy * 0.01))
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setDistance(prev => Math.max(4, Math.min(25, prev + e.deltaY * 0.02)));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0e0f12] overflow-hidden relative select-none">
      {/* 3D Viewport Controls Bar */}
      <div className="h-10 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between px-3 text-xs shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackTo2D}
            className="px-2.5 py-1 bg-[#2d2d30] hover:bg-[#37373d] text-white border border-[#3e3e42] rounded flex items-center space-x-1.5 transition text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#00a2ff]" />
            <span>Return to 2D Canvas</span>
          </button>

          <div className="h-4 w-px bg-[#3e3e42]" />

          <div className="flex items-center space-x-2 text-white font-semibold">
            <span className="text-[#00a2ff]">{rootType}</span>
            <span className="text-gray-400 font-normal text-[11px]">
              (3D Roblox World Simulation)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-gray-400 hidden md:inline">
            🖱️ Left click & drag to rotate camera • Scroll to zoom
          </span>

          <button
            onClick={() => {
              setOrbitAngle({ phi: 0.3, theta: 0.8 });
              setDistance(12);
            }}
            title="Reset Camera Position"
            className="px-2 py-0.5 bg-[#2d2d30] hover:bg-[#37373d] text-gray-300 rounded border border-[#3e3e42] text-[11px] flex items-center space-x-1"
          >
            <RotateCw className="w-3 h-3 text-amber-400" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* 3D Scene Mount Area */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden"
      >
        {/* Overlay HUD / Info Card */}
        <div className="absolute bottom-4 left-4 bg-[#18181b]/90 border border-[#3e3e42] p-3 rounded-lg text-xs text-gray-300 max-w-xs backdrop-blur-sm pointer-events-none space-y-1.5">
          <div className="font-bold text-white flex items-center space-x-1.5 text-sm">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Live Roblox World Preview</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            {rootType === 'SurfaceGui'
              ? 'Your designed GUI is dynamically projected onto the front face of a 3D Part in the workspace.'
              : 'Your designed BillboardGui hovers above the character head with StudsOffset and continuously faces the active player camera.'}
          </p>
          <div className="text-[10px] text-gray-500 font-mono pt-1 border-t border-[#3e3e42]">
            Target: {rootType === 'SurfaceGui' ? 'workspace.Part' : 'player.Character.Head'}
          </div>
        </div>
      </div>
    </div>
  );
};
