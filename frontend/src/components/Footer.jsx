
import React from 'react';

export default function Footer({ onPolicyClick }) {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">

        <span className="brand footer-brand">
          Studio S<span className="brand-dot"></span>
        </span>

        <span>Ample space for various occassion.</span>

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
