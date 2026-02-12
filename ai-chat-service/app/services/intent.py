def detect_intent(question: str) -> str:
    q = question.lower()

    if "profit" in q or "margin" in q:
        return "PROFIT_ANALYSIS"

    if "trend" in q or "highest" in q or "best" in q:
        return "BEST_PRODUCT"

    if "forecast" in q or "predict" in q or "next month" in q:
        return "FORECAST"

    if "history" in q or "past" in q or "total" in q:
        return "HISTORICAL"

    return "UNKNOWN"