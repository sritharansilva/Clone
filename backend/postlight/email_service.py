
import html
import resend

from postlight.config import settings


def send_booking_confirmation_email(
    recipient_email: str,
    customer_name: str,
    studio_title: str,
    booking_type: str,
    start_at,
    end_at,
    total_price,
    lookup_reference: str,
):
    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is not configured.")

    resend.api_key = settings.resend_api_key

    booking_type_text = (
        "Full day" if booking_type == "full_day" else "Hourly"
    )

    customer_name = html.escape(customer_name)
    studio_title = html.escape(studio_title)

    params = {
        "from": settings.resend_from_email,
        "to": [recipient_email],
        "subject": "Your Postlight booking request",
        "html": f"""
        <div style="font-family: Arial, sans-serif; max-width: 520px;">
            <h2>Thank you for booking with Postlight!</h2>
            <p>Hi {customer_name},</p>
            <p>Your booking request has been received.</p>
            <p><strong>Studio:</strong> {studio_title}</p>
            <p><strong>Booking type:</strong> {booking_type_text}</p>
            <p><strong>Start:</strong> {start_at}</p>
            <p><strong>End:</strong> {end_at}</p>
            <p><strong>Total price:</strong> RM {total_price}</p>
            <p><strong>Booking status:</strong> Pending owner approval</p>
            <hr>
            <h3>Your private booking reference</h3>
            <div style="background: #f4f4f4; padding: 16px; word-break: break-all; font-weight: bold;">
                {html.escape(lookup_reference)}
            </div>
            <p>Please keep this reference safe. You will need it
            to check your booking status on the Postlight website.</p>
            <p>Thank you,<br>Postlight</p>
        </div>
        """,
    }

    return resend.Emails.send(params)


def send_booking_decision_email(
    recipient_email: str,
    customer_name: str,
    studio_title: str,
    booking_type: str,
    start_at,
    end_at,
    total_price,
    decision: str,
    rejection_reason: str | None = None,
):
    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is not configured.")

    if decision not in ("approved", "rejected"):
        raise ValueError("Invalid booking decision.")

    resend.api_key = settings.resend_api_key

    customer_name = html.escape(customer_name)
    studio_title = html.escape(studio_title)

    booking_type_text = (
        "Full day" if booking_type == "full_day" else "Hourly"
    )

    if decision == "approved":
        subject = "Your Postlight booking has been approved!"
        heading = "Your booking is approved!"
        message = "Good news! Your booking has been approved by the studio owner."
        rejection_reason_html = ""

    else:
        subject = "Update on your Postlight booking"
        heading = "Booking request not approved"
        message = (
            "Unfortunately, your booking request was not approved "
            "by the studio owner."
        )

        safe_reason = html.escape(
            rejection_reason or "No reason was provided."
        )

        rejection_reason_html = f"""
            <div style="background: #fff4f4; padding: 16px;
                        border-left: 4px solid #d9534f;
                        margin: 16px 0;">
                <p><strong>Reason for rejection:</strong></p>
                <p>{safe_reason}</p>
            </div>
        """

    params = {
        "from": settings.resend_from_email,
        "to": [recipient_email],
        "subject": subject,
        "html": f"""
        <div style="font-family: Arial, sans-serif; max-width: 520px;">
            <h2>{heading}</h2>
            <p>Hi {customer_name},</p>
            <p>{message}</p>

            {rejection_reason_html}

            <hr>

            <p><strong>Studio:</strong> {studio_title}</p>
            <p><strong>Booking type:</strong> {booking_type_text}</p>
            <p><strong>Start:</strong> {start_at}</p>
            <p><strong>End:</strong> {end_at}</p>
            <p><strong>Total price:</strong> RM {total_price}</p>
            <p><strong>Booking status:</strong> {decision.capitalize()}</p>

            <p>Thank you,<br>Postlight</p>
        </div>
        """,
    }

    return resend.Emails.send(params)