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
    <main className="flex items-center justify-center min-h-screen p-margin-mobile bg-background text-on-surface">
      <div className="flex flex-col w-full h-full min-h-[calc(100vh-64px)] justify-center items-center relative overflow-hidden">
        
        {/* Ambient Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-[128px]"></div>
          <div className="absolute bottom-1/3 right-1/4 w-[30rem] h-[30rem] bg-secondary rounded-full mix-blend-screen filter blur-[128px]"></div>
        </div>

        <div className="relative w-full max-w-md mx-auto p-margin-mobile md:p-0 z-10">
          <div className="bg-surface-container-low rounded-xl shadow-2xl p-stack-lg flex flex-col gap-stack-lg backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 border border-outline/10 rounded-xl pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center gap-stack-sm">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center shadow-inner mb-stack-sm relative">
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse"></div>
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
              </div>
              <h1 className="font-headline-md text-headline-md text-on-surface">Welcome back</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Continue your AI learning journey.</p>
            </div>

            {error && (
              <div className="bg-error/10 text-error p-3 rounded-lg text-sm text-center border border-error/20">
                {error}
              </div>
            )}

            <form className="flex flex-col gap-stack-md" onSubmit={handleLogin}>
              <div className="flex flex-col gap-unit">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="email">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">mail</span>
                  <input 
                    className="w-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm rounded-lg py-3 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary transition-shadow placeholder:text-outline/50 border border-transparent focus:border-primary/20 shadow-inner" 
                    id="email" 
                    placeholder="name@university.edu" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-unit">
                <div className="flex justify-between items-center">
                  <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">Password</label>
                  <Link className="font-label-sm text-label-sm text-primary hover:text-primary-fixed transition-colors" to="/forgot-password">Forgot?</Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">lock</span>
                  <input 
                    className="w-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm rounded-lg py-3 pl-10 pr-4 outline-none focus:ring-1 focus:ring-primary transition-shadow placeholder:text-outline/50 border border-transparent focus:border-primary/20 shadow-inner" 
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
              
              <button 
                className={clsx(
                  "mt-stack-sm w-full bg-primary text-on-primary font-label-md text-label-md rounded-lg py-3 px-4 shadow-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden group",
                  loading ? "opacity-80 cursor-not-allowed" : "hover:bg-primary-fixed active:scale-[0.98]"
                )} 
                type="submit"
                disabled={loading}
              >
                {!loading && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>}
                
                <span className={clsx("relative z-10 flex items-center gap-2", loading && "hidden")}>
                  Sign In
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </span>
                
                {loading && (
                  <span className="material-symbols-outlined animate-spin text-xl relative z-10">progress_activity</span>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-outline-variant/30"></div>
              <span className="bg-surface-container-low px-4 font-label-sm text-label-sm text-on-surface-variant relative z-10">OR</span>
            </div>

            <button className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-lg py-3 px-4 shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3" type="button">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Continue with Google
            </button>
            <p className="text-center font-body-sm text-body-sm text-on-surface-variant mt-stack-sm">
              Don't have an account? <Link className="text-primary hover:text-primary-fixed transition-colors font-label-sm text-label-sm" to="/register">Sign up</Link>
            </p>
          </div>
          
          <div className="mt-stack-md text-center">
            <p className="font-label-sm text-label-sm text-outline flex items-center justify-center gap-1 opacity-70">
              <span className="material-symbols-outlined text-sm">lock</span>
              Secure encrypted connection
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
