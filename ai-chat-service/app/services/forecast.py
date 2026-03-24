# import pandas as pd
# import numpy as np
# import math
# from prophet import Prophet
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import LSTM, Dense, Dropout
# from sklearn.preprocessing import MinMaxScaler
#
# def train_lstm_on_residuals(residuals, lookback=7):
#     scaler = MinMaxScaler(feature_range=(0, 1))
#     scaled_res = scaler.fit_transform(residuals.reshape(-1, 1))
#     X, y = [], []
#     for i in range(lookback, len(scaled_res)):
#         X.append(scaled_res[i-lookback:i, 0])
#         y.append(scaled_res[i, 0])
#     X, y = np.array(X), np.array(y)
#     X = np.reshape(X, (X.shape[0], X.shape[1], 1))
#     model = Sequential([
#         LSTM(32, activation='relu', input_shape=(lookback, 1), return_sequences=True),
#         Dropout(0.1),
#         LSTM(32, activation='relu'),
#         Dense(1)
#     ])
#     model.compile(optimizer='adam', loss='mse')
#     model.fit(X, y, epochs=5, batch_size=16, verbose=0)
#     return model, scaler
#
# def predict_future_residuals(model, scaler, last_residuals, steps=30, lookback=7):
#     current_batch = scaler.transform(last_residuals[-lookback:].reshape(-1, 1))
#     current_batch = current_batch.reshape((1, lookback, 1))
#     corrections = []
#     for _ in range(steps):
#         next_pred = model.predict(current_batch, verbose=0)[0]
#         corrections.append(next_pred)
#         current_batch = np.append(current_batch[:, 1:, :], [[next_pred]], axis=1)
#     return scaler.inverse_transform(np.array(corrections).reshape(-1, 1)).flatten()
#
# def historical_summary(df: pd.DataFrame):
#     if "revenue" in df.columns:
#         total_revenue = df["revenue"].sum()
#         total_orders = len(df)
#         return {"total_revenue": float(total_revenue), "total_orders": total_orders}
#     if "Metric" in df.columns:
#         rev_row = df[df['Metric'] == 'Revenue']['Value'].values
#         revenue = rev_row[0] if len(rev_row) > 0 else "0"
#         return {"summary_revenue": revenue}
#     return {"message": "Could not calculate totals from this file format."}
#
# def best_selling_product(df: pd.DataFrame):
#     if "Product Name" in df.columns:
#         top_product = df["Product Name"].iloc[0]
#         return f"Your top product is {top_product}"
#     if "product" in df.columns and "quantity" in df.columns:
#         product = df.groupby("product")["quantity"].sum().idxmax()
#         return product
#     return "Could not find product data. Please check your CSV column headers."
#
# def analyze_profitability(df: pd.DataFrame):
#     if "cost_price" in df.columns and "revenue" in df.columns:
#         df['profit'] = df['revenue'] - (df['cost_price'] * df['quantity'])
#         profit_by_product = df.groupby("product")["profit"].sum()
#         best_p = profit_by_product.idxmax()
#         total_p = profit_by_product.max()
#         return {
#             "best_profitable_product": best_p,
#             "total_profit_earned": f"₹{total_p:,.2f}",
#             "message": f"The {best_p} is your most profitable item."
#         }
#     return "I need cost data to calculate profit."
#
# def next_month_prediction(df: pd.DataFrame):
#     try:
#         df['date'] = pd.to_datetime(df['date'])
#         daily_sales = df.groupby('date')['revenue'].sum().reset_index()
#         lookback = 7
#         m_total = Prophet(yearly_seasonality=False, weekly_seasonality=True, daily_seasonality=False, uncertainty_samples=0)
#         m_total.fit(daily_sales.rename(columns={'date': 'ds', 'revenue': 'y'}))
#         hist_forecast = m_total.predict(daily_sales.rename(columns={'date': 'ds'}))
#         residuals = daily_sales['revenue'].values - hist_forecast['yhat'].values
#         if len(residuals) > lookback + 5:
#             lstm_model, scaler = train_lstm_on_residuals(residuals, lookback)
#             corrections = predict_future_residuals(lstm_model, scaler, residuals, steps=30, lookback=lookback)
#         else:
#             corrections = np.zeros(30)
#         future_total = m_total.make_future_dataframe(periods=30)
#         forecast_total = m_total.predict(future_total)
#         prophet_30d = forecast_total.iloc[-30:]['yhat'].values
#         hybrid_30d = prophet_30d + corrections
#         total_predicted = hybrid_30d.sum()
#         product_results = []
#         unique_products = df['product'].unique()
#         for prod in unique_products:
#             prod_df = df[df['product'] == prod].groupby('date')['quantity'].sum().reset_index()
#             if len(prod_df) > 10:
#                 m_prod = Prophet(yearly_seasonality=False, weekly_seasonality=True, daily_seasonality=False, uncertainty_samples=0)
#                 m_prod.fit(prod_df.rename(columns={'date': 'ds', 'quantity': 'y'}))
#                 f_prod = m_prod.make_future_dataframe(periods=30)
#                 p_prod = m_prod.predict(f_prod)
#                 pred_qty = p_prod.iloc[-30:]['yhat'].sum()
#             else:
#                 pred_qty = prod_df['quantity'].mean() * 30
#             avg_price = (df[df['product'] == prod]['revenue'] / df[df['product'] == prod]['quantity']).mean()
#             product_results.append({
#                 "product": prod,
#                 "predicted_qty": round(float(pred_qty), 0),
#                 "expected_revenue": round(float(pred_qty * avg_price), 2)
#             })
#         top_buy = sorted(product_results, key=lambda x: x['predicted_qty'], reverse=True)[:10]
#         dead_stock = sorted(product_results, key=lambda x: x['predicted_qty'])[:10]
#         return {
#             "forecast_30d_total": f"₹{max(0, total_predicted):,.2f}",
#             "methodology": "Hybrid Deep Learning (Prophet + LSTM)",
#             "top_buy_list": top_buy,
#             "least_priority_list": dead_stock,
#             "message": f"AI Hybrid Forecast complete. Refined by LSTM. Stock up on {top_buy[0]['product']}."
#         }
#     except Exception as e:
#         return {"error": str(e)}
#
# def yearly_forecast_logic(df: pd.DataFrame):
#     daily_sales = df.groupby('date')['revenue'].sum().reset_index()
#     model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False, uncertainty_samples=0)
#     model.fit(daily_sales.rename(columns={'date': 'ds', 'revenue': 'y'}))
#     future = model.make_future_dataframe(periods=365)
#     forecast = model.predict(future)
#     return forecast
# tensorflow==2.16.1
import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.linear_model import LinearRegression

def historical_summary(df: pd.DataFrame):
    if "revenue" in df.columns:
        total_revenue = df["revenue"].sum()
        total_orders = len(df)
        return {"total_revenue": float(total_revenue), "total_orders": total_orders}
    if "Metric" in df.columns:
        rev_row = df[df['Metric'] == 'Revenue']['Value'].values
        revenue = rev_row[0] if len(rev_row) > 0 else "0"
        return {"summary_revenue": revenue}
    return {"message": "Could not calculate totals from this file format."}

def best_selling_product(df: pd.DataFrame):
    if "product" in df.columns and "quantity" in df.columns:
        product = df.groupby("product")["quantity"].sum().idxmax()
        return f"Your top product is {product}"
    return "Could not find product data. Please check your CSV column headers."

def analyze_profitability(df: pd.DataFrame):
    if "cost_price" in df.columns and "revenue" in df.columns and "quantity" in df.columns:
        # Calculate profit per row: Revenue - (Cost * Quantity)
        df['profit'] = df['revenue'] - (df['cost_price'] * df['quantity'])
        profit_by_product = df.groupby("product")["profit"].sum()
        best_p = profit_by_product.idxmax()
        total_p = profit_by_product.max()
        return {
            "best_profitable_product": best_p,
            "total_profit_earned": f"₹{total_p:,.2f}",
            "message": f"The {best_p} is your most profitable item."
        }
    return "I need 'cost_price', 'revenue', and 'quantity' columns to calculate profit."

def get_seasonal_trends(df: pd.DataFrame):
    """
    Analyzes seasonal patterns. Requires at least 10 days for weekly
    and ideally 180+ days for yearly/monthly trends.
    """
    try:
        df['date'] = pd.to_datetime(df['date'])
        daily_sales = df.groupby('date')['revenue'].sum().reset_index()

        if len(daily_sales) < 10:
            return {"message": "Not enough data for seasonal analysis. Need at least 10 days of history."}

        # Enable yearly seasonality to catch monthly patterns
        model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
        model.fit(daily_sales.rename(columns={'date': 'ds', 'revenue': 'y'}))

        future = model.make_future_dataframe(periods=365)
        forecast = model.predict(future)

        result = {"type": "Seasonal Pattern Analysis"}

        # Extract Monthly patterns (Yearly component)
        if 'yearly' in forecast.columns:
            forecast['month'] = forecast['ds'].dt.strftime('%B')
            monthly_values = forecast.groupby('month')['yearly'].mean().to_dict()
            month_order = ["January", "February", "March", "April", "May", "June",
                           "July", "August", "September", "October", "November", "December"]
            result["monthly_trends"] = {m: round(float(monthly_values[m]), 2) for m in month_order if m in monthly_values}
            result["peak_season"] = max(result["monthly_trends"], key=result["monthly_trends"].get)

        # Extract Weekly patterns
        if 'weekly' in forecast.columns:
            forecast['day'] = forecast['ds'].dt.day_name()
            weekly_values = forecast.groupby('day')['weekly'].mean().to_dict()
            result["weekly_trends"] = {d: round(float(v), 2) for d, v in weekly_values.items()}
            result["best_day_of_week"] = max(weekly_values, key=weekly_values.get)

        result["message"] = f"Analysis complete. Peak season identified as {result.get('peak_season', 'N/A')}."
        return result
    except Exception as e:
        return {"error": f"Seasonal analysis failed: {str(e)}"}

def next_month_prediction(df: pd.DataFrame):
    """
    Hybrid logic: Uses Linear Regression for tiny datasets (<10 days)
    and Prophet for larger datasets to ensure accuracy and stability.
    """
    try:
        df['date'] = pd.to_datetime(df['date'])
        daily_sales = df.groupby('date')['revenue'].sum().reset_index()

        # --- THE SMART SWITCH ---
        if len(daily_sales) < 10:
            # Linear Regression for small data (stable, no crashes)
            X = np.array(range(len(daily_sales))).reshape(-1, 1)
            y = daily_sales['revenue'].values
            model = LinearRegression()
            model.fit(X, y)

            future_X = np.array(range(len(daily_sales), len(daily_sales) + 30)).reshape(-1, 1)
            prediction_30d = model.predict(future_X)
            total_predicted = np.sum(prediction_30d)
            method = "Linear Trend (Small Dataset)"
        else:
            # Prophet for large data (captures seasonality)
            m = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
            m.fit(daily_sales.rename(columns={'date': 'ds', 'revenue': 'y'}))
            future = m.make_future_dataframe(periods=30)
            forecast = m.predict(future)
            total_predicted = forecast.iloc[-30:]['yhat'].sum()
            method = "Prophet Seasonal Model"

        # --- Product Distribution Logic ---
        unique_products = df['product'].unique()
        product_results = []

        # Calculate overall proportions to distribute the predicted total revenue
        total_hist_revenue = df['revenue'].sum()

        for prod in unique_products:
            prod_df = df[df['product'] == prod]
            prod_hist_rev = prod_df['revenue'].sum()

            # Percentage of total business this product represents
            revenue_share = prod_hist_rev / total_hist_revenue if total_hist_revenue > 0 else 0

            # Expected revenue for this product next month
            expected_prod_rev = total_predicted * revenue_share

            # Estimate quantity based on average unit price
            avg_price = (prod_df['revenue'] / prod_df['quantity']).mean()
            predicted_qty = expected_prod_rev / avg_price if avg_price > 0 else 0

            product_results.append({
                "product": prod,
                "predicted_qty": round(float(predicted_qty), 0),
                "expected_revenue": round(float(expected_prod_rev), 2)
            })

        top_buy = sorted(product_results, key=lambda x: x['predicted_qty'], reverse=True)[:5]
        dead_stock = sorted(product_results, key=lambda x: x['predicted_qty'])[:5]

        return {
            "forecast_30d_total": f"₹{max(0, total_predicted):,.2f}",
            "methodology": method,
            "top_buy_list": top_buy,
            "least_priority_list": dead_stock,
            "message": f"Forecast generated using {method}. Stock up on {top_buy[0]['product']}."
        }
    except Exception as e:
        return {"error": str(e)}