"""Payment / Lemon Squeezy business logic.

Ownership rule: the local `subscriptions` table (and `users.lemonsqueezy_customer_id`)
is the sole source of truth for which Lemon Squeezy resources a user may access.
Never trust a client-supplied Lemon Squeezy ID alone — the store-wide API key
would happily return any store resource.
"""

from __future__ import annotations

import hashlib
import hmac
import time
from datetime import timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..db.subscription_orm import SubscriptionORM
from ..db.user_orm import UserORM
from ..domain.payment.enums import (
    ACTIVE_PAID_STATUSES,
    PlanVariant,
    SubscriptionStatus,
    get_plan_for_variant_id,
    get_plan_variant_for_variant_id,
    get_variant_id,
    plan_variant_to_subscription_plan,
)
from ..domain.portfolio.enums import SubscriptionPlan
from ..utils import _get_env_var, get_current_time
from ..utils.datetime_utils import parse_utc_iso, to_utc_iso_string, utc_now
from .lemonsqueezy_client import LemonSqueezyClient, LemonSqueezyError, lemonsqueezy_client

# Minimal in-process per-user cooldown (seconds) for mutating checkout/customer creation.
_COOLDOWN_SECONDS = 3.0
_last_action_at: dict[tuple[int, str], float] = {}
CHECKOUT_EXPIRE_HOURS = 1

WEBHOOK_SUBSCRIPTION_EVENTS = frozenset(
    {
        "subscription_created",
        "subscription_updated",
        "subscription_cancelled",
        "subscription_resumed",
        "subscription_expired",
        "subscription_paused",
        "subscription_unpaused",
        "subscription_payment_failed",
    }
)


def _enforce_cooldown(user_id: int, action: str) -> None:
    key = (user_id, action)
    now = time.monotonic()
    last = _last_action_at.get(key)
    if last is not None and (now - last) < _COOLDOWN_SECONDS:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a moment and try again.",
        )
    _last_action_at[key] = now


def _get_user_or_404(db: Session, user_id: int, *, for_update: bool = False) -> UserORM:
    query = db.query(UserORM).filter(UserORM.id == user_id)
    if for_update:
        query = query.with_for_update()
    user = query.first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _store_id() -> int:
    return int(_get_env_var("LEMON_SQUEEZY_STORE_ID"))


def _frontend_url() -> str:
    return _get_env_var("FRONTEND_URL").rstrip("/")


def verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    """Verify Lemon Squeezy X-Signature (HMAC-SHA256 hex digest)."""
    if not signature:
        return False
    secret = _get_env_var("LEMON_SQUEEZY_WEBHOOK_SECRET").encode("utf-8")
    digest = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)


def _subscription_attrs_from_ls(data: dict) -> dict[str, Any]:
    """Extract local column values from a Lemon Squeezy subscription resource."""
    attributes = data.get("attributes") or {}
    return {
        "lemonsqueezy_subscription_id": str(data.get("id")),
        "lemonsqueezy_customer_id": (
            str(attributes["customer_id"])
            if attributes.get("customer_id") is not None
            else None
        ),
        "product_id": (
            str(attributes["product_id"])
            if attributes.get("product_id") is not None
            else None
        ),
        "variant_id": (
            str(attributes["variant_id"])
            if attributes.get("variant_id") is not None
            else None
        ),
        "status": attributes.get("status") or SubscriptionStatus.active.value,
        "renews_at": attributes.get("renews_at"),
        "ends_at": attributes.get("ends_at"),
        "trial_ends_at": attributes.get("trial_ends_at"),
        "card_brand": attributes.get("card_brand") or None,
        "card_last_four": attributes.get("card_last_four") or None,
    }


def _apply_attrs_to_row(row: SubscriptionORM, attrs: dict[str, Any]) -> None:
    for key, value in attrs.items():
        setattr(row, key, value)
    row.updated_at = get_current_time()


def _upsert_subscription_row(
    db: Session,
    *,
    user_id: int,
    ls_data: dict,
) -> SubscriptionORM:
    attrs = _subscription_attrs_from_ls(ls_data)
    ls_id = attrs["lemonsqueezy_subscription_id"]
    row = (
        db.query(SubscriptionORM)
        .filter(SubscriptionORM.lemonsqueezy_subscription_id == ls_id)
        .first()
    )
    if row is None:
        row = SubscriptionORM(
            user_id=user_id,
            created_at=get_current_time(),
            **attrs,
        )
        db.add(row)
    else:
        # Do not allow reassignment across users
        if row.user_id != user_id:
            raise HTTPException(
                status_code=409,
                detail="Subscription is already linked to another account",
            )
        _apply_attrs_to_row(row, attrs)
    return row


def _status_grants_paid_access(status: str, ends_at: str | None) -> bool:
    if status in (
        SubscriptionStatus.expired.value,
        SubscriptionStatus.unpaid.value,
    ):
        return False
    if status == SubscriptionStatus.cancelled.value:
        # Grace period: still paid only until ends_at. Missing/unparseable ends_at → no access.
        if not ends_at:
            return False
        try:
            return utc_now() < parse_utc_iso(ends_at)
        except (TypeError, ValueError):
            return False
    return status in ACTIVE_PAID_STATUSES


def _is_cancelled_in_grace(row: SubscriptionORM) -> bool:
    return (
        row.status == SubscriptionStatus.cancelled.value
        and _status_grants_paid_access(row.status, row.ends_at)
    )


def find_paid_access_subscriptions(db: Session, user_id: int) -> list[SubscriptionORM]:
    rows = list_owned_subscriptions(db, user_id)
    return [row for row in rows if _status_grants_paid_access(row.status, row.ends_at)]


def get_current_subscription(db: Session, user_id: int) -> SubscriptionORM | None:
    """Return the paid-access subscription, preferring the newest if duplicates exist."""
    paid = find_paid_access_subscriptions(db, user_id)
    if not paid:
        return None
    return paid[0]


def get_current_subscription_or_404(db: Session, user_id: int) -> SubscriptionORM:
    row = get_current_subscription(db, user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return row


def _active_subscription_exists_detail(row: SubscriptionORM) -> dict[str, str]:
    return {
        "code": "active_subscription_exists",
        "lemonsqueezy_subscription_id": row.lemonsqueezy_subscription_id,
        "status": row.status,
    }


def _cancel_sibling_locally(row: SubscriptionORM, ls_data: dict) -> None:
    attrs = _subscription_attrs_from_ls(ls_data)
    _apply_attrs_to_row(row, attrs)
    if row.status != SubscriptionStatus.cancelled.value:
        row.status = SubscriptionStatus.cancelled.value
        row.updated_at = get_current_time()


def reconcile_single_paid_access(
    db: Session,
    user_id: int,
    keep_ls_id: str,
    *,
    client: LemonSqueezyClient | None = None,
) -> None:
    """Keep keep_ls_id; cancel other paid-access subscriptions via LS and locally."""
    ls = client or lemonsqueezy_client
    keep_ls_id = str(keep_ls_id)
    for row in find_paid_access_subscriptions(db, user_id):
        if row.lemonsqueezy_subscription_id == keep_ls_id:
            continue
        try:
            response = ls.delete(f"/subscriptions/{row.lemonsqueezy_subscription_id}")
        except LemonSqueezyError:
            continue
        ls_data = response.get("data") or None
        if not ls_data:
            continue
        _cancel_sibling_locally(row, ls_data)


def recompute_user_plan(db: Session, user: UserORM) -> None:
    """Set users.plan from the highest active owned subscription."""
    rows = (
        db.query(SubscriptionORM)
        .filter(SubscriptionORM.user_id == user.id)
        .all()
    )
    best: SubscriptionPlan = SubscriptionPlan.free
    for row in rows:
        if not _status_grants_paid_access(row.status, row.ends_at):
            continue
        mapped = get_plan_for_variant_id(row.variant_id)
        if mapped is None:
            continue
        if mapped == SubscriptionPlan.max:
            best = SubscriptionPlan.max
            break
        if mapped == SubscriptionPlan.pro and best == SubscriptionPlan.free:
            best = SubscriptionPlan.pro
    user.plan = best.value


def get_or_create_customer(
    db: Session,
    user_id: int,
    *,
    client: LemonSqueezyClient | None = None,
    enforce_rate_limit: bool = True,
    commit: bool = True,
) -> str:
    """Ensure the user has a Lemon Squeezy customer and return its ID."""
    if enforce_rate_limit:
        _enforce_cooldown(user_id, "create_customer")

    user = _get_user_or_404(db, user_id)
    if user.lemonsqueezy_customer_id:
        return user.lemonsqueezy_customer_id

    ls = client or lemonsqueezy_client
    payload = {
        "data": {
            "type": "customers",
            "attributes": {
                "name": user.username,
                "email": user.email,
            },
            "relationships": {
                "store": {
                    "data": {
                        "type": "stores",
                        "id": str(_store_id()),
                    }
                }
            },
        }
    }
    try:
        response = ls.post("/customers", json=payload)
    except LemonSqueezyError as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to create Lemon Squeezy customer",
        ) from exc

    data = response.get("data") or {}
    customer_id = str(data.get("id"))
    if not customer_id or customer_id == "None":
        raise HTTPException(
            status_code=502,
            detail="Lemon Squeezy customer response missing id",
        )

    user.lemonsqueezy_customer_id = customer_id
    if commit:
        db.commit()
        db.refresh(user)
    return customer_id


def _clear_pending_checkout(user: UserORM) -> None:
    user.pending_checkout_id = None
    user.pending_checkout_url = None
    user.pending_checkout_variant = None
    user.pending_checkout_expires_at = None


def _pending_checkout_is_active(user: UserORM) -> bool:
    if not user.pending_checkout_url or not user.pending_checkout_expires_at:
        return False
    try:
        return utc_now() < parse_utc_iso(user.pending_checkout_expires_at)
    except (TypeError, ValueError):
        return False


def _reuse_or_reject_pending_checkout(user: UserORM, plan_variant: PlanVariant) -> str | None:
    """Return existing URL, raise 409, or None if caller should create a new checkout."""
    if not _pending_checkout_is_active(user):
        _clear_pending_checkout(user)
        return None
    if user.pending_checkout_variant == plan_variant.value:
        return user.pending_checkout_url
    raise HTTPException(
        status_code=409,
        detail={
            "code": "checkout_already_pending",
            "pending_checkout_id": user.pending_checkout_id,
            "plan_variant": user.pending_checkout_variant,
        },
    )


def create_checkout(
    db: Session,
    user_id: int,
    plan_variant: PlanVariant,
    *,
    client: LemonSqueezyClient | None = None,
) -> str:
    """Create a Lemon Squeezy checkout; returns the hosted checkout URL."""
    user = _get_user_or_404(db, user_id, for_update=True)
    current = get_current_subscription(db, user_id)
    if current is not None:
        raise HTTPException(
            status_code=409,
            detail=_active_subscription_exists_detail(current),
        )

    reused = _reuse_or_reject_pending_checkout(user, plan_variant)
    if reused is not None:
        return reused

    _enforce_cooldown(user_id, "checkout")
    customer_id = get_or_create_customer(
        db, user_id, client=client, enforce_rate_limit=False, commit=False
    )
    # Re-lock after possible nested queries; re-check invariant before minting LS checkout.
    user = _get_user_or_404(db, user_id, for_update=True)
    current = get_current_subscription(db, user_id)
    if current is not None:
        raise HTTPException(
            status_code=409,
            detail=_active_subscription_exists_detail(current),
        )
    reused = _reuse_or_reject_pending_checkout(user, plan_variant)
    if reused is not None:
        return reused

    variant_id = get_variant_id(plan_variant)
    ls = client or lemonsqueezy_client
    expires_at = to_utc_iso_string(utc_now() + timedelta(hours=CHECKOUT_EXPIRE_HOURS))

    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "expires_at": expires_at,
                "checkout_data": {
                    "email": user.email,
                    "name": user.username,
                    "custom": {
                        "internal_user_id": str(user_id),
                    },
                },
                "product_options": {
                    "redirect_url": f"{_frontend_url()}/billing?checkout=success",
                    "enabled_variants": [int(variant_id)],
                },
            },
            "relationships": {
                "store": {
                    "data": {"type": "stores", "id": str(_store_id())},
                },
                "variant": {
                    "data": {"type": "variants", "id": str(variant_id)},
                },
            },
        }
    }
    _ = customer_id

    try:
        response = ls.post("/checkouts", json=payload)
    except LemonSqueezyError as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to create Lemon Squeezy checkout",
        ) from exc

    data = response.get("data") or {}
    attributes = data.get("attributes") or {}
    checkout_url = attributes.get("url")
    if not checkout_url:
        raise HTTPException(
            status_code=502,
            detail="Lemon Squeezy checkout response missing url",
        )

    user.pending_checkout_id = str(data.get("id")) if data.get("id") is not None else None
    user.pending_checkout_url = checkout_url
    user.pending_checkout_variant = plan_variant.value
    user.pending_checkout_expires_at = attributes.get("expires_at") or expires_at
    db.commit()
    return checkout_url


def list_owned_subscriptions(db: Session, user_id: int) -> list[SubscriptionORM]:
    return (
        db.query(SubscriptionORM)
        .filter(SubscriptionORM.user_id == user_id)
        .order_by(SubscriptionORM.id.desc())
        .all()
    )


def get_owned_subscription_or_404(
    db: Session,
    user_id: int,
    ls_subscription_id: str,
) -> SubscriptionORM:
    row = (
        db.query(SubscriptionORM)
        .filter(
            SubscriptionORM.user_id == user_id,
            SubscriptionORM.lemonsqueezy_subscription_id == str(ls_subscription_id),
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return row


def get_subscription_detail(
    db: Session,
    user_id: int,
    ls_subscription_id: str,
    *,
    client: LemonSqueezyClient | None = None,
) -> tuple[SubscriptionORM, dict]:
    row = get_owned_subscription_or_404(db, user_id, ls_subscription_id)
    ls = client or lemonsqueezy_client
    try:
        response = ls.get(f"/subscriptions/{row.lemonsqueezy_subscription_id}")
    except LemonSqueezyError as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch subscription from Lemon Squeezy",
        ) from exc

    data = response.get("data") or {}
    attrs = _subscription_attrs_from_ls(data)
    _apply_attrs_to_row(row, attrs)
    db.commit()
    db.refresh(row)
    return row, (data.get("attributes") or {})


def update_subscription(
    db: Session,
    user_id: int,
    ls_subscription_id: str,
    *,
    plan_variant: PlanVariant | None = None,
    resume: bool | None = None,
    client: LemonSqueezyClient | None = None,
) -> SubscriptionORM:
    row = get_owned_subscription_or_404(db, user_id, ls_subscription_id)
    if plan_variant is None and resume is None:
        raise HTTPException(
            status_code=400,
            detail="Provide plan_variant and/or resume",
        )

    grants_access = _status_grants_paid_access(row.status, row.ends_at)
    if plan_variant is not None and not grants_access:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "subscription_does_not_grant_access",
                "lemonsqueezy_subscription_id": row.lemonsqueezy_subscription_id,
                "status": row.status,
            },
        )
    if resume is True and not _is_cancelled_in_grace(row):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "resume_not_in_grace",
                "lemonsqueezy_subscription_id": row.lemonsqueezy_subscription_id,
                "status": row.status,
            },
        )

    attributes: dict[str, Any] = {}
    if plan_variant is not None:
        attributes["variant_id"] = int(get_variant_id(plan_variant))
        attributes["product_id"] = None  # LS derives product from variant
        # Remove product_id if None — LS docs allow variant_id alone
        attributes.pop("product_id", None)
    if resume is True:
        attributes["cancelled"] = False

    ls = client or lemonsqueezy_client
    payload = {
        "data": {
            "type": "subscriptions",
            "id": row.lemonsqueezy_subscription_id,
            "attributes": attributes,
        }
    }
    try:
        response = ls.patch(
            f"/subscriptions/{row.lemonsqueezy_subscription_id}",
            json=payload,
        )
    except LemonSqueezyError as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to update subscription on Lemon Squeezy",
        ) from exc

    data = response.get("data") or {}
    attrs = _subscription_attrs_from_ls(data)
    _apply_attrs_to_row(row, attrs)

    user = _get_user_or_404(db, user_id)
    if plan_variant is not None:
        # Optimistically reflect plan change; webhook remains source of truth.
        user.plan = plan_variant_to_subscription_plan(plan_variant).value
    recompute_user_plan(db, user)
    db.commit()
    db.refresh(row)
    return row


def cancel_subscription(
    db: Session,
    user_id: int,
    ls_subscription_id: str,
    *,
    client: LemonSqueezyClient | None = None,
) -> SubscriptionORM:
    row = get_owned_subscription_or_404(db, user_id, ls_subscription_id)
    ls = client or lemonsqueezy_client
    try:
        response = ls.delete(f"/subscriptions/{row.lemonsqueezy_subscription_id}")
    except LemonSqueezyError as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to cancel subscription on Lemon Squeezy",
        ) from exc

    data = response.get("data") or {}
    if data:
        attrs = _subscription_attrs_from_ls(data)
        _apply_attrs_to_row(row, attrs)
    else:
        row.status = SubscriptionStatus.cancelled.value
        row.updated_at = get_current_time()

    # Keep paid access during grace period — recompute_user_plan still treats cancelled as paid.
    user = _get_user_or_404(db, user_id)
    recompute_user_plan(db, user)
    db.commit()
    db.refresh(row)
    return row


def _owned_ls_subscription_ids(db: Session, user_id: int) -> set[str]:
    rows = list_owned_subscriptions(db, user_id)
    return {r.lemonsqueezy_subscription_id for r in rows}


def list_owned_invoices(
    db: Session,
    user_id: int,
    *,
    client: LemonSqueezyClient | None = None,
) -> list[dict]:
    owned_ids = _owned_ls_subscription_ids(db, user_id)
    if not owned_ids:
        return []

    ls = client or lemonsqueezy_client
    invoices: list[dict] = []
    # Filter per subscription to avoid leaking other customers' invoices via store-wide list.
    for sub_id in owned_ids:
        try:
            response = ls.get(
                "/subscription-invoices",
                params={"filter[subscription_id]": sub_id},
            )
        except LemonSqueezyError as exc:
            raise HTTPException(
                status_code=502,
                detail="Failed to fetch subscription invoices from Lemon Squeezy",
            ) from exc
        for item in response.get("data") or []:
            invoices.append(item)
    return invoices


def get_owned_invoice_or_404(
    db: Session,
    user_id: int,
    invoice_id: str,
    *,
    client: LemonSqueezyClient | None = None,
) -> dict:
    owned_ids = _owned_ls_subscription_ids(db, user_id)
    if not owned_ids:
        raise HTTPException(status_code=404, detail="Invoice not found")

    ls = client or lemonsqueezy_client
    try:
        response = ls.get(f"/subscription-invoices/{invoice_id}")
    except LemonSqueezyError as exc:
        if exc.status_code == 404:
            raise HTTPException(status_code=404, detail="Invoice not found") from exc
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch subscription invoice from Lemon Squeezy",
        ) from exc

    data = response.get("data") or {}
    attributes = data.get("attributes") or {}
    sub_id = attributes.get("subscription_id")
    if sub_id is None or str(sub_id) not in owned_ids:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return data


def get_owned_customer_or_404(db: Session, user_id: int, customer_id: str) -> UserORM:
    user = _get_user_or_404(db, user_id)
    if not user.lemonsqueezy_customer_id or user.lemonsqueezy_customer_id != str(
        customer_id
    ):
        raise HTTPException(status_code=404, detail="Customer not found")
    return user


def fetch_customer(
    db: Session,
    user_id: int,
    customer_id: str,
    *,
    client: LemonSqueezyClient | None = None,
) -> dict:
    get_owned_customer_or_404(db, user_id, customer_id)
    ls = client or lemonsqueezy_client
    try:
        response = ls.get(f"/customers/{customer_id}")
    except LemonSqueezyError as exc:
        if exc.status_code == 404:
            raise HTTPException(status_code=404, detail="Customer not found") from exc
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch customer from Lemon Squeezy",
        ) from exc
    return response.get("data") or {}


def update_customer(
    db: Session,
    user_id: int,
    customer_id: str,
    updates: dict[str, Any],
    *,
    client: LemonSqueezyClient | None = None,
) -> dict:
    get_owned_customer_or_404(db, user_id, customer_id)
    attributes = {k: v for k, v in updates.items() if v is not None}
    if not attributes:
        raise HTTPException(status_code=400, detail="No customer fields to update")

    ls = client or lemonsqueezy_client
    payload = {
        "data": {
            "type": "customers",
            "id": str(customer_id),
            "attributes": attributes,
        }
    }
    try:
        response = ls.patch(f"/customers/{customer_id}", json=payload)
    except LemonSqueezyError as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to update customer on Lemon Squeezy",
        ) from exc
    return response.get("data") or {}


def _custom_data_user_id(payload: dict, data: dict) -> int | None:
    """Extract internal_user_id from webhook meta.custom_data or resource attributes."""
    candidates: list[Any] = []
    top_meta = payload.get("meta") or {}
    candidates.append(top_meta.get("custom_data"))
    candidates.append((data.get("meta") or {}).get("custom_data"))
    candidates.append((data.get("attributes") or {}).get("custom_data"))
    for custom in candidates:
        if not isinstance(custom, dict):
            continue
        raw = custom.get("internal_user_id")
        if raw is None:
            continue
        try:
            return int(raw)
        except (TypeError, ValueError):
            continue
    return None


def _resolve_user_id_from_webhook(db: Session, payload: dict, data: dict) -> int | None:
    """Resolve internal user from custom data, customer id, or email."""
    user_id = _custom_data_user_id(payload, data)
    if user_id is not None:
        return user_id

    attributes = data.get("attributes") or {}
    customer_id = attributes.get("customer_id")
    if customer_id is not None:
        user = (
            db.query(UserORM)
            .filter(UserORM.lemonsqueezy_customer_id == str(customer_id))
            .first()
        )
        if user is not None:
            return user.id

    email = attributes.get("user_email")
    if email:
        user = db.query(UserORM).filter(UserORM.email == email).first()
        if user is not None:
            return user.id
    return None


def handle_webhook_event(
    db: Session,
    event_name: str,
    payload: dict,
    *,
    client: LemonSqueezyClient | None = None,
) -> None:
    """Upsert subscription state and recompute users.plan. Idempotent by LS subscription id."""
    if event_name not in WEBHOOK_SUBSCRIPTION_EVENTS:
        return

    # Lemon Squeezy webhook shape: { meta: { event_name, custom_data }, data: { ... } }
    data = payload.get("data") or {}

    if event_name == "subscription_payment_failed" and data.get("type") == "subscription-invoices":
        attributes = data.get("attributes") or {}
        sub_id = attributes.get("subscription_id")
        if sub_id is not None:
            row = (
                db.query(SubscriptionORM)
                .filter(SubscriptionORM.lemonsqueezy_subscription_id == str(sub_id))
                .first()
            )
            if row is not None:
                row.status = SubscriptionStatus.past_due.value
                row.updated_at = get_current_time()
                user = db.query(UserORM).filter(UserORM.id == row.user_id).first()
                if user is not None:
                    db.flush()
                    if _status_grants_paid_access(row.status, row.ends_at):
                        reconcile_single_paid_access(
                            db,
                            user.id,
                            row.lemonsqueezy_subscription_id,
                            client=client,
                        )
                        _clear_pending_checkout(user)
                    recompute_user_plan(db, user)
                db.commit()
        return

    if data.get("type") != "subscriptions":
        return

    user_id = _resolve_user_id_from_webhook(db, payload, data)
    if user_id is None:
        # Cannot link — ignore quietly (still 200 to LS to avoid retries for orphaned events)
        return

    user = _get_user_or_404(db, user_id)
    attrs = _subscription_attrs_from_ls(data)

    # Persist customer id if we learn it
    if attrs.get("lemonsqueezy_customer_id") and not user.lemonsqueezy_customer_id:
        user.lemonsqueezy_customer_id = attrs["lemonsqueezy_customer_id"]

    row = _upsert_subscription_row(db, user_id=user_id, ls_data=data)
    db.flush()
    if _status_grants_paid_access(row.status, row.ends_at):
        reconcile_single_paid_access(
            db,
            user_id,
            row.lemonsqueezy_subscription_id,
            client=client,
        )
        _clear_pending_checkout(user)
    recompute_user_plan(db, user)
    db.commit()


def customer_response_from_ls(data: dict) -> dict:
    attributes = data.get("attributes") or {}
    return {
        "id": str(data.get("id")),
        "store_id": attributes.get("store_id"),
        "name": attributes.get("name"),
        "email": attributes.get("email"),
        "status": attributes.get("status"),
        "city": attributes.get("city"),
        "region": attributes.get("region"),
        "country": attributes.get("country"),
        "postal_code": attributes.get("postal_code"),
        "created_at": attributes.get("created_at"),
        "updated_at": attributes.get("updated_at"),
    }


def invoice_response_from_ls(data: dict) -> dict:
    attributes = data.get("attributes") or {}
    return {
        "id": str(data.get("id")),
        "store_id": attributes.get("store_id"),
        "subscription_id": attributes.get("subscription_id"),
        "customer_id": attributes.get("customer_id"),
        "status": attributes.get("status"),
        "billing_reason": attributes.get("billing_reason"),
        "card_brand": attributes.get("card_brand"),
        "card_last_four": attributes.get("card_last_four"),
        "currency": attributes.get("currency"),
        "total": attributes.get("total"),
        "total_formatted": attributes.get("total_formatted"),
        "refunded": attributes.get("refunded"),
        "refunded_at": attributes.get("refunded_at"),
        "created_at": attributes.get("created_at"),
        "updated_at": attributes.get("updated_at"),
        "urls": attributes.get("urls"),
    }


def subscription_response_from_row(
    row: SubscriptionORM,
    *,
    urls: dict | None = None,
) -> dict:
    plan_variant = get_plan_variant_for_variant_id(row.variant_id)
    return {
        "id": row.id,
        "user_id": row.user_id,
        "lemonsqueezy_subscription_id": row.lemonsqueezy_subscription_id,
        "lemonsqueezy_customer_id": row.lemonsqueezy_customer_id,
        "product_id": row.product_id,
        "variant_id": row.variant_id,
        "plan_variant": plan_variant.value if plan_variant else None,
        "status": row.status,
        "renews_at": row.renews_at,
        "ends_at": row.ends_at,
        "trial_ends_at": row.trial_ends_at,
        "card_brand": row.card_brand,
        "card_last_four": row.card_last_four,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
        "urls": urls,
    }
