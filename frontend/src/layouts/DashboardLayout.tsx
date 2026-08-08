import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'home' },
  { path: '/ai-tutor', label: 'AI Tutor', icon: 'chat_bubble' },
  { path: '/quizzes', label: 'Quizzes', icon: 'check_box' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface min-h-screen relative">
      {/* Background container removed for theme consistency */}
      
      {/* Main Layout content, elevated above background */}
      <div className="relative z-10 flex w-full">
        <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low border-r border-outline-variant/10 z-50 flex flex-col pt-stack-md">
        <div className="px-6 flex items-center gap-3 mb-stack-lg">
          <img alt="PaathShala AI Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjLMOH7YO4Q7odRxtoYeO28_X9t8IHjQswN890KQe2mRtLNoUDiMaz1MYqrMMjdNwHt9nNP056QsusKlE4Nqv9M22uSb2M31M33vHVjOFJf5ECHrfhYhhauDJw4XN3CqKNzLG4Aj3yBZ4JK2gwHqgCSyAm0-qRTac_3ugF9FMeKtRCBfLBoSfH2xwq7Brgy-Bsul_Qai6bl0Rk4uRMInpMNJ0Jb5Mc76U5xQZkCGcsGy5TO4RPCJGJEmZebpy4RqUcT2fenEhdKw"/>
          <span className="font-title-lg text-title-lg tracking-tight">PaathShala AI</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path.split('?')[0]);
            return (
              <Link
                key={item.label}
                to={item.path}
                className={clsx(
                  "flex items-center px-4 py-2.5 rounded-lg transition-all group",
                  isActive 
                    ? "bg-primary-container text-on-primary-container font-medium"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                )}
              >
                <span className="material-symbols-outlined mr-3 text-[20px] group-hover:text-primary transition-colors">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto p-4 border-t border-outline-variant/10">
          <div onClick={logout} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer group">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-md font-label-md text-on-surface truncate">{user?.email?.split('@')[0] || 'Student User'}</p>
              <p className="text-label-sm font-label-sm text-on-surface-variant truncate">Pro Learner</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-error text-[18px]">logout</span>
          </div>
        </div>
      </aside>

      <div className="pl-72 w-full">
        <header className="fixed top-0 left-72 right-0 h-16 bg-surface/80 backdrop-blur-md z-40 px-gutter flex items-center justify-between border-b border-outline-variant/5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4 flex-1">
            <div className="bg-surface-container-high rounded-lg px-3 py-1.5 flex items-center gap-2 max-w-md w-full border border-outline-variant/20 hover:border-primary/30 transition-colors group cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <span className="text-label-md font-label-md text-on-surface-variant">Search or Command+K</span>
              <div className="ml-auto flex gap-1 items-center">
                <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/20 text-[10px] text-on-surface-variant">⌘</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/20 text-[10px] text-on-surface-variant">K</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
          </div>
        </header>

        <main className="relative pt-16 w-full min-h-screen">
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  </div>
  );
}
