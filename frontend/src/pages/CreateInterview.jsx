import { useState } from 'react';
import {
  useNavigate,
} from 'react-router-dom';

import api from '../services/api';

function CreateInterview() {
  const navigate = useNavigate();

  const [role, setRole] =
    useState('');

  const [difficulty, setDifficulty] =
    useState('Medium');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role.trim()) {
      setError('Please enter a role.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response =
        await api.post(
          '/interviews',
          {
            role,
            difficulty,
          },
        );

      const interview =
        response.data;

      navigate(
        `/interviews/${interview.id}`,
      );
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          'Failed to create interview',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">

      <div className="form-card">

        <h1>
          Create Interview
        </h1>

        <p>
          Let AI generate a personalized
          interview for you.
        </p>

        {error && (
          <div className="error">
            {Array.isArray(error)
              ? error.join(', ')
              : error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >

          <label>
            Job Role
          </label>

          <input
            type="text"
            placeholder="Java Backend Developer"
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
          />

          <label>
            Difficulty
          </label>

          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value)
            }
          >
            <option value="Easy">
              Easy
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Hard">
              Hard
            </option>
          </select>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Generating Interview...'
              : 'Generate Interview'}
          </button>

        </form>

        <button
          className="secondary-button"
          onClick={() =>
            navigate('/dashboard')
          }
        >
          Back to Dashboard
        </button>

      </div>

    </div>
  );
}

export default CreateInterview;