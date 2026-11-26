
import React from 'react';

export default function Footer({ onPolicyClick }) {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">

        <span className="brand footer-brand">
  <span className="brand-word">Studio</span><span className="brand-s">S</span>
</span>

        <p className="footer-tagline">
  A Versatile Space for Every Occasion.
</p>
        <button
          className="footer-policy-link"
          onClick={onPolicyClick}
        >
          Cancellation & Booking Policy
        </button>

      </div>
    </footer>
  );
}
