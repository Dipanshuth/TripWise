import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { login, getCurrentUser } from '@/services/apiService';
import { useToast } from '@/context/ToastContext';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ username, password });
      const user = await getCurrentUser();
      if (user.authenticated) {
        setCurrentUser(user.user);
        toast('Logged in successfully', 'success');
        navigate('/my-trips');
      }
    } catch (err: any) {
      toast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 px-4 max-w-md mx-auto pb-16">
      <h1 className="text-3xl font-bold text-charcoal mb-6 text-center">Log In</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <Input 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Username" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <Input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
            required 
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
