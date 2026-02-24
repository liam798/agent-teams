import { Box, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { toggleMode, is3D } = useTheme();

  return (
    <button
      onClick={toggleMode}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-lg
        transition-all duration-300 transform
        ${is3D 
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105' 
          : 'bg-white/90 text-slate-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        cursor-pointer min-h-[44px]
      `}
      aria-label={`切换到${is3D ? '普通' : '3D'}模式`}
      title={`当前: ${is3D ? '3D模式' : '普通模式'}`}
    >
      {is3D ? (
        <>
          <Box className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium">3D模式</span>
        </>
      ) : (
        <>
          <Palette className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium">普通模式</span>
        </>
      )}
    </button>
  );
}
