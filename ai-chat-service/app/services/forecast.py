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

# def historical_summary(df: pd.DataFrame):
#     if "revenue" in df.columns:
#         total_revenue = df["revenue"].sum()
#         total_orders = len(df)
#         return {"total_revenue": float(total_revenue), "total_orders": total_orders}
#     return {"message": "Could not calculate totals from this file format."}
#
# def best_selling_product(df: pd.DataFrame):
#     if "product" in df.columns and "quantity" in df.columns:
#         product = df.groupby("product")["quantity"].sum().idxmax()
#         return f"Your top product is {product}"
#     return "Could not find product data."
#
# def analyze_profitability(df: pd.DataFrame):
#     if "cost_price" in df.columns and "revenue" in df.columns and "quantity" in df.columns:
#         df['profit'] = df['revenue'] - (df['cost_price'] * df['quantity'])
#         profit_by_product = df.groupby("product")["profit"].sum().reset_index()
#
#         # Returns top 10 profitable items
#         top_profitable = profit_by_product.nlargest(10, 'profit').to_dict('records')
#         best_p = profit_by_product.loc[profit_by_product['profit'].idxmax()]
#
#         return {
#             "best_profitable_product": best_p['product'],
#             "total_profit_earned": f"₹{best_p['profit']:,.2f}",
#             "top_buy_list": [{"product": r['product'], "profit": r['profit']} for r in top_profitable],
#             "message": f"The {best_p['product']} is your most profitable item."
#         }
#     return "I need 'cost_price', 'revenue', and 'quantity' columns to calculate profit."
#
# def get_seasonal_trends(df: pd.DataFrame):
#     """
#     Groups data by month and identifies the top 3 products based on QUANTITY.
#     """
#     try:
#         df['date'] = pd.to_datetime(df['date'])
#         df['month_name'] = df['date'].dt.strftime('%B')
#
#         month_order = ["January", "February", "March", "April", "May", "June",
#                        "July", "August", "September", "October", "November", "December"]
#
#         # CHANGE: We now group by 'quantity' instead of 'revenue' to see what's popular
#         monthly_prod_sales = df.groupby(['month_name', 'product'])['quantity'].sum().reset_index()
#         available_months = [m for m in month_order if m in monthly_prod_sales['month_name'].unique()]
#
#         seasonal_report = []
#         for month in available_months:
#             month_data = monthly_prod_sales[monthly_prod_sales['month_name'] == month]
#             # Identifying top 3 based on unit volume
#             top_3 = month_data.nlargest(3, 'quantity')
#
#             products_list = []
#             for _, row in top_3.iterrows():
#                 # We still keep revenue in the display for the UI
#                 rev = df[(df['month_name'] == month) & (df['product'] == row['product'])]['revenue'].sum()
#                 products_list.append({
#                     "name": row['product'],
#                     "revenue": float(rev),
#                     "quantity": int(row['quantity']) # Adding quantity back to the data
#                 })
#
#             seasonal_report.append({
#                 "month": month,
#                 "top_products": products_list
#             })
#
#         # Best month is still usually determined by total revenue
#         best_month_name = df.groupby('month_name')['revenue'].sum().idxmax()
#
#         return {
#             "most_promising_month": best_month_name,
#             "monthly_breakdown": seasonal_report,
#             "message": f"Market analysis identifies {best_month_name} as your peak demand period."
#         }
#     except Exception as e:
#         return {"error": str(e)}
#
# def next_month_prediction(df: pd.DataFrame):
#     """
#     Generates a 30-day forecast and identifies the top 10 best and 10 lowest performing products.
#     """
#     try:
#         df['date'] = pd.to_datetime(df['date'])
#         daily_sales = df.groupby('date')['revenue'].sum().reset_index()
#
#         if len(daily_sales) < 10:
#             X = np.array(range(len(daily_sales))).reshape(-1, 1)
#             y = daily_sales['revenue'].values
#             model = LinearRegression().fit(X, y)
#             total_predicted = np.sum(model.predict(np.array(range(len(daily_sales), len(daily_sales) + 30)).reshape(-1, 1)))
#             method = "Linear Trend"
#         else:
#             m = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
#             m.fit(daily_sales.rename(columns={'date': 'ds', 'revenue': 'y'}))
#             forecast = m.predict(m.make_future_dataframe(periods=30))
#             total_predicted = forecast.iloc[-30:]['yhat'].sum()
#             method = "Prophet Seasonal Model"
#
#         unique_products = df['product'].unique()
#         product_results = []
#         total_hist_revenue = df['revenue'].sum()
#
#         for prod in unique_products:
#             prod_df = df[df['product'] == prod]
#             revenue_share = prod_df['revenue'].sum() / total_hist_revenue if total_hist_revenue > 0 else 0
#             expected_prod_rev = total_predicted * revenue_share
#
#             # Use unit price to estimate quantity
#             avg_price = (prod_df['revenue'] / prod_df['quantity']).mean()
#             predicted_qty = expected_prod_rev / avg_price if avg_price > 0 else 0
#
#             product_results.append({
#                 "product": prod,
#                 "predicted_qty": round(float(predicted_qty), 0),
#                 "expected_revenue": round(float(expected_prod_rev), 2)
#             })
#
#         # Return TOP 10 and LEAST 10
#         return {
#             "forecast_30d_total": f"₹{max(0, total_predicted):,.2f}",
#             "methodology": method,
#             "top_buy_list": sorted(product_results, key=lambda x: x['predicted_qty'], reverse=True)[:10],
#             "least_priority_list": sorted(product_results, key=lambda x: x['predicted_qty'])[:10],
#             "message": f"Forecast generated using {method}. High demand expected for {product_results[0]['product']}."
#         }
#     except Exception as e:
#         return {"error": str(e)}

# import pandas as pd
# import numpy as np
# from prophet import Prophet
# from sklearn.linear_model import LinearRegression
#
# def get_abc_analysis(df: pd.DataFrame):
#     items = df.groupby('product')['revenue'].sum().sort_values(ascending=False).reset_index()
#     total_rev = items['revenue'].sum()
#     items['running_sum'] = items['revenue'].cumsum()
#     abc_results = []
#     for _, row in items.iterrows():
#         share = (row['running_sum'] / total_rev) * 100
#         category = "A" if share <= 70 else "B" if share <= 90 else "C"
#         abc_results.append({
#             "product": row['product'],
#             "category": category,
#             "revenue": float(row['revenue'])
#         })
#     return abc_results
#
# def get_seasonal_trends(df: pd.DataFrame):
#     try:
#         df['date'] = pd.to_datetime(df['date'])
#         df['month_name'] = df['date'].dt.strftime('%B')
#         month_order = ["January", "February", "March", "April", "May", "June",
#                        "July", "August", "September", "October", "November", "December"]
#         monthly_prod_sales = df.groupby(['month_name', 'product'])['quantity'].sum().reset_index()
#         available_months = [m for m in month_order if m in monthly_prod_sales['month_name'].unique()]
#         seasonal_report = []
#         for month in available_months:
#             month_data = monthly_prod_sales[monthly_prod_sales['month_name'] == month]
#             top_3 = month_data.nlargest(3, 'quantity')
#             products_list = []
#             for _, row in top_3.iterrows():
#                 rev = df[(df['month_name'] == month) & (df['product'] == row['product'])]['revenue'].sum()
#                 products_list.append({"name": row['product'], "revenue": float(rev), "quantity": int(row['quantity'])})
#             seasonal_report.append({"month": month, "top_products": products_list})
#         best_month_name = df.groupby('month_name')['revenue'].sum().idxmax()
#         return {"most_promising_month": best_month_name, "monthly_breakdown": seasonal_report}
#     except Exception as e:
#         return {"error": str(e)}
#
# def next_month_prediction(df: pd.DataFrame):
#     try:
#         df['date'] = pd.to_datetime(df['date'])
#         daily_sales = df.groupby('date')['revenue'].sum().reset_index()
#         if len(daily_sales) < 10:
#             X = np.array(range(len(daily_sales))).reshape(-1, 1)
#             y = daily_sales['revenue'].values
#             model = LinearRegression().fit(X, y)
#             total_predicted = np.sum(model.predict(np.array(range(len(daily_sales), len(daily_sales) + 30)).reshape(-1, 1)))
#             method = "Linear Trend"
#         else:
#             m = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False, uncertainty_samples=0)
#             m.fit(daily_sales.rename(columns={'date': 'ds', 'revenue': 'y'}))
#             forecast = m.predict(m.make_future_dataframe(periods=30))
#             total_predicted = forecast.iloc[-30:]['yhat'].sum()
#             method = "Prophet Seasonal Model"
#         unique_products = df['product'].unique()
#         product_results = []
#         total_hist_revenue = df['revenue'].sum()
#         for prod in unique_products:
#             prod_df = df[df['product'] == prod]
#             revenue_share = prod_df['revenue'].sum() / total_hist_revenue if total_hist_revenue > 0 else 0
#             expected_prod_rev = total_predicted * revenue_share
#             avg_price = (prod_df['revenue'] / prod_df['quantity']).mean()
#             predicted_qty = expected_prod_rev / avg_price if avg_price > 0 else 0
#             status = "Healthy"
#             if predicted_qty > 100: status = "Stock Warning"
#             product_results.append({
#                 "product": prod,
#                 "predicted_qty": round(float(predicted_qty), 0),
#                 "expected_revenue": round(float(expected_prod_rev), 2),
#                 "status": status
#             })
#         return {
#             "forecast_30d_total": f"₹{max(0, total_predicted):,.2f}",
#             "methodology": method,
#             "top_buy_list": sorted(product_results, key=lambda x: x['predicted_qty'], reverse=True)[:10],
#             "abc_analysis": get_abc_analysis(df)
#         }
#     except Exception as e:
#         return {"error": str(e)}
#
# def historical_summary(df: pd.DataFrame):
#     total_revenue = df["revenue"].sum()
#     total_orders = len(df)
#     return {"total_revenue": float(total_revenue), "total_orders": total_orders}
#
# def best_selling_product(df: pd.DataFrame):
#     product = df.groupby("product")["quantity"].sum().idxmax()
#     return {"top_product": product}
# def get_eoq_data(df: pd.DataFrame):
#     results = []
#     # Ordering Cost (S) and Holding Cost (H) are industry constants
#     S = 500  # Fixed cost per order (shipping/admin)
#     H_rate = 0.15  # 15% of product price per year to store it
#
#     products = df.groupby('product').agg({
#         'quantity': 'sum',
#         'revenue': 'mean' # Used to estimate unit price
#     }).reset_index()
#
#     total_days = (pd.to_datetime(df['date']).max() - pd.to_datetime(df['date']).min()).days or 1
#
#     for _, row in products.iterrows():
#         annual_demand = (row['quantity'] / total_days) * 365
#         unit_price = row['revenue']
#         holding_cost = unit_price * H_rate
#
#         # Economic Order Quantity Formula: sqrt(2DS/H)
#         eoq = math.sqrt((2 * annual_demand * S) / max(holding_cost, 1))
#
#         # Reorder Point (Safety logic)
#         lead_time = 7 # 7 days to get stock
#         daily_usage = annual_demand / 365
#         reorder_point = daily_usage * lead_time * 1.2 # 20% safety buffer
#
#         results.append({
#             "product": row['product'],
#             "recommended_order_size": round(eoq, 0),
#             "reorder_at_stock_level": round(reorder_point, 0)
#         })
#     return results
#
# def next_month_prediction(df: pd.DataFrame):
#     # ... (Keep your existing Prophet code from the last step)
#     # At the end of the return dictionary, add the EOQ data
#     forecast_results = {
#         "forecast_30d_total": f"₹{max(0, total_predicted):,.2f}",
#         "methodology": method,
#         "top_buy_list": sorted(product_results, key=lambda x: x['predicted_qty'], reverse=True)[:10],
#         "abc_analysis": get_abc_analysis(df),
#         "inventory_optimization": get_eoq_data(df) # NEW
#     }
#     return forecast_results
import pandas as pd
import numpy as np
import math
from prophet import Prophet
from sklearn.linear_model import LinearRegression

def get_abc_analysis(df: pd.DataFrame):
    items = df.groupby('product')['revenue'].sum().sort_values(ascending=False).reset_index()
    total_rev = items['revenue'].sum()
    items['running_sum'] = items['revenue'].cumsum()
    abc_results = []
    for _, row in items.iterrows():
        share = (row['running_sum'] / total_rev) * 100
        category = "A" if share <= 70 else "B" if share <= 90 else "C"
        abc_results.append({
            "product": row['product'],
            "category": category,
            "revenue": float(row['revenue'])
        })
    return abc_results

def get_eoq_data(df: pd.DataFrame):
    results = []
    S = 500  # Fixed Ordering Cost
    H_rate = 0.15  # Holding Cost Rate (15%)

    # Group by product to get demand and average revenue
    products = df.groupby('product').agg({
        'quantity': 'sum',
        'revenue': 'mean'
    }).reset_index()

    # Calculate total days in the dataset to annualize demand
    df['date'] = pd.to_datetime(df['date'])
    total_days = (df['date'].max() - df['date'].min()).days or 1

    for _, row in products.iterrows():
        annual_demand = (row['quantity'] / total_days) * 365
        # Estimate unit price based on mean revenue/quantity for that product
        prod_samples = df[df['product'] == row['product']]
        avg_unit_price = (prod_samples['revenue'] / prod_samples['quantity']).mean()
        holding_cost = max(avg_unit_price * H_rate, 1)

        # EOQ = sqrt(2DS/H)
        eoq = math.sqrt((2 * annual_demand * S) / holding_cost)
        daily_usage = annual_demand / 365
        reorder_point = daily_usage * 7 * 1.2 # 7 day lead time + 20% safety buffer

        results.append({
            "product": row['product'],
            "recommended_order_size": round(eoq, 0),
            "reorder_at_stock_level": round(reorder_point, 0)
        })
    return results

def get_seasonal_trends(df: pd.DataFrame):
    df['date'] = pd.to_datetime(df['date'])
    df['month_name'] = df['date'].dt.strftime('%B')
    month_order = ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]

    monthly_prod_sales = df.groupby(['month_name', 'product'])['quantity'].sum().reset_index()
    available_months = [m for m in month_order if m in monthly_prod_sales['month_name'].unique()]

    seasonal_report = []
    for month in available_months:
        month_data = monthly_prod_sales[monthly_prod_sales['month_name'] == month]
        top_3 = month_data.nlargest(3, 'quantity')
        products_list = [{"name": r['product'],
                          "revenue": float(df[(df['month_name']==month) & (df['product']==r['product'])]['revenue'].sum()),
                          "quantity": int(r['quantity'])} for _, r in top_3.iterrows()]
        seasonal_report.append({"month": month, "top_products": products_list})

    best_month = df.groupby('month_name')['revenue'].sum().idxmax()
    return {"most_promising_month": best_month, "monthly_breakdown": seasonal_report}

def next_month_prediction(df: pd.DataFrame):
    df['date'] = pd.to_datetime(df['date'])
    daily_sales = df.groupby('date')['revenue'].sum().reset_index()

    if len(daily_sales) < 10:
        X = np.array(range(len(daily_sales))).reshape(-1, 1)
        model = LinearRegression().fit(X, daily_sales['revenue'].values)
        total_predicted = np.sum(model.predict(np.array(range(len(daily_sales), len(daily_sales) + 30)).reshape(-1, 1)))
        method = "Linear Trend"
    else:
        m = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False, uncertainty_samples=0)
        m.fit(daily_sales.rename(columns={'date': 'ds', 'revenue': 'y'}))
        forecast = m.predict(m.make_future_dataframe(periods=30))
        total_predicted = forecast.iloc[-30:]['yhat'].sum()
        method = "Prophet Seasonal Model"

    product_results = []
    total_hist_rev = df['revenue'].sum()
    for prod in df['product'].unique():
        prod_df = df[df['product'] == prod]
        share = prod_df['revenue'].sum() / total_hist_rev if total_hist_rev > 0 else 0
        pred_rev = total_predicted * share
        avg_price = (prod_df['revenue'] / prod_df['quantity']).mean()
        pred_qty = pred_rev / avg_price if avg_price > 0 else 0
        product_results.append({"product": prod, "predicted_qty": round(float(pred_qty), 0), "expected_revenue": round(float(pred_rev), 2)})

    return {
        "forecast_30d_total": f"₹{max(0, total_predicted):,.2f}",
        "methodology": method,
        "top_buy_list": sorted(product_results, key=lambda x: x['predicted_qty'], reverse=True)[:10],
        "abc_analysis": get_abc_analysis(df),
        "inventory_optimization": get_eoq_data(df),
        "message": f"Forecast generated using {method}. High demand expected for {product_results[0]['product'] if product_results else 'N/A'}."
    }

def historical_summary(df: pd.DataFrame):
    return {"total_revenue": float(df["revenue"].sum()), "total_orders": len(df)}

def best_selling_product(df: pd.DataFrame):
    return {"top_product": df.groupby("product")["quantity"].sum().idxmax()}