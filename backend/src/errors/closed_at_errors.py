from pydantic_core import PydanticCustomError

ClosedAtBeforeOpenedAtError = lambda: PydanticCustomError(
    "closed_at.before",
    "Close date must be after openen date."
)