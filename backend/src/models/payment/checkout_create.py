from pydantic import BaseModel

from ...domain.payment.enums import PlanVariant


class CheckoutCreate(BaseModel):
    plan_variant: PlanVariant
