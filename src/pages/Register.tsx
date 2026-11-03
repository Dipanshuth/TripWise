import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { register, getCurrentUser } from '@/services/apiService';
import { useToast } from '@/context/ToastContext';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ username, email, password });
      const user = await getCurrentUser();
      if (user.authenticated) {
        setCurrentUser(user.user);
        toast('Registration successful', 'success');
        navigate('/profile');
      }
    } catch (err: any) {
      toast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 px-4 max-w-md mx-auto pb-16">
      <h1 className="text-3xl font-bold text-charcoal mb-6 text-center">Sign Up</h1>
      <form onSubmit={handleRegister} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <Input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Email" 
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
          {loading ? 'Signing up...' : 'Sign Up'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}
