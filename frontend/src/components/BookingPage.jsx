
import React from 'react';
import { api } from '../lib/api';
import { CalendarDays, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function BookingPage({ mode, onBack }) {
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [processing, setProcessing] = React.useState('');

  async function loadBookings() {
    try {
      setLoading(true);
      setError('');
      const result = await api(
        mode === 'owner' ? '/bookings/owner' : '/bookings/mine'
      );
      setBookings(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadBookings();
  }, [mode]);

  async function decideBooking(id, decision) {
    try {
      setProcessing(id);
      setError('');
      setMessage('');

      await api(`/bookings/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });

      setMessage(
        decision === 'approved'
          ? 'Booking approved successfully.'
          : 'Booking rejected successfully.'
      );

      await loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing('');
    }
  }

  async function deleteBooking(id) {
  const confirmed = window.confirm(
    'Are you sure you want to permanently delete this booking?'
  );

  if (!confirmed) return;

  try {
    setProcessing(id);
    setError('');
    setMessage('');

    await api(`/bookings/${id}`, {
      method: 'DELETE'
    });

    setMessage('Booking deleted successfully.');

    await loadBookings();
  } catch (err) {
    setError(err.message);
  } finally {
    setProcessing('');
  }
}

  
  function formatDate(value) {
    return new Date(value).toLocaleString('en-MY', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kuala_Lumpur'
    });
  }

  function statusClass(status) {
    return `booking-status status-${status}`;
  }

  return (
    <main className="wrap booking-page">
      <div className="booking-page-heading">
        <div>
          <div className="eyebrow">POSTLIGHT</div>
          <h1>{mode === 'owner' ? 'Manage Bookings' : 'My Bookings'}</h1>
          <p>
            {mode === 'owner'
              ? 'Review and manage booking requests for your studios.'
              : 'Check the latest status of your studio booking requests.'}
          </p>
        </div>

        <button className="button button-outline" onClick={loadBookings}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <p className="booking-error">{error}</p>}
      {message && <p className="booking-message">{message}</p>}

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="booking-empty">
          <CalendarDays size={36} />
          <h3>No bookings yet</h3>
          <p>Your booking requests will appear here.</p>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map(booking => (
            <article className="booking-card" key={booking.id}>
              <div className="booking-card-heading">
                <div>
                  <h2>{booking.studio_title}</h2>
                  <p>{booking.studio_location || 'Studio location not provided'}</p>
                </div>
                <span className={statusClass(booking.status)}>
                  {booking.status}
                </span>
              </div>

              <div className="booking-card-details">
                {mode === 'owner' && (
  <>
    <p>
      <strong>Customer:</strong> {booking.customer_name || 'Existing customer'}
    </p>
    <p>
      <strong>WhatsApp:</strong> {booking.customer_phone || 'Not provided'}
    </p>
    <p>
      <strong>Email:</strong> {booking.customer_email || 'Not provided'}
    </p>
  </>
)}
                <p>
                  <strong>Booking type:</strong>{' '}
                  {booking.booking_type === 'full_day' ? 'Full day' : 'Hourly'}
                </p>
                <p>
                  <strong>Start:</strong> {formatDate(booking.start_at)}
                </p>
                <p>
                  <strong>End:</strong> {formatDate(booking.end_at)}
                </p>
                <p>
                  <strong>Total price:</strong>{' '}
                  RM {Number(booking.total_price).toFixed(2)}
                </p>
                <p>
                  <strong>Booking ID:</strong>{' '}
                  <span className="booking-id">{booking.id}</span>
                </p>
              </div>

              {mode === 'owner' && (
  <div className="booking-card-actions">
    <button
      className="booking-reject"
      disabled={processing === booking.id}
      onClick={() => deleteBooking(booking.id)}
    >
      <XCircle size={16} />
      Delete
    </button>
  </div>
)}

              {mode === 'owner' && booking.status === 'pending' && (
                <div className="booking-card-actions">
                  <button
                    className="booking-approve"
                    disabled={processing === booking.id}
                    onClick={() => decideBooking(booking.id, 'approved')}
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>

                  <button
                    className="booking-reject"
                    disabled={processing === booking.id}
                    onClick={() => decideBooking(booking.id, 'rejected')}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}

              {mode === 'customer' && (
                <p className="booking-customer-note">
                  {booking.status === 'pending' &&
                    'Your request is waiting for the studio owner to respond.'}
                  {booking.status === 'approved' &&
                    'Your booking has been approved. Your studio booking is confirmed.'}
                  {booking.status === 'rejected' &&
                    'Sorry, your booking request was rejected by the studio owner.'}
                  {booking.status === 'cancelled' &&
                    'This booking has been cancelled.'}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <button className="button button-outline booking-back" onClick={onBack}>
        Back to Explore
      </button>
    </main>
  );
}
