import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email: email.trim(), password });

      const destination = (location.state as { from?: string } | null)?.from;

      navigate(destination || "/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to book and manage your appointments."
    >
      <button
        type="button"
        className="auth-close"
        onClick={() => navigate("/")}
        aria-label="Close login"
        title="Close"
      >
        &times;
      </button>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={255}
          autoComplete="email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          maxLength={72}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="button button-primary button-full"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Create account</Link>
      </p>
    </AuthLayout>
  );
}
