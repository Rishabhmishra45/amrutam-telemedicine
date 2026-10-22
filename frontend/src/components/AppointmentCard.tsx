
import type { Appointment } from '../types';

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel: (id: string) => void;
  cancelling: boolean;
}

export default function AppointmentCard({
  appointment,
  onCancel,
  cancelling,
}: AppointmentCardProps) {
  return (
    <article className="appointment-card">
      <div className="appointment-card-heading">
        <div className="doctor-avatar">⚕</div>
        <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
          {appointment.status}
        </span>
      </div>

      <h3>Doctor appointment</h3>
      <p className="appointment-date">
        {new Date(appointment.startsAt).toLocaleString()}
      </p>

      <p className="appointment-duration">
        Ends: {new Date(appointment.endsAt).toLocaleTimeString()}
      </p>

      {appointment.reason && (
        <p className="appointment-reason">{appointment.reason}</p>
      )}

      {appointment.status === 'PENDING' && (
        <button
          className="button button-danger"
          disabled={cancelling}
          onClick={() => onCancel(appointment.id)}
        >
          {cancelling ? 'Cancelling...' : 'Cancel appointment'}
        </button>
      )}
    </article>
  );
}
