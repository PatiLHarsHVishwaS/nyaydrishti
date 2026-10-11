import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scale, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      // Redirect to dashboard on success
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrors({
        general: err.message || 'Invalid email or password. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@nyayadrishti.in');
    setPassword('Password@123');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#3F4754] flex flex-col justify-between">
      {/* Simple Public Header */}
      <header className="h-18 border-b border-[#E5E2DA] bg-[#F7F6F2] px-6 lg:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5">
          <Scale className="w-5 h-5 text-[#A98A4B]" />
          <span className="font-serif font-bold text-xl tracking-tight text-[#14243D]">
            NyayaDrishti
          </span>
        </Link>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#737986] hidden sm:inline">Don't have an account?</span>
          <Link
            to="/register"
            className="font-medium text-[#14243D] hover:underline"
          >
            Create account
          </Link>
        </div>
      </header>

      {/* Main Two-Column Container */}
      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-16 flex-1 w-full flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch w-full max-w-4xl">
          {/* Left Column: Product Branding & Legal Identity (~45%) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-xl bg-[#F0EDE6] border border-[#E5E2DA]">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-[#E4DFC) text-[#14243D] text-[11px] font-semibold tracking-wide uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A98A4B]" />
                <span>Verified Legal Access</span>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold text-[#14243D] leading-tight">
                  Legal document review, structured and verified.
                </h2>
                <p className="mt-3 text-xs text-[#616875] leading-relaxed">
                  Sign in to access your uploaded judgments, inspect evidence-linked facts, and review legal provision extractions.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#E5E2DA]/80">
                <div className="flex items-start space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A98A4B] mt-1.5 shrink-0" />
                  <p className="text-xs text-[#3F4754]">
                    <strong className="text-[#14243D]">Deterministic & AI analysis:</strong> Accurate extraction of case laws, statutes, and parties.
                  </p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A98A4B] mt-1.5 shrink-0" />
                  <p className="text-xs text-[#3F4754]">
                    <strong className="text-[#14243D]">Source-linked evidence:</strong> Grounded references with page numbers.
                  </p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A98A4B] mt-1.5 shrink-0" />
                  <p className="text-xs text-[#3F4754]">
                    <strong className="text-[#14243D]">Private & local-ready:</strong> Files stay within your configured review workspace.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Quote */}
            <div className="pt-6 border-t border-[#E5E2DA]/80">
              <div className="border-l-2 border-[#A98A4B] pl-3">
                <p className="text-xs font-serif italic text-[#14243D] leading-snug">
                  "Streamlining Indian court document review for advocates, researchers, and citizens."
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Login Form (~55%) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="bg-white border border-[#E5E2DA] rounded-xl p-8 sm:p-10 shadow-card">
              <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-[#14243D] tracking-tight">
                  Welcome back
                </h1>
                <p className="text-xs text-[#737986] mt-1">
                  Sign in to continue reviewing your legal documents.
                </p>
              </div>

              {/* General Error Banner */}
              {errors.general && (
                <div className="mb-5 p-3 rounded-md bg-[#FFF5F5] border border-[#FED7D7] flex items-start space-x-2.5 text-xs text-[#C53030]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Email Address */}
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-[#14243D] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#737986]" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="advocate@nyayadrishti.in"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-md border ${
                        errors.email ? 'border-[#E53E3E] bg-[#FFF5F5]' : 'border-[#E5E2DA] bg-[#FFFFFF]'
                      } text-[#17243A] placeholder-[#A0AEC0] focus:outline-none focus:border-[#14243D] transition-colors`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-[11px] text-[#E53E3E]">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-xs font-semibold text-[#14243D]">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#737986]" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="••••••••••••"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-10 py-2 text-xs rounded-md border ${
                        errors.password ? 'border-[#E53E3E] bg-[#FFF5F5]' : 'border-[#E5E2DA] bg-[#FFFFFF]'
                      } text-[#17243A] placeholder-[#A0AEC0] focus:outline-none focus:border-[#14243D] transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#737986] hover:text-[#14243D] transition-colors"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-[11px] text-[#E53E3E]">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-[#616875] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#D5D0C5] text-[#14243D] focus:ring-0"
                    />
                    <span>Remember my session</span>
                  </label>
                  <span className="text-[11px] text-[#737986] italic">Encrypted session</span>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md bg-[#14243D] hover:bg-[#0D182A] text-white text-xs font-semibold shadow-subtle transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick Demo Credentials Assistant */}
              <div className="mt-6 pt-5 border-t border-[#E5E2DA] flex items-center justify-between text-xs bg-[#FBF9F5] p-3 rounded-md border border-[#EBE7DF]">
                <div>
                  <span className="font-medium text-[#14243D]">Demo credentials:</span>
                  <span className="text-[#737986] ml-1.5 font-mono text-[11px]">demo@nyayadrishti.in</span>
                </div>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-xs font-semibold text-[#A98A4B] hover:text-[#8C7037] underline"
                >
                  Auto-fill
                </button>
              </div>

              {/* Switch to Register */}
              <div className="mt-6 text-center text-xs text-[#737986]">
                New to NyayaDrishti?{' '}
                <Link to="/register" className="font-semibold text-[#14243D] hover:underline">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-[#E5E2DA] py-4 px-6 text-center text-[11px] text-[#737986] bg-[#F7F6F2]">
        <p>
          NyayaDrishti Document Intelligence. Secure authentication with hashed credentials.
        </p>
      </footer>
    </div>
  );
};
