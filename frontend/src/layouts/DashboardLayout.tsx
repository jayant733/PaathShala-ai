import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

interface DashboardLayoutProps {
  children: ReactNode;
}

const mainNavItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/ai-tutor', label: 'AI Tutor' },
  { path: '/quizzes', label: 'Quizzes' },
  { path: '/progress', label: 'My Progress' },
];

const accountNavItems = [
  { path: '/settings', label: 'Profile Settings', icon: 'settings' },
  { path: '/notifications', label: 'Notifications', icon: 'notifications' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container border-r-2 border-surface-border z-50 flex flex-col pt-spacing-gutter pb-spacing-gutter">
        <div className="px-spacing-gutter mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary border-2 border-surface-border shadow-[2px_2px_0px_0px_#111827] flex items-center justify-center">
            <span className="material-symbols-outlined text-on-secondary">school</span>
          </div>
          <span className="font-headline-lg text-headline-lg tracking-tight text-primary">PaathShala</span>
        </div>
        
        <div className="px-spacing-gutter mb-6">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-4 uppercase tracking-widest">Account</p>
          <nav className="flex flex-col gap-2">
            {accountNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={clsx(
                    "flex items-center px-4 py-3 border-2 transition-all font-button-text",
                    isActive 
                      ? "bg-secondary-container text-on-secondary-container border-surface-border shadow-[4px_4px_0px_0px_#111827]"
                      : "border-transparent text-on-surface-variant hover:border-surface-border hover:bg-surface-container-high"
                  )}
                >
                  <span className="material-symbols-outlined mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto px-spacing-gutter border-t-2 border-surface-border pt-6">
          <button 
            onClick={logout}
            className="w-full flex items-center px-4 py-3 border-2 border-surface-border bg-error text-on-error font-button-text hover:shadow-[4px_4px_0px_0px_#111827] transition-all active:shadow-none active:translate-y-1 active:translate-x-1"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="pl-72">
        <header className="fixed top-0 left-72 right-0 h-20 bg-surface/90 backdrop-blur-md border-b-2 border-surface-border z-40 flex items-center justify-between px-spacing-gutter">
          <div className="flex-1 max-w-xl pr-12">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">search</span>
              <input 
                className="w-full bg-surface-container-low border-2 border-surface-border py-3 pl-12 pr-4 font-body-md focus:shadow-[4px_4px_0px_0px_#111827] outline-none transition-all placeholder:text-on-surface-variant/50" 
                placeholder="Search courses or quizzes..." 
                type="text"
              />
            </div>
          </div>
          
          <nav className="flex items-center gap-10">
            {mainNavItems.map(item => {
              const isActive = location.pathname.startsWith(item.path.split('?')[0]);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={clsx(
                    "transition-colors font-button-text",
                    isActive
                      ? "text-primary font-bold underline decoration-4 underline-offset-8"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-surface-border ml-4 uppercase text-on-primary font-bold">
              {user?.email?.charAt(0) || 'U'}
            </div>
          </nav>
        </header>

        <main className="relative pt-20 min-h-screen bg-surface">
          {children}
        </main>
      </div>
    </div>
  );
}
