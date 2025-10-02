def normalize_csv_row(row: dict) -> dict:
    return {k: (v if v != "" else None) for k, v in row.items()}