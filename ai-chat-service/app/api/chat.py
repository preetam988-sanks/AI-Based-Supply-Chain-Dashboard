from fastapi import APIRouter, UploadFile, File, Form
from app.utils.csv_loader import load_csv
from app.services.intent import detect_intent
# ADD 'analyze_profitability' TO THIS IMPORT LIST BELOW
from app.services.forecast import (
    historical_summary,
    best_selling_product,
    next_month_prediction,
    analyze_profitability
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
        # This will now work because of the import above
        answer = analyze_profitability(df)
    else:
        answer = "Sorry, I couldn't understand the question."

    return {
        "question": questions,
        "intent": intent,
        "answer": answer
    }