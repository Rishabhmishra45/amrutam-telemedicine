
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <span className="eyebrow">404 · PAGE NOT FOUND</span>
      <h1>Oops! This page doesn't exist.</h1>
      <p>The page you are looking for may have moved or the URL may be incorrect.</p>
      <Link className="button button-primary" to="/">
        Back to home
      </Link>
    </main>
  );
}
