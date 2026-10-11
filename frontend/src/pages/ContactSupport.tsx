import React, { useEffect, useState } from 'react';
import { Send, Clock, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'w-full rounded-md border border-[#E5E2DA] bg-white px-3.5 py-2.5 text-sm text-[#14243D] placeholder:text-[#9CA1AA] focus:outline-none focus:ring-1 focus:ring-[#4269A8] focus:border-[#4269A8]';

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-xs sm:text-sm font-semibold text-[#14243D] mb-1.5">
    {children} <span className="text-[#C44B4B]">*</span>
  </label>
);

export const ContactSupport: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  // Open at the top of the page, not at the previous page's scroll position.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Pre-fill from the logged-in user once it is available (without overwriting what was typed).
  useEffect(() => {
    if (user?.name) setName((prev) => prev || user.name);
    if (user?.email) setEmail((prev) => prev || user.email);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.submitSupportInquiry({ name, email, subject, message });
      setReferenceId(res.referenceId);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Could not submit your inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl animate-fadeIn pb-12">
      {/* Heading */}
      <div className="space-y-1 pb-4 border-b border-[#E5E2DA]">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#14243D] tracking-tight">Contact Support</h1>
        <p className="text-xs sm:text-sm text-[#737986]">
          Have an inquiry, experiencing an issue with document parsing, or need technical assistance? Describe your case below.
        </p>
      </div>

      {/* Form */}
      <div className="border border-[#E5E2DA] rounded-lg bg-white p-6 shadow-card">
        {referenceId ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-[#23845D] mx-auto" />
            <h2 className="font-serif font-bold text-lg text-[#14243D]">Inquiry submitted</h2>
            <p className="text-xs sm:text-sm text-[#616875]">
              Thank you. Your reference number is{' '}
              <span className="font-mono font-semibold text-[#14243D]">{referenceId}</span>. Please mention it if you follow up.
            </p>
            <button
              onClick={() => setReferenceId(null)}
              className="inline-flex items-center px-3.5 py-2 rounded-md border border-[#E5E2DA] bg-white hover:bg-[#F3F1EB] text-[#14243D] text-xs font-medium"
            >
              Submit another inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <Label htmlFor="support-name">Your Name</Label>
              <input id="support-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
            </div>
            <div>
              <Label htmlFor="support-email">Email Address</Label>
              <input
                id="support-email"
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div>
              <Label htmlFor="support-subject">Subject</Label>
              <input
                id="support-subject"
                className={inputClass}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Issue reviewing judgment PDF or feature request"
                maxLength={200}
                required
              />
            </div>
            <div>
              <Label htmlFor="support-message">Message</Label>
              <textarea
                id="support-message"
                rows={4}
                className={`${inputClass} resize-y`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail (e.g. which judgment was being processed, error messages encountered, etc.)..."
                maxLength={5000}
                required
              />
            </div>

            {error && <p className="text-xs text-[#C44B4B]">{error}</p>}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <p className="text-[11px] sm:text-xs text-[#737986]">All inquiries are logged for platform quality assurance.</p>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !email.trim() || !subject.trim() || !message.trim()}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-md bg-[#14243D] hover:bg-[#0D182A] disabled:opacity-50 text-white text-sm font-medium shadow-subtle transition-colors"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{submitting ? 'Submitting…' : 'Submit Inquiry'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-[#E5E2DA] rounded-lg bg-white p-5 shadow-card space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#A98A4B]" />
            <h3 className="text-sm font-semibold text-[#14243D]">Response Timeline</h3>
          </div>
          <p className="text-xs text-[#737986] leading-relaxed">
            Our team reviews hackathon demo queries and technical inquiries typically within 24 business hours.
          </p>
        </div>
        <div className="border border-[#E5E2DA] rounded-lg bg-white p-5 shadow-card space-y-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#A98A4B]" />
            <h3 className="text-sm font-semibold text-[#14243D]">Document Confidentiality</h3>
          </div>
          <p className="text-xs text-[#737986] leading-relaxed">
            Court judgment reviews are processed strictly in accordance with local Indian court review privacy standards.
          </p>
        </div>
      </div>
    </div>
  );
};
