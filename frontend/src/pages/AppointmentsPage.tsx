
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AppointmentCard from '../components/AppointmentCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Appointment } from '../types';

export default function AppointmentsPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const result = await api.getMyAppointments(token);
      setAppointments(Array.isArray(result) ? result : [result]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Appointments load nahi hui.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  async function cancelAppointment(id: string) {
    if (!token) return;

    const confirmed = window.confirm(
      'Kya tum is appointment ko cancel karna chahte ho?',
    );

    if (!confirmed) return;

    setCancellingId(id);
    setError('');

    try {
      await api.cancelAppointment(id, token);
      await loadAppointments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Cancellation failed.',
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <>
      <Navbar />

      <main className="page-container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR HEALTH JOURNEY</span>
            <h1>My appointments</h1>
            <p>View and manage your consultation bookings.</p>
          </div>
          <Link className="button button-primary" to="/">
            Find a doctor
          </Link>
        </div>

        {loading && <p className="message">Loading appointments...</p>}
        {error && <p className="message error" role="alert">{error}</p>}

        {!loading && !error && appointments.length === 0 && (
          <div className="empty-state">
            <h2>No appointments yet</h2>
            <p>Find a doctor to book your first consultation.</p>
            <Link className="button button-primary" to="/">
              Browse doctors
            </Link>
          </div>
        )}

        <div className="appointment-grid">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={cancelAppointment}
              cancelling={cancellingId === appointment.id}
            />
          ))}
        </div>
      </main>
    </>
  );
}
