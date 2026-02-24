import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useTheme } from '../contexts/ThemeContext';
import { ErrorBoundary } from './ErrorBoundary';

interface Member {
  id: string;
  name: string;
  platform: string;
  isRunning?: boolean;
}

interface Members3DSimpleProps {
  members: Member[];
}

// 最简单的测试组件 - 使用JSX语法（React Three Fiber v8支持）
function SimpleTest() {
  console.log('[SimpleTest] 开始渲染');
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      <OrbitControls />
    </>
  );
}

export default function Members3DSimple({ members }: Members3DSimpleProps) {
  const { is3D } = useTheme();

  // 调试：强制显示3D内容用于测试
  console.log('[Members3DSimple] is3D:', is3D, 'members:', members.length);

  // 临时：即使is3D为false也显示，用于测试Canvas是否能正常工作
  const shouldShow = true; // 强制显示用于测试

  if (!shouldShow) {
    return null;
  }

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 rounded-xl bg-slate-800/50 border border-purple-500/30">
        <p className="text-purple-200">暂无成员</p>
      </div>
    );
  }

  console.log('[Members3DSimple] 开始渲染Canvas，成员数量:', members.length);

  // 检查WebGL支持
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const supported = !!gl;
    setWebglSupported(supported);
    console.log('[Members3DSimple] WebGL支持:', supported);
    if (!supported) {
      console.error('[Members3DSimple] WebGL不支持或不可用');
    }
  }, []);

  if (webglSupported === false) {
    return (
      <div className="w-full h-96 rounded-xl bg-red-900/50 border-2 border-red-500 p-6 flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold text-red-200 mb-3">❌ WebGL不支持</h3>
        <p className="text-sm text-red-300 mb-4 text-center">
          您的浏览器不支持WebGL，无法显示3D内容。
          <br />
          请使用支持WebGL的浏览器（Chrome、Firefox、Edge等）。
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-96 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-purple-900 border-2 border-purple-500/50 relative" style={{ minHeight: '384px' }}>
        <div className="absolute top-2 left-2 text-sm font-bold text-green-300 bg-green-900/80 px-3 py-2 rounded pointer-events-none z-30 border-2 border-green-500">
          ✅ 3D测试模式 | {members.length} 个成员 | is3D: {is3D ? 'true' : 'false'}
        </div>
        <Canvas 
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ 
            antialias: true,
            alpha: false
          }}
          onCreated={(state) => {
            console.log('[Members3DSimple] Canvas创建成功:', {
              width: state.size.width,
              height: state.size.height,
              gl: state.gl ? '已定义' : '未定义'
            });
          }}
        >
          <Suspense fallback={null}>
            <SimpleTest />
          </Suspense>
        </Canvas>
      </div>
    </ErrorBoundary>
  );
}
