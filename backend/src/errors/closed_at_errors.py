from pydantic_core import PydanticCustomError

def closed_at_before_opened_at_error() -> PydanticCustomError:
    return PydanticCustomError(
        "closed_at.before",
        "Close date must be after opened date."
    )