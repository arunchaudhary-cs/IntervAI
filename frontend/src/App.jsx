import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateInterview from './pages/CreateInterview';
import Interview from './pages/Interview';
import Result from './pages/Result';

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/create-interview"
          element={
            <CreateInterview />
          }
        />

        <Route
          path="/interviews/:id"
          element={
            <Interview />
          }
        />

        <Route
          path="/interviews/:id/result"
          element={
            <Result />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;