# views.py
from rest_framework import viewsets
from .models import Transaction, Category
from .serializers import TransactionSerializer, CategorySerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import models

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
