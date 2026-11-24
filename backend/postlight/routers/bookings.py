from datetime import date, datetime, time, timedelta
from decimal import Decimal
import hashlib
import secrets
from typing import Annotated, Literal
from uuid import UUID
from zoneinfo import ZoneInfo

import psycopg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from psycopg.rows import dict_row

from postlight.database import connection
from postlight.dependencies import current_user
from postlight.email_service import (
    send_booking_confirmation_email,
    send_booking_decision_email,
)



router = APIRouter(prefix="/bookings", tags=["Bookings"])

MALAYSIA_TZ = ZoneInfo("Asia/Kuala_Lumpur")

POSTLIGHT_ADMIN_IDS = {
    UUID("c64f584e-9c61-43e4-91f3-518bd1f09b1d"),
}



class BookingCreate(BaseModel):
    post_id: UUID
    booking_type: Literal["hourly", "full_day"]
    booking_date: date
    customer_name: str = Field(min_length=2, max_length=120)
    customer_phone: str = Field(min_length=8, max_length=30)
    customer_email: str = Field(min_length=5, max_length=254)
    start_time: time | None = None
    duration_hours: int | None = Field(default=None, ge=1, le=13)



@router.post("", status_code=201)
def create_booking(
    booking: BookingCreate,
):

    opening_time = time(9, 0)
    closing_time = time(22, 0)

    # Calculate booking period using Malaysia local time.
    if booking.booking_type == "hourly":

        if booking.start_time is None or booking.duration_hours is None:
            raise HTTPException(
                422,
                "Hourly bookings require a start time and duration."
            )

        if booking.start_time < opening_time or booking.start_time >= closing_time:
            raise HTTPException(
                422,
                "Bookings must start between 09:00 and 22:00."
            )

        start_at = datetime.combine(
            booking.booking_date,
            booking.start_time,
            tzinfo=MALAYSIA_TZ,
        )

        end_at = start_at.replace(
            hour=start_at.hour,
            minute=start_at.minute,
            second=start_at.second,
            microsecond=0,
        )

        end_at += timedelta(hours=booking.duration_hours)

        if end_at.time() > closing_time:
            raise HTTPException(
                422,
                "Booking must finish by 22:00."
            )

    else:
        start_at = datetime.combine(
            booking.booking_date,
            opening_time,
            tzinfo=MALAYSIA_TZ,
        )

        end_at = datetime.combine(
            booking.booking_date,
            closing_time,
            tzinfo=MALAYSIA_TZ,
        )
    # Generate a private customer lookup reference.
    lookup_reference = secrets.token_urlsafe(32)
    lookup_token_hash = hashlib.sha256(
        lookup_reference.encode("utf-8")
    ).hexdigest()
    
    now = datetime.now(MALAYSIA_TZ)

    if start_at <= now:
        raise HTTPException(
            422,
            "You cannot book a time that has already passed."
        )

    try:
        with connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:

                # Get the studio's current hourly price.
                cur.execute(
                    """
                    SELECT id, author_id, price_per_hour, title
                    FROM public.posts
                    WHERE id = %s
                    """,
                    (booking.post_id,),
                )

                studio = cur.fetchone()

                if studio is None:
                    raise HTTPException(404, "Studio not found.")

                # Only Podcast Hangout supports full-day booking.
                

                # DEMO ONLY: Temporarily allow owners to book their own studios.
                # Restore the ownership restriction after the demonstration.
                

                if booking.booking_type == "hourly":

                    if studio["price_per_hour"] is None:
                        raise HTTPException(
                            400,
                            "This studio does not have an hourly price."
                        )

                    hourly_rate = Decimal(str(studio["price_per_hour"]))
                    total_price = hourly_rate * booking.duration_hours
                    daily_rate = None

                else:

                    cur.execute(
                        """
                        SELECT full_day_price
                        FROM public.booking_settings
                        WHERE id = 1
                        """
                    )

                    settings_row = cur.fetchone()

                    if settings_row is None:
                        raise HTTPException(
                            500,
                            "Full-day booking price is not configured."
                        )

                    daily_rate = Decimal(
                        str(settings_row["full_day_price"])
                    )

                    total_price = daily_rate
                    hourly_rate = None

                
                
                # Save the guest booking as pending for owner approval.
                cur.execute(
                    """
                    INSERT INTO public.bookings (
                        post_id,
                        customer_id,
                        customer_name,
                        customer_phone,
                        customer_email,
                        booking_type,
                        start_at,
                        end_at,
                        hourly_rate,
                        daily_rate,
                        total_price,
                        lookup_token_hash
                    )
                    VALUES (%s, NULL, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        booking.post_id,
                        booking.customer_name,
                        booking.customer_phone,
                        booking.customer_email,
                        booking.booking_type,
                        start_at,
                        end_at,
                        hourly_rate,
                        daily_rate,
                        total_price,
                        lookup_token_hash,
                    ),
                )

                new_booking = cur.fetchone()

                # Do not send the stored hash to the customer.
                result = dict(new_booking)
                result.pop("lookup_token_hash", None)

                # Show the original private reference only once.
                result["lookup_reference"] = lookup_reference

                # Send booking confirmation email to the customer.
                try:
                    send_booking_confirmation_email(
                        recipient_email=booking.customer_email,
                        customer_name=booking.customer_name,
                        studio_title=studio["title"],
                        booking_type=booking.booking_type,
                        start_at=start_at,
                        end_at=end_at,
                        total_price=total_price,
                        lookup_reference=lookup_reference,
                    )
                except Exception as exc:
                    print("BOOKING CONFIRMATION EMAIL ERROR:", repr(exc))

                return result


    except psycopg.errors.ExclusionViolation:
        raise HTTPException(
            409,
            "This studio already has a booking request or confirmed booking during that time."
        ) from None


@router.get("/availability/{post_id}")
def get_booking_availability(
    post_id: UUID,
    start_date: date,
    end_date: date,
):
    """Return unavailable booking periods for a studio."""

    if end_date < start_date:
        raise HTTPException(
            400,
            "End date must be on or after start date."
        )

    if (end_date - start_date).days > 90:
        raise HTTPException(
            400,
            "Please request availability for a maximum of 90 days."
        )

    range_start = datetime.combine(
        start_date,
        time(0, 0),
        tzinfo=MALAYSIA_TZ,
    )

    range_end = datetime.combine(
        end_date + timedelta(days=1),
        time(0, 0),
        tzinfo=MALAYSIA_TZ,
    )

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            cur.execute(
                """
                SELECT id
                FROM public.posts
                WHERE id = %s
                """,
                (post_id,),
            )

            if cur.fetchone() is None:
                raise HTTPException(404, "Studio not found.")

            cur.execute(
                """
                SELECT
                    id,
                    booking_type,
                    start_at,
                    end_at,
                    status
                FROM public.bookings
                WHERE post_id = %s
                  AND status IN ('pending', 'approved')
                  AND start_at < %s
                  AND end_at > %s
                ORDER BY start_at
                """,
                (
                    post_id,
                    range_end,
                    range_start,
                ),
            )

            bookings = cur.fetchall()

            return {
                "post_id": str(post_id),
                "start_date": start_date,
                "end_date": end_date,
                "bookings": bookings,
            }



class BookingLookup(BaseModel):
    lookup_reference: str = Field(min_length=20, max_length=100)


@router.post("/lookup")
def lookup_booking(lookup: BookingLookup):

    lookup_token_hash = hashlib.sha256(
        lookup.lookup_reference.encode("utf-8")
    ).hexdigest()

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            cur.execute(
                """
                SELECT
                    b.status,
                    b.booking_type,
                    b.start_at,
                    b.end_at,
                    b.total_price,
                    p.title AS studio_title,
                    p.location AS studio_location
                FROM public.bookings b
                JOIN public.posts p ON p.id = b.post_id
                WHERE b.lookup_token_hash = %s
                """,
                (lookup_token_hash,),
            )

            booking = cur.fetchone()

            if booking is None:
                raise HTTPException(
                    404,
                    "Booking not found. Please check your reference."
                )

            return booking


class BookingDecision(BaseModel):
    decision: Literal["approved", "rejected"]

class HourlyPriceUpdate(BaseModel):
    price_per_hour: Decimal = Field(
        ge=0,
        max_digits=10,
        decimal_places=2
    )


class FullDayPriceUpdate(BaseModel):
    full_day_price: Decimal = Field(
        ge=0,
        max_digits=10,
        decimal_places=2
    )    



@router.put("/studios/{post_id}/hourly-price")
def update_hourly_price(
    post_id: UUID,
    price: HourlyPriceUpdate,
    user_id: Annotated[UUID, Depends(current_user)],
):
    """Allow a studio owner to update their own hourly price."""

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            cur.execute(
                """
                UPDATE public.posts
                SET price_per_hour = %s
                WHERE id = %s
                  AND author_id = %s
                RETURNING id, title, price_per_hour
                """,
                (
                    price.price_per_hour,
                    post_id,
                    user_id,
                ),
            )

            studio = cur.fetchone()

            if studio is None:
                raise HTTPException(
                    404,
                    "Studio not found or you do not own this studio.",
                )

            return {
                "message": "Hourly price updated successfully.",
                "studio": studio,
            }


@router.get("/admin/full-day-price")
def get_full_day_price(
    user_id: Annotated[UUID, Depends(current_user)],
):
    """Allow only the Postlight administrator to view the shared full-day price."""

    if user_id not in POSTLIGHT_ADMIN_IDS:
        raise HTTPException(
            403,
            "Only the Postlight administrator can view the full-day price.",
        )

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT id, full_day_price
                FROM public.booking_settings
                WHERE id = 1
                """
            )

            settings_row = cur.fetchone()

            if settings_row is None:
                raise HTTPException(
                    500,
                    "Booking settings record not found.",
                )

            return {
                "settings": settings_row,
            }


@router.put("/admin/full-day-price")
def update_full_day_price(
    price: FullDayPriceUpdate,
    user_id: Annotated[UUID, Depends(current_user)],
):
    """Allow only the Postlight administrator to update the shared full-day price."""

    if user_id not in POSTLIGHT_ADMIN_IDS:
        raise HTTPException(
            403,
            "Only the Postlight administrator can change the full-day price.",
        )

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                UPDATE public.booking_settings
                SET full_day_price = %s
                WHERE id = 1
                RETURNING id, full_day_price
                """,
                (price.full_day_price,),
            )

            settings_row = cur.fetchone()

            if settings_row is None:
                raise HTTPException(
                    500,
                    "Booking settings record not found.",
                )

            return {
                "message": "Full-day price updated successfully.",
                "settings": settings_row,
            }



@router.get("/mine")
def get_my_bookings(
    user_id: Annotated[UUID, Depends(current_user)],
):
    """Show bookings submitted by the signed-in customer."""

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    b.*,
                    p.title AS studio_title,
                    p.location AS studio_location
                FROM public.bookings b
                JOIN public.posts p ON p.id = b.post_id
                WHERE b.customer_id = %s
                ORDER BY b.created_at DESC
                """,
                (user_id,),
            )

            return cur.fetchall()


@router.get("/owner")
def get_owner_bookings(
    user_id: Annotated[UUID, Depends(current_user)],
):
    """Show booking requests for studios owned by the signed-in user."""

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                    b.*,
                    p.title AS studio_title,
                    p.location AS studio_location
                FROM public.bookings b
                JOIN public.posts p ON p.id = b.post_id
                WHERE p.author_id = %s
                ORDER BY b.created_at DESC
                """,
                (user_id,),
            )

            return cur.fetchall()



@router.post("/{booking_id}/decision")
def decide_booking(
    booking_id: UUID,
    decision: BookingDecision,
    user_id: Annotated[UUID, Depends(current_user)],
):
    """Allow a studio owner to approve or reject a pending request."""

    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            cur.execute(
                """
                SELECT
                    b.id,
                    b.status,
                    b.customer_name,
                    b.customer_email,
                    b.booking_type,
                    b.start_at,
                    b.end_at,
                    b.total_price,
                    p.title AS studio_title,
                    p.author_id
                FROM public.bookings b
                JOIN public.posts p ON p.id = b.post_id
                WHERE b.id = %s
                FOR UPDATE OF b
                """,
                (booking_id,),
            )

            booking = cur.fetchone()

            if booking is None:
                raise HTTPException(404, "Booking not found.")

            if booking["author_id"] != user_id:
                raise HTTPException(
                    403,
                    "You can only manage bookings for your own studios.",
                )

            if booking["status"] != "pending":
                raise HTTPException(
                    409,
                    "This booking has already been processed.",
                )

            cur.execute(
                """
                UPDATE public.bookings
                SET status = %s,
                    updated_at = NOW()
                WHERE id = %s
                RETURNING *
                """,
                (decision.decision, booking_id),
            )

            updated_booking = cur.fetchone()

    # Send the customer an email after the database update succeeds.
    try:
        send_booking_decision_email(
            recipient_email=booking["customer_email"],
            customer_name=booking["customer_name"],
            studio_title=booking["studio_title"],
            booking_type=booking["booking_type"],
            start_at=booking["start_at"],
            end_at=booking["end_at"],
            total_price=booking["total_price"],
            decision=decision.decision,
        )
    except Exception as exc:
        print("BOOKING DECISION EMAIL ERROR:", repr(exc))

    return updated_booking

@router.delete("/{booking_id}")
def delete_booking(
    booking_id: UUID,
    user=Depends(current_user),
):
    with connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:

            # Confirm the booking exists.
            cur.execute(
                """
                SELECT id
                FROM public.bookings
                WHERE id = %s
                """,
                (booking_id,),
            )

            booking = cur.fetchone()

            if booking is None:
                raise HTTPException(
                    404,
                    "Booking not found.",
                )

            # Delete the booking.
            cur.execute(
                """
                DELETE FROM public.bookings
                WHERE id = %s
                RETURNING id
                """,
                (booking_id,),
            )

            deleted_booking = cur.fetchone()

            return {
                "message": "Booking deleted successfully.",
                "booking_id": str(deleted_booking["id"]),
            }


