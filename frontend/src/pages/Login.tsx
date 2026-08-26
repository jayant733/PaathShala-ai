import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';
import clsx from 'clsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(email, password);
      // Temporarily set token for getCurrentUser request
      localStorage.setItem('token', response.access_token);
      const user = await authApi.getCurrentUser();
      setAuth(response.access_token, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col antialiased">
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b-2 border-surface-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="h-20 w-full px-margin-mobile lg:px-margin-desktop flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary border-2 border-surface-border flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary">neurology</span>
            </div>
            <span className="font-headline-lg text-[24px] tracking-tighter text-on-surface hidden sm:block">
              PaathShala <span className="text-primary">AI</span>
            </span>
          </Link>
          <nav className="flex items-center gap-gutter">
            <Link className="font-button-text text-button-text text-on-surface hover:text-primary flex items-center gap-2 transition-colors uppercase" to="/">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>Back to Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-24 flex flex-col items-center justify-center bg-background px-margin-mobile">
        <div className="flex flex-col w-full h-full items-center justify-center p-margin-mobile lg:p-margin-desktop">
          <div className="w-full max-w-md bg-surface-container-lowest border-4 border-surface-border rounded-xl shadow-[8px_8px_0_0_#000000] p-8 lg:p-12 relative">
            
            <div className="absolute -top-8 -right-8 bg-secondary-fixed border-4 border-surface-border rounded-full p-4 shadow-[4px_4px_0_0_#000000] transform rotate-12">
              <span className="material-symbols-outlined text-headline-lg text-on-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                school
              </span>
            </div>
            
            <div className="mb-8">
              <h1 className="font-display-lg text-[48px] lg:text-[64px] font-black text-primary mb-2 leading-tight tracking-tight uppercase">Welcome<br/>back</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant font-bold">Continue your AI learning journey.</p>
            </div>

            {error && (
              <div className="mb-6 bg-error-container text-on-error-container border-2 border-error p-4 font-body-md shadow-[2px_2px_0_0_#000000]">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant group-focus-within:text-primary transition-colors">
                      mail
                    </span>
                  </div>
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-background border-2 border-surface-border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary focus:shadow-[4px_4px_0_0_#064e3b] transition-all placeholder:text-outline-variant" 
                    id="email" 
                    placeholder="name@university.edu" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline-variant group-focus-within:text-primary transition-colors">
                      lock
                    </span>
                  </div>
                  <input 
                    className="w-full pl-12 pr-12 py-4 bg-background border-2 border-surface-border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-0 focus:border-primary focus:shadow-[4px_4px_0_0_#064e3b] transition-all placeholder:text-outline-variant" 
                    id="password" 
                    placeholder="••••••••" 
                    required 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-6 h-6 bg-background border-2 border-surface-border rounded focus-within:shadow-[2px_2px_0_0_#000000] transition-shadow">
                    <input className="opacity-0 absolute inset-0 w-full h-full cursor-pointer peer" type="checkbox" />
                    <span className="material-symbols-outlined text-[18px] text-primary opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check
                    </span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary font-bold transition-colors">Remember me</span>
                </label>
                <Link className="font-label-caps text-label-caps text-primary hover:text-surface-tint underline decoration-2 underline-offset-4 transition-colors uppercase" to="/forgot-password">Forgot password?</Link>
              </div>

              <button 
                className={clsx(
                  "w-full flex items-center justify-center gap-2 py-4 bg-primary text-on-primary border-4 border-surface-border font-button-text text-button-text uppercase tracking-wider transition-all",
                  loading ? "opacity-70 cursor-not-allowed shadow-[4px_4px_0_0_#000000]" : "shadow-[8px_8px_0_0_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#000000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none"
                )}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && (
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-1 bg-surface-border"></div>
              <span className="font-label-caps text-label-caps text-on-surface-variant font-bold uppercase">OR</span>
              <div className="flex-1 h-1 bg-surface-border"></div>
            </div>

            <button 
              className="mt-8 w-full flex items-center justify-center gap-3 py-4 bg-surface-container-low text-on-surface border-4 border-surface-border font-button-text text-button-text uppercase tracking-wider shadow-[8px_8px_0_0_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#000000] transition-all active:shadow-none active:translate-y-[8px] active:translate-x-[8px]" 
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Continue with Google
            </button>

            <div className="mt-8 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant font-bold">
                Don't have an account?{' '}
                <Link className="font-button-text text-button-text text-primary hover:text-surface-tint underline decoration-4 underline-offset-4 transition-colors uppercase" to="/register">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
