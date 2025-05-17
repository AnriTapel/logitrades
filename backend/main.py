from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello, Market memo!"}

@app.post("/api/v1/trade")
async def postNewTrade(trade: dict):
    """
    This endpoint receives a new trade and processes it.
    """
    # Here you would typically process the trade, e.g., save it to a database
    # For now, we'll just return the trade data back
    print("Received trade:", trade)
    return {"received_trade": trade}
