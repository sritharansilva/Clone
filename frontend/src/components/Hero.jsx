
import React from 'react';

export default function Hero({ onCreate }) {
  return (
    <section className="hero">
      <div className="wrap hero-inner">

        <div className="hero-copy">
          <span className="hero-eyebrow">
            
          </span>

          <h1>
            One stop studio.
            <br />
            <em>Everything you need to create.</em>
          </h1>

          <p className="hero-description">
            Ideally located studios with thoughtfully curated amenities for your next creative project.
          </p>

          <p className="hero-description">
            Call 60123456789 for more information.
          </p>
        </div>

        <div className="hero-qr-card">
          <div className="hero-qr-label">STUDIO S</div>

          <div className="hero-qr-frame">
            <svg
              viewBox="0 0 21 21"
              className="hero-qr-pattern"
              aria-hidden="true"
            >
              <rect width="21" height="21" fill="white" />

              <path
                fill="#2a2823"
                d="
                  M0 0h7v7H0z M14 0h7v7h-7z M0 14h7v7H0z
                  M2 2h3v3H2z M16 2h3v3h-3z M2 16h3v3H2z
                  M8 0h1v2H8z M10 1h2v1h-2z
                  M8 4h2v2H8z M11 3h1v3h-1z
                  M8 8h2v2H8z M11 8h1v1h-1z
                  M14 8h2v2h-2z M17 8h1v2h-1z
                  M19 9h2v1h-2z M8 11h1v2H8z
                  M10 11h2v1h-2z M13 11h2v2h-2z
                  M17 11h2v1h-2z M20 12h1v2h-1z
                  M8 14h2v2H8z M11 14h1v1h-1z
                  M13 15h2v2h-2z M16 14h1v2h-1z
                  M19 15h2v2h-2z M8 18h1v2H8z
                  M10 17h2v2h-2z M13 19h2v2h-2z
                  M16 18h2v1h-2z M19 19h2v2h-2z
                "
              />
            </svg>
          </div>

          <div className="hero-qr-title">SCAN TO EXPLORE</div>
          <p>Discover our creative spaces</p>
          <div className="hero-qr-caption">A SPACE FOR EVERY IDEA</div>
        </div>

      </div>
    </section>
  );
}
