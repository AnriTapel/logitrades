from enum import Enum
import os

from ..portfolio.enums import SubscriptionPlan


class PlanVariant(str, Enum):
    pro_monthly = "pro_monthly"
    pro_annually = "pro_annually"
    max_monthly = "max_monthly"
    max_annually = "max_annually"


class SubscriptionStatus(str, Enum):
    on_trial = "on_trial"
    active = "active"
    paused = "paused"
    past_due = "past_due"
    unpaid = "unpaid"
    cancelled = "cancelled"
    expired = "expired"


_VARIANT_ENV_KEYS: dict[PlanVariant, str] = {
    PlanVariant.pro_monthly: "LEMON_SQUEEZY_PRO_MONTHLY_VARIANT_ID",
    PlanVariant.pro_annually: "LEMON_SQUEEZY_PRO_ANNUALLY_VARIANT_ID",
    PlanVariant.max_monthly: "LEMON_SQUEEZY_MAX_MONTHLY_VARIANT_ID",
    PlanVariant.max_annually: "LEMON_SQUEEZY_MAX_ANNUALLY_VARIANT_ID",
}

_PLAN_BY_VARIANT: dict[PlanVariant, SubscriptionPlan] = {
    PlanVariant.pro_monthly: SubscriptionPlan.pro,
    PlanVariant.pro_annually: SubscriptionPlan.pro,
    PlanVariant.max_monthly: SubscriptionPlan.max,
    PlanVariant.max_annually: SubscriptionPlan.max,
}


def _load_variant_id_map() -> dict[PlanVariant, str]:
    mapping: dict[PlanVariant, str] = {}
    for plan_variant, env_key in _VARIANT_ENV_KEYS.items():
        value = os.getenv(env_key)
        if value:
            mapping[plan_variant] = value
    return mapping


def get_variant_id(plan_variant: PlanVariant) -> str:
    """Resolve Lemon Squeezy variant ID for a plan variant from env."""
    value = os.getenv(_VARIANT_ENV_KEYS[plan_variant])
    if not value:
        raise RuntimeError(
            f"{_VARIANT_ENV_KEYS[plan_variant]} env variable is not set. "
            "Define it in your environment or .env file."
        )
    return value


def get_plan_for_variant_id(variant_id: str | int | None) -> SubscriptionPlan | None:
    """Map a Lemon Squeezy variant ID back to an internal SubscriptionPlan."""
    if variant_id is None:
        return None
    variant_id_str = str(variant_id)
    for plan_variant, env_key in _VARIANT_ENV_KEYS.items():
        env_value = os.getenv(env_key)
        if env_value and env_value == variant_id_str:
            return _PLAN_BY_VARIANT[plan_variant]
    return None


def get_plan_variant_for_variant_id(
    variant_id: str | int | None,
) -> PlanVariant | None:
    """Map a Lemon Squeezy variant ID back to a PlanVariant enum value."""
    if variant_id is None:
        return None
    variant_id_str = str(variant_id)
    for plan_variant, env_key in _VARIANT_ENV_KEYS.items():
        env_value = os.getenv(env_key)
        if env_value and env_value == variant_id_str:
            return plan_variant
    return None


def plan_variant_to_subscription_plan(plan_variant: PlanVariant) -> SubscriptionPlan:
    return _PLAN_BY_VARIANT[plan_variant]


# Statuses that grant paid-plan access directly.
# Cancelled is handled separately (grace until ends_at) in payment_service.
ACTIVE_PAID_STATUSES = frozenset(
    {
        SubscriptionStatus.on_trial.value,
        SubscriptionStatus.active.value,
        SubscriptionStatus.paused.value,
        SubscriptionStatus.past_due.value,
    }
)
