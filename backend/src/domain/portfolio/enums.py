from enum import Enum


class SubscriptionPlan(str, Enum):
    free = "free"
    pro = "pro"
    max = "max"


class PortfolioStatus(str, Enum):
    active = "active"
    archived = "archived"


class BalanceTransactionType(str, Enum):
    deposit = "deposit"
    withdrawal = "withdrawal"


PLAN_PORTFOLIO_LIMITS: dict[SubscriptionPlan, int] = {
    SubscriptionPlan.free: 1,
    SubscriptionPlan.pro: 1,
    SubscriptionPlan.max: 5,
}
