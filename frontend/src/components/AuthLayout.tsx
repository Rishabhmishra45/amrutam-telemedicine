
import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  description,
  children,
}: AuthLayoutProps) {
  const navigate = useNavigate();

  return (
    <main className="auth-page">
      <section className="auth-card">
        <button
          type="button"
          className="auth-close"
          onClick={() => navigate('/')}
          aria-label="Close"
          title="Back to home"
        >
          &times;
        </button>

        <Link className="brand auth-brand" to="/">
          <span className="brand-icon">✚</span>
          Amrutam
        </Link>

        <span className="eyebrow">YOUR HEALTH, OUR PRIORITY</span>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>

        {children}
      </section>
    </main>
  );
}
