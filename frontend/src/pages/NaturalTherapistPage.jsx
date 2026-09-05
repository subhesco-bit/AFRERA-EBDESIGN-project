import React, { useState } from 'react';
import styles from './NaturalTherapist.module.css';

export default function NaturalTherapistPage() {
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');

  const therapists = [
    {
      id: 1,
      name: 'Dr. Priya Sharma',
      specialization: 'Ayurveda & Nutrition',
      rating: 4.9,
      reviews: 287,
      experience: '15 years',
      languages: ['English', 'Hindi', 'Malayalam'],
      consultation: 'Personalized wellness plans using traditional Ayurveda combined with modern nutrition science',
      price: 500,
      availability: 'Mon-Fri, 9 AM - 6 PM',
      image: '👩‍⚕️'
    },
    {
      id: 2,
      name: 'Vaidya Rajesh Kumar',
      specialization: 'Traditional Ayurvedic Medicine',
      rating: 4.8,
      reviews: 215,
      experience: '20 years',
      languages: ['English', 'Hindi', 'Tamil'],
      consultation: 'Herbal remedies, Panchakarma treatments, and lifestyle optimization',
      price: 600,
      availability: 'Mon-Sat, 10 AM - 7 PM',
      image: '👨‍⚕️'
    },
    {
      id: 3,
      name: 'Naturopathy Clinic - Natural Healing',
      specialization: 'Naturopathy & Wellness',
      rating: 4.7,
      reviews: 156,
      experience: '12 years',
      languages: ['English', 'Hindi'],
      consultation: 'Natural healing through diet, herbs, exercise, and detoxification',
      price: 400,
      availability: 'Daily, 8 AM - 8 PM',
      image: '🌿'
    },
    {
      id: 4,
      name: 'Dr. Anjali Pandey',
      specialization: 'Yoga Therapy & Wellness',
      rating: 4.8,
      reviews: 198,
      experience: '10 years',
      languages: ['English', 'Hindi', 'Marathi'],
      consultation: 'Therapeutic yoga, meditation, and holistic health transformation',
      price: 350,
      availability: 'Tue-Sun, 6 AM - 8 PM',
      image: '🧘‍♀️'
    },
    {
      id: 5,
      name: 'Herbal Wellness Center',
      specialization: 'Herbal Medicine & Detox',
      rating: 4.6,
      reviews: 142,
      experience: '8 years',
      languages: ['English', 'Hindi'],
      consultation: 'Herbal remedies from organic farms, detoxification programs',
      price: 450,
      availability: 'Mon-Fri, 9 AM - 5 PM',
      image: '🌱'
    },
    {
      id: 6,
      name: 'Dr. Suresh Iyer',
      specialization: 'Lifestyle Medicine',
      rating: 4.9,
      reviews: 267,
      experience: '18 years',
      languages: ['English', 'Malayalam', 'Tamil', 'Hindi'],
      consultation: 'Preventive health, chronic disease management, lifestyle transformation',
      price: 550,
      availability: 'Mon-Sat, 8 AM - 6 PM',
      image: '👨‍⚕️'
    }
  ];

  const handleBooking = () => {
    if (!selectedTherapist || !bookingDate || !bookingTime) {
      alert('Please select therapist, date, and time');
      return;
    }
    alert(`Booking confirmed with ${selectedTherapist.name} on ${bookingDate} at ${bookingTime}`);
    setSelectedTherapist(null);
    setBookingDate('');
    setBookingTime('10:00');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🌿 Natural Therapists & Wellness Experts</h1>
        <p>Connect with certified natural healers for personalized wellness consultations</p>
      </header>

      <div className={styles.mainContent}>
        <section className={styles.therapistsList}>
          <h2>Available Therapists</h2>
          <div className={styles.grid}>
            {therapists.map(therapist => (
              <div
                key={therapist.id}
                className={`${styles.therapistCard} ${selectedTherapist?.id === therapist.id ? styles.selected : ''}`}
                onClick={() => setSelectedTherapist(therapist)}
              >
                <div className={styles.avatar}>{therapist.image}</div>
                <h3>{therapist.name}</h3>
                <p className={styles.specialization}>{therapist.specialization}</p>

                <div className={styles.info}>
                  <span>⭐ {therapist.rating} ({therapist.reviews} reviews)</span>
                  <span>📅 {therapist.experience}</span>
                  <span>💬 {therapist.languages.join(', ')}</span>
                </div>

                <p className={styles.consultation}>{therapist.consultation}</p>

                <div className={styles.footer}>
                  <span className={styles.price}>₹{therapist.price}/session</span>
                  <span className={styles.availability}>{therapist.availability}</span>
                </div>

                {selectedTherapist?.id === therapist.id && (
                  <button className={styles.selectBtn}>✓ Selected</button>
                )}
              </div>
            ))}
          </div>
        </section>

        {selectedTherapist && (
          <section className={styles.bookingPanel}>
            <h2>Book Consultation</h2>
            <div className={styles.bookingCard}>
              <div className={styles.therapistInfo}>
                <div className={styles.avatarLarge}>{selectedTherapist.image}</div>
                <div>
                  <h3>{selectedTherapist.name}</h3>
                  <p>{selectedTherapist.specialization}</p>
                  <p className={styles.price}>₹{selectedTherapist.price}/session</p>
                </div>
              </div>

              <div className={styles.bookingForm}>
                <div className={styles.formGroup}>
                  <label>Consultation Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Preferred Time</label>
                  <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}>
                    {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Consultation Type</label>
                  <select>
                    <option>Video Call (30 min)</option>
                    <option>In-Person Visit (45 min)</option>
                    <option>Phone Call (30 min)</option>
                  </select>
                </div>

                <button className={styles.bookBtn} onClick={handleBooking}>
                  Book Consultation
                </button>
              </div>

              <div className={styles.benefits}>
                <h4>💡 Session Benefits</h4>
                <ul>
                  <li>✓ Personalized wellness assessment</li>
                  <li>✓ Custom treatment plan</li>
                  <li>✓ Herbal product recommendations</li>
                  <li>✓ Lifestyle guidance</li>
                  <li>✓ Follow-up support</li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>

      <section className={styles.testimonials}>
        <h2>What Clients Say</h2>
        <div className={styles.testimonialCards}>
          <div className={styles.testimonial}>
            <p>"Completely transformed my health through natural methods. Highly recommend!" - Priya K.</p>
            <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
          </div>
          <div className={styles.testimonial}>
            <p>"Expert guidance and personalized care. My digestion improved significantly." - Rajesh M.</p>
            <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
          </div>
          <div className={styles.testimonial}>
            <p>"Natural healing methods work better than I expected. Life-changing experience!" - Anita S.</p>
            <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
          </div>
        </div>
      </section>
    </div>
  );
}
