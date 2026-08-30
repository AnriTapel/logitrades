"""Thin sync HTTP client for the Lemon Squeezy JSON:API."""

from __future__ import annotations

import time
from typing import Any

import httpx

from ..utils import _get_env_var

BASE_URL = "https://api.lemonsqueezy.com/v1"
DEFAULT_TIMEOUT = 10.0
MAX_RETRIES = 1
RETRYABLE_STATUS_CODES = frozenset({500, 502, 503, 504})


class LemonSqueezyError(Exception):
    """Raised when a Lemon Squeezy API call fails."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        body: Any = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.body = body


class LemonSqueezyClient:
    def __init__(self, api_key: str | None = None, timeout: float = DEFAULT_TIMEOUT):
        self._api_key = api_key
        self._timeout = timeout

    def _get_api_key(self) -> str:
        if self._api_key is None:
            self._api_key = _get_env_var("LEMON_SQUEEZY_API_KEY")
        return self._api_key

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._get_api_key()}",
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
        }

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict:
        url = f"{BASE_URL}{path}"
        last_error: Exception | None = None

        for attempt in range(MAX_RETRIES + 1):
            try:
                with httpx.Client(timeout=self._timeout) as client:
                    response = client.request(
                        method,
                        url,
                        headers=self._headers(),
                        json=json,
                        params=params,
                    )

                if (
                    response.status_code in RETRYABLE_STATUS_CODES
                    and attempt < MAX_RETRIES
                ):
                    time.sleep(0.25 * (attempt + 1))
                    continue

                if response.status_code >= 400:
                    try:
                        body = response.json()
                    except Exception:
                        body = response.text
                    raise LemonSqueezyError(
                        f"Lemon Squeezy API error: {response.status_code}",
                        status_code=response.status_code,
                        body=body,
                    )

                if response.status_code == 204 or not response.content:
                    return {}
                return response.json()

            except httpx.TransportError as exc:
                last_error = exc
                if attempt < MAX_RETRIES:
                    time.sleep(0.25 * (attempt + 1))
                    continue
                raise LemonSqueezyError(
                    f"Lemon Squeezy connection error: {exc}"
                ) from exc

        raise LemonSqueezyError(
            f"Lemon Squeezy request failed after retries: {last_error}"
        )

    def get(self, path: str, *, params: dict | None = None) -> dict:
        return self._request("GET", path, params=params)

    def post(self, path: str, *, json: dict | None = None) -> dict:
        return self._request("POST", path, json=json)

    def patch(self, path: str, *, json: dict | None = None) -> dict:
        return self._request("PATCH", path, json=json)

    def delete(self, path: str) -> dict:
        return self._request("DELETE", path)


# Module-level singleton for convenience; tests can instantiate LemonSqueezyClient directly.
lemonsqueezy_client = LemonSqueezyClient()
