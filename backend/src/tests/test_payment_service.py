"""Tests for payment_service — HMAC, ownership, webhook idempotency, plan mapping."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..db import Base, SubscriptionORM, UserORM
from ..domain.payment.enums import (
    PlanVariant,
    SubscriptionStatus,
    get_plan_for_variant_id,
    get_variant_id,
)
from ..domain.portfolio.enums import SubscriptionPlan
from ..services import payment_service
from ..services.lemonsqueezy_client import LemonSqueezyError


@pytest.fixture
def env_variants(monkeypatch):
    monkeypatch.setenv("LEMON_SQUEEZY_API_KEY", "test_api_key")
    monkeypatch.setenv("LEMON_SQUEEZY_STORE_ID", "1")
    monkeypatch.setenv("LEMON_SQUEEZY_WEBHOOK_SECRET", "whsec_test_secret")
    monkeypatch.setenv("FRONTEND_URL", "http://localhost:5173")
    monkeypatch.setenv("LEMON_SQUEEZY_PRO_MONTHLY_VARIANT_ID", "101")
    monkeypatch.setenv("LEMON_SQUEEZY_PRO_ANNUALLY_VARIANT_ID", "102")
    monkeypatch.setenv("LEMON_SQUEEZY_MAX_MONTHLY_VARIANT_ID", "201")
    monkeypatch.setenv("LEMON_SQUEEZY_MAX_ANNUALLY_VARIANT_ID", "202")


@pytest.fixture
def db_session(env_variants):
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    session.add(
        UserORM(
            id=1,
            username="trader",
            email="t@example.com",
            hashed_password="x",
            plan=SubscriptionPlan.free.value,
        )
    )
    session.add(
        UserORM(
            id=2,
            username="other",
            email="o@example.com",
            hashed_password="x",
            plan=SubscriptionPlan.free.value,
            lemonsqueezy_customer_id="cust_other",
        )
    )
    session.commit()
    # Reset in-process cooldown between tests
    payment_service._last_action_at.clear()
    yield session
    session.close()


def _add_subscription(
    db,
    *,
    user_id: int = 1,
    ls_id: str = "sub_1",
    variant_id: str = "101",
    status: str = SubscriptionStatus.active.value,
    customer_id: str = "cust_1",
    ends_at: str | None = None,
):
    row = SubscriptionORM(
        user_id=user_id,
        lemonsqueezy_subscription_id=ls_id,
        lemonsqueezy_customer_id=customer_id,
        product_id="prod_1",
        variant_id=variant_id,
        status=status,
        ends_at=ends_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


class TestPlanMapping:
    def test_variant_id_to_plan(self, env_variants):
        assert get_plan_for_variant_id("101") == SubscriptionPlan.pro
        assert get_plan_for_variant_id("102") == SubscriptionPlan.pro
        assert get_plan_for_variant_id("201") == SubscriptionPlan.max
        assert get_plan_for_variant_id("202") == SubscriptionPlan.max
        assert get_plan_for_variant_id("999") is None
        assert get_plan_for_variant_id(None) is None

    def test_get_variant_id(self, env_variants):
        assert get_variant_id(PlanVariant.pro_monthly) == "101"
        assert get_variant_id(PlanVariant.max_annually) == "202"


class TestWebhookSignature:
    def test_valid_signature(self, env_variants):
        body = b'{"meta":{"event_name":"subscription_created"}}'
        secret = os.environ["LEMON_SQUEEZY_WEBHOOK_SECRET"].encode()
        sig = hmac.new(secret, body, hashlib.sha256).hexdigest()
        assert payment_service.verify_webhook_signature(body, sig) is True

    def test_invalid_signature(self, env_variants):
        body = b'{"meta":{"event_name":"subscription_created"}}'
        assert payment_service.verify_webhook_signature(body, "deadbeef") is False

    def test_missing_signature(self, env_variants):
        body = b"{}"
        assert payment_service.verify_webhook_signature(body, None) is False
        assert payment_service.verify_webhook_signature(body, "") is False


class TestOwnership:
    def test_get_owned_subscription_404_for_other_user(self, db_session):
        _add_subscription(db_session, user_id=1, ls_id="sub_owned")
        with pytest.raises(HTTPException) as exc:
            payment_service.get_owned_subscription_or_404(db_session, 2, "sub_owned")
        assert exc.value.status_code == 404

    def test_get_owned_subscription_ok(self, db_session):
        _add_subscription(db_session, user_id=1, ls_id="sub_owned")
        row = payment_service.get_owned_subscription_or_404(db_session, 1, "sub_owned")
        assert row.lemonsqueezy_subscription_id == "sub_owned"

    def test_customer_404_for_wrong_id(self, db_session):
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        user.lemonsqueezy_customer_id = "cust_1"
        db_session.commit()
        with pytest.raises(HTTPException) as exc:
            payment_service.get_owned_customer_or_404(db_session, 1, "cust_other")
        assert exc.value.status_code == 404

    def test_invoice_404_when_subscription_not_owned(self, db_session):
        _add_subscription(db_session, user_id=1, ls_id="sub_1")
        client = MagicMock()
        client.get.return_value = {
            "data": {
                "id": "inv_1",
                "type": "subscription-invoices",
                "attributes": {"subscription_id": "sub_someone_else"},
            }
        }
        with pytest.raises(HTTPException) as exc:
            payment_service.get_owned_invoice_or_404(
                db_session, 1, "inv_1", client=client
            )
        assert exc.value.status_code == 404

    def test_invoice_ok_when_owned(self, db_session):
        _add_subscription(db_session, user_id=1, ls_id="sub_1")
        client = MagicMock()
        client.get.return_value = {
            "data": {
                "id": "inv_1",
                "type": "subscription-invoices",
                "attributes": {"subscription_id": "sub_1", "status": "paid"},
            }
        }
        data = payment_service.get_owned_invoice_or_404(
            db_session, 1, "inv_1", client=client
        )
        assert data["id"] == "inv_1"


class TestWebhookIdempotencyAndPlan:
    def _subscription_payload(
        self,
        *,
        ls_id: str = "sub_10",
        variant_id: int = 101,
        status: str = "active",
        customer_id: int = 55,
        user_id: int = 1,
        ends_at: str | None = None,
    ) -> dict:
        return {
            "meta": {
                "event_name": "subscription_created",
                "custom_data": {"internal_user_id": str(user_id)},
            },
            "data": {
                "type": "subscriptions",
                "id": ls_id,
                "attributes": {
                    "customer_id": customer_id,
                    "product_id": 9,
                    "variant_id": variant_id,
                    "status": status,
                    "user_email": "t@example.com",
                    "renews_at": "2026-09-01T00:00:00.000000Z",
                    "ends_at": ends_at,
                    "trial_ends_at": None,
                    "card_brand": "visa",
                    "card_last_four": "4242",
                },
            },
        }

    def test_created_sets_plan_and_row(self, db_session):
        payload = self._subscription_payload(variant_id=201)
        payment_service.handle_webhook_event(
            db_session, "subscription_created", payload
        )
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        assert user.plan == SubscriptionPlan.max.value
        assert user.lemonsqueezy_customer_id == "55"
        rows = payment_service.list_owned_subscriptions(db_session, 1)
        assert len(rows) == 1
        assert rows[0].lemonsqueezy_subscription_id == "sub_10"
        assert rows[0].variant_id == "201"

    def test_idempotent_upsert(self, db_session):
        payload = self._subscription_payload(status="active")
        payment_service.handle_webhook_event(
            db_session, "subscription_created", payload
        )
        payload["data"]["attributes"]["status"] = "past_due"
        payload["meta"]["event_name"] = "subscription_updated"
        payment_service.handle_webhook_event(
            db_session, "subscription_updated", payload
        )
        rows = payment_service.list_owned_subscriptions(db_session, 1)
        assert len(rows) == 1
        assert rows[0].status == "past_due"

    def test_expired_downgrades_to_free(self, db_session):
        payload = self._subscription_payload(variant_id=101, status="active")
        payment_service.handle_webhook_event(
            db_session, "subscription_created", payload
        )
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        assert user.plan == SubscriptionPlan.pro.value

        payload["data"]["attributes"]["status"] = "expired"
        payload["meta"]["event_name"] = "subscription_expired"
        payment_service.handle_webhook_event(
            db_session, "subscription_expired", payload
        )
        db_session.refresh(user)
        assert user.plan == SubscriptionPlan.free.value

    def test_cancelled_keeps_plan_during_grace(self, db_session):
        payload = self._subscription_payload(
            variant_id=101,
            status="cancelled",
            ends_at="2099-01-01T00:00:00.000000Z",
        )
        payment_service.handle_webhook_event(
            db_session, "subscription_cancelled", payload
        )
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        assert user.plan == SubscriptionPlan.pro.value

    def test_cancelled_past_ends_at_downgrades(self, db_session):
        payload = self._subscription_payload(
            variant_id=101,
            status="cancelled",
            ends_at="2020-01-01T00:00:00.000000Z",
        )
        payment_service.handle_webhook_event(
            db_session, "subscription_cancelled", payload
        )
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        assert user.plan == SubscriptionPlan.free.value


class TestGetOrCreateCustomer:
    def test_returns_existing(self, db_session):
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        user.lemonsqueezy_customer_id = "cust_existing"
        db_session.commit()
        client = MagicMock()
        result = payment_service.get_or_create_customer(
            db_session, 1, client=client, enforce_rate_limit=False
        )
        assert result == "cust_existing"
        client.post.assert_not_called()

    def test_creates_when_missing(self, db_session):
        client = MagicMock()
        client.post.return_value = {
            "data": {"id": "cust_new", "type": "customers", "attributes": {}}
        }
        result = payment_service.get_or_create_customer(
            db_session, 1, client=client, enforce_rate_limit=False
        )
        assert result == "cust_new"
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        assert user.lemonsqueezy_customer_id == "cust_new"
        client.post.assert_called_once()

    def test_maps_ls_error_to_502(self, db_session):
        client = MagicMock()
        client.post.side_effect = LemonSqueezyError("boom", status_code=500)
        with pytest.raises(HTTPException) as exc:
            payment_service.get_or_create_customer(
                db_session, 1, client=client, enforce_rate_limit=False
            )
        assert exc.value.status_code == 502


class TestOneActiveSubscription:
    def _checkout_client(self):
        client = MagicMock()

        def post(path, json=None):
            if path == "/customers":
                return {
                    "data": {"id": "cust_new", "type": "customers", "attributes": {}}
                }
            return {
                "data": {
                    "id": "chk_1",
                    "type": "checkouts",
                    "attributes": {
                        "url": "https://ls.example/checkout/1",
                        "expires_at": "2099-01-01T00:00:00.000000Z",
                    },
                }
            }

        client.post.side_effect = post
        return client

    def _checkout_post_count(self, client: MagicMock) -> int:
        return sum(1 for call in client.post.call_args_list if call.args[0] == "/checkouts")

    def test_checkout_allowed_when_no_subscription(self, db_session):
        url = payment_service.create_checkout(
            db_session,
            1,
            PlanVariant.pro_monthly,
            client=self._checkout_client(),
        )
        assert url == "https://ls.example/checkout/1"

    def test_checkout_allowed_when_expired(self, db_session):
        _add_subscription(
            db_session,
            ls_id="sub_old",
            status=SubscriptionStatus.expired.value,
        )
        url = payment_service.create_checkout(
            db_session,
            1,
            PlanVariant.pro_monthly,
            client=self._checkout_client(),
        )
        assert url.startswith("https://ls.example/checkout/")

    def test_checkout_allowed_when_cancelled_past_ends_at(self, db_session):
        _add_subscription(
            db_session,
            ls_id="sub_old",
            status=SubscriptionStatus.cancelled.value,
            ends_at="2020-01-01T00:00:00.000000Z",
        )
        url = payment_service.create_checkout(
            db_session,
            1,
            PlanVariant.max_monthly,
            client=self._checkout_client(),
        )
        assert url.startswith("https://ls.example/checkout/")

    def test_checkout_409_when_active(self, db_session):
        _add_subscription(db_session, ls_id="sub_live")
        with pytest.raises(HTTPException) as exc:
            payment_service.create_checkout(
                db_session,
                1,
                PlanVariant.max_monthly,
                client=self._checkout_client(),
            )
        assert exc.value.status_code == 409
        assert exc.value.detail["code"] == "active_subscription_exists"
        assert exc.value.detail["lemonsqueezy_subscription_id"] == "sub_live"
        assert exc.value.detail["status"] == "active"

    def test_checkout_409_when_past_due(self, db_session):
        _add_subscription(
            db_session,
            ls_id="sub_due",
            status=SubscriptionStatus.past_due.value,
        )
        with pytest.raises(HTTPException) as exc:
            payment_service.create_checkout(
                db_session,
                1,
                PlanVariant.pro_monthly,
                client=self._checkout_client(),
            )
        assert exc.value.status_code == 409
        assert exc.value.detail["lemonsqueezy_subscription_id"] == "sub_due"

    def test_checkout_409_when_cancelled_in_grace(self, db_session):
        _add_subscription(
            db_session,
            ls_id="sub_grace",
            status=SubscriptionStatus.cancelled.value,
            ends_at="2099-01-01T00:00:00.000000Z",
        )
        with pytest.raises(HTTPException) as exc:
            payment_service.create_checkout(
                db_session,
                1,
                PlanVariant.pro_monthly,
                client=self._checkout_client(),
            )
        assert exc.value.status_code == 409
        assert exc.value.detail["status"] == "cancelled"

    def test_get_current_subscription(self, db_session):
        _add_subscription(
            db_session,
            ls_id="sub_expired",
            status=SubscriptionStatus.expired.value,
        )
        live = _add_subscription(db_session, ls_id="sub_live")
        current = payment_service.get_current_subscription(db_session, 1)
        assert current is not None
        assert current.lemonsqueezy_subscription_id == live.lemonsqueezy_subscription_id

    def test_get_current_subscription_none_when_free(self, db_session):
        assert payment_service.get_current_subscription(db_session, 1) is None
        with pytest.raises(HTTPException) as exc:
            payment_service.get_current_subscription_or_404(db_session, 1)
        assert exc.value.status_code == 404

    def _subscription_payload(
        self,
        *,
        ls_id: str = "sub_new",
        variant_id: int = 201,
        status: str = "active",
        user_id: int = 1,
    ) -> dict:
        return {
            "meta": {
                "event_name": "subscription_created",
                "custom_data": {"internal_user_id": str(user_id)},
            },
            "data": {
                "type": "subscriptions",
                "id": ls_id,
                "attributes": {
                    "customer_id": 55,
                    "product_id": 9,
                    "variant_id": variant_id,
                    "status": status,
                    "user_email": "t@example.com",
                    "renews_at": "2026-09-01T00:00:00.000000Z",
                    "ends_at": None,
                    "trial_ends_at": None,
                    "card_brand": "visa",
                    "card_last_four": "4242",
                },
            },
        }

    def test_webhook_second_active_cancels_older(self, db_session):
        _add_subscription(db_session, ls_id="sub_old", variant_id="101")
        client = MagicMock()
        client.delete.return_value = {
            "data": {
                "id": "sub_old",
                "type": "subscriptions",
                "attributes": {
                    "customer_id": 1,
                    "product_id": 9,
                    "variant_id": 101,
                    "status": "cancelled",
                    "ends_at": "2099-01-01T00:00:00.000000Z",
                },
            }
        }
        payment_service.handle_webhook_event(
            db_session,
            "subscription_created",
            self._subscription_payload(ls_id="sub_new", variant_id=201),
            client=client,
        )
        client.delete.assert_called_once_with("/subscriptions/sub_old")
        old = payment_service.get_owned_subscription_or_404(db_session, 1, "sub_old")
        new = payment_service.get_owned_subscription_or_404(db_session, 1, "sub_new")
        assert old.status == "cancelled"
        assert new.status == "active"
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        assert user.plan == SubscriptionPlan.max.value

    def test_webhook_idempotent_same_id_does_not_cancel_self(self, db_session):
        payload = self._subscription_payload(ls_id="sub_only", variant_id=101)
        client = MagicMock()
        payment_service.handle_webhook_event(
            db_session, "subscription_created", payload, client=client
        )
        payment_service.handle_webhook_event(
            db_session, "subscription_created", payload, client=client
        )
        client.delete.assert_not_called()
        rows = payment_service.list_owned_subscriptions(db_session, 1)
        assert len(rows) == 1
        assert rows[0].lemonsqueezy_subscription_id == "sub_only"

    def test_webhook_expired_does_not_cancel_siblings(self, db_session):
        _add_subscription(db_session, ls_id="sub_live", variant_id="101")
        client = MagicMock()
        payload = self._subscription_payload(ls_id="sub_dead", variant_id=101)
        payload["data"]["attributes"]["status"] = "expired"
        payload["meta"]["event_name"] = "subscription_expired"
        payment_service.handle_webhook_event(
            db_session, "subscription_expired", payload, client=client
        )
        client.delete.assert_not_called()
        live = payment_service.get_owned_subscription_or_404(db_session, 1, "sub_live")
        assert live.status == "active"

    def test_patch_variant_on_active_allowed(self, db_session):
        _add_subscription(db_session, ls_id="sub_live")
        client = MagicMock()
        client.patch.return_value = {
            "data": {
                "id": "sub_live",
                "type": "subscriptions",
                "attributes": {
                    "customer_id": 1,
                    "product_id": 9,
                    "variant_id": 201,
                    "status": "active",
                },
            }
        }
        row = payment_service.update_subscription(
            db_session,
            1,
            "sub_live",
            plan_variant=PlanVariant.max_monthly,
            client=client,
        )
        assert row.variant_id == "201"
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        assert user.plan == SubscriptionPlan.max.value

    def test_patch_variant_on_expired_rejected(self, db_session):
        _add_subscription(
            db_session,
            ls_id="sub_dead",
            status=SubscriptionStatus.expired.value,
        )
        client = MagicMock()
        with pytest.raises(HTTPException) as exc:
            payment_service.update_subscription(
                db_session,
                1,
                "sub_dead",
                plan_variant=PlanVariant.pro_monthly,
                client=client,
            )
        assert exc.value.status_code == 409
        assert exc.value.detail["code"] == "subscription_does_not_grant_access"
        client.patch.assert_not_called()

    def test_resume_only_in_grace(self, db_session):
        _add_subscription(
            db_session,
            ls_id="sub_dead",
            status=SubscriptionStatus.expired.value,
        )
        client = MagicMock()
        with pytest.raises(HTTPException) as exc:
            payment_service.update_subscription(
                db_session,
                1,
                "sub_dead",
                resume=True,
                client=client,
            )
        assert exc.value.status_code == 400
        assert exc.value.detail["code"] == "resume_not_in_grace"
        client.patch.assert_not_called()

    def test_resume_in_grace_allowed(self, db_session):
        _add_subscription(
            db_session,
            ls_id="sub_grace",
            status=SubscriptionStatus.cancelled.value,
            ends_at="2099-01-01T00:00:00.000000Z",
        )
        client = MagicMock()
        client.patch.return_value = {
            "data": {
                "id": "sub_grace",
                "type": "subscriptions",
                "attributes": {
                    "customer_id": 1,
                    "product_id": 9,
                    "variant_id": 101,
                    "status": "active",
                    "cancelled": False,
                    "ends_at": None,
                },
            }
        }
        row = payment_service.update_subscription(
            db_session,
            1,
            "sub_grace",
            resume=True,
            client=client,
        )
        assert row.status == "active"

    def test_second_checkout_same_variant_reuses_url(self, db_session):
        client = self._checkout_client()
        url1 = payment_service.create_checkout(
            db_session, 1, PlanVariant.pro_monthly, client=client
        )
        url2 = payment_service.create_checkout(
            db_session, 1, PlanVariant.pro_monthly, client=client
        )
        assert url1 == url2 == "https://ls.example/checkout/1"
        assert self._checkout_post_count(client) == 1

    def test_second_checkout_different_variant_409(self, db_session):
        client = self._checkout_client()
        payment_service.create_checkout(
            db_session, 1, PlanVariant.pro_monthly, client=client
        )
        with pytest.raises(HTTPException) as exc:
            payment_service.create_checkout(
                db_session, 1, PlanVariant.max_monthly, client=client
            )
        assert exc.value.status_code == 409
        assert exc.value.detail["code"] == "checkout_already_pending"
        assert self._checkout_post_count(client) == 1

    def test_pending_cleared_after_paid_webhook(self, db_session):
        client = self._checkout_client()
        payment_service.create_checkout(
            db_session, 1, PlanVariant.pro_monthly, client=client
        )
        payment_service.handle_webhook_event(
            db_session,
            "subscription_created",
            self._subscription_payload(ls_id="sub_new", variant_id=101),
            client=client,
        )
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        assert user.pending_checkout_url is None
        with pytest.raises(HTTPException) as exc:
            payment_service.create_checkout(
                db_session, 1, PlanVariant.pro_monthly, client=client
            )
        assert exc.value.status_code == 409
        assert exc.value.detail["code"] == "active_subscription_exists"

    def test_expired_pending_allows_new_checkout(self, db_session):
        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        user.pending_checkout_id = "chk_old"
        user.pending_checkout_url = "https://ls.example/checkout/old"
        user.pending_checkout_variant = PlanVariant.pro_monthly.value
        user.pending_checkout_expires_at = "2020-01-01T00:00:00.000000Z"
        db_session.commit()
        client = self._checkout_client()
        url = payment_service.create_checkout(
            db_session, 1, PlanVariant.max_monthly, client=client
        )
        assert url == "https://ls.example/checkout/1"
        assert self._checkout_post_count(client) == 1

    def test_reconcile_delete_failure_keeps_old_active(self, db_session):
        _add_subscription(db_session, ls_id="sub_old", variant_id="101")
        client = MagicMock()
        client.delete.side_effect = LemonSqueezyError("boom", status_code=500)
        payment_service.handle_webhook_event(
            db_session,
            "subscription_created",
            self._subscription_payload(ls_id="sub_new", variant_id=201),
            client=client,
        )
        old = payment_service.get_owned_subscription_or_404(db_session, 1, "sub_old")
        new = payment_service.get_owned_subscription_or_404(db_session, 1, "sub_new")
        assert old.status == "active"
        assert new.status == "active"
        client.delete.assert_called_once_with("/subscriptions/sub_old")


