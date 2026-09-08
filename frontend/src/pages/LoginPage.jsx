import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { useAuthStore, demoAccounts } from '../store/authStore';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff, ShieldCheck, Store, UserRound, Landmark } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, loginDemo } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Login successful');
      navigate(user?.role === 'admin' ? '/admin/settings' : '/dashboard');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Login failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDemoLogin = (role) => {
    const ok = loginDemo(role);
    if (!ok) {
      toast.error('Demo account not available');
      return;
    }

    toast.success('Demo account connected successfully');
    navigate(role === 'admin' ? '/admin/settings' : role === 'banker' ? '/banker-dashboard' : role === 'farmer' ? '/farmer-portal' : '/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-v42-paddy2 py-12 px-4">
      <div className="max-w-5xl w-full grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-v42-paddy border border-v42-line rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-v42-forest rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-v42-ink">Welcome Back</h1>
            <p className="text-v42-mut">Sign in to your AFRERA account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-v42-ink2 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-v42-ink2 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-v42-mut hover:text-v42-ink2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-v42-line text-v42-forest focus:ring-v42-turmeric" />
                <span className="ml-2 text-sm text-v42-mut">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-v42-forest hover:text-v42-turmericink">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full px-4 py-3 bg-v42-forest text-white rounded-lg font-semibold hover:bg-v42-forestd transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loginMutation.isPending ? (
                <span className="animate-spin mr-2">⌛</span>
              ) : (
                <LogIn className="w-5 h-5 mr-2" />
              )}
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-v42-mut">
              Don't have an account?{' '}
              <Link to="/register" className="text-v42-forest hover:text-v42-turmericink font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Secure access</div>
              <h2 className="text-2xl font-bold">Platform access by role</h2>
            </div>
          </div>

          <p className="mb-6 text-sm text-slate-300">
            Public browsing is open to everyone. Orders, payouts, admin controls, and client-sensitive tools are gated behind login and role-based access.
          </p>

          <div className="space-y-3">
            {demoAccounts.map((account) => {
              const Icon = account.role === 'admin' ? ShieldCheck : account.role === 'banker' ? Landmark : account.role === 'farmer' ? UserRound : Store;

              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleDemoLogin(account.role)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-left transition hover:border-emerald-400 hover:bg-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-slate-700 p-2 text-emerald-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{account.label}</div>
                      <div className="text-xs text-slate-400">{account.email}</div>
                      <div className="mt-1 text-xs text-slate-300">{account.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
