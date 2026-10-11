import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'advocate' | 'researcher' | 'clerk' | 'citizen'>('advocate');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
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
      await register(name.trim(), email.trim(), password, role);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrors({
        general: err.message || 'Registration failed. Please check your details and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#3F4754] flex flex-col justify-between">
      {/* Public Header */}
      <header className="h-18 border-b border-[#E5E2DA] bg-[#F7F6F2] px-6 lg:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5">
          <Scale className="w-5 h-5 text-[#A98A4B]" />
          <span className="font-serif font-bold text-xl tracking-tight text-[#14243D]">
            NyayaDrishti
          </span>
        </Link>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#737986] hidden sm:inline">Already have an account?</span>
          <Link
            to="/login"
            className="font-medium text-[#14243D] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-6xl mx-auto px-6 py-10 lg:py-14 flex-1 w-full flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch w-full max-w-4xl">
          {/* Left Column: Product Value Narrative (~45%) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-xl bg-[#F0EDE6] border border-[#E5E2DA]">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-[#E4DFC8] text-[#14243D] text-[11px] font-semibold tracking-wide uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A98A4B]" />
                <span>Join NyayaDrishti</span>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold text-[#14243D] leading-tight">
                  Start analyzing Indian court judgments in minutes.
                </h2>
                <p className="mt-3 text-xs text-[#616875] leading-relaxed">
                  Join advocates, researchers, court staff, and law students using automated document structuring to accelerate legal review.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#E5E2DA]/80">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#A98A4B] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#3F4754]">
                    <strong className="text-[#14243D]">Case Summaries:</strong> Clear factual background and legal issues extracted automatically.
                  </p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#A98A4B] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#3F4754]">
                    <strong className="text-[#14243D]">Statute References:</strong> Direct cataloging of acts, sections, and constitutional articles.
                  </p>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#A98A4B] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#3F4754]">
                    <strong className="text-[#14243D]">Source Grounding:</strong> Verifiable passages linked directly to page locations.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E2DA]/80">
              <p className="text-[11px] text-[#737986] leading-relaxed">
                Your uploaded documents are securely processed and retained solely within your workspace.
              </p>
            </div>
          </div>

          {/* Right Column: Registration Form (~55%) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="bg-white border border-[#E5E2DA] rounded-xl p-8 sm:p-10 shadow-card">
              <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-[#14243D] tracking-tight">
                  Create your NyayaDrishti account
                </h1>
                <p className="text-xs text-[#737986] mt-1">
                  Start analyzing Indian court judgments with structured AI assistance.
                </p>
              </div>

              {errors.general && (
                <div className="mb-5 p-3 rounded-md bg-[#FFF5F5] border border-[#FED7D7] flex items-start space-x-2.5 text-xs text-[#C53030]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Full Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-[#14243D] mb-1.5">
                    Full name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#737986]" />
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Advocate Vikram Sen"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-md border ${
                        errors.name ? 'border-[#E53E3E] bg-[#FFF5F5]' : 'border-[#E5E2DA] bg-[#FFFFFF]'
                      } text-[#17243A] placeholder-[#A0AEC0] focus:outline-none focus:border-[#14243D] transition-colors`}
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-[11px] text-[#E53E3E]">{errors.name}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-[#14243D] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#737986]" />
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="vikram.sen@highcourt.in"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-md border ${
                        errors.email ? 'border-[#E53E3E] bg-[#FFF5F5]' : 'border-[#E5E2DA] bg-[#FFFFFF]'
                      } text-[#17243A] placeholder-[#A0AEC0] focus:outline-none focus:border-[#14243D] transition-colors`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-[11px] text-[#E53E3E]">{errors.email}</p>}
                </div>

                {/* Professional Role */}
                <div>
                  <label htmlFor="reg-role" className="block text-xs font-semibold text-[#14243D] mb-1.5">
                    Primary role
                  </label>
                  <select
                    id="reg-role"
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#E5E2DA] bg-[#FFFFFF] text-[#17243A] focus:outline-none focus:border-[#14243D] transition-colors"
                  >
                    <option value="advocate">Advocate / Legal Practitioner</option>
                    <option value="researcher">Legal Researcher / Academic</option>
                    <option value="clerk">Court Clerk / Registry Staff</option>
                    <option value="citizen">Law Student / Citizen</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-[#14243D] mb-1.5">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#737986]" />
                    <input
                      id="reg-password"
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
                      className="absolute right-3 top-2.5 text-[#737986] hover:text-[#14243D]"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-[11px] text-[#E53E3E]">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-[#14243D] mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#737986]" />
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }}
                      placeholder="••••••••••••"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-10 py-2 text-xs rounded-md border ${
                        errors.confirmPassword ? 'border-[#E53E3E] bg-[#FFF5F5]' : 'border-[#E5E2DA] bg-[#FFFFFF]'
                      } text-[#17243A] placeholder-[#A0AEC0] focus:outline-none focus:border-[#14243D] transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-[#737986] hover:text-[#14243D]"
                      tabIndex={-1}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-[11px] text-[#E53E3E]">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md bg-[#14243D] hover:bg-[#0D182A] text-white text-xs font-semibold shadow-subtle transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center text-xs text-[#737986]">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#14243D] hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#E5E2DA] py-4 px-6 text-center text-[11px] text-[#737986] bg-[#F7F6F2]">
        <p>
          NyayaDrishti — Indian Court Document Review Platform.
        </p>
      </footer>
    </div>
  );
};
