import pandas as pd
from fastapi import UploadFile, HTTPException
import io

REQUIRED_COLUMNS = {"date", "product", "quantity", "revenue"}

def load_csv(file: UploadFile) -> pd.DataFrame:
    try:
        # 1. Read the first few lines to check for titles
        file.file.seek(0)
        content = file.file.read(1024).decode('utf-8')
        file.file.seek(0)

        # 2. If it starts with "KPI Summary", skip that line
        if content.startswith("KPI Summary"):
            df = pd.read_csv(file.file, skiprows=1)
        else:
            df = pd.read_csv(file.file)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {str(e)}")

    # CHECK: Is this a Summary Report?
    if "Metric" in df.columns or "Product Name" in df.columns:
        return df

    # CHECK: Is this a Raw Transaction file?
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {missing}. Detected columns were: {list(df.columns)}"
        )

    df["date"] = pd.to_datetime(df["date"])
    return df