from pydantic_core import PydanticCustomError

def stop_loss_too_low_error() -> PydanticCustomError:
    return PydanticCustomError(
        "stop_loss.low",
        "For sell trades, stop loss must be greater than open price."
    )

def stop_loss_too_high_error() -> PydanticCustomError:
    return PydanticCustomError(
        "stop_loss.high",
        "For buy trades, stop loss must be less than open price."
    )
