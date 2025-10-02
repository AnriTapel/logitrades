from pydantic_core import PydanticCustomError

def take_profit_too_low_error() -> PydanticCustomError:
    return PydanticCustomError(
        "take_profit.low",
        "For buy trades, take profit must be greater than open price."
    )

def take_profit_too_high_error() -> PydanticCustomError:
    return PydanticCustomError(
        "take_profit.high",
        "For sell trades, take profit must be less than open price."
    )
