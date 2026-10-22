import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });

      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Join Amrutam to manage your healthcare appointments."
    >
      <button
        type="button"
        className="auth-close"
        onClick={() => navigate("/")}
        aria-label="Close registration"
        title="Close"
      >
        &times;
      </button>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label htmlFor="register-name">Full name</label>
        <input
          id="register-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          autoComplete="name"
          required
        />

        <label htmlFor="register-phone">Phone (optional)</label>
        <input
          id="register-phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          maxLength={20}
          autoComplete="tel"
        />

        <label htmlFor="register-email">Email address</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={255}
          autoComplete="email"
          required
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
