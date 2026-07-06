import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import MyQuizzes from "./pages/MyQuizzes.jsx";
import CreateQuiz from "./pages/CreateQuiz.jsx";
import EditQuiz from "./pages/EditQuiz.jsx";
import SharedQuiz from "./pages/SharedQuiz.jsx";
import Settings from "./pages/Settings.jsx";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold text-brand-600">
          QuizHub
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-brand-600">Browse</Link>
          {user ? (
            <>
              <Link to="/my-quizzes" className="hover:text-brand-600">My Quizzes</Link>
              <Link to="/create" className="hover:text-brand-600">Create</Link>
              <Link to="/settings" className="hover:text-brand-600">Integrations</Link>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-brand-600">Login</Link>
              <Link
                to="/register"
                className="bg-brand-500 text-white px-3 py-1.5 rounded-md hover:bg-brand-600"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/quiz/share/:slug" element={<SharedQuiz />} />
          <Route
            path="/my-quizzes"
            element={
              <ProtectedRoute>
                <MyQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <EditQuiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
