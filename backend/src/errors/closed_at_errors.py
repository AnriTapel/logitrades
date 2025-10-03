from pydantic_core import PydanticCustomError

def closed_at_before_opened_at_error() -> PydanticCustomError:
    return PydanticCustomError(
        "closed_at.before",
        "Close date must be after opened date."
    )

def close_trade_data_error() -> PydanticCustomError:
    return PydanticCustomError(
        "close_trade.no_data",
        "Provide both price and date to close trade."
    )