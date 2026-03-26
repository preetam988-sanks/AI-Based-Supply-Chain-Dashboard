def detect_intent(question: str) -> str:
    q = question.lower()
    if "abc" in q or "importance" in q or "category" in q:
        return "ABC_ANALYSIS"
    if "seasonal" in q or "pattern" in q or "month" in q:
        return "SEASONAL"
    if "trend" in q or "highest" in q or "best" in q:
        return "BEST_PRODUCT"
    if "forecast" in q or "predict" in q or "next" in q:
        return "FORECAST"
    if "history" in q or "past" in q or "total" in q:
        return "HISTORICAL"
    if "how much" in q or "order" in q or "stock" in q or "inventory" in q or "optimize" in q:
        return "INVENTORY_OPTIMIZATION"
    return "UNKNOWN"