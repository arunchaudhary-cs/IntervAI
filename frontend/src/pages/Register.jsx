import {
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import api from '../services/api';

function Register() {
  const navigate = useNavigate();

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      await api.post(
        '/auth/register',
        {
          name,
          email,
          password,
        },
      );

      navigate('/login');

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registration failed',
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
          Create your account
        </p>

        <h2>Register</h2>

        {error && (
          <div className="error">
            {Array.isArray(error)
              ? error.join(', ')
              : error}
          </div>
        )}

        <form
          onSubmit={handleRegister}
        >

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

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

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Creating account...'
              : 'Register'}
          </button>

        </form>

        <p>
          Already have an account?{' '}

          <Link to="/login">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Register;