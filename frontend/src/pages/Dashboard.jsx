import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import api from '../services/api';

function Dashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] =
    useState(null);

  const [interviews, setInterviews] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [
        dashboardResponse,
        interviewsResponse,
      ] = await Promise.all([
        api.get('/users/dashboard'),
        api.get('/users/interviews?limit=5'),
      ]);

      setDashboard(
        dashboardResponse.data,
      );

      setInterviews(
        interviewsResponse.data.data || [],
      );
    } catch (error) {
      console.error(error);

      if (
        error.response?.status === 401
      ) {
        localStorage.removeItem(
          'accessToken',
        );

        localStorage.removeItem(
          'refreshToken',
        );

        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem(
      'accessToken',
    );

    localStorage.removeItem(
      'refreshToken',
    );

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
    navigate(
      `/interviews/${interview.id}`,
    );
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="navbar">

        <div className="navbar-brand">
          <h2>Interv<span>AI</span></h2>
        </div>

        <div className="navbar-actions">

          <button
            className="new-interview-btn"
            onClick={() =>
              navigate(
                '/create-interview',
              )
            }
          >
            + New Interview
          </button>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* =========================
          MAIN
      ========================= */}

      <main className="dashboard-main">

        {/* Header */}

        <div className="dashboard-header">

          <div>
            <h1>Dashboard</h1>

            <p>
              Track your interview preparation
              and improve your performance.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() =>
              navigate(
                '/create-interview',
              )
            }
          >
            Start New Interview
          </button>

        </div>

        {/* =========================
            STAT CARDS
        ========================= */}

        <div className="stats">

          <div className="stat-card">

            <div className="stat-icon">
              🎯
            </div>

            <div>
              <p>Total Interviews</p>

              <strong>
                {dashboard?.totalInterviews || 0}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ✓
            </div>

            <div>
              <p>Completed</p>

              <strong>
                {dashboard?.completedInterviews || 0}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ◷
            </div>

            <div>
              <p>In Progress</p>

              <strong>
                {dashboard?.inProgressInterviews || 0}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ★
            </div>

            <div>
              <p>Average Score</p>

              <strong>
                {Number(
                  dashboard?.averageScore || 0,
                ).toFixed(1)}
              </strong>
            </div>

          </div>

        </div>

        {/* =========================
            RECENT INTERVIEWS
        ========================= */}

        <section className="recent-section">

          <div className="section-header">

            <div>
              <h2>Recent Interviews</h2>

              <p>
                Your latest interview attempts
              </p>
            </div>

            <button
              className="outline-btn"
              onClick={() =>
                navigate(
                  '/create-interview',
                )
              }
            >
              Start Interview
            </button>

          </div>

          {interviews.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                🎤
              </div>

              <h3>
                No interviews yet
              </h3>

              <p>
                Start your first AI-powered
                interview and begin practicing.
              </p>

              <button
                className="primary-btn"
                onClick={() =>
                  navigate(
                    '/create-interview',
                  )
                }
              >
                Create Your First Interview
              </button>

            </div>

          ) : (

            <div className="interviews">

              {interviews.map(
                (interview) => (

                  <div
                    className="interview-card"
                    key={interview.id}
                  >

                    <div className="interview-card-top">

                      <div>

                        <h3>
                          {interview.role}
                        </h3>

                        <p className="difficulty">
                          {interview.difficulty}
                        </p>

                      </div>

                      <span
                        className={`status-badge ${getStatusClass(
                          interview.status,
                        )}`}
                      >
                        {interview.status
                          ?.replace(
                            '_',
                            ' ',
                          )}
                      </span>

                    </div>

                    <div className="interview-details">

                      <div>
                        <span>Score</span>

                        <strong>
                          {interview.averageScore !==
                          null &&
                          interview.averageScore !==
                            undefined
                            ? Number(
                                interview.averageScore,
                              ).toFixed(1)
                            : '--'}
                        </strong>
                      </div>

                      <div>
                        <span>Difficulty</span>

                        <strong>
                          {interview.difficulty}
                        </strong>
                      </div>

                    </div>

                    <button
                      className="open-btn"
                      onClick={() =>
                        openInterview(
                          interview,
                        )
                      }
                    >
                      Open Interview →
                    </button>

                  </div>

                ),
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Dashboard;