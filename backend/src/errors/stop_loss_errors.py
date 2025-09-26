from pydantic_core import PydanticCustomError

StopLossTooLowError = lambda: PydanticCustomError(
    "stop_loss_low",
    "For sell trades, stop loss must be greater than open price."
)

StopLossTooHightError = lambda: PydanticCustomError(
    "stop_loss.high",
    "For buy trades, stop loss must be less than open price."
)