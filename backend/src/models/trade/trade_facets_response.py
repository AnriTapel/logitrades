from pydantic import BaseModel


class TradeFacetsResponse(BaseModel):
    symbols: list[str]
    tags: list[str]
