import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import api from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const {
        access_token,
        refresh_token,
      } = response.data;

      localStorage.setItem(
        'accessToken',
        access_token,
      );

      localStorage.setItem(
        'refreshToken',
        refresh_token,
      );

      navigate('/dashboard');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.emailNotVerified) {
        navigate(`/verify-email?email=${encodeURIComponent(errorData.email || email)}`);
        return;
      }

      setError(
        errorData?.message ||
          'Login failed. Please check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h1>IntervAI</h1>

        <p>
          AI-powered interview preparation
        </p>

        <h2>Login</h2>

        {searchParams.get('registered') && (
          <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            Account created successfully! Please log in below.
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-5px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', color: '#4f46e5', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Logging in...'
              : 'Login'}
          </button>

        </form>

        <p>
          Don't have an account?{' '}

          <Link to="/register">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;