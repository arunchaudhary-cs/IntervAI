import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = request code, 2 = enter OTP & new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputRefs = useRef([]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim(),
      });

      setSuccessMsg(response.data.message || 'Password reset code sent to your email.');
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (sanitized.length > 1) {
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

    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: fullOtp,
        newPassword,
      });

      setSuccessMsg(response.data.message || 'Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Password reset failed. Please verify your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="verify-icon-container">
          <span className="verify-icon">🔒</span>
        </div>

        <h1>Reset Password</h1>
        <p>
          {step === 1
            ? 'Enter your account email to receive a password reset code.'
            : `Enter the 6-digit code sent to ${email} and your new password.`}
        </p>

        {error && <div className="error">{Array.isArray(error) ? error.join(', ') : error}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', textAlign: 'left', display: 'block', marginBottom: '8px' }}>
              6-Digit Reset Code
            </label>

            <div className="otp-container" style={{ margin: '0 0 20px 0' }}>
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

            <input
              type="password"
              placeholder="New Password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading || otp.join('').length !== 6}>
              {loading ? 'Resetting Password...' : 'Set New Password'}
            </button>

            <button
              type="button"
              className="outline-btn"
              style={{ marginTop: '10px', width: '100%' }}
              onClick={() => setStep(1)}
            >
              ← Change Email
            </button>
          </form>
        )}

        <div className="verify-footer">
          <p className="back-login-link">
            Remembered your password? <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
