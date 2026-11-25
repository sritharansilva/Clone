
import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function CancellationPolicy({ onBack }) {
  return (
    <div className="wrap policy-page">
      <button className="btn btn-secondary" onClick={onBack}>
        <ArrowLeft size={18} /> Back
      </button>

      <h1>Cancellation & Booking Policy</h1>

      <p>
        Please read our cancellation and booking policy carefully
        before submitting your booking request.
      </p>

      <section>
        <h2>1. Booking Requests</h2>
        <p>
          All bookings on Postlight are subject to studio owner approval.
          A booking request is not confirmed until it has been approved
          by the studio owner.
        </p>
      </section>

      <section>
        <h2>2. Customer Cancellation</h2>
        <p>
          If you wish to cancel your booking, please contact the studio
          owner as soon as possible. Please provide your booking details
          so that the owner can assist you with your cancellation request.
        </p>
        <p>
          Customer self-service cancellation is not currently available
          on Postlight.
        </p>
      </section>

      <section>
        <h2>3. Cancellation Notice</h2>
        <p>
          We encourage customers to notify the studio owner at least
          48 hours before the scheduled booking to allow the studio
          to make the time slot available to other customers.
        </p>
      </section>

      <section>
        <h2>4. Studio Owner Cancellation</h2>
        <p>
          If the studio owner needs to cancel your booking, the owner
          will notify you as soon as possible and assist you with any
          necessary arrangements.
        </p>
      </section>

      <section>
        <h2>5. Future Payment & Refund Terms</h2>
        <p>
          Postlight is currently not processing online payments.
          The following refund terms are proposed for when online
          payments become available:
        </p>

        <ul>
          <li>48 hours or more before booking: Full refund (100%).</li>
          <li>
            24 to less than 48 hours before booking: 50% refund.
          </li>
          <li>
            Less than 24 hours before booking: Generally no refund,
            subject to applicable laws and exceptional circumstances.
          </li>
          <li>
            Studio owner cancels or rejects a paid booking:
            Full refund (100%).
          </li>
          <li>
            No-show: Generally no refund, subject to applicable laws.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Rescheduling</h2>
        <p>
          Customers may contact the studio owner to request a
          rescheduling. All rescheduling requests are subject to
          studio availability and owner approval.
        </p>
      </section>

      <section>
        <h2>7. Exceptional Circumstances</h2>
        <p>
          Unexpected emergencies or circumstances may be reviewed
          on a case-by-case basis by the studio owner.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          For cancellation, rescheduling or booking-related enquiries,
          please contact the studio owner directly using the contact
          details provided for the studio.
        </p>
      </section>

      <p className="policy-note">
        This policy may be updated as Postlight introduces additional
        booking and payment features. Applicable consumer laws prevail
        where relevant.
      </p>
    </div>
  );
}
