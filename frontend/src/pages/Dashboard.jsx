import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Dashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'IN_PROGRESS'
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashboardResponse, interviewsResponse] = await Promise.all([
        api.get('/users/dashboard'),
        api.get('/users/interviews?limit=50'),
      ]);

      setDashboard(dashboardResponse.data);
      setInterviews(interviewsResponse.data.data || []);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (filter) => {
    setActiveFilter(filter);
    setFilterLoading(true);

    try {
      let url = '/users/interviews?limit=50';
      if (filter === 'COMPLETED') url += '&status=COMPLETED';
      else if (filter === 'IN_PROGRESS') url += '&status=IN_PROGRESS';

      const response = await api.get(url);
      setInterviews(response.data.data || []);
    } catch (err) {
      console.error('Failed to filter interviews:', err);
    } finally {
      setFilterLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'status-completed';
      case 'IN_PROGRESS':
        return 'status-progress';
      case 'PENDING':
        return 'status-pending';
      default:
        return '';
    }
  };

  const openInterview = (interview) => {
    if (interview.status === 'COMPLETED') {
      navigate(`/interviews/${interview.id}/result`);
    } else {
      navigate(`/interviews/${interview.id}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const filteredInterviews = interviews.filter((interview) => {
    if (activeFilter === 'COMPLETED') return interview.status === 'COMPLETED';
    if (activeFilter === 'IN_PROGRESS') return interview.status === 'IN_PROGRESS' || interview.status === 'PENDING';
    return true;
  });

  return (
    <div className="dashboard-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <h2>Interv<span>AI</span></h2>
        </div>

        <div className="navbar-actions">
          <button
            className="new-interview-btn"
            onClick={() => navigate('/create-interview')}
          >
            + New Interview
          </button>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Track your interview preparation, review past reports, and improve your performance.</p>
          </div>

          <button
            className="primary-btn"
            onClick={() => navigate('/create-interview')}
          >
            Start New Interview
          </button>
        </div>

        {/* Interactive Clickable Stat Cards */}
        <div className="stats">
          {/* Total Interviews Tab */}
          <div
            className={`stat-card stat-clickable ${activeFilter === 'ALL' ? 'stat-card-active' : ''}`}
            onClick={() => handleFilterChange('ALL')}
            title="Click to view all interviews"
          >
            <div className="stat-icon">🎯</div>
            <div>
              <p>Total Interviews</p>
              <strong>{dashboard?.totalInterviews || 0}</strong>
            </div>
            {activeFilter === 'ALL' && <span className="stat-active-indicator">● Showing All</span>}
          </div>

          {/* Completed Interviews Tab */}
          <div
            className={`stat-card stat-clickable ${activeFilter === 'COMPLETED' ? 'stat-card-active' : ''}`}
            onClick={() => handleFilterChange('COMPLETED')}
            title="Click to view all completed interviews & reports"
          >
            <div className="stat-icon">✓</div>
            <div>
              <p>Completed</p>
              <strong>{dashboard?.completedInterviews || 0}</strong>
            </div>
            {activeFilter === 'COMPLETED' && <span className="stat-active-indicator">● Showing Completed</span>}
          </div>

          {/* In Progress Interviews Tab */}
          <div
            className={`stat-card stat-clickable ${activeFilter === 'IN_PROGRESS' ? 'stat-card-active' : ''}`}
            onClick={() => handleFilterChange('IN_PROGRESS')}
            title="Click to view ongoing in-progress interviews"
          >
            <div className="stat-icon">◷</div>
            <div>
              <p>In Progress</p>
              <strong>{dashboard?.inProgressInterviews || 0}</strong>
            </div>
            {activeFilter === 'IN_PROGRESS' && <span className="stat-active-indicator">● Showing In Progress</span>}
          </div>

          {/* Average Score */}
          <div
            className="stat-card"
            style={{ cursor: 'default' }}
          >
            <div className="stat-icon">★</div>
            <div>
              <p>Average Score</p>
              <strong>{Number(dashboard?.averageScore || 0).toFixed(1)}</strong>
            </div>
          </div>
        </div>

        {/* Section List */}
        <section className="recent-section">
          <div className="section-header">
            <div>
              <h2>
                {activeFilter === 'ALL'
                  ? 'All Interviews'
                  : activeFilter === 'COMPLETED'
                  ? 'Completed Interviews & Evaluation Reports'
                  : 'In-Progress Interviews'}
              </h2>
              <p>
                {activeFilter === 'ALL'
                  ? 'Your complete interview history and sessions'
                  : activeFilter === 'COMPLETED'
                  ? 'Click any completed interview to review your comprehensive AI evaluation report'
                  : 'Resume your unfinished interview sessions'}
              </p>
            </div>
          </div>

          {filterLoading ? (
            <div className="empty-state">
              <div className="loading-spinner"></div>
              <p>Filtering interviews...</p>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎤</div>
              <h3>
                {activeFilter === 'COMPLETED'
                  ? 'No completed interviews yet'
                  : activeFilter === 'IN_PROGRESS'
                  ? 'No interviews currently in progress'
                  : 'No interviews found'}
              </h3>
              <p>
                {activeFilter === 'COMPLETED'
                  ? 'Complete an interview session to generate your performance report.'
                  : 'Create a new AI-powered interview to begin practicing.'}
              </p>
              <button
                className="primary-btn"
                onClick={() => navigate('/create-interview')}
              >
                Create New Interview
              </button>
            </div>
          ) : (
            <div className="interviews">
              {filteredInterviews.map((interview) => {
                const isVoice = interview.mode === 'VOICE';
                const isCompleted = interview.status === 'COMPLETED';

                return (
                  <div className="interview-card" key={interview.id}>
                    <div className="interview-card-top">
                      <div>
                        <h3>{interview.role}</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                          <span className="difficulty">{interview.difficulty}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isVoice ? '#e0e7ff' : '#f1f5f9',
                              color: isVoice ? '#4338ca' : '#475569',
                            }}
                          >
                            {isVoice ? '🎙️ Voice (15m)' : '✍️ Text (30m)'}
                          </span>
                        </div>
                      </div>

                      <span className={`status-badge ${getStatusClass(interview.status)}`}>
                        {interview.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="interview-details">
                      <div>
                        <span>Score</span>
                        <strong>
                          {interview.averageScore !== null && interview.averageScore !== undefined
                            ? `${Number(interview.averageScore).toFixed(1)} / 100`
                            : '--'}
                        </strong>
                      </div>

                      <div>
                        <span>Mode</span>
                        <strong style={{ fontSize: '13px' }}>
                          {isVoice ? '🎙️ Voice' : '✍️ Text'}
                        </strong>
                      </div>

                      <div>
                        <span>Difficulty</span>
                        <strong>{interview.difficulty}</strong>
                      </div>
                    </div>

                    <button
                      className="open-btn"
                      style={{
                        background: isCompleted ? '#059669' : '#4f46e5',
                        color: 'white',
                        fontWeight: 600,
                      }}
                      onClick={() => openInterview(interview)}
                    >
                      {isCompleted ? '📊 View Results Report →' : '🚀 Continue Interview →'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;