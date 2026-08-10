import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import api from '../services/api';

function Result() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [interview, setInterview] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadResult();
  }, [id]);

  const loadResult = async () => {
    try {
      const response =
        await api.get(
          `/interviews/${id}/result`,
        );

      setInterview(
        response.data,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        Loading result...
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="page">
        Result not found.
      </div>
    );
  }

  return (
    <div className="page">

      <div className="result-container">

        <h1>
          Interview Result
        </h1>

        <h2>
          {interview.role}
        </h2>

        <div className="score-card">

          <span>
            Average Score
          </span>

          <strong>
            {interview.averageScore ??
              0}
          </strong>

          <span>
            / 100
          </span>

        </div>

        <h2>
          Questions & Feedback
        </h2>

        {interview.questions.map(
          (question, index) => (
            <div
              className="result-question"
              key={question.id}
            >

              <h3>
                {index + 1}.{' '}
                {question.question}
              </h3>

              <p>
                <strong>
                  Your Answer:
                </strong>
              </p>

              <p>
                {question.answer ||
                  'No answer submitted'}
              </p>

              <p>
                <strong>
                  Score:
                </strong>{' '}
                {question.score ??
                  0}
              </p>

              <p>
                <strong>
                  Feedback:
                </strong>
              </p>

              <p>
                {question.feedback ||
                  'No feedback available'}
              </p>

              {question.correctAnswer && (
                <>
                  <p>
                    <strong>
                      Suggested Answer:
                    </strong>
                  </p>

                  <p>
                    {question.correctAnswer}
                  </p>
                </>
              )}

            </div>
          ),
        )}

        {interview.report && (
          <div className="report-card">

            <h2>
              AI Report
            </h2>

            <h3>
              Overall Score
            </h3>

            <p>
              {interview.report.overallScore}
            </p>

            <h3>
              Strengths
            </h3>

            <p>
              {interview.report.strengths}
            </p>

            <h3>
              Weaknesses
            </h3>

            <p>
              {interview.report.weaknesses}
            </p>

            <h3>
              Feedback
            </h3>

            <p>
              {interview.report.feedback}
            </p>

            <h3>
              Improvements
            </h3>

            <p>
              {interview.report.improvements}
            </p>

          </div>
        )}

        <button
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

export default Result;