
import React, { useState } from 'react';

const MALAYSIA_TIME_ZONE = 'Asia/Kuala_Lumpur';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMalaysiaDateKey(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MALAYSIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));

  const year = parts.find(part => part.type === 'year').value;
  const month = parts.find(part => part.type === 'month').value;
  const day = parts.find(part => part.type === 'day').value;

  return `${year}-${month}-${day}`;
}

function getCalendarDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatBookingTime(value) {
  return new Date(value).toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MALAYSIA_TIME_ZONE,
  });
}

function BookingCalendar({ bookings = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  function navigateDate(direction) {
    const newDate = new Date(currentDate);

    if (view === 'month') {
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }

    setCurrentDate(newDate);
  }

  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const startOffset = firstDay.getDay();

  let dates = [];

  if (view === 'month') {
    dates = Array.from({ length: 42 }, (_, index) =>
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1 - startOffset + index
      )
    );
  } else if (view === 'week') {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  } else {
    dates = [new Date(currentDate)];
  }

  let heading = '';

  if (view === 'month') {
    heading = currentDate.toLocaleDateString('en-MY', {
      month: 'long',
      year: 'numeric',
    });
  } else if (view === 'week') {
    const first = dates[0].toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
    });

    const last = dates[6].toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    heading = `${first} – ${last}`;
  } else {
    heading = currentDate.toLocaleDateString('en-MY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const columnCount = view === 'day' ? 1 : 7;

  return (
    <div className={`booking-calendar view-${view}`}>
      <div className="booking-calendar-header">
        <h2>Booking Calendar</h2>

        <div className="booking-calendar-controls">
          <button
            type="button"
            onClick={() => navigateDate(-1)}
          >
            Previous
          </button>

          <h3>{heading}</h3>

          <button
            type="button"
            onClick={() => navigateDate(1)}
          >
            Next
          </button>
        </div>

        <div className="booking-calendar-views">
          {['month', 'week', 'day'].map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={view === option ? 'active' : ''}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="booking-calendar-content">
        <div
          className="booking-calendar-weekdays"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {view === 'day' ? (
            <div className="booking-calendar-weekday">
              {currentDate.toLocaleDateString('en-MY', {
                weekday: 'long',
              })}
            </div>
          ) : (
            WEEKDAYS.map(day => (
              <div key={day} className="booking-calendar-weekday">
                {day}
              </div>
            ))
          )}
        </div>

        <div
          className="booking-calendar-grid"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {dates.map(date => {
            const dateKey = getCalendarDateKey(date);

            const isCurrentMonth =
              date.getMonth() === currentDate.getMonth();

            const dayBookings = bookings.filter(booking => {
              if (!booking.start_at || !booking.end_at) {
                return false;
              }

              const startDate = getMalaysiaDateKey(booking.start_at);
              const endDate = getMalaysiaDateKey(booking.end_at);

              return dateKey >= startDate && dateKey <= endDate;
            });

            return (
              <div
                key={dateKey}
                className={`booking-calendar-date ${
                  view === 'month' && !isCurrentMonth
                    ? 'other-month'
                    : ''
                }`}
              >
                <span className="booking-calendar-date-number">
                  {date.getDate()}
                </span>

                <div className="booking-calendar-day-bookings">
                  {dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      className={`calendar-booking status-${booking.status}`}
                    >
                      <strong>{booking.studio_title}</strong>

                      <span>
                        {booking.booking_type === 'full_day'
                          ? 'Full day'
                          : `${formatBookingTime(booking.start_at)} – ${formatBookingTime(booking.end_at)}`}
                      </span>

                      <span>{booking.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BookingCalendar;
