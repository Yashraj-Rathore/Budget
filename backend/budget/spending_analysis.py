# spending_analysis.py

import pandas as pd
import numpy as np
from datetime import datetime
from .models import Transaction
from sklearn.linear_model import LinearRegression


class SpendingAnalysis:
    # ---------------------------
    #  Fetch DB -> DataFrame
    # ---------------------------
    @staticmethod
    def fetch_transactions(user):
        qs = Transaction.objects.filter(user=user).select_related("category")

        data = [
            {
                "amount": float(t.amount),
                "category": t.category.name,
                "type": t.type,
                "date": t.date,
            }
            for t in qs
        ]

        return pd.DataFrame(data)


    # ---------------------------
    #  Core Analysis
    # ---------------------------
    @staticmethod
    def analyze_spending(data):
        if data.empty:
            return {"error": "No data available for analysis"}

        df = data.copy()
        df["date"] = pd.to_datetime(df["date"])
        df["month"] = df["date"].dt.to_period("M").astype(str)

        # summary
        total_income = df[df["type"] == "income"]["amount"].sum()
        total_expenses = df[df["type"] == "expense"]["amount"].sum()
        balance = total_income - total_expenses

        # top categories
        by_cat = (
            df[df["type"] == "expense"]
            .groupby("category", as_index=False)["amount"]
            .sum()
            .sort_values("amount", ascending=False)
        )

        total_exp = max(total_expenses, 1e-9)
        by_cat["share"] = (by_cat["amount"] / total_exp).round(4)

        # month trends
        monthly = (
            df[df["type"] == "expense"]
            .groupby("month", as_index=False)["amount"]
            .sum()
            .sort_values("month")
        )

        monthly["mom_delta"] = monthly["amount"].pct_change().fillna(0).round(4)

        return {
            "summary": {
                "total_income": float(total_income),
                "total_expenses": float(total_expenses),
                "balance": float(balance),
            },
            "category_spending": by_cat.to_dict("records"),
            "monthly_spending": monthly.to_dict("records"),
        }


    # ---------------------------
    #  Rolling Average Forecast
    # ---------------------------
    @staticmethod
    def forecast_next_month(data, window=3):
        if data.empty:
            return {
                "predicted_expense": 0.0,
                "method": "rolling_average",
            }

        df = data.copy()
        df["date"] = pd.to_datetime(df["date"])
        df["month"] = df["date"].dt.to_period("M")

        monthly = (
            df[df["type"] == "expense"]
            .groupby("month", as_index=False)["amount"]
            .sum()
            .sort_values("month")
        )

        values = monthly["amount"].astype(float).values

        if len(values) == 0:
            pred = 0.0
        else:
            k = min(window, len(values))
            pred = float(np.mean(values[-k:]))

        return {
            "predicted_expense": round(pred, 2),
            "method": f"rolling_average_{window}m",
        }


    # ---------------------------
    #  Recurring Detection (Light)
    # ---------------------------
    @staticmethod
    def detect_recurring(data, tolerance=0.05):
        if data.empty:
            return []

        df = data.copy()
        df["date"] = pd.to_datetime(df["date"])
        df = df[df["type"] == "expense"]

        # group by approx amount bucket + category
        df["amt_band"] = (df["amount"].astype(float) // 5) * 5

        rec = (
            df.groupby(["category", "amt_band"])
            .agg(
                count=("amount", "size"),
                first_date=("date", "min"),
                last_date=("date", "max"),
            )
            .reset_index()
        )

        rec["months_span"] = ((rec["last_date"] - rec["first_date"]).dt.days / 30.0).clip(lower=1)
        rec["avg_per_month"] = rec["count"] / rec["months_span"]

        # Naive approach: if appears ~ monthly
        candidates = rec[rec["avg_per_month"] >= 0.8].copy()

        return candidates[["category", "amt_band", "count"]].to_dict("records")
