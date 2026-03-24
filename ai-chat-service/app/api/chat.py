from fastapi import APIRouter, UploadFile, File, Form
from app.utils.csv_loader import load_csv
from app.services.intent import detect_intent
from app.services.forecast import (
    historical_summary,
    best_selling_product,
    next_month_prediction,
    analyze_profitability,
    get_seasonal_trends # Add this
)

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("")
async def chat(
        questions: str = Form(...),
        file: UploadFile = File(...)
):
    df = load_csv(file)
    intent = detect_intent(questions)

    if intent == "HISTORICAL":
        answer = historical_summary(df)
    elif intent == "BEST_PRODUCT":
        answer = best_selling_product(df)
    elif intent == "FORECAST":
        answer = next_month_prediction(df)
    elif intent == "PROFIT_ANALYSIS":
        answer = analyze_profitability(df)
    elif intent == "SEASONAL":
        answer = get_seasonal_trends(df)
    else:
        answer = "Sorry, I couldn't understand the question."

    # We return intent here so Java saves it inside the 'result' JSON string
    return {
        "question": questions,
        "intent": intent,
        "answer": answer
    }