import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateInterview() {
  const navigate = useNavigate();

  // Tab: 'role' or 'resume'
  const [activeTab, setActiveTab] = useState('role');

  // Common settings
  const [difficulty, setDifficulty] = useState('Medium');
  const [mode, setMode] = useState('VOICE'); // 'VOICE' or 'TEXT'

  // Role-based state
  const [role, setRole] = useState('');

  // Resume-based state
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a valid PDF resume file.');
        setResumeFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume file size must be less than 5MB.');
        setResumeFile(null);
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();

    if (!role.trim()) {
      setError('Please enter a target job role.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/interviews', {
        role: role.trim(),
        difficulty,
        mode,
      });

      const interview = response.data;
      navigate(`/interviews/${interview.id}`);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to generate interview. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();

    if (!resumeFile) {
      setError('Please select a PDF resume file to analyze.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('difficulty', difficulty);
      formData.append('mode', mode);

      const response = await api.post('/resume/interview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const interview = response.data;
      navigate(`/interviews/${interview.id}`);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to analyze resume and generate interview.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="form-card create-interview-card">
        <h1>Create AI Interview</h1>
        <p>Choose your interview source and configure your practice session.</p>

        {/* Source Tabs: Role vs Resume */}
        <div className="creation-type-tabs">
          <button
            type="button"
            className={`source-tab-btn ${activeTab === 'role' ? 'active-source-tab' : ''}`}
            onClick={() => {
              setActiveTab('role');
              setError('');
            }}
          >
            💼 Role-Based
          </button>

          <button
            type="button"
            className={`source-tab-btn ${activeTab === 'resume' ? 'active-source-tab' : ''}`}
            onClick={() => {
              setActiveTab('resume');
              setError('');
            }}
          >
            📄 Resume-Based
          </button>
        </div>

        {error && (
          <div className="error">{Array.isArray(error) ? error.join(', ') : error}</div>
        )}

        {/* Form Container */}
        {activeTab === 'role' ? (
          <form onSubmit={handleRoleSubmit}>
            <label className="field-label">Target Job Role</label>
            <input
              type="text"
              placeholder="e.g. Full Stack Developer, DevOps Engineer, Data Scientist"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />

            <label className="field-label">Difficulty Level</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="Easy">Easy (Foundations & Concepts)</option>
              <option value="Medium">Medium (Standard Industry Questions)</option>
              <option value="Hard">Hard (Architecture & Edge Cases)</option>
            </select>

            {/* Mode Selection */}
            <label className="field-label">Interview Answering Mode</label>
            <div className="mode-selection-grid">
              <div
                className={`mode-card ${mode === 'VOICE' ? 'mode-card-selected' : ''}`}
                onClick={() => setMode('VOICE')}
              >
                <div className="mode-card-header">
                  <span className="mode-icon">🎙️</span>
                  <strong>Voice Mode</strong>
                </div>
                <p className="mode-desc">
                  Realistic audio simulation. Speak your answers verbally. (15 minutes session / ~1.5 min per question including follow-ups).
                </p>
                <span className="mode-pill pill-voice">⚡ 15 Mins • Verbal + Follow-ups</span>
              </div>

              <div
                className={`mode-card ${mode === 'TEXT' ? 'mode-card-selected' : ''}`}
                onClick={() => setMode('TEXT')}
              >
                <div className="mode-card-header">
                  <span className="mode-icon">✍️</span>
                  <strong>Text Mode</strong>
                </div>
                <p className="mode-desc">
                  Written technical assessment. Type your answers using the keyboard. (30 minutes session).
                </p>
                <span className="mode-pill pill-text">🕒 30 Mins • Written</span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="generate-submit-btn">
              {loading ? 'Generating 10 AI Questions...' : '🚀 Start Role Interview'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResumeSubmit}>
            <label className="field-label">Upload Resume (PDF)</label>
            
            <div
              className={`resume-dropzone ${resumeFile ? 'resume-uploaded' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <span className="dropzone-icon">{resumeFile ? '📄' : '☁️'}</span>
              {resumeFile ? (
                <div>
                  <strong>{resumeFile.name}</strong>
                  <p className="file-size-hint">({(resumeFile.size / 1024).toFixed(1)} KB) - Click to change</p>
                </div>
              ) : (
                <div>
                  <strong>Click to select or drag & drop PDF resume</strong>
                  <p className="file-size-hint">Max file size: 5MB</p>
                </div>
              )}
            </div>

            <label className="field-label">Difficulty Level</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="Easy">Easy (Foundations & Concepts)</option>
              <option value="Medium">Medium (Standard Industry Questions)</option>
              <option value="Hard">Hard (Architecture & Edge Cases)</option>
            </select>

            {/* Mode Selection */}
            <label className="field-label">Interview Answering Mode</label>
            <div className="mode-selection-grid">
              <div
                className={`mode-card ${mode === 'VOICE' ? 'mode-card-selected' : ''}`}
                onClick={() => setMode('VOICE')}
              >
                <div className="mode-card-header">
                  <span className="mode-icon">🎙️</span>
                  <strong>Voice Mode</strong>
                </div>
                <p className="mode-desc">
                  Realistic audio simulation. Speak your answers verbally. (15 minutes session / ~1.5 min per question including follow-ups).
                </p>
                <span className="mode-pill pill-voice">⚡ 15 Mins • Verbal + Follow-ups</span>
              </div>

              <div
                className={`mode-card ${mode === 'TEXT' ? 'mode-card-selected' : ''}`}
                onClick={() => setMode('TEXT')}
              >
                <div className="mode-card-header">
                  <span className="mode-icon">✍️</span>
                  <strong>Text Mode</strong>
                </div>
                <p className="mode-desc">
                  Written technical assessment. Type your answers using the keyboard. (30 minutes session).
                </p>
                <span className="mode-pill pill-text">🕒 30 Mins • Written</span>
              </div>
            </div>

            <button type="submit" disabled={loading || !resumeFile} className="generate-submit-btn">
              {loading ? 'Analyzing Resume & Generating Questions...' : '🎯 Generate Resume Interview'}
            </button>
          </form>
        )}

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default CreateInterview;