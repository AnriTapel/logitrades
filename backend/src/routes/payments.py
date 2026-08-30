"""Payment routes — Lemon Squeezy subscription billing."""

from __future__ import annotations

import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import database
from ..auth import current_user_id
from ..models.payment.checkout_create import CheckoutCreate
from ..models.payment.checkout_response import CheckoutResponse
from ..models.payment.customer_response import CustomerResponse
from ..models.payment.customer_update import CustomerUpdate
from ..models.payment.subscription_invoice_response import SubscriptionInvoiceResponse
from ..models.payment.subscription_response import SubscriptionResponse
from ..models.payment.subscription_update import SubscriptionUpdate
from ..services import payment_service

router = APIRouter(prefix="/payments", tags=["payments"])

db_dependency = Annotated[Session, Depends(database.get_db)]


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(
    body: CheckoutCreate,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    checkout_url = payment_service.create_checkout(db, user_id, body.plan_variant)
    return CheckoutResponse(checkout_url=checkout_url)


@router.get("/subscriptions", response_model=list[SubscriptionResponse])
def list_subscriptions(
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    rows = payment_service.list_owned_subscriptions(db, user_id)
    return [
        SubscriptionResponse(**payment_service.subscription_response_from_row(row))
        for row in rows
    ]


@router.get("/subscriptions/current", response_model=SubscriptionResponse)
def get_current_subscription(
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    row = payment_service.get_current_subscription_or_404(db, user_id)
    return SubscriptionResponse(**payment_service.subscription_response_from_row(row))


@router.get("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: str,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    row, attributes = payment_service.get_subscription_detail(
        db, user_id, subscription_id
    )
    return SubscriptionResponse(
        **payment_service.subscription_response_from_row(
            row,
            urls=attributes.get("urls"),
        )
    )


@router.patch("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
def patch_subscription(
    subscription_id: str,
    body: SubscriptionUpdate,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    row = payment_service.update_subscription(
        db,
        user_id,
        subscription_id,
        plan_variant=body.plan_variant,
        resume=body.resume,
    )
    return SubscriptionResponse(**payment_service.subscription_response_from_row(row))


@router.delete("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
def delete_subscription(
    subscription_id: str,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    row = payment_service.cancel_subscription(db, user_id, subscription_id)
    return SubscriptionResponse(**payment_service.subscription_response_from_row(row))


@router.get(
    "/subscription-invoices",
    response_model=list[SubscriptionInvoiceResponse],
)
def list_subscription_invoices(
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    items = payment_service.list_owned_invoices(db, user_id)
    return [
        SubscriptionInvoiceResponse(**payment_service.invoice_response_from_ls(item))
        for item in items
    ]


@router.get(
    "/subscription-invoices/{invoice_id}",
    response_model=SubscriptionInvoiceResponse,
)
def get_subscription_invoice(
    invoice_id: str,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    data = payment_service.get_owned_invoice_or_404(db, user_id, invoice_id)
    return SubscriptionInvoiceResponse(**payment_service.invoice_response_from_ls(data))


@router.post("/customers", response_model=CustomerResponse)
def create_customer(
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    customer_id = payment_service.get_or_create_customer(db, user_id)
    data = payment_service.fetch_customer(db, user_id, customer_id)
    return CustomerResponse(**payment_service.customer_response_from_ls(data))


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: str,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    data = payment_service.fetch_customer(db, user_id, customer_id)
    return CustomerResponse(**payment_service.customer_response_from_ls(data))


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
def patch_customer(
    customer_id: str,
    body: CustomerUpdate,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    data = payment_service.update_customer(
        db,
        user_id,
        customer_id,
        body.model_dump(exclude_unset=True),
    )
    return CustomerResponse(**payment_service.customer_response_from_ls(data))


@router.post("/webhooks/lemonsqueezy")
async def lemonsqueezy_webhook(request: Request, db: db_dependency):
    """Public webhook endpoint. Signature must be verified against the raw body."""
    raw_body = await request.body()
    signature = request.headers.get("X-Signature")
    if not payment_service.verify_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc

    event_name = (payload.get("meta") or {}).get("event_name")
    if not event_name:
        raise HTTPException(status_code=400, detail="Missing event_name")

    payment_service.handle_webhook_event(db, event_name, payload)
    return {"ok": True}
