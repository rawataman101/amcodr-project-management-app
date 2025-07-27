import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./components/Auth/LoginPage";
import SignupPage from "./components/Auth/SignupPage";
import ProjectList from "./components/Projects/ProjectList";
import KanbanBoard from "./components/Projects/KanbanBoard";

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <KanbanBoard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/projects" replace />} />
            </Routes>
          </div>
        </Router>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
