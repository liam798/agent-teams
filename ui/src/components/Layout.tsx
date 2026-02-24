import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { is3D } = useTheme();

  return (
    <div 
      className={`
        min-h-screen transition-all duration-500
        ${is3D 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 perspective-1000' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
        }
      `}
      style={is3D ? { perspective: '1000px' } : {}}
    >
      <nav 
        className={`
          backdrop-blur-md border-b shadow-sm sticky top-0 z-50 transition-all duration-500
          ${is3D 
            ? 'bg-slate-800/90 border-purple-500/30 shadow-purple-500/20' 
            : 'bg-white/90 border-gray-200'
          }
        `}
        role="navigation" 
        aria-label="主导航"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link
              to="/"
              className={`
                flex items-center gap-2.5 text-lg font-bold transition-all -ml-2 py-2
                ${is3D 
                  ? 'text-white hover:text-purple-300' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700'
                }
              `}
            >
              <div 
                className={`
                  w-7 h-7 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 transition-all duration-300
                  ${is3D 
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/50 hover:scale-110 hover:rotate-12' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:scale-105'
                  }
                `}
              >
                <Users className="w-4 h-4 text-white" />
              </div>
              <span>Agent Teams</span>
            </Link>
            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
