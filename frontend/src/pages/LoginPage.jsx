import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { LogIn, Eye, EyeOff } from 'lucide-react'

function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // NOTE: @tanstack/react-query v5 (installed) removed the `useMutation(fn, opts)`
  // shorthand — the object form below is the only supported signature. This was
  // silently broken (login itself would throw on render), and `isLoading` was
  // renamed to `isPending` for mutations specifically in v5.
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      // authAPI.login resolves to the raw axios response; the actual payload
      // (user/accessToken/refreshToken) is in response.data, not on response
      // itself. Previously this read response.user/response.accessToken
      // directly, which are always undefined, so login silently stored a
      // null user and undefined token while still saying "Login successful".
      const { user, accessToken, refreshToken } = response.data
      setAuth(user, accessToken, refreshToken)
      toast.success('Login successful')
      navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Login failed')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    loginMutation.mutate(formData)
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-v42-paddy2 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-v42-paddy border border-v42-line rounded-lg shadow-lg p-8">
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
      </div>
    </div>
  )
}

export default LoginPage
