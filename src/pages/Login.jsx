import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import squirrelLogo from '../assets/squirrel.svg';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already logged in
  if (!authLoading && isAuthenticated) {
    return <Navigate to="/donations" replace />;
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const result = await login(data.email, data.password);

    if (result.success) {
      toast.success(
        result.role === 'admin'
          ? 'Welcome back, Admin!'
          : 'Welcome back, Worker!'
      );
      navigate('/donations', { replace: true });
    } else {
      toast.error(result.error || 'Login failed');
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        {/* Header with Squirrel */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <img
              src={squirrelLogo}
              alt="Black Squirrel"
              className="w-16 h-16"
            />
            <div className="p-3 bg-gradient-to-br from-eco-primary-200 to-eco-teal-light rounded-full shadow-md">
              <LogIn className="w-8 h-8 text-eco-primary-700" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-eco-primary-700 to-eco-teal-dark bg-clip-text text-transparent mb-2 font-display">
            ReUSE Store Login
          </h1>
          <p className="text-gray-600">
            Sign in to log and manage donations
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card bg-gradient-to-br from-white via-eco-primary-50 to-eco-teal-light/20 border-2 border-eco-primary-300 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-eco-primary-600" />
                  Email Address
                </div>
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
                className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-eco-primary-200 focus:border-eco-primary-500 focus:ring-eco-primary-100'
                }`}
                placeholder="worker@haverford.edu"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-eco-primary-600" />
                  Password
                </div>
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                autoComplete="current-password"
                className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all ${
                  errors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-eco-primary-200 focus:border-eco-primary-500 focus:ring-eco-primary-100'
                }`}
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-eco-primary-100 border border-eco-primary-300 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              <strong>Note:</strong> Only authorized worker and admin accounts can access the system.
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-eco-primary-600 hover:text-eco-primary-700 font-semibold underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
