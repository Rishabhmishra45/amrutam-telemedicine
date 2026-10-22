
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DoctorCard from '../components/DoctorCard';
import BookingModal from '../components/BookingModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Doctor } from '../types';

export default function HomePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let active = true;

    api.getDoctors()
      .then((data) => {
        if (active) setDoctors(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Doctors load nahi hue.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    const query = search.trim().toLowerCase();

    return (
      doctor.user.name.toLowerCase().includes(query) ||
      doctor.specialization.toLowerCase().includes(query) ||
      doctor.qualification.toLowerCase().includes(query)
    );
  });

  function handleBook(doctor: Doctor) {
    if (!user) {
      navigate('/login', { state: { from: '/' } });
      return;
    }

    if (user.role !== 'PATIENT') {
      setError('Sirf patient account appointment book kar sakta hai.');
      return;
    }

    setSelectedDoctor(doctor);
  }

  return (
    <>
      <Navbar />

      <main>
        <section className="hero" id="home">
          <span className="eyebrow">YOUR HEALTH, OUR PRIORITY</span>
          <h1>
            Better health begins
            <br />
            with the <span>right doctor.</span>
          </h1>
          <p>
            Find trusted healthcare professionals and make your
            next appointment with confidence.
          </p>

          <div className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search doctor or specialization..."
              aria-label="Search doctors"
            />
            <a href="#doctors" className="button button-primary">
              Find a doctor
            </a>
          </div>

          <div className="hero-note">
            <span>✓ Trusted care</span>
            <span>✓ Easy appointments</span>
            <span>✓ Patient-first approach</span>
          </div>
        </section>

        <section className="doctors-section" id="doctors">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MEET OUR EXPERTS</span>
              <h2>Find your doctor</h2>
              <p>Explore available healthcare professionals.</p>
            </div>
            <span className="doctor-count">
              {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading && <p className="message">Loading doctors...</p>}
          {error && <p className="message error">{error}</p>}

          {!loading && !error && filteredDoctors.length === 0 && (
            <p className="message">
              {doctors.length === 0
                ? 'No doctors are available yet.'
                : 'No doctors match your search.'}
            </p>
          )}

          <div className="doctor-grid">
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onBook={handleBook}
              />
            ))}
          </div>
        </section>

        <section className="about-section" id="about">
          <span className="eyebrow">CARE THAT CONNECTS</span>
          <h2>Your health journey, made simpler.</h2>
          <p>
            Amrutam helps patients discover healthcare professionals
            and manage their appointments in one place.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand" href="/">
          <span className="brand-icon">✚</span>
          Amrutam
        </a>
        <p>Healthcare, with care.</p>
      </footer>

      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onBooked={() => {
            setSelectedDoctor(null);
            navigate('/appointments');
          }}
        />
      )}
    </>
  );
}
