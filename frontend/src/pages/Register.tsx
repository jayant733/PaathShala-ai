import { useState } from 'react';
import { authApi } from '../api/auth.api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded bg-primary mx-auto mb-4 flex items-center justify-center font-bold text-on-primary text-xl">P</div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Create an account</h1>
          <p className="text-on-surface-variant mt-2">Start learning with PaathShala AI</p>
        </div>
        
        {error && <div className="bg-error-container text-on-error-container p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-on-primary font-medium py-3 rounded-lg hover:bg-primary-fixed transition-colors disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Sign up'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-on-surface-variant text-sm">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
