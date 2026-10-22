
import type { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
  onBook: (doctor: Doctor) => void;
}

export default function DoctorCard({ doctor, onBook }: DoctorCardProps) {
  return (
    <article className="doctor-card">
      <div className="doctor-card-top">
        <div className="doctor-avatar">⚕</div>
        <span className="available">
          <span className="status-dot" />
          Available
        </span>
      </div>

      <h3>{doctor.user.name}</h3>
      <p className="specialization">{doctor.specialization}</p>
      <p className="qualification">{doctor.qualification}</p>

      <div className="card-footer">
        <div>
          <span className="fee-label">Consultation fee</span>
          <strong>₹{doctor.consultationFee.toString()}</strong>
        </div>
        <button
          className="button button-primary"
          disabled={!doctor.isAvailable}
          onClick={() => onBook(doctor)}
        >
          Book now
        </button>
      </div>
    </article>
  );
}
