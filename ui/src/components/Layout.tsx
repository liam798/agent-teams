import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 transition-all duration-500">
      <nav
        className="backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50 bg-white/90"
        role="navigation"
        aria-label="主导航"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-lg font-bold -ml-2 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 hover:scale-105 transition-all duration-300">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span>Agent Teams</span>
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
