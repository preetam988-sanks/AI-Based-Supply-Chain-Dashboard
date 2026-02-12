from prophet import Prophet
import pandas as pd
import math

def historical_summary(df: pd.DataFrame):
    # Case 1: Raw Transaction Data (has 'revenue' column)
    if "revenue" in df.columns:
        total_revenue = df["revenue"].sum()
        total_orders = len(df)
        return {"total_revenue": float(total_revenue), "total_orders": total_orders}

    # Case 2: Summary Report (has 'Metric' and 'Value' columns)
    if "Metric" in df.columns:
        # Find the row where Metric is 'Revenue'
        rev_row = df[df['Metric'] == 'Revenue']['Value'].values
        revenue = rev_row[0] if len(rev_row) > 0 else "0"
        return {"summary_revenue": revenue}

    return {"message": "Could not calculate totals from this file format."}

def best_selling_product(df: pd.DataFrame):
    # 1. Check for Summary Report format (uses 'Product Name')
    if "Product Name" in df.columns:
        # The summary report already sorts these by 'Units Sold'
        # So we take the very first item in the 'Product Name' column
        top_product = df["Product Name"].iloc[0]
        return f"Your top product is {top_product}"

    # 2. Check for Raw Transaction Data (uses 'product' and 'quantity')
    if "product" in df.columns and "quantity" in df.columns:
        product = (
            df.groupby("product")["quantity"]
            .sum()
            .idxmax()
        )
        return product

    return "Could not find product data. Please check your CSV column headers."

def analyze_profitability(df: pd.DataFrame):
    if "cost_price" in df.columns and "revenue" in df.columns:
        # Profit = Total Revenue - (Cost * Quantity)
        df['profit'] = df['revenue'] - (df['cost_price'] * df['quantity'])

        # Group by product to see which one is the real money maker
        profit_by_product = df.groupby("product")["profit"].sum()
        best_p = profit_by_product.idxmax()
        total_p = profit_by_product.max()

        return {
            "best_profitable_product": best_p,
            "total_profit_earned": f"₹{total_p:,.2f}",
            "message": f"The {best_p} is your most profitable item."
        }
    return "I need cost data to calculate profit."

# def next_month_prediction(df: pd.DataFrame):
#     df["month"] = df["date"].dt.to_period("M")
#     monthly = df.groupby("month")["revenue"].sum()
#
#     if len(monthly) < 2:
#         return "I need at least 2 months of data to predict a trend. Currently, I only see 1 month."
#
#     avg_growth = monthly.pct_change().mean()
#     last = monthly.iloc[-1]
#     prediction = last * (1 + avg_growth)
#     return f"Based on growth trends, next month's predicted revenue is ₹{round(float(prediction), 2):,.2f}"
def next_month_prediction(df: pd.DataFrame):
    try:
        df['date'] = pd.to_datetime(df['date'])

        daily_sales = df.groupby('date')['revenue'].sum().reset_index()
        m_total = Prophet(yearly_seasonality=False, weekly_seasonality=True, daily_seasonality=False)
        m_total.fit(daily_sales.rename(columns={'date': 'ds', 'revenue': 'y'}))
        future_total = m_total.make_future_dataframe(periods=30)
        forecast_total = m_total.predict(future_total)
        total_predicted = forecast_total.iloc[-30:]['yhat'].sum()

        product_results = []
        for prod in df['product'].unique():
            prod_df = df[df['product'] == prod].groupby('date')['quantity'].sum().reset_index()

            if len(prod_df) > 5:
                m_prod = Prophet(yearly_seasonality=False, weekly_seasonality=True, daily_seasonality=False)
                m_prod.fit(prod_df.rename(columns={'date': 'ds', 'quantity': 'y'}))
                f_prod = m_prod.make_future_dataframe(periods=30)
                p_prod = m_prod.predict(f_prod)
                pred_qty = p_prod.iloc[-30:]['yhat'].sum()
            else:
                pred_qty = prod_df['quantity'].mean() * 30

            avg_price = (df[df['product'] == prod]['revenue'] / df[df['product'] == prod]['quantity']).mean()

            product_results.append({
                "product": prod,
                "predicted_qty": round(float(pred_qty), 0),
                "expected_revenue": round(float(pred_qty * avg_price), 2)
            })

        # 3. RANKING (The "What to buy" vs "What to avoid" logic)
        top_buy = sorted(product_results, key=lambda x: x['predicted_qty'], reverse=True)[:10]
        dead_stock = sorted(product_results, key=lambda x: x['predicted_qty'])[:10]

        return {
            "forecast_30d_total": f"₹{total_predicted:,.2f}",
            "top_buy_list": top_buy,
            "least_priority_list": dead_stock,
            "message": f"AI Forecast complete. Stock up on {top_buy[0]['product']}. Declining trend detected for {dead_stock[0]['product']}."
        }
    except Exception as e:
        return {"error": str(e)}

def yearly_forecast_logic(df: pd.DataFrame):
    # Ensure you have daily data for a full year
    daily_sales = df.groupby('date')['revenue'].sum().reset_index()

    # 1. Enable Yearly Seasonality
    model = Prophet(
        yearly_seasonality=True,  # Captures annual spikes (Diwali, New Year)
        weekly_seasonality=True,  # Captures weekend spikes
        daily_seasonality=False
    )

    model.fit(daily_sales.rename(columns={'date': 'ds', 'revenue': 'y'}))

    # 2. Predict for the next full year
    future = model.make_future_dataframe(periods=365)
    forecast = model.predict(future)

    return forecast