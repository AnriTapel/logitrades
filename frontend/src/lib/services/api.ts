import {httpClient} from "$lib/services/http-client/http-client";

export async function deleteTrade(tradeId: number): Promise<void> {
    await httpClient.delete(`http://localhost:8000/api/v1/trades/${tradeId}`)
}

export async function importTrades(file: File): Promise<void> {
    await httpClient.sendFile('http://localhost:8000/api/v1/trades/import', file);
}
