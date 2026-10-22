
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <span className="brand-icon">✚</span>
        Amrutam
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <a href="/#doctors">Find Doctors</a>
        <a href="/#about">About</a>
      </nav>

      <div className="nav-actions">
        {isAuthenticated && user ? (
          <>
            <span className="welcome-user">Hi, {user.name}</span>
            {user.role === 'PATIENT' && (
              <Link className="button button-outline" to="/appointments">
                My Appointments
              </Link>
            )}
            <button className="button button-primary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="button button-outline" to="/login">
              Sign in
            </Link>
            <Link className="button button-primary" to="/register">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
