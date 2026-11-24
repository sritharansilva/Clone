
import React from 'react';
import { api } from '../lib/api';
import { RefreshCw, Save, DollarSign } from 'lucide-react';

export default function PricingPage({ session, onBack }) {
  const ADMIN_ID = 'c64f584e-9c61-43e4-91f3-518bd1f09b1d';

  const isAdmin = session?.user?.id === ADMIN_ID;

  const [studios, setStudios] = React.useState([]);
  const [hourlyPrices, setHourlyPrices] = React.useState({});
  const [fullDayPrice, setFullDayPrice] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  async function loadPrices() {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const result = await api('/posts');

      setStudios(result);

      const prices = {};
      result.forEach(studio => {
        prices[studio.id] = String(studio.price_per_hour ?? '');
      });
      setHourlyPrices(prices);

      if (isAdmin) {
        const fullDayResult = await api('/bookings/admin/full-day-price');
        setFullDayPrice(String(fullDayResult.settings.full_day_price));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadPrices();
  }, []);

  async function saveHourlyPrice(studio) {
    const price = Number(hourlyPrices[studio.id]);

    if (!Number.isFinite(price) || price < 0) {
      setError('Please enter a valid hourly price.');
      return;
    }

    try {
      setSaving(studio.id);
      setError('');
      setMessage('');

      await api(`/bookings/studios/${studio.id}/hourly-price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_per_hour: price })
      });

      setMessage(`Hourly price for "${studio.title}" updated successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving('');
    }
  }

  async function saveFullDayPrice() {
    const price = Number(fullDayPrice);

    if (!Number.isFinite(price) || price < 0) {
      setError('Please enter a valid full-day price.');
      return;
    }

    try {
      setSaving('full-day');
      setError('');
      setMessage('');

      await api('/bookings/admin/full-day-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_day_price: price })
      });

      setMessage('Shared full-day price updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving('');
    }
  }

  return (
    <main className="wrap booking-page">
      <div className="booking-page-heading">
        <div>
          <div className="eyebrow">POSTLIGHT</div>
          <h1>Pricing Management</h1>
          <p>Manage hourly and full-day studio prices.</p>
        </div>

        <button className="button button-outline" onClick={loadPrices}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <p className="booking-error">{error}</p>}
      {message && <p className="booking-message">{message}</p>}

      {loading ? (
        <p>Loading prices...</p>
      ) : (
        <>
          {isAdmin && (
            <section className="booking-card">
              <h2>Shared Full-Day Price</h2>
              <p>This price applies to all studios.</p>

              <div className="pricing-input-row">
                <label htmlFor="full-day-price">Full-day price (RM)</label>
                <input
                  id="full-day-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fullDayPrice}
                  onChange={event => setFullDayPrice(event.target.value)}
                />

                <button
                  className="button"
                  disabled={saving === 'full-day'}
                  onClick={saveFullDayPrice}
                >
                  <Save size={16} />
                  {saving === 'full-day' ? 'Saving...' : 'Save Full-Day Price'}
                </button>
              </div>
            </section>
          )}

          <h2>Studio Hourly Prices</h2>

          {studios.length === 0 ? (
            <p>No studios found.</p>
          ) : (
            <div className="booking-list">
              {studios.map(studio => (
                <article className="booking-card" key={studio.id}>
                  <h2>{studio.title}</h2>

                  <div className="pricing-input-row">
                    <label htmlFor={`hourly-${studio.id}`}>
                      Hourly price (RM)
                    </label>

                    <input
                      id={`hourly-${studio.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={hourlyPrices[studio.id] ?? ''}
                      onChange={event =>
                        setHourlyPrices(previous => ({
                          ...previous,
                          [studio.id]: event.target.value
                        }))
                      }
                    />

                    <button
                      className="button"
                      disabled={saving === studio.id}
                      onClick={() => saveHourlyPrice(studio)}
                    >
                      <Save size={16} />
                      {saving === studio.id ? 'Saving...' : 'Save Hourly Price'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <button className="button button-outline booking-back" onClick={onBack}>
        Back to Explore
      </button>
    </main>
  );
}
