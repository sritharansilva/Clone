from decimal import Decimal, InvalidOperation

from fastapi import HTTPException

from postlight.services.storage import image_url


def serialize_post(row: dict) -> dict:
    price = row.get("price_per_hour")
    return {
        "id": str(row["id"]),
        "author_id": str(row["author_id"]),
        "title": row["title"],
        "body": row["body"],
        "image_url": image_url(row["image_path"]),
        "location": row.get("location"),
        "studio_type": row.get("studio_type"),
        "price_per_hour": float(price) if price is not None else None,
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }


def validate_text(title: str, body: str) -> tuple[str, str]:
    title, body = title.strip(), body.strip()
    if not 1 <= len(title) <= 160 or not 1 <= len(body) <= 20000:
        raise HTTPException(422, "Title must be 1-160 characters and body 1-20,000 characters")
    return title, body


def validate_listing(
    location: str, studio_type: str, price: str
) -> tuple[str | None, str | None, Decimal | None]:
    """Clean the optional listing fields. Empty values become None (NULL in the database)."""
    location = (location or "").strip() or None
    studio_type = (studio_type or "").strip() or None
    if (location and len(location) > 100) or (studio_type and len(studio_type) > 100):
        raise HTTPException(422, "Location and studio type must be 100 characters or fewer")

    price = (price or "").strip()
    if not price:
        return location, studio_type, None
    try:
        amount = Decimal(price)
    except InvalidOperation as exc:
        raise HTTPException(422, "Price must be a number") from exc
    if not amount.is_finite() or not 0 <= amount <= 1_000_000:
        raise HTTPException(422, "Price must be between 0 and 1,000,000")
    return location, studio_type, amount
