import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function Result() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'attempted', 'skipped'

  useEffect(() => {
    loadResult();
  }, [id]);

  const loadResult = async () => {
    try {
      const response = await api.get(`/interviews/${id}/result`);
      setInterview(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Loading your interview results and AI report...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="page">
        <div className="result-container">
          <div className="error">Result not found or interview does not exist.</div>
          <button className="primary-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = interview.questions?.length || 0;
  const attemptedQuestions = interview.questions?.filter((q) => q.answer && q.answer.trim().length > 0) || [];
  const skippedQuestions = interview.questions?.filter((q) => !q.answer || q.answer.trim().length === 0) || [];

  const averageScore = Math.round(Number(interview.averageScore || 0));

  let performanceTier = { label: 'Needs Improvement', color: '#ef4444', badge: 'tier-low' };
  if (averageScore >= 80) {
    performanceTier = { label: 'Outstanding (Ready to Hire)', color: '#10b981', badge: 'tier-high' };
  } else if (averageScore >= 60) {
    performanceTier = { label: 'Competent (Interview Ready)', color: '#3b82f6', badge: 'tier-med' };
  }

  const filteredQuestions = interview.questions?.filter((q) => {
    const hasAnswer = q.answer && q.answer.trim().length > 0;
    if (filterTab === 'attempted') return hasAnswer;
    if (filterTab === 'skipped') return !hasAnswer;
    return true;
  }) || [];

  return (
    <div className="page result-page-wrap">
      <div className="result-container">
        {/* Header */}
        <div className="result-header-card">
          <div className="result-header-left">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span className="result-badge">Interview Assessment Report</span>
              <span className="result-badge" style={{ background: '#f0fdf4', color: '#166534' }}>
                {interview.mode === 'VOICE' ? '🎙️ Voice Interview' : '✍️ Text Assessment'}
              </span>
            </div>
            <h1>{interview.role}</h1>
            <p className="difficulty-text">
              Difficulty: <strong>{interview.difficulty}</strong> • Security Integrity:{' '}
              <strong style={{ color: (interview.tabSwitches || 0) > 0 ? '#f59e0b' : '#10b981' }}>
                {(interview.tabSwitches || 0) === 0 ? '✓ Verified (0 Tab Switches)' : `⚠️ ${interview.tabSwitches} Tab Switch(es) Detected`}
              </strong>
            </p>
          </div>

          <div className="result-header-actions">
            <button className="outline-btn" onClick={() => window.print()}>
              🖨️ Print / Save PDF
            </button>
            <button className="primary-btn" onClick={() => navigate('/create-interview')}>
              + New Interview
            </button>
          </div>
        </div>

        {/* Score Summary Metrics */}
        <div className="result-metrics-grid">
          <div className="metric-box overall-score-box">
            <span className="metric-label">Overall Average Score</span>
            <div className="score-number-wrap">
              <strong className="huge-score">{averageScore}</strong>
              <span className="score-denom">/ 100</span>
            </div>
            <span className={`performance-badge ${performanceTier.badge}`}>
              {performanceTier.label}
            </span>
          </div>

          <div className="metric-box">
            <span className="metric-icon">📋</span>
            <span className="metric-label">Total Questions</span>
            <strong className="metric-val">{totalQuestions}</strong>
          </div>

          <div className="metric-box">
            <span className="metric-icon">✅</span>
            <span className="metric-label">Attempted</span>
            <strong className="metric-val text-green">{attemptedQuestions.length}</strong>
          </div>

          <div className="metric-box">
            <span className="metric-icon">⏭️</span>
            <span className="metric-label">Skipped / Unanswered</span>
            <strong className="metric-val text-amber">{skippedQuestions.length}</strong>
          </div>
        </div>

        {/* AI Report Card */}
        {interview.report && (
          <div className="report-card">
            <div className="report-header">
              <h2>🧠 Comprehensive AI Evaluation Report</h2>
              <span className="ai-verified-tag">AI Powered by Gemini</span>
            </div>

            <div className="report-grid">
              <div className="report-section-card strengths-card">
                <h3>💪 Key Strengths</h3>
                <p>{interview.report.strengths}</p>
              </div>

              <div className="report-section-card weaknesses-card">
                <h3>🔍 Areas for Improvement</h3>
                <p>{interview.report.weaknesses}</p>
              </div>

              <div className="report-section-card feedback-card full-width-card">
                <h3>📝 Interviewer Feedback</h3>
                <p>{interview.report.feedback}</p>
              </div>

              <div className="report-section-card improvements-card full-width-card">
                <h3>🚀 Actionable Next Steps & Preparation Plan</h3>
                <p>{interview.report.improvements}</p>
              </div>
            </div>
          </div>
        )}

        {/* Question Breakdown Section */}
        <div className="questions-breakdown-section">
          <div className="breakdown-header">
            <h2>Detailed Question-by-Question Review</h2>

            {/* Filter Tabs */}
            <div className="filter-tabs">
              <button
                className={`tab-btn ${filterTab === 'all' ? 'tab-active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All Questions ({totalQuestions})
              </button>
              <button
                className={`tab-btn ${filterTab === 'attempted' ? 'tab-active' : ''}`}
                onClick={() => setFilterTab('attempted')}
              >
                Attempted ({attemptedQuestions.length})
              </button>
              <button
                className={`tab-btn ${filterTab === 'skipped' ? 'tab-active' : ''}`}
                onClick={() => setFilterTab('skipped')}
              >
                Skipped ({skippedQuestions.length})
              </button>
            </div>
          </div>

          <div className="questions-list">
            {filteredQuestions.map((question, index) => {
              const hasAnswer = question.answer && question.answer.trim().length > 0;
              const originalIndex = interview.questions.findIndex((q) => q.id === question.id);

              return (
                <div className={`result-question ${!hasAnswer ? 'question-skipped' : ''}`} key={question.id}>
                  <div className="question-row-top">
                    <h3>
                      Question {originalIndex + 1}: {question.question}
                    </h3>
                    <div className="question-score-pill">
                      {hasAnswer ? (
                        <span className="score-pill-val">Score: <strong>{question.score ?? 0}</strong> / 100</span>
                      ) : (
                        <span className="score-pill-skipped">Skipped (0/100)</span>
                      )}
                    </div>
                  </div>

                  <div className="answer-section">
                    <p className="answer-label">Your Response:</p>
                    <div className={`answer-box ${!hasAnswer ? 'answer-empty' : ''}`}>
                      {question.answer || 'No answer submitted for this question.'}
                    </div>
                  </div>

                  {question.feedback && (
                    <div className="feedback-section">
                      <p className="feedback-label">AI Evaluator Feedback:</p>
                      <p className="feedback-text">{question.feedback}</p>
                    </div>
                  )}

                  {question.correctAnswer && (
                    <div className="ideal-answer-section">
                      <p className="ideal-label">Optimal / Suggested Answer Concept:</p>
                      <p className="ideal-text">{question.correctAnswer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="result-footer-actions">
          <button className="secondary-button" onClick={() => navigate('/dashboard')}>
            ← Return to Dashboard
          </button>
          <button className="primary-btn" onClick={() => navigate('/create-interview')}>
            Start Another Interview →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;