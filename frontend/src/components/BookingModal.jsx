
import React from 'react';
import { api } from '../lib/api';
import { X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const MALAYSIA_TIME_ZONE = 'Asia/Kuala_Lumpur';
const OPENING_HOUR = 9;
const CLOSING_HOUR = 22;

function getMalaysiaDateTime(value) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MALAYSIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));

  const result = {};
  parts.forEach(part => {
    result[part.type] = part.value;
  });

  return {
    date: `${result.year}-${result.month}-${result.day}`,
    minutes: Number(result.hour) * 60 + Number(result.minute),
  };
}

function getMalaysiaToday() {
  return getMalaysiaDateTime(new Date()).date;
}

function addDays(dateString, numberOfDays) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + numberOfDays));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function getDateParts(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return { year, month, day };
}

function getDateIntervals(dateString, bookings) {
  return bookings
    .map(booking => {
      const start = getMalaysiaDateTime(booking.start_at);
      const end = getMalaysiaDateTime(booking.end_at);

      if (start.date !== dateString) {
        return null;
      }

      return {
        start: start.minutes,
        end: end.date === dateString ? end.minutes : 24 * 60,
        bookingType: booking.booking_type,
      };
    })
    .filter(Boolean);
}

function getAvailableStartTimes(dateString, duration, bookings) {
  const intervals = getDateIntervals(dateString, bookings);
  const available = [];

  for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
    const start = hour * 60;
    const end = start + Number(duration) * 60;

    if (end > CLOSING_HOUR * 60) {
      continue;
    }

    const overlaps = intervals.some(
      interval => start < interval.end && end > interval.start
    );

    if (!overlaps) {
      available.push(
        `${String(hour).padStart(2, '0')}:00`
      );
    }
  }

  return available;
}

export default function BookingModal({ post, onClose }) {
  const today = getMalaysiaToday();
  const lastDate = addDays(today, 89);

  const [bookingType, setBookingType] = React.useState('hourly');
  const [bookingDate, setBookingDate] = React.useState(today);
  const [startTime, setStartTime] = React.useState('09:00');
  const [duration, setDuration] = React.useState('1');
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerEmail, setCustomerEmail] = React.useState('');
  const [bookings, setBookings] = React.useState([]);
  const [availabilityLoading, setAvailabilityLoading] = React.useState(true);
  const [availabilityError, setAvailabilityError] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(null);
  const [copiedReference, setCopiedReference] = React.useState(false);

  const [displayMonth, setDisplayMonth] = React.useState(
    today.slice(0, 7)
  );

  const hourlyRate = Number(post.price_per_hour || 0);
  const estimatedPrice =
    bookingType === 'hourly'
      ? hourlyRate * Number(duration)
      : 500;

  React.useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        setAvailabilityLoading(true);
        setAvailabilityError('');

        const result = await api(
          `/bookings/availability/${post.id}?start_date=${today}&end_date=${lastDate}`
        );

        if (!cancelled) {
          setBookings(result.bookings || []);
        }
      } catch (err) {
        if (!cancelled) {
          setAvailabilityError(
            err.message || 'Could not load booking availability.'
          );
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [post.id, today, lastDate]);

  const availableStartTimes = React.useMemo(() => {
    if (!bookingDate) return [];

    return getAvailableStartTimes(
      bookingDate,
      duration,
      bookings
    );
  }, [bookingDate, duration, bookings]);

  React.useEffect(() => {
    if (
      availableStartTimes.length > 0 &&
      !availableStartTimes.includes(startTime)
    ) {
      setStartTime(availableStartTimes[0]);
    }
  }, [availableStartTimes, startTime]);

  const monthParts = getDateParts(`${displayMonth}-01`);

  const daysInMonth = new Date(
    Date.UTC(monthParts.year, monthParts.month, 0)
  ).getUTCDate();

  const firstWeekday = new Date(
    Date.UTC(monthParts.year, monthParts.month - 1, 1)
  ).getUTCDay();

  const calendarDates = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = String(index + 1).padStart(2, '0');
      return `${displayMonth}-${day}`;
    }),
  ];

  const minimumMonth = today.slice(0, 7);
  const maximumMonth = lastDate.slice(0, 7);

  const previousMonth = () => {
    const [year, month] = displayMonth.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 2, 1));

    const value = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
    ].join('-');

    if (value >= minimumMonth) {
      setDisplayMonth(value);
    }
  };

  const nextMonth = () => {
    const [year, month] = displayMonth.split('-').map(Number);
    const date = new Date(Date.UTC(year, month, 1));

    const value = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
    ].join('-');

    if (value <= maximumMonth) {
      setDisplayMonth(value);
    }
  };

  function getDayStatus(dateString) {
    if (!dateString || dateString < today || dateString > lastDate) {
      return 'outside';
    }

    const intervals = getDateIntervals(dateString, bookings);

    if (bookingType === 'full_day') {
      return intervals.length > 0 ? 'unavailable' : 'available';
    }

    if (intervals.some(
      interval =>
        interval.bookingType === 'full_day' ||
        (
          interval.start <= OPENING_HOUR * 60 &&
          interval.end >= CLOSING_HOUR * 60
        )
    )) {
      return 'unavailable';
    }

    const slots = getAvailableStartTimes(
      dateString,
      duration,
      bookings
    );

    if (slots.length === 0) {
      return 'unavailable';
    }

    return intervals.length > 0 ? 'partial' : 'available';
  }

  function selectDate(dateString) {
    if (getDayStatus(dateString) === 'unavailable') {
      return;
    }

    setBookingDate(dateString);
    setError('');
  }

  async function submitBooking(event) {
    event.preventDefault();
    setError('');

    if (!bookingDate) {
      setError('Please select a booking date.');
      return;
    }
    if (
  customerName.trim().length < 2 ||
  customerPhone.trim().length < 8 ||
  !customerEmail.trim()
) {
  setError('Please enter your full name, WhatsApp number and email address.');
  return;
}
    if (getDayStatus(bookingDate) === 'unavailable') {
  setError('This date is no longer available. Please choose another date.');
  return;
}

    if (bookingType === 'hourly' && availableStartTimes.length === 0) {
      setError('There are no available time slots for this date and duration.');
      return;
    }

    const payload = {
  post_id: post.id,
  booking_type: bookingType,
  booking_date: bookingDate,
  customer_name: customerName.trim(),
  customer_phone: customerPhone.trim(),
  customer_email: customerEmail.trim(),
};

    if (bookingType === 'hourly') {
      payload.start_time = startTime;
      payload.duration_hours = Number(duration);
    }

    try {
      setLoading(true);

      const result = await api('/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const monthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(
    new Date(`${displayMonth}-01T00:00:00Z`)
  );

  return (
    <div className="booking-overlay">
      <div className="booking-modal">
        <button
          className="booking-close"
          onClick={onClose}
          aria-label="Close booking window"
        >
          <X size={22} />
        </button>

        {success ? (
  <div className="booking-success">
    <CalendarDays size={42} />
    <h2>Booking request submitted!</h2>

    <p>
      Your request for <strong>{post.title}</strong> has been
      submitted successfully.
    </p>

    <p>
      Status: <strong>Pending owner approval</strong>
    </p>

    <p>
      Booking price: RM {Number(success.total_price).toFixed(2)}
    </p>

    <div className="booking-reference">
      <h3>Your booking reference</h3>

      <p>
        Please save this reference. You will need it to check your
        booking status later.
      </p>

      <strong className="booking-reference-code">
        {success.lookup_reference}
      </strong>

      <button
        type="button"
        className="button button-dark"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              success.lookup_reference
            );
            setCopiedReference(true);
          } catch {
            setError('Could not copy the reference. Please copy it manually.');
          }
        }}
      >
        {copiedReference ? 'Reference copied!' : 'Copy booking reference'}
      </button>
    </div>

    <button className="button button-dark" onClick={onClose}>
      Close
    </button>
  </div>
) : (
  <>
            <h2>Book this studio</h2>
            <p className="booking-subtitle">{post.title}</p>

            <form onSubmit={submitBooking}>
              <div className="booking-customer-details">
  <h3>Your contact details</h3>
  <p>Sign-in is not required. Please provide your details so the studio owner can contact you.</p>

  <label htmlFor="customer-name">Full name</label>
  <input
    id="customer-name"
    type="text"
    value={customerName}
    onChange={event => setCustomerName(event.target.value)}
    placeholder="Enter your full name"
    minLength={2}
    maxLength={120}
    required
  />

  <label htmlFor="customer-phone">WhatsApp number</label>
  <input
    id="customer-phone"
    type="tel"
    value={customerPhone}
    onChange={event => setCustomerPhone(event.target.value)}
    placeholder="e.g. 0123456789"
    minLength={8}
    maxLength={30}
    required
  />

  <label htmlFor="customer-email">Email address</label>
  <input
    id="customer-email"
    type="email"
    value={customerEmail}
    onChange={event => setCustomerEmail(event.target.value)}
    placeholder="Enter your email address"
    maxLength={254}
    required
  />
</div>
              <label>Booking type</label>

              <div className="booking-type-options">
                <button
                  type="button"
                  className={bookingType === 'hourly' ? 'active' : ''}
                  onClick={() => {
                    setBookingType('hourly');
                    setError('');
                  }}
                >
                  Hourly
                </button>

                <button
                  type="button"
                  className={bookingType === 'full_day' ? 'active' : ''}
                  onClick={() => {
                    setBookingType('full_day');
                    setError('');
                  }}
                >
                  Full day
                </button>
              </div>

              <label>Choose a booking date</label>

              <div className="booking-calendar">
                <div className="booking-calendar-header">
                  <button
                    type="button"
                    onClick={previousMonth}
                    disabled={displayMonth <= minimumMonth}
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <strong>{monthLabel}</strong>

                  <button
                    type="button"
                    onClick={nextMonth}
                    disabled={displayMonth >= maximumMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="booking-calendar-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    day => (
                      <div className="booking-calendar-weekday" key={day}>
                        {day}
                      </div>
                    )
                  )}

                  {calendarDates.map((dateString, index) => {
                    if (!dateString) {
                      return (
                        <div
                          className="booking-calendar-blank"
                          key={`blank-${index}`}
                        />
                      );
                    }

                    const status = getDayStatus(dateString);
                    const selected = bookingDate === dateString;

                    return (
                      <button
                        type="button"
                        key={dateString}
                        disabled={
                          status === 'unavailable' ||
                          status === 'outside' ||
                          availabilityLoading
                        }
                        className={[
                          'booking-calendar-day',
                          `day-${status}`,
                          selected ? 'selected' : '',
                        ].join(' ')}
                        onClick={() => selectDate(dateString)}
                        title={
                          status === 'unavailable'
                            ? 'Not available'
                            : status === 'partial'
                              ? 'Some time slots are booked'
                              : 'Available'
                        }
                      >
                        {Number(dateString.slice(-2))}
                      </button>
                    );
                  })}
                </div>

                <div className="booking-calendar-legend">
                  <span><i className="legend-available" /> Available</span>
                  <span><i className="legend-partial" /> Partly booked</span>
                  <span><i className="legend-unavailable" /> Unavailable</span>
                </div>
              </div>

              {availabilityLoading && (
                <p className="booking-calendar-message">
                  Loading calendar availability...
                </p>
              )}

              {availabilityError && (
                <p className="booking-error">
                  {availabilityError}
                </p>
              )}

              {bookingDate && (
                <p className="booking-selected-date">
                  Selected date: <strong>{bookingDate}</strong>
                </p>
              )}

              {bookingType === 'hourly' && (
                <>
                  <label htmlFor="booking-duration">
                    Number of hours
                  </label>

                  <select
                    id="booking-duration"
                    value={duration}
                    onChange={event => setDuration(event.target.value)}
                  >
                    {Array.from({ length: 13 }, (_, index) => index + 1).map(
                      hours => (
                        <option key={hours} value={hours}>
                          {hours} {hours === 1 ? 'hour' : 'hours'}
                        </option>
                      )
                    )}
                  </select>

                  <label htmlFor="booking-time">
                    Available start times
                  </label>

                  <select
                    id="booking-time"
                    value={startTime}
                    onChange={event => setStartTime(event.target.value)}
                    disabled={availableStartTimes.length === 0}
                  >
                    {availableStartTimes.length === 0 ? (
                      <option value="">No available times</option>
                    ) : (
                      availableStartTimes.map(time => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))
                    )}
                  </select>

                  <div className="booking-price">
                    <span>Hourly rate</span>
                    <strong>RM {hourlyRate.toFixed(2)}</strong>
                  </div>

                  <div className="booking-price">
                    <span>Estimated total</span>
                    <strong>RM {estimatedPrice.toFixed(2)}</strong>
                  </div>
                </>
              )}

              {bookingType === 'full_day' && (
                <div className="booking-price">
                  <span>Full-day period</span>
                  <strong>09:00 – 22:00</strong>
                  <p>Full-day price: RM 500.00</p>
                </div>
              )}

              <p className="booking-note">
                Your booking is a request. The studio owner must approve it
                before it is confirmed. Pending and approved bookings are
                treated as unavailable.
              </p>

              {error && (
                <p className="booking-error">{error}</p>
              )}

              <button
                className="button button-dark booking-submit"
                type="submit"
                disabled={
                  loading ||
                  availabilityLoading ||
                  Boolean(availabilityError) ||
                  !bookingDate ||
                  (
                    bookingType === 'hourly' &&
                    availableStartTimes.length === 0
                  )
                }
              >
                {loading ? 'Submitting...' : 'Submit booking request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
