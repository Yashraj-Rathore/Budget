# spending_analysis.py

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
import pandas as pd
from .models import Transaction
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

class SpendingAnalysis:
    @staticmethod
    def fetch_transactions(user):
        """
        Fetch transactions for the user from the database.
        """
        transactions = Transaction.objects.all()
        data = []

        for transaction in transactions:
            data.append({
                "amount": transaction.amount,
                "category": transaction.category.name,
                "type": transaction.type,
                "date": transaction.date
            })

        return pd.DataFrame(data)

    @staticmethod
    def analyze_spending(data):
        """
        Analyze the user's spending habits.
        """
        # Ensure there's data to analyze
        if data.empty:
            return {"error": "No data available for analysis"}

        # Calculate total spent by category
        category_spending = data[data['type'] == 'expense'].groupby('category')['amount'].sum().reset_index()

        # Total income and expenses
        total_income = data[data['type'] == 'income']['amount'].sum()
        total_expenses = data[data['type'] == 'expense']['amount'].sum()

        # Monthly spending trends (sum of expenses by month)
        data['month'] = pd.to_datetime(data['date']).dt.to_period('M').astype(str)
        monthly_spending = data[data['type'] == 'expense'].groupby('month')['amount'].sum().reset_index()

        return {
            "category_spending": category_spending.to_dict('records'),
            "total_income": total_income,
            "total_expenses": total_expenses,
            "monthly_spending": monthly_spending.to_dict('records')
        }

    @staticmethod
    def provide_recommendations(data):
        """
        Provide spending recommendations based on past habits.
        """
        # Simple example of an ML model to predict next month's spending based on past spending
        if data.empty:
            return {"error": "No data available for predictions"}

        # Extract features and target for the model
        data['month'] = pd.to_datetime(data['date']).dt.month
        expense_data = data[data['type'] == 'expense']

        if len(expense_data) < 2:
            return {"recommendations": "Not enough data to provide predictions"}

        # Prepare training data for regression
        X = expense_data[['month']].values
        y = expense_data['amount'].values

        # Train the model
        model = LinearRegression()
        model.fit(X, y)

        # Predict spending for the next month
        next_month = [[(X[-1][0] % 12) + 1]]
        predicted_expense = model.predict(next_month)[0]

        # Prepare recommendations
        recommendations = f"Based on your spending pattern, you may spend approximately ${predicted_expense:.2f} next month. Consider optimizing expenses in high-spending categories."

        return {
            "predicted_next_month_expense": predicted_expense,
            "recommendations": recommendations
        }

    @staticmethod
    def categorize_spending(data):
        """
        Categorize spending by type (e.g., essentials, discretionary).
        """
        if data.empty:
            return {"error": "No data available for categorization"}

        categories = data['category'].unique()
        categorized_spending = {category: data[data['category'] == category]['amount'].sum() for category in categories}

        return categorized_spending

    @staticmethod
    def detect_irregular_spending(data):
        """
        Detect irregular spending patterns.
        """
        if data.empty:
            return {"error": "No data available for detecting irregularities"}

        expense_data = data[data['type'] == 'expense']
        if len(expense_data) < 2:
            return {"irregularities": "Not enough data to detect irregular spending"}

        avg_expense = expense_data['amount'].mean()
        irregularities = expense_data[expense_data['amount'] > (avg_expense * 1.5)]

        return irregularities.to_dict('records')

    @staticmethod
    def top_spending_categories(data):
        """
        Get the top spending categories.
        """
        if data.empty:
            return {"error": "No data available for top categories"}
	
     # Convert the 'amount' column to numeric if it's not already

        data['amount'] = pd.to_numeric(data['amount'], errors='coerce')
    
    # Ensure no NaN values are present
        data.dropna(subset=['amount'], inplace=True)	
        
        top_categories = data[data['type'] == 'expense'].groupby('category')['amount'].sum().nlargest(3).reset_index()
        return top_categories.to_dict('records')

    @staticmethod
    def check_budget_limits(data, category_limits):
        """
        Check if spending exceeds set budget limits for categories.
        """
        if data.empty:
            return {"error": "No data available for budget checks"}

        alerts = []
        for category, limit in category_limits.items():
            total_spent = data[(data['category'] == category) & (data['type'] == 'expense')]['amount'].sum()
            if total_spent > limit:
                alerts.append(f"Spending for {category} exceeds the limit of ${limit}")

        return alerts

    @staticmethod
    def generate_spending_trend_plot(data):
        """
        Generate a spending trend plot and return it as a base64-encoded string.
        """
        if data.empty:
            return ""

        data['month'] = pd.to_datetime(data['date']).dt.to_period('M')
        monthly_spending = data[data['type'] == 'expense'].groupby('month')['amount'].sum().reset_index()

        plt.figure(figsize=(10, 6))
        plt.plot(monthly_spending['month'].astype(str), monthly_spending['amount'], marker='o', linestyle='-', color='b')
        plt.xlabel('Month')
        plt.ylabel('Total Spending ($)')
        plt.title('Monthly Spending Trend')
        plt.xticks(rotation=45)
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        encoded_image = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()

        return encoded_image