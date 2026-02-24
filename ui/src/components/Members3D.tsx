import { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../contexts/ThemeContext';
import { ErrorBoundary } from './ErrorBoundary';

// 确保THREE对象已加载
if (typeof THREE === 'undefined') {
  console.error('[Members3D] THREE对象未定义！');
}

interface Member {
  id: string;
  name: string;
  platform: string;
  isRunning?: boolean;
}

interface Members3DProps {
  members: Member[];
  onMemberClick?: (member: Member) => void;
}

// 平台颜色映射
const platformColors: Record<string, string> = {
  claude: '#FF6B6B',
  codex: '#4ECDC4',
  gemini: '#95E1D3',
};

// 单个成员3D对象
function MemberAvatar({ member, position, onClick }: { member: Member; position: [number, number, number]; onClick?: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = platformColors[member.platform.toLowerCase()] || '#6366f1';
  const isRunning = member.isRunning;

  // 旋转动画
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (isRunning) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  console.log(`[MemberAvatar] ${member.name} 渲染，使用JSX语法`);

  return (
    <group position={position}>
      {/* 成员主体 - 使用八面体，使用JSX语法避免直接创建Three.js对象 */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        {/* 使用boxGeometry替代octahedronGeometry，避免extend问题 */}
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial
          color={isRunning ? color : '#666'}
          emissive={isRunning ? color : '#000'}
          emissiveIntensity={isRunning ? 0.5 : 0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 运行状态指示器 */}
      {isRunning && (
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color="#00ff00"
            emissive="#00ff00"
            emissiveIntensity={1}
          />
        </mesh>
      )}

      {/* 成员名称标签 */}
      <Html position={[0, -0.8, 0]} center>
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {member.name}
        </div>
      </Html>

      {/* 平台标签 */}
      <Html position={[0, -1.1, 0]} center>
        <div
          style={{
            background: color,
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {member.platform}
        </div>
      </Html>
    </group>
  );
}

// 3D场景
function Scene({ members, onMemberClick }: Members3DProps) {
  // 调试日志
  useEffect(() => {
    console.log('[Scene] 场景初始化:', { 
      membersCount: members.length, 
      members,
      THREE: typeof THREE !== 'undefined' ? '已定义' : '未定义',
      THREE_OctahedronGeometry: typeof THREE !== 'undefined' && THREE.OctahedronGeometry ? '已定义' : '未定义'
    });
  }, [members]);

  // 计算成员位置（圆形排列）
  const radius = 2;
  const positions = useMemo(() => {
    if (members.length === 0) {
      console.warn('[Scene] 成员列表为空');
      return [];
    }
    const pos = members.map((_, index) => {
      const angle = (index / members.length) * Math.PI * 2;
      return [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ] as [number, number, number];
    });
    console.log('[Scene] 计算位置完成:', { count: pos.length, positions: pos });
    return pos;
  }, [members]);


  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.6} />
      {/* 主光源 */}
      <directionalLight position={[5, 5, 5]} intensity={1} />
      {/* 点光源 */}
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#6366f1" />

      {/* 地面网格 - 使用JSX语法 */}
      <gridHelper args={[10, 10, 0x4a5568, 0x2d3748]} />

      {/* 测试立方体（用于验证渲染是否正常） */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color={0x00ff00} />
      </mesh>
      <Html position={[0, 1.5, 0]} center>
        <div style={{ 
          color: 'white', 
          fontSize: '14px', 
          background: 'rgba(0,255,0,0.7)', 
          padding: '8px 12px',
          borderRadius: '4px',
          fontWeight: 'bold',
          pointerEvents: 'none'
        }}>
          ✅ 3D渲染正常
        </div>
      </Html>

      {/* 渲染所有成员 */}
      {members.length > 0 && positions.length === members.length && members.map((member, index) => {
        console.log(`[Scene] 渲染成员 ${index}:`, member.name, positions[index]);
        return (
          <MemberAvatar
            key={member.id}
            member={member}
            position={positions[index]}
            onClick={() => onMemberClick?.(member)}
          />
        );
      })}

      {/* 轨道控制器 */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={10}
        target={[0, 0, 0]}
      />
    </>
  );
}

// 加载占位符
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="text-purple-200 text-lg">加载3D场景...</div>
    </div>
  );
}

// 主组件
export default function Members3D({ members, onMemberClick }: Members3DProps) {
  const { is3D } = useTheme();

  // 调试日志
  useEffect(() => {
    console.log('[Members3D] 组件渲染:', { is3D, membersCount: members.length, members });
    if (is3D) {
      console.log('[Members3D] 3D模式已启用，准备渲染Canvas');
    } else {
      console.log('[Members3D] 3D模式未启用，返回null');
    }
  }, [is3D, members.length, members]);

  if (!is3D) {
    console.log('[Members3D] is3D为false，返回null');
    return (
      <div className="w-full h-96 rounded-xl bg-yellow-900/50 border-2 border-yellow-500 p-6 flex items-center justify-center">
        <p className="text-yellow-200 text-lg">⚠️ 3D模式未启用 (is3D=false)</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 rounded-xl bg-slate-800/50 border border-purple-500/30">
        <p className="text-purple-200">暂无成员</p>
      </div>
    );
  }

  // 验证成员数据完整性
  const validMembers = members.filter(m => m && m.id && m.name);
  if (validMembers.length === 0) {
    console.warn('[Members3D] 成员数据无效:', members);
    return (
      <div className="flex items-center justify-center h-96 rounded-xl bg-red-900/50 border border-red-500/30">
        <div className="text-center">
          <p className="text-red-200 mb-2">成员数据无效</p>
          <p className="text-red-300 text-xs">请检查控制台日志</p>
        </div>
      </div>
    );
  }

  console.log('[Members3D] 准备渲染3D场景:', {
    totalMembers: members.length,
    validMembers: validMembers.length,
    members: validMembers.map(m => ({ id: m.id, name: m.name, platform: m.platform }))
  });

  console.log('[Members3D] 开始渲染Canvas容器，成员数量:', validMembers.length);

  return (
    <ErrorBoundary>
      <div 
        className="w-full h-96 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-purple-900 border-2 border-purple-500/50 relative" 
        style={{ minHeight: '384px', position: 'relative' }}
        id="members-3d-container"
      >
        {/* 明显的调试指示器 */}
        <div className="absolute top-2 left-2 text-sm font-bold text-green-300 bg-green-900/80 px-3 py-2 rounded pointer-events-none z-30 border-2 border-green-500">
          ✅ 3D模式已启用 | {validMembers.length} 个成员
        </div>
        <div className="absolute top-2 right-2 text-xs text-purple-300 bg-black/70 px-2 py-1 rounded pointer-events-none z-20">
          Canvas容器
        </div>
        <Canvas 
          camera={{ position: [0, 3, 5], fov: 50 }}
          gl={{ 
            antialias: true, 
            alpha: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false
          }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%', display: 'block', background: '#1a1a2e', minHeight: '384px' }}
          frameloop="always"
          onCreated={(state) => {
            console.log('[Members3D] Canvas onCreated回调触发');
            // 确保WebGL上下文正确初始化
            try {
              const gl = state.gl.getContext();
              if (!gl) {
                console.error('[Members3D] ❌ WebGL context not available');
                return;
              }
              const canvas = state.gl.domElement;
              console.log('[Members3D] ✅ Canvas created successfully:', {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                width: state.size.width,
                height: state.size.height,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                THREE: typeof THREE !== 'undefined' ? '已定义' : '未定义',
                THREE_OctahedronGeometry: typeof THREE !== 'undefined' && THREE.OctahedronGeometry ? '已定义' : '未定义'
              });
              // 确保Canvas有正确的尺寸
              if (canvas.width === 0 || canvas.height === 0) {
                console.warn('[Members3D] ⚠️ Canvas尺寸为0，尝试设置尺寸');
                canvas.width = state.size.width || 800;
                canvas.height = state.size.height || 384;
              }
            } catch (error: any) {
              console.error('[Members3D] ❌ Canvas creation error:', error);
              if (error?.stack) {
                console.error('[Members3D] 错误堆栈:', error.stack);
              }
              if (error?.message) {
                console.error('[Members3D] 错误消息:', error.message);
              }
            }
          }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Scene members={validMembers} onMemberClick={onMemberClick} />
          </Suspense>
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
