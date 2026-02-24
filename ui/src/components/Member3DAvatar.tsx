import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ErrorBoundary } from './ErrorBoundary';

interface Member {
  id: string;
  name: string;
  platform: string;
  isRunning?: boolean;
}

interface Member3DAvatarProps {
  member: Member | null;
}

// 根据平台返回不同的颜色
function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    claude: '#FF6B6B',
    codex: '#4ECDC4',
    gemini: '#95E1D3',
  };
  return colors[platform.toLowerCase()] || '#6366f1';
}

// 单个成员的3D模型
function MemberModel({ member }: { member: Member }) {
  const color = getPlatformColor(member.platform);
  
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} />
      
      {/* 主模型 - 使用菱形组合（两个旋转的boxGeometry）创造科技感 */}
      <group>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.7}
            roughness={0.3}
            emissive={member.isRunning ? color : '#000000'}
            emissiveIntensity={member.isRunning ? 0.3 : 0}
          />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 4, -Math.PI / 4, 0]}>
          <boxGeometry args={[1.0, 1.0, 1.0]} />
          <meshStandardMaterial 
            color={color} 
            metalness={0.8}
            roughness={0.2}
            emissive={member.isRunning ? color : '#000000'}
            emissiveIntensity={member.isRunning ? 0.2 : 0}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
      
      {/* 如果运行中，添加旋转的环（使用多个小立方体组成） */}
      {member.isRunning && (
        <group>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 1.5;
            return (
              <mesh 
                key={i}
                position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
                rotation={[0, 0, angle]}
              >
                <boxGeometry args={[0.1, 0.3, 0.1]} />
                <meshStandardMaterial 
                  color={color} 
                  emissive={color}
                  emissiveIntensity={0.8}
                />
              </mesh>
            );
          })}
        </group>
      )}
      
      {/* 背景网格 */}
      <gridHelper args={[5, 20, '#4a5568', '#2d3748']} />
      
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={3}
        maxDistance={8}
        autoRotate={member.isRunning}
        autoRotateSpeed={member.isRunning ? 1 : 0}
      />
    </>
  );
}

export default function Member3DAvatar({ member }: Member3DAvatarProps) {
  if (!member) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="text-6xl opacity-50">👤</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-full relative">
        <Canvas 
          camera={{ position: [0, 0, 4], fov: 50 }}
          gl={{ 
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
          }}
        >
          <Suspense fallback={null}>
            <MemberModel member={member} />
          </Suspense>
        </Canvas>
        
        {/* 运行状态指示器覆盖层 */}
        {member.isRunning && (
          <div className="absolute top-4 right-4 z-10">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
