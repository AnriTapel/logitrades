from pydantic import BaseModel

from ...domain.payment.enums import PlanVariant


class SubscriptionUpdate(BaseModel):
    plan_variant: PlanVariant | None = None
    resume: bool | None = None
