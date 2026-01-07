from pydantic import ValidationError


# Map Pydantic error types to user-friendly messages per field
FIELD_ERROR_MESSAGES: dict[str, dict[str, str]] = {
    'symbol': {
        'missing': "Symbol is required.",
        'string_type': "Symbol must be text.",
        'symbol.empty': "Symbol is required.",
        'symbol.too_long': "Symbol must be 16 characters or less.",
    },
    'trade_type': {
        'enum': "Trade type must be 'buy' or 'sell'.",
        'missing': "Trade type is required.",
    },
    'open_price': {
        'float_parsing': "Open price must be a valid number.",
        'float_type': "Open price must be a valid number.",
        'greater_than': "Open price must be greater than 0.",
        'missing': "Open price is required.",
        'open_price.not_positive': "Open price must be greater than 0.",
    },
    'quantity': {
        'float_parsing': "Quantity must be a valid number.",
        'float_type': "Quantity must be a valid number.",
        'missing': "Quantity is required.",
        'quantity.not_positive': "Quantity must be greater than 0.",
    },
    'opened_at': {
        'datetime_parsing': "Opened at must be a valid date/time.",
        'datetime_type': "Opened at must be a valid date/time.",
        'datetime_from_date_parsing': "Opened at must be a valid date/time.",
    },
    'take_profit': {
        'float_parsing': "Take profit must be a valid number.",
        'float_type': "Take profit must be a valid number.",
    },
    'stop_loss': {
        'float_parsing': "Stop loss must be a valid number.",
        'float_type': "Stop loss must be a valid number.",
    },
    'leverage': {
        'int_parsing': "Leverage must be a whole number.",
        'int_type': "Leverage must be a whole number.",
        'leverage.not_positive': "Leverage must be greater than 0.",
    },
    'close_price': {
        'float_parsing': "Close price must be a valid number.",
        'float_type': "Close price must be a valid number.",
    },
    'closed_at': {
        'datetime_parsing': "Closed at must be a valid date/time.",
        'datetime_type': "Closed at must be a valid date/time.",
        'datetime_from_date_parsing': "Closed at must be a valid date/time.",
    },
    'created_at': {
        'datetime_parsing': "Created at must be a valid date/time.",
        'datetime_type': "Created at must be a valid date/time.",
        'datetime_from_date_parsing': "Created at must be a valid date/time.",
    },
}

# Default messages for common error types when field-specific message is not found
DEFAULT_ERROR_MESSAGES: dict[str, str] = {
    'missing': "This field is required.",
    'float_parsing': "Must be a valid number.",
    'float_type': "Must be a valid number.",
    'int_parsing': "Must be a whole number.",
    'int_type': "Must be a whole number.",
    'datetime_parsing': "Must be a valid date/time.",
    'datetime_type': "Must be a valid date/time.",
    'datetime_from_date_parsing': "Must be a valid date/time.",
    'string_type': "Must be text.",
    'enum': "Invalid value.",
}


def format_import_error(row: int, error: ValidationError) -> str:
    """
    Extract the first error from a ValidationError and format as a user-friendly message.
    
    Returns a string like: "Row 2: Trade type must be 'buy' or 'sell'."
    """
    if not error.errors():
        return f"Row {row}: Invalid data."
    
    first_error = error.errors()[0]
    field = _extract_field_name(first_error)
    error_type = first_error.get('type', '')
    
    # Try to get field-specific message
    message = _get_error_message(field, error_type)
    
    return f"Row {row}: {message}"


def _extract_field_name(error: dict) -> str:
    """Extract the field name from a Pydantic error dict."""
    loc = error.get('loc', ())
    if loc:
        # Return the first location part that's not 'body'
        for part in loc:
            if part != 'body':
                return str(part)
    return 'unknown'


def _get_error_message(field: str, error_type: str) -> str:
    """Get the user-friendly error message for a field and error type."""
    # Check field-specific messages first
    field_messages = FIELD_ERROR_MESSAGES.get(field, {})
    if error_type in field_messages:
        return field_messages[error_type]
    
    # Fall back to default messages
    if error_type in DEFAULT_ERROR_MESSAGES:
        return DEFAULT_ERROR_MESSAGES[error_type]
    
    # Last resort: return a generic message with the field name
    readable_field = field.replace('_', ' ').title()
    return f"{readable_field} has an invalid value."

