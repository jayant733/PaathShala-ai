import { useState } from 'react';
import { authApi } from '../api/auth.api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Assuming backend only expects email and password
      await authApi.register(email, password);
      // Auto redirect to login
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register');
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
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-surface shadow-[8px_8px_0_0_#000000] border-4 border-surface-border rounded-xl overflow-hidden">
            <div className="p-8 md:p-12 bg-surface-container-highest border-b-4 md:border-b-0 md:border-r-4 border-surface-border flex flex-col justify-center">
              <div className="mb-12">
                <h1 className="font-headline-xl text-[48px] font-black text-on-surface mb-4 leading-tight uppercase tracking-tight">Create your account</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant font-bold">Join the next generation of AI learning.</p>
              </div>
              
              <div className="space-y-6">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider mb-4 font-bold">Benefits</h3>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-fixed border-4 border-surface-border flex items-center justify-center shadow-[4px_4px_0_0_#000000] transform -rotate-3">
                    <span className="material-symbols-outlined text-on-primary-fixed">psychology</span>
                  </div>
                  <div>
                    <h4 className="font-button-text text-button-text text-on-surface mb-1 font-black uppercase">Personalized AI Tutor</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-tight">Adaptive learning paths that mold to your unique pace and style.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary-fixed border-4 border-surface-border flex items-center justify-center shadow-[4px_4px_0_0_#000000] transform rotate-3">
                    <span className="material-symbols-outlined text-on-secondary-fixed">memory</span>
                  </div>
                  <div>
                    <h4 className="font-button-text text-button-text text-on-surface mb-1 font-black uppercase">Smart Memory</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-tight">Never forget a concept with spaced repetition built right in.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-tertiary-fixed border-4 border-surface-border flex items-center justify-center shadow-[4px_4px_0_0_#000000] transform -rotate-2">
                    <span className="material-symbols-outlined text-on-tertiary-fixed">route</span>
                  </div>
                  <div>
                    <h4 className="font-button-text text-button-text text-on-surface mb-1 font-black uppercase">Structured Roadmaps</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-tight">Clear, step-by-step guides to master any complex subject.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 md:p-12 flex flex-col justify-center bg-surface relative">
              {error && (
                <div className="mb-6 bg-error-container text-on-error-container border-2 border-error p-4 font-body-md shadow-[2px_2px_0_0_#000000]">
                  {error}
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleRegister}>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface block font-bold uppercase" htmlFor="name">Full Name</label>
                  <input 
                    className="w-full bg-background border-4 border-surface-border px-4 py-3 font-body-lg text-body-lg text-on-surface focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_0_#064e3b] transition-shadow" 
                    id="name" 
                    placeholder="John Doe" 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface block font-bold uppercase" htmlFor="email">Email Address</label>
                  <input 
                    className="w-full bg-background border-4 border-surface-border px-4 py-3 font-body-lg text-body-lg text-on-surface focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_0_#064e3b] transition-shadow" 
                    id="email" 
                    placeholder="john@example.com" 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface block font-bold uppercase" htmlFor="password">Password</label>
                  <input 
                    className="w-full bg-background border-4 border-surface-border px-4 py-3 font-body-lg text-body-lg text-on-surface focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_0_#064e3b] transition-shadow" 
                    id="password" 
                    placeholder="••••••••" 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <button 
                  className={`w-full bg-primary text-on-primary font-button-text text-button-text py-4 px-6 border-4 border-surface-border transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${loading ? "opacity-70 cursor-not-allowed shadow-[4px_4px_0_0_#000000]" : "shadow-[8px_8px_0_0_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0_0_#000000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none"}`}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                  {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                </button>
              </form>
              
              <div className="my-8 flex items-center gap-4">
                <div className="h-[4px] flex-1 bg-surface-border"></div>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">Or</span>
                <div className="h-[4px] flex-1 bg-surface-border"></div>
              </div>
              
              <button 
                className="w-full bg-secondary-fixed text-on-secondary-fixed font-button-text text-button-text py-4 px-6 border-4 border-surface-border hover:shadow-[8px_8px_0_0_#000000] active:shadow-[2px_2px_0_0_#000000] active:translate-y-[8px] active:translate-x-[8px] transition-all flex items-center justify-center gap-3 uppercase tracking-wider" 
                type="button"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Sign up with Google
              </button>
              
              <div className="mt-8 text-center">
                <p className="font-body-md text-body-md text-on-surface-variant font-bold">
                  Already have an account?{' '}
                  <Link className="font-button-text text-button-text text-primary hover:underline underline-offset-4 decoration-4 uppercase" to="/login">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
