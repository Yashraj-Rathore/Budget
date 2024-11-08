# views.py
from rest_framework import viewsets
from .models import Transaction, Category
from .serializers import TransactionSerializer, CategorySerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import models
from rest_framework.views import APIView
from .spending_analysis import SpendingAnalysis 

# Financial Overview API view
class FinancialOverview(APIView):
    permission_classes = [AllowAny]  # Change to AllowAny to bypass authentication for now

    def get(self, request):
        total_income = Transaction.objects.filter(type='income').aggregate(total=models.Sum('amount'))['total'] or 0
        total_expenses = Transaction.objects.filter(type='expense').aggregate(total=models.Sum('amount'))['total'] or 0
        current_balance = total_income - total_expenses

        data = {
            'totalIncome': total_income,
            'totalExpenses': total_expenses,
            'currentBalance': current_balance
        }
        return Response(data)

# Transaction viewset
class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related('category').all()  # Use select_related to optimize the query for category data
    serializer_class = TransactionSerializer
    # permission_classes = [IsAuthenticated]  # Uncomment if you want to enforce authentication

# Category viewset
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    # permission_classes = [IsAuthenticated]  # Uncomment if you want to enforce authentication

# views.py

# Updated SpendingAnalysisView Class
from rest_framework.views import APIView
from rest_framework.response import Response
from .spending_analysis import SpendingAnalysis

class SpendingAnalysisView(APIView):
    def get(self, request):
        try:
            user = request.user
            data = SpendingAnalysis.fetch_transactions(user)

            # Analyze spending, detect irregularities, and categorize spending
            analysis_result = SpendingAnalysis.analyze_spending(data)
            recommendations_result = SpendingAnalysis.provide_recommendations(data)
            spending_categories = SpendingAnalysis.categorize_spending(data)
            irregularities = SpendingAnalysis.detect_irregular_spending(data)
            top_categories = SpendingAnalysis.top_spending_categories(data)
            budget_alerts = SpendingAnalysis.check_budget_limits(data, category_limits={'rent': 500, 'groceries': 300})

            # Visual spending trend
            spending_trend_plot = SpendingAnalysis.generate_spending_trend_plot(data)

            # Combine the analysis and recommendations in the response
            response_data = {
                "analysis": analysis_result,
                "recommendations": recommendations_result,
                "spending_categories": spending_categories,
                "irregularities": irregularities,
                "top_spending_categories": top_categories,
                "budget_alerts": budget_alerts,
                "spending_trend_plot": spending_trend_plot
            }

            return Response(response_data)

        except ValueError as e:
            return Response({"error": str(e)}, status=400)
