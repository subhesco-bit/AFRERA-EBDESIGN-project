import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'consumer',
  });

  // See LoginPage.jsx: v5 react-query object-syntax fix, same pattern.
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (response) => {
      // See LoginPage.jsx: authAPI.register resolves to the raw axios
      // response, so the payload is under response.data.
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Registration successful');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Registration failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-v42-paddy2 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-v42-forest rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-v42-ink">Create Account</h1>
            <p className="text-v42-mut">Join the AFRERA community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-v42-ink2 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-v42-ink2 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric"
                  placeholder="Doe"
                />
              </div>
            </div>

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
              <label htmlFor="phone" className="block text-sm font-medium text-v42-ink2 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric"
                placeholder="+91 98765 43210"
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
                  minLength="8"
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

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-v42-ink2 mb-2">
                I want to join as
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric"
              >
                <option value="consumer">Consumer</option>
                <option value="farmer">Farmer</option>
                <option value="fpo">FPO</option>
                <option value="corporate">Corporate Buyer</option>
                <option value="logistics">Logistics Partner</option>
              </select>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-v42-line text-v42-forest focus:ring-v42-turmeric"
              />
              <label className="ml-2 text-sm text-v42-mut">
                I agree to the{' '}
                <Link to="/terms" className="text-v42-forest hover:text-v42-turmericink">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-v42-forest hover:text-v42-turmericink">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full px-4 py-3 bg-v42-forest text-white rounded-lg font-semibold hover:bg-v42-forestd transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {registerMutation.isPending ? (
                <span className="animate-spin mr-2">⌛</span>
              ) : (
                <UserPlus className="w-5 h-5 mr-2" />
              )}
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-v42-mut">
              Already have an account?{' '}
              <Link to="/login" className="text-v42-forest hover:text-v42-turmericink font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
