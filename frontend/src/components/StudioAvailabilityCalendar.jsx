
import React from 'react';
import { api } from '../lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TIME_ZONE = 'Asia/Kuala_Lumpur';
const OPENING_HOUR = 9;
const CLOSING_HOUR = 22;

function getMalaysiaDate(value) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));

  const result = {};
  parts.forEach(part => {
    result[part.type] = part.value;
  });

  return `${result.year}-${result.month}-${result.day}`;
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function getDateStatus(dateString, bookings) {
  const intervals = bookings
    .map(booking => {
      const start = new Date(booking.start_at);
      const end = new Date(booking.end_at);
      const startDate = getMalaysiaDate(start);
      const endDate = getMalaysiaDate(end);

      if (startDate > dateString || endDate < dateString) {
        return null;
      }

      const startParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(start);

      const endParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(end);

      const minutes = parts => {
        const values = {};
        parts.forEach(part => {
          values[part.type] = part.value;
        });
        return Number(values.hour) * 60 + Number(values.minute);
      };

      return {
        start: startDate === dateString ? minutes(startParts) : 0,
        end: endDate === dateString ? minutes(endParts) : 24 * 60,
        bookingType: booking.booking_type,
      };
    })
    .filter(Boolean);

  if (intervals.some(interval => interval.bookingType === 'full_day')) {
    return 'unavailable';
  }

  const bookedMinutes = intervals.reduce((total, interval) => {
    return total + Math.max(
      0,
      Math.min(interval.end, CLOSING_HOUR * 60) -
      Math.max(interval.start, OPENING_HOUR * 60)
    );
  }, 0);

  const totalMinutes = (CLOSING_HOUR - OPENING_HOUR) * 60;

  if (bookedMinutes >= totalMinutes) return 'unavailable';
  if (bookedMinutes > 0) return 'partial';

  return 'available';
}

export default function StudioAvailabilityCalendar({
  post,
  onDateSelect,
}) {
  const today = getMalaysiaDate(new Date());
  const lastDate = addDays(today, 89);

  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [displayMonth, setDisplayMonth] = React.useState(today.slice(0, 7));

  React.useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        setLoading(true);
        setError('');

        const result = await api(
          `/bookings/availability/${post.id}?start_date=${today}&end_date=${lastDate}`
        );

        if (!cancelled) {
            
          setBookings(Array.isArray(result) ? result : result.bookings || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Availability unavailable');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [post.id, today, lastDate]);

  const [year, month] = displayMonth.split('-').map(Number);

  const daysInMonth = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  const firstWeekday = new Date(
    Date.UTC(year, month - 1, 1)
  ).getUTCDay();

  const dates = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      return `${displayMonth}-${String(index + 1).padStart(2, '0')}`;
    }),
  ];

  const minimumMonth = today.slice(0, 7);
  const maximumMonth = lastDate.slice(0, 7);

  function changeMonth(amount) {
    const date = new Date(Date.UTC(year, month - 1 + amount, 1));

    const next = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
    ].join('-');

    if (next >= minimumMonth && next <= maximumMonth) {
      setDisplayMonth(next);
    }
  }

  const monthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${displayMonth}-01T00:00:00Z`));

  return (
    <div className="studio-availability">
      <div className="studio-availability-heading">
        <strong>Availability</strong>

        <div className="studio-availability-navigation">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            disabled={displayMonth <= minimumMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>

          <span>{monthLabel}</span>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            disabled={displayMonth >= maximumMonth}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="studio-availability-message">Loading availability...</p>
      ) : error ? (
        <p className="studio-availability-message">{error}</p>
      ) : (
        <>
          <div className="studio-availability-grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <span className="studio-availability-weekday" key={index}>
                {day}
              </span>
            ))}

            {dates.map((date, index) => {
              if (!date) {
                return <span key={`blank-${index}`} />;
              }

              const status =
                date < today || date > lastDate
                  ? 'outside'
                  : getDateStatus(date, bookings);

              return (
                <button
                  type="button"
                  key={date}
                  disabled={status === 'outside' || status === 'unavailable'}
                  className={`studio-availability-day day-${status}`}
                  onClick={() => onDateSelect(post, date)}
                  title={
                    status === 'available'
                      ? 'Available'
                      : status === 'partial'
                        ? 'Partially booked'
                        : 'Unavailable'
                  }
                >
                  {Number(date.slice(-2))}
                </button>
              );
            })}
          </div>

          <div className="studio-availability-legend">
            <span><i className="legend-available" /> Available</span>
            <span><i className="legend-partial" /> Partly booked</span>
            <span><i className="legend-unavailable" /> Booked</span>
          </div>
          <p className="studio-availability-hint">
  Select a date to view available times.
</p>
        </>
      )}
    </div>
  );
}
