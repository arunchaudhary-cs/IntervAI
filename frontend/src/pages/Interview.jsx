import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import api from '../services/api';

function Interview() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [interview, setInterview] =
    useState(null);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [answer, setAnswer] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  const loadInterview =
    async () => {
      try {
        const response =
          await api.get(
            `/interviews/${id}`,
          );

        setInterview(
          response.data,
        );

        // Start interview
        await api.post(
          `/interviews/${id}/start`,
        );

      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            'Failed to load interview',
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadInterview();
  }, [id]);

  const submitAnswer =
    async () => {
      if (!answer.trim()) {
        setError(
          'Please enter an answer.',
        );
        return;
      }

      const question =
        interview.questions[
          currentIndex
        ];

      setSubmitting(true);
      setError('');

      try {
        await api.post(
          `/interviews/${id}/questions/${question.id}/answer`,
          {
            answer,
          },
        );

        if (
          currentIndex <
          interview.questions.length - 1
        ) {
          setCurrentIndex(
            currentIndex + 1,
          );

          setAnswer('');
        } else {
          await finishInterview();
        }
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            'Failed to submit answer',
        );
      } finally {
        setSubmitting(false);
      }
    };

  const finishInterview =
    async () => {
      try {
        await api.post(
          `/interviews/${id}/finish`,
        );

        navigate(
          `/interviews/${id}/result`,
        );
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            'Failed to finish interview',
        );
      }
    };

  if (loading) {
    return (
      <div className="page">
        <h2>
          Loading interview...
        </h2>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="page">
        <div className="error">
          {error}
        </div>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  const question =
    interview.questions[
      currentIndex
    ];

  const totalQuestions =
    interview.questions.length;

  return (
    <div className="page">

      <div className="interview-container">

        <div className="interview-header">

          <div>
            <h1>
              {interview.role}
            </h1>

            <p>
              Difficulty:{' '}
              {interview.difficulty}
            </p>
          </div>

          <div>
            Question{' '}
            {currentIndex + 1}
            {' / '}
            {totalQuestions}
          </div>

        </div>

        <div className="progress">
          <div
            className="progress-bar"
            style={{
              width:
                `${((currentIndex + 1) /
                  totalQuestions) *
                  100}%`,
            }}
          />
        </div>

        <div className="question-card">

          <h2>
            {question.question}
          </h2>

          <textarea
            rows="10"
            placeholder="Write your answer here..."
            value={answer}
            onChange={(e) =>
              setAnswer(
                e.target.value,
              )
            }
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            onClick={submitAnswer}
            disabled={submitting}
          >
            {submitting
              ? 'Evaluating...'
              : currentIndex ===
                totalQuestions - 1
                ? 'Submit & Finish'
                : 'Submit Answer'}
          </button>

        </div>

      </div>

    </div>
  );
}

export default Interview;