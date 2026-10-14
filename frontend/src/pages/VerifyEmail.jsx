import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [searchParams]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    // Only accept alphanumeric / digits
    const sanitized = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (sanitized.length > 1) {
      // Pasted full 6-digit code
      const pasted = sanitized.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = sanitized;
    setOtp(newOtp);

    // Auto-advance to next input
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-email', {
        email: email.trim(),
        otp: fullOtp,
      });

      if (response.data.access_token) {
        localStorage.setItem('accessToken', response.data.access_token);
        localStorage.setItem('refreshToken', response.data.refresh_token);
        setSuccessMsg('Email verified successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setSuccessMsg(response.data.message || 'Email verified successfully! Please log in.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email to resend the code.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const response = await api.post('/auth/resend-verification', {
        email: email.trim(),
      });

      setSuccessMsg(response.data.message || 'Verification code resent successfully.');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card verify-card">
        <div className="verify-icon-container">
          <span className="verify-icon">✉️</span>
        </div>

        <h1>Verify Your Email</h1>
        <p>
          We've sent a 6-digit verification code to <strong>{email || 'your email'}</strong>
        </p>

        {error && <div className="error">{Array.isArray(error) ? error.join(', ') : error}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        <form onSubmit={handleVerify}>
          {!searchParams.get('email') && (
            <div className="email-input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="otp-container">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength="1"
                className="otp-box"
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <button type="submit" disabled={loading || otp.join('').length !== 6}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="verify-footer">
          <p>
            Didn't receive the code?{' '}
            {canResend ? (
              <button
                type="button"
                className="resend-link-btn"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            ) : (
              <span className="resend-timer">Resend code in {countdown}s</span>
            )}
          </p>

          <p className="back-login-link">
            <Link to="/login">← Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
