import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-question state storage
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [followUpCounts, setFollowUpCounts] = useState({});

  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluatingFollowUp, setEvaluatingFollowUp] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Speech-to-Text (STT) state for main answer
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  // Speech-to-Text (STT) state for follow-up answer
  const [isListeningFollowUp, setIsListeningFollowUp] = useState(false);
  const followUpRecognitionRef = useRef(null);

  // Text-to-Speech (TTS) state
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);

  // Finish Confirmation Modal
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Anti-Cheating: Tab Switch Detection
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  // Interview Timer
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const timerRef = useRef(null);

  // Initialize Speech Recognition for Main Answer
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript) {
          setAnswers((prev) => {
            const currentQId = interview?.questions?.[currentIndex]?.id;
            if (!currentQId) return prev;
            const existing = prev[currentQId] || '';
            const updated = existing ? `${existing.trim()} ${finalTranscript.trim()}` : finalTranscript.trim();
            return { ...prev, [currentQId]: updated };
          });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access in your browser.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      // Secondary recognition for follow-up
      const followUpRec = new SpeechRecognition();
      followUpRec.continuous = true;
      followUpRec.interimResults = true;
      followUpRec.lang = 'en-US';

      followUpRec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setFollowUpAnswers((prev) => {
            const currentQId = interview?.questions?.[currentIndex]?.id;
            if (!currentQId) return prev;
            const existing = prev[currentQId] || '';
            return { ...prev, [currentQId]: `${existing.trim()} ${finalTranscript.trim()}`.trim() };
          });
        }
      };

      followUpRec.onend = () => setIsListeningFollowUp(false);
      followUpRecognitionRef.current = followUpRec;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (followUpRecognitionRef.current) {
        try { followUpRecognitionRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentIndex, interview]);

  // Tab Switch & Visibility Detection (Anti-Cheating)
  useEffect(() => {
    if (loading || !interview || interview.status === 'COMPLETED') return;

    let isCooldown = false;

    const triggerWarning = () => {
      if (isCooldown) return;
      isCooldown = true;

      setTabSwitches((prev) => {
        const updated = prev + 1;
        api.post(`/interviews/${id}/tab-switch`).catch(console.error);

        if (updated >= 3) {
          alert('Security Alert: Multiple tab switches detected (3/3). Auto-submitting your interview for evaluation.');
          executeFinishInterview();
        } else {
          setShowTabWarning(true);
        }
        return updated;
      });

      setTimeout(() => {
        isCooldown = false;
      }, 1500);
    };

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerWarning();
      }
    };

    const handleBlur = () => {
      triggerWarning();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [loading, interview, id]);

  // Load Interview data & Persistent Timer
  const loadInterview = async () => {
    try {
      const response = await api.get(`/interviews/${id}`);
      const data = response.data;
      setInterview(data);

      const initialAnswers = {};
      const initialEvaluations = {};

      if (data.questions && data.questions.length > 0) {
        data.questions.forEach((q) => {
          if (q.answer) {
            initialAnswers[q.id] = q.answer;
          }
          if (q.score !== null && q.score !== undefined) {
            initialEvaluations[q.id] = {
              score: q.score,
              feedback: q.feedback,
              correctAnswer: q.correctAnswer,
              followUp: q.followUp,
            };
          }
        });
      }

      setAnswers(initialAnswers);
      setEvaluations(initialEvaluations);
      setTabSwitches(data.tabSwitches || 0);

      let startedAtTime = data.startedAt;
      if (data.status === 'PENDING') {
        const startRes = await api.post(`/interviews/${id}/start`);
        startedAtTime = startRes.data?.startedAt || new Date().toISOString();
      }

      // Calculate Persistent Time Left
      const durationMins = data.mode === 'VOICE' ? 15 : (data.duration || 30);
      const totalSeconds = durationMins * 60;
      if (startedAtTime) {
        const elapsed = Math.floor((Date.now() - new Date(startedAtTime).getTime()) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsed);
        setTimeLeft(remaining);
      } else {
        setTimeLeft(totalSeconds);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load interview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterview();
  }, [id]);

  // Persistent Timer countdown
  useEffect(() => {
    if (loading || !interview || interview.status === 'COMPLETED') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, interview]);

  const handleAutoSubmitOnTimeout = async () => {
    alert('Time has expired! Submitting your interview now.');
    await executeFinishInterview();
  };

  // Toggle Speech Recognition for Main Answer
  const toggleSpeechRecognition = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      try { recognitionRef.current?.stop(); } catch (err) {}
      setIsListening(false);
    } else {
      setError('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Toggle Speech Recognition for Follow-up Answer
  const toggleFollowUpSpeech = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListeningFollowUp) {
      try { followUpRecognitionRef.current?.stop(); } catch (err) {}
      setIsListeningFollowUp(false);
    } else {
      try {
        followUpRecognitionRef.current?.start();
        setIsListeningFollowUp(true);
      } catch (err) {
        console.error('Failed to start follow-up speech:', err);
      }
    }
  };

  const handleClearVoiceAnswer = () => {
    const currentQId = interview?.questions?.[currentIndex]?.id;
    if (!currentQId) return;
    setAnswers((prev) => ({ ...prev, [currentQId]: '' }));
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Text-to-Speech (TTS) for Question
  const toggleSpeakQuestion = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text to speech is not supported in this browser.');
      return;
    }

    if (isSpeakingQuestion) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    } else {
      const currentQuestionText = interview.questions[currentIndex]?.question;
      if (!currentQuestionText) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuestionText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsSpeakingQuestion(false);
      utterance.onerror = () => setIsSpeakingQuestion(false);

      setIsSpeakingQuestion(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswerChange = (text) => {
    const currentQId = interview.questions[currentIndex]?.id;
    if (!currentQId) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQId]: text,
    }));
    setError('');
  };

  // Evaluate Primary Question Answer
  const evaluateCurrentQuestion = async () => {
    const currentQuestion = interview.questions[currentIndex];
    const currentAnswer = answers[currentQuestion.id] || '';

    if (!currentAnswer.trim()) {
      setError(
        interview.mode === 'VOICE'
          ? 'Please record your voice answer before evaluating this question.'
          : 'Please enter an answer before evaluating this question.',
      );
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setEvaluating(true);
    setError('');
    setSuccessNotice('');

    try {
      const response = await api.post(
        `/interviews/${id}/questions/${currentQuestion.id}/answer`,
        { answer: currentAnswer.trim() },
      );

      const result = response.data;
      setEvaluations((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          score: result.score,
          feedback: result.feedback,
          correctAnswer: result.correctAnswer,
          followUp: result.followUp,
        },
      }));

      // Initialize follow-up counter for this question
      setFollowUpCounts((prev) => ({
        ...prev,
        [currentQuestion.id]: prev[currentQuestion.id] || 0,
      }));

      setSuccessNotice('Answer evaluated successfully! Check the AI feedback and follow-up probe below.');
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to evaluate answer');
    } finally {
      setEvaluating(false);
    }
  };

  // Submit Answer to AI Follow-Up Probe (Max 2 Follow-ups)
  const submitFollowUpResponse = async () => {
    const currentQuestion = interview.questions[currentIndex];
    const currentFollowUpAns = followUpAnswers[currentQuestion.id] || '';

    if (!currentFollowUpAns.trim()) {
      setError('Please provide or speak an answer to the follow-up probe before submitting.');
      return;
    }

    if (isListeningFollowUp && followUpRecognitionRef.current) {
      followUpRecognitionRef.current.stop();
      setIsListeningFollowUp(false);
    }

    setEvaluatingFollowUp(true);
    setError('');

    try {
      const baseAnswer = answers[currentQuestion.id] || '';
      const combined = `${baseAnswer}\n\n[Follow-up Response]: ${currentFollowUpAns.trim()}`;

      const response = await api.post(
        `/interviews/${id}/questions/${currentQuestion.id}/answer`,
        { answer: combined },
      );

      const result = response.data;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: combined }));
      setEvaluations((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          score: result.score,
          feedback: result.feedback,
          correctAnswer: result.correctAnswer,
          followUp: result.followUp,
        },
      }));

      const newCount = (followUpCounts[currentQuestion.id] || 0) + 1;
      setFollowUpCounts((prev) => ({ ...prev, [currentQuestion.id]: newCount }));
      setFollowUpAnswers((prev) => ({ ...prev, [currentQuestion.id]: '' }));

      setSuccessNotice(`Follow-up response evaluated! Score updated to ${result.score}/100.`);
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to evaluate follow-up response');
    } finally {
      setEvaluatingFollowUp(false);
    }
  };

  // Execute Finish Interview (Handles early & partial attempts)
  const executeFinishInterview = async () => {
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (isListeningFollowUp && followUpRecognitionRef.current) {
      try { followUpRecognitionRef.current.stop(); } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setFinishing(true);
    setError('');

    try {
      await api.post(`/interviews/${id}/finish`);
      navigate(`/interviews/${id}/result`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to finish interview');
      setFinishing(false);
      setShowFinishModal(false);
    }
  };

  // Navigation handlers
  const handleJumpToQuestion = (index) => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (isListeningFollowUp && followUpRecognitionRef.current) {
      followUpRecognitionRef.current.stop();
      setIsListeningFollowUp(false);
    }
    if (isSpeakingQuestion && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }
    setCurrentIndex(index);
    setError('');
    setSuccessNotice('');
  };

  const handleNext = () => {
    if (currentIndex < interview.questions.length - 1) {
      handleJumpToQuestion(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      handleJumpToQuestion(currentIndex - 1);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Loading AI Interview Session...</p>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="page">
        <div className="error">{error}</div>
        <button className="primary-btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!interview || !interview.questions || interview.questions.length === 0) {
    return (
      <div className="page">
        <div className="error">No questions found for this interview.</div>
        <button className="primary-btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = interview.questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id] || '';
  const currentFollowUpAnswer = followUpAnswers[currentQuestion.id] || '';
  const currentEvaluation = evaluations[currentQuestion.id];
  const currentQFollowUpCount = followUpCounts[currentQuestion.id] || 0;
  const totalQuestions = interview.questions.length;

  const attemptedCount = Object.keys(evaluations).length;
  const draftCount = Object.keys(answers).filter(
    (qId) => answers[qId]?.trim() && !evaluations[qId],
  ).length;
  const unansweredCount = totalQuestions - attemptedCount;

  const isVoiceMode = interview.mode === 'VOICE';
  const hasRecordedVoice = currentAnswer.trim().length > 0;

  return (
    <div className="page interview-page-wrap">
      <div className="interview-container">
        {/* Top Header */}
        <div className="interview-header">
          <div className="header-meta">
            <h1>{interview.role}</h1>
            <div className="meta-badges">
              <span className="badge difficulty-badge">{interview.difficulty}</span>
              <span className="badge mode-tag-badge">
                {isVoiceMode ? '🎙️ Voice Mode (15m)' : '✍️ Text Mode (30m)'}
              </span>
              <span
                className="badge timer-badge"
                style={{ color: timeLeft < 180 ? '#ef4444' : '#4f46e5' }}
              >
                ⏱️ {formatTimer(timeLeft)}
              </span>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="finish-early-btn"
              onClick={() => setShowFinishModal(true)}
              disabled={finishing}
            >
              Finish Interview 🏁
            </button>
          </div>
        </div>

        {/* Question Palette Navigation Grid */}
        <div className="question-nav-palette">
          <div className="palette-title">
            <span>Questions:</span>
            <span className="palette-stats">
              <span className="stat-dot dot-evaluated"></span> Evaluated: {attemptedCount} |
              <span className="stat-dot dot-draft"></span> {isVoiceMode ? 'Recorded' : 'Drafts'}: {draftCount} |
              <span className="stat-dot dot-unanswered"></span> Pending: {unansweredCount - draftCount}
            </span>
          </div>

          <div className="question-numbers-grid">
            {interview.questions.map((q, idx) => {
              const isEvaluated = !!evaluations[q.id];
              const hasDraft = !isEvaluated && !!answers[q.id]?.trim();
              const isCurrent = idx === currentIndex;

              let btnClass = 'q-btn';
              if (isEvaluated) btnClass += ' q-evaluated';
              else if (hasDraft) btnClass += ' q-draft';
              else btnClass += ' q-unanswered';

              if (isCurrent) btnClass += ' q-active';

              return (
                <button
                  key={q.id}
                  className={btnClass}
                  onClick={() => handleJumpToQuestion(idx)}
                  title={`Question ${idx + 1}: ${isEvaluated ? 'Evaluated (' + evaluations[q.id].score + '/100)' : hasDraft ? 'Response Recorded' : 'Unanswered'}`}
                >
                  {idx + 1}
                  {isEvaluated && <span className="q-badge-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress">
          <div
            className="progress-bar"
            style={{
              width: `${((attemptedCount + draftCount) / totalQuestions) * 100}%`,
            }}
          />
        </div>

        {/* Question Card */}
        <div className="question-card">
          <div className="question-card-top">
            <div className="question-index-tag">
              Question {currentIndex + 1} of {totalQuestions}
            </div>

            <button
              type="button"
              className={`tts-listen-btn ${isSpeakingQuestion ? 'tts-active' : ''}`}
              onClick={toggleSpeakQuestion}
              title="Listen to question spoken aloud"
            >
              {isSpeakingQuestion ? '🔊 Speaking Question...' : '🔈 Listen Question'}
            </button>
          </div>

          <h2 className="question-text">{currentQuestion.question}</h2>

          {/* =========================================
              ANSWER INTERFACE: VOICE MODE vs TEXT MODE
          ========================================= */}
          {isVoiceMode ? (
            /* VOICE MODE: Pure Audio Response UI (No raw text box displayed) */
            <div className="voice-mode-container">
              <div className={`voice-recorder-card ${isListening ? 'recording-active' : ''}`}>
                <div className="voice-recorder-center">
                  <button
                    type="button"
                    className={`giant-mic-btn ${isListening ? 'giant-mic-listening' : ''}`}
                    onClick={toggleSpeechRecognition}
                  >
                    <span className="giant-mic-icon">{isListening ? '⏹️' : '🎙️'}</span>
                  </button>

                  <div className="voice-status-text">
                    {isListening ? (
                      <div>
                        <strong className="recording-status-alert">🔴 Listening to your verbal answer...</strong>
                        <p className="status-subtext">Speak clearly into your microphone. Click Stop when finished.</p>
                      </div>
                    ) : hasRecordedVoice ? (
                      <div>
                        <strong className="recording-status-ready">✅ Voice Response Recorded</strong>
                        <p className="status-subtext">
                          Your response is securely captured for AI scoring. Click 'Evaluate Answer' below or click mic to re-record.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <strong>Ready for Your Response</strong>
                        <p className="status-subtext">Click the microphone to start speaking your answer aloud.</p>
                      </div>
                    )}
                  </div>

                  {isListening && (
                    <div className="audio-wave-visualizer">
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                    </div>
                  )}
                </div>

                {hasRecordedVoice && !isListening && (
                  <div className="voice-re-record-actions">
                    <button
                      type="button"
                      className="clear-voice-btn"
                      onClick={handleClearVoiceAnswer}
                    >
                      🗑️ Discard & Re-record
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TEXT MODE: Written Textbox Answer Interface */
            <div className="textarea-wrapper">
              <textarea
                rows="8"
                placeholder="Type your technical explanation and code logic here using your keyboard..."
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
              />
              <div className="char-counter">
                {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          )}

          {/* Alert Messages */}
          {error && <div className="error">{error}</div>}
          {successNotice && <div className="success-banner">{successNotice}</div>}

          {/* Instant Question Evaluation Feedback */}
          {currentEvaluation && (
            <div className="instant-feedback-card">
              <div className="feedback-header">
                <div className="feedback-score-badge">
                  <span>Score:</span>
                  <strong>{currentEvaluation.score} / 100</strong>
                </div>
                <span className="feedback-status-tag">✓ Evaluated by AI</span>
              </div>

              <div className="feedback-body">
                <p>
                  <strong>AI Feedback:</strong> {currentEvaluation.feedback}
                </p>
                {currentEvaluation.correctAnswer && (
                  <p className="suggested-ans">
                    <strong>Optimal Answer Concept:</strong> {currentEvaluation.correctAnswer}
                  </p>
                )}

                {/* AI Follow-up Probe - Capped at 2 Probes Max */}
                {currentEvaluation.followUp && (
                  currentQFollowUpCount < 2 ? (
                    <div className="followup-probe-card">
                      <div className="followup-probe-header">
                        <span className="followup-icon">🧠</span>
                        <strong>
                          AI Follow-Up Challenge (Probe {currentQFollowUpCount + 1} of 2):
                        </strong>
                      </div>
                      <p className="followup-probe-text">{currentEvaluation.followUp}</p>

                      {/* Dedicated Follow-Up Answer Box */}
                      <div className="followup-answer-box-wrap" style={{ marginTop: '12px' }}>
                        {isVoiceMode ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                            <button
                              type="button"
                              className={`mic-btn ${isListeningFollowUp ? 'mic-listening' : ''}`}
                              onClick={toggleFollowUpSpeech}
                              style={{ padding: '8px 14px' }}
                            >
                              <span>{isListeningFollowUp ? '🔴 Stop Speaking' : '🎤 Speak Follow-Up'}</span>
                            </button>
                            <span style={{ fontSize: '13px', color: '#475569' }}>
                              {isListeningFollowUp ? 'Listening to your follow-up...' : currentFollowUpAnswer ? '✅ Voice captured' : 'Speak your answer'}
                            </span>
                          </div>
                        ) : (
                          <textarea
                            rows="3"
                            placeholder="Type your response to the AI follow-up probe here..."
                            value={currentFollowUpAnswer}
                            onChange={(e) =>
                              setFollowUpAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
                            }
                            style={{ width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '10px', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <button
                            type="button"
                            className="primary-btn"
                            style={{ fontSize: '13px', padding: '8px 16px', background: '#0d9488' }}
                            onClick={submitFollowUpResponse}
                            disabled={evaluatingFollowUp || !currentFollowUpAnswer.trim()}
                          >
                            {evaluatingFollowUp ? 'Evaluating Follow-Up...' : '⚡ Submit Follow-Up Response'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="followup-probe-card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', borderLeftColor: '#059669' }}>
                      <div className="followup-probe-header" style={{ color: '#047857' }}>
                        <span className="followup-icon">🎉</span>
                        <strong>Topic Mastery Complete (2/2 Follow-ups Answered)</strong>
                      </div>
                      <p className="followup-probe-text" style={{ color: '#065f46', fontSize: '13px', margin: '0' }}>
                        You have answered all follow-up probes for this question. Excellent work! Proceed to the next question.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="interview-actions-bar">
            <div className="nav-controls">
              <button
                className="outline-btn"
                onClick={handlePrev}
                disabled={currentIndex === 0 || evaluating || finishing}
              >
                ← Previous
              </button>

              <button
                className="outline-btn"
                onClick={handleNext}
                disabled={currentIndex === totalQuestions - 1 || evaluating || finishing}
              >
                Next →
              </button>
            </div>

            <div className="primary-controls">
              <button
                className="save-evaluate-btn"
                onClick={evaluateCurrentQuestion}
                disabled={evaluating || !currentAnswer.trim()}
              >
                {evaluating
                  ? 'Evaluating with AI...'
                  : currentEvaluation
                  ? 'Re-Evaluate Primary Answer'
                  : isVoiceMode
                  ? '⚡ Submit Voice Answer'
                  : '⚡ Evaluate This Question'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Finish Confirmation Modal */}
      {showFinishModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Complete & Submit Interview?</h2>

            <div className="modal-summary">
              <div className="summary-stat-box">
                <span className="stat-label">Total Questions</span>
                <span className="stat-val">{totalQuestions}</span>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Evaluated</span>
                <span className="stat-val stat-green">{attemptedCount}</span>
              </div>
              <div className="summary-stat-box">
                <span className="stat-label">Unanswered</span>
                <span className="stat-val stat-amber">{unansweredCount}</span>
              </div>
            </div>

            {unansweredCount > 0 ? (
              <p className="modal-warning">
                ⚠️ You have <strong>{unansweredCount} unanswered questions</strong>. Any unanswered questions will receive 0 marks in your overall average score. Are you sure you want to finish now?
              </p>
            ) : (
              <p className="modal-success-text">
                🎉 Great job! You have answered all {totalQuestions} questions. Click below to generate your comprehensive AI Interview Report.
              </p>
            )}

            <div className="modal-actions">
              <button
                className="outline-btn"
                onClick={() => setShowFinishModal(false)}
                disabled={finishing}
              >
                Continue Interview
              </button>

              <button
                className="primary-btn finish-confirm-btn"
                onClick={executeFinishInterview}
                disabled={finishing}
              >
                {finishing ? 'Generating AI Report...' : 'Yes, Submit & View Results'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Cheating Tab Switch Warning Modal */}
      {showTabWarning && (
        <div className="modal-overlay">
          <div className="modal-content security-warning-card">
            <div className="security-icon-wrap">⚠️</div>
            <h2>Tab Switch Detected!</h2>
            <p className="security-warning-msg">
              We detected that you switched away from the interview tab or minimized the window.
            </p>
            <div className="warning-count-banner">
              Integrity Warning: <strong>{tabSwitches} / 3</strong>
            </div>
            <p className="security-subtext">
              For test integrity, please stay on this window throughout your interview. If you switch tabs 3 times, your interview will be automatically submitted with current answers.
            </p>
            <button
              className="primary-btn"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowTabWarning(false)}
            >
              I Understand & Return to Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Interview;