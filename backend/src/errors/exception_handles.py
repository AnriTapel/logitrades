from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi import HTTPException
from pydantic_core import PydanticCustomError

from .error_response import ErrorResponse


def make_error(
    status_code: int,
    reason: str,
    details: str | dict | None = None,
):
    return ErrorResponse(
        code=status_code,
        reason=reason,
        details=details,
    )

def register_exception_handlers(app):
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Convert FastAPI/Pydantic's list of errors → dict of field: message
        details = {}
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"] if loc not in ("body",))
            details[field] = error["msg"]

        error = make_error(
            status_code=422,
            reason="ValidationError",
            details=details
        )
        return JSONResponse(status_code=422, content=error.dict())

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        error = make_error(
            status_code=exc.status_code,
            reason="HTTPException",
            details=exc.detail if isinstance(exc.detail, str) else str(exc.detail),
        )
        return JSONResponse(status_code=exc.status_code, content=error.dict())

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        error = make_error(
            status_code=500,
            reason="InternalServerError",
            details="Unexpected server error.",
        )
        # log exc with error.correlation_id
        return JSONResponse(status_code=500, content=error.dict())

    @app.exception_handler(PydanticCustomError)
    async def pydantic_custom_error_handler(request: Request, exc: PydanticCustomError):
        # exc contains a "type" and "message"
        error = make_error(
            status_code=422,
            reason="ValidationError",
            details=str(exc.message_template),
        )
        return JSONResponse(status_code=422, content=error.dict())