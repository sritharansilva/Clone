
import React from 'react';
import { api } from './lib/api';
import {
  Search,
  CalendarDays,
  Clock,
  MapPin,
  ArrowLeft,
} from 'lucide-react';

export default function BookingLookup({ onBack }) {
  const [reference, setReference] = React.useState('');
  const [booking, setBooking] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function checkBooking(event) {
    event.preventDefault();

    if (!reference.trim()) {
      setError('Please enter your booking reference.');
      return;
    }

    setLoading(true);
    setError('');
    setBooking(null);

    try {
      const result = await api('/bookings/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lookup_reference: reference.trim(),
        }),
      });

      setBooking(result);
    } catch (err) {
      setError(
        err.message || 'Could not find your booking. Please check your reference.'
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  function formatStatus(status) {
    if (status === 'pending') return 'Pending approval';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    return status;
  }

  function BookingDetails({ booking }) {
    return (
      <div className="booking-lookup-result">
        <h2>Booking details</h2>

        <div>
          <strong>Studio</strong>
          <p>{booking.studio_title}</p>
        </div>

        {booking.studio_location && (
          <div>
            <strong>Location</strong>
            <p>
              <MapPin size={15} />
              {booking.studio_location}
            </p>
          </div>
        )}

        <div>
          <strong>Booking type</strong>
          <p>
            {booking.booking_type === 'full_day'
              ? 'Full day'
              : 'Hourly'}
          </p>
        </div>

        <div>
          <strong>Date and time</strong>
          <p>
            <CalendarDays size={15} />
            {formatDateTime(booking.start_at)}
          </p>
          <p>
            <Clock size={15} />
            Until {formatDateTime(booking.end_at)}
          </p>
        </div>

        <div>
          <strong>Total price</strong>
          <p>
            RM {Number(booking.total_price).toFixed(2)}
          </p>
        </div>

        <div className="booking-lookup-status">
          <strong>Current status</strong>
          <p className={`status-${booking.status}`}>
            {formatStatus(booking.status)}
          </p>
        </div>

        {booking.status === 'pending' && (
          <p>
            Your booking is waiting for the studio owner's approval.
          </p>
        )}

        {booking.status === 'approved' && (
          <p>
            Your booking has been approved. We look forward to
            welcoming you!
          </p>
        )}

        {booking.status === 'rejected' && (
          <p>
            Unfortunately, your booking request was not approved.
            Please contact the studio owner if you need more information.
          </p>
        )}
      </div>
    );
  }

  return (
    <main className="booking-lookup-page">
      <div className="booking-lookup-container">
        <button
          type="button"
          className="booking-lookup-back"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="booking-lookup-card">
          <Search size={36} />

          <h1>Check your booking status</h1>

          <p>
            Enter the private booking reference you received
            after submitting your booking request.
          </p>

          <form onSubmit={checkBooking}>
            <label htmlFor="booking-reference">
              Booking reference
            </label>

            <input
              id="booking-reference"
              type="text"
              value={reference}
              onChange={event => setReference(event.target.value)}
              placeholder="Paste your booking reference"
              required
            />

            {error && (
              <p className="booking-error">{error}</p>
            )}

            <button
              type="submit"
              className="button button-dark"
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </form>

          {booking && <BookingDetails booking={booking} />}
        </div>
      </div>
    </main>
  );
}
