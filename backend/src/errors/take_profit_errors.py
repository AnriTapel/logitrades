from pydantic_core import PydanticCustomError

TakeProfitTooLowError = lambda: PydanticCustomError(
    'take_profit_low',
    'For buy trades, take profit must be greater than open price.'
)

TakeProfitTooHightError = lambda: PydanticCustomError(
    'take_profit_high',
    'For sell trades, take profit must be less than open price.'
)