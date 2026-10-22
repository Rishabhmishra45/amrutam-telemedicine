
import { useState, type FormEvent } from 'react';
import { api } from '../services/api';
import type { Doctor } from '../types';
import { useAuth } from '../context/AuthContext';

interface BookingModalProps {
  doctor: Doctor;
  onClose: () => void;
  onBooked: () => void;
}

export default function BookingModal({
  doctor,
  onClose,
  onBooked,
}: BookingModalProps) {
  const { token } = useAuth();
  const [startsAt, setStartsAt] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError('Appointment book karne ke liye sign in karo.');
      return;
    }

    const start = new Date(startsAt);

    if (Number.isNaN(start.getTime()) || start <= new Date()) {
      setError('Future date aur time select karo.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      await api.createAppointment(
        {
          doctorId: doctor.id,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          reason: reason.trim() || undefined,
        },
        token,
      );

      setSuccess('Appointment successfully booked.');
      onBooked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <span className="eyebrow">BOOK A CONSULTATION</span>
        <h2 id="booking-title">{doctor.user.name}</h2>
        <p className="auth-description">
          {doctor.specialization} · ₹{doctor.consultationFee}
        </p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label htmlFor="booking-start">Appointment date and time</label>
          <input
            id="booking-start"
            type="datetime-local"
            value={startsAt}
            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)}
            onChange={(event) => setStartsAt(event.target.value)}
            required
          />

          <label htmlFor="booking-reason">Reason for consultation (optional)</label>
          <textarea
            id="booking-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={3}
          />

          {error && <p className="form-error" role="alert">{error}</p>}
          {success && <p className="form-success" role="status">{success}</p>}

          <button className="button button-primary button-full" disabled={loading}>
            {loading ? 'Booking...' : 'Confirm appointment'}
          </button>
        </form>
      </section>
    </div>
  );
}
