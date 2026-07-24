"""Supported display currencies (ISO 4217). Must match frontend CURRENCIES."""

from enum import Enum


class CurrencyCode(str, Enum):
    USD = "USD"
    EUR = "EUR"
    JPY = "JPY"
    GBP = "GBP"
    CNY = "CNY"
    CHF = "CHF"
    AUD = "AUD"
    CAD = "CAD"
    HKD = "HKD"
    SGD = "SGD"
    INR = "INR"
    KRW = "KRW"
    SEK = "SEK"
    MXN = "MXN"
    BRL = "BRL"
    ILS = "ILS"
    AED = "AED"
    SAR = "SAR"


DEFAULT_CURRENCY = CurrencyCode.USD.value

SUPPORTED_CURRENCY_CODES = frozenset(c.value for c in CurrencyCode)


def parse_currency_code(value: str | None) -> str:
    if value is None or value == "":
        return DEFAULT_CURRENCY
    try:
        return CurrencyCode(value).value
    except ValueError as exc:
        raise ValueError(f"Unsupported currency: {value}") from exc
