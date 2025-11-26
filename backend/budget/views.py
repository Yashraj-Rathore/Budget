from rest_framework import viewsets
from rest_framework.views import APIView
from django.db.models.functions import TruncMonth
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import csv, io
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from django.db.models import Sum, Q
from rest_framework.decorators import api_view, permission_classes

from .models import (
    Transaction,
    Category,
    BudgetLimit,
    FinancialGoal,
)
from .serializers import (
    TransactionSerializer,
    CategorySerializer,
    BudgetLimitSerializer,
    FinancialGoalSerializer,
)
from .spending_analysis import SpendingAnalysis


# ---------------------------
#  Financial Overview (no auth required)
# ---------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def financial_overview(request):
    # Use all transactions if not authenticated
    qs = Transaction.objects.all()
    total_income = qs.filter(type="income").aggregate(total=Sum("amount"))["total"] or 0
    total_expenses = qs.filter(type="expense").aggregate(total=Sum("amount"))["total"] or 0
    current_balance = total_income - total_expenses
    return Response(
        {
            "totalIncome": float(total_income),
            "totalExpenses": float(total_expenses),
            "currentBalance": float(current_balance),
        }
    )


# ---------------------------
#  Monthly Spending (no auth required)
# ---------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def MonthlySpendingView(request):
    qs = Transaction.objects.filter(type="expense")  # spending = expenses
    rows = (
        qs.annotate(m=TruncMonth("date"))
        .values("m")
        .annotate(amount=Sum("amount"))
        .order_by("m")
    )
    data = [
        {"month": r["m"].strftime("%Y-%m"), "amount": float(r["amount"] or 0)}
        for r in rows
        if r["m"] is not None
    ]
    return Response(data)


# ---------------------------
#  Category Spending (no auth required)
# ---------------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def CategorySpendingView(request):
    qs = Transaction.objects.filter(type="expense")
    rows = (
        qs.values("category__name")
        .annotate(amount=Sum("amount"))
        .order_by("category__name")
    )
    data = [
        {
            "category": r["category__name"] or "Uncategorized",
            "amount": float(r["amount"] or 0),
        }
        for r in rows
    ]
    return Response(data)


# ----------------------------------------------------
#  Transaction CRUD (Auth Optional for now)
# ----------------------------------------------------
class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Show all when no user
        if not self.request.user or not self.request.user.is_authenticated:
            return Transaction.objects.all().order_by("-date", "-id")

        return (
            Transaction.objects.select_related("category")
            .filter(user=self.request.user)
            .order_by("-date", "-id")
        )

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


# ----------------------------------------------------
#  Category CRUD (Auth Optional)
# ----------------------------------------------------
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # show global and user categories if logged in
        if not self.request.user or not self.request.user.is_authenticated:
            return Category.objects.filter(user__isnull=True).order_by("name")

        return Category.objects.filter(
            Q(user=self.request.user) | Q(user__isnull=True)
        ).order_by("name")


# ----------------------------------------------------
#  BudgetLimit CRUD (Auth Optional)
# ----------------------------------------------------
class BudgetLimitViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetLimitSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if not self.request.user or not self.request.user.is_authenticated:
            return BudgetLimit.objects.none()

        return BudgetLimit.objects.filter(user=self.request.user).select_related(
            "category"
        )

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


# ----------------------------------------------------
# Financial Goal CRUD (Auth Optional)
# ----------------------------------------------------
class FinancialGoalViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialGoalSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if not self.request.user or not self.request.user.is_authenticated:
            return FinancialGoal.objects.none()

        return FinancialGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


# ----------------------------------------------------
#  Spending Analysis
# ----------------------------------------------------
class SpendingAnalysisView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # If you add auth later, you can filter by user here.
        user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None

        # This will fetch transactions for that user,
        # or for user=None (your demo data) if no auth.
        df = SpendingAnalysis.fetch_transactions(user)

        if df.empty:
            return Response({"analysis": {}, "forecast": {}, "recurring": []})

        analysis = SpendingAnalysis.analyze_spending(df)
        forecast = SpendingAnalysis.forecast_next_month(df, window=3)
        recurring = SpendingAnalysis.detect_recurring(df)

        return Response(
            {
                "analysis": analysis,
                "forecast": forecast,
                "recurring": recurring,
            }
        )



# ----------------------------------------------------
#  Alerts View
# ----------------------------------------------------
class AlertsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None

        if not user:
            return Response({"alerts": []})

        df = SpendingAnalysis.fetch_transactions(user)

        if df.empty:
            return Response({"alerts": []})

        limits = {
            bl.category.name: float(bl.limit)
            for bl in BudgetLimit.objects.filter(user=user).select_related("category")
        }
        alerts = []
        for cat, limit in limits.items():
            spent = float(
                df[(df["category"] == cat) & (df["type"] == "expense")]["amount"].sum()
            )
            if spent > limit:
                alerts.append(
                    {
                        "category": cat,
                        "limit": limit,
                        "spent": round(spent, 2),
                        "over_by": round(spent - limit, 2),
                    }
                )
        return Response({"alerts": alerts})


# ----------------------------------------------------
#  CSV Export
# ----------------------------------------------------
class ExportCsvView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "CSV export disabled until auth is added"})


# ----------------------------------------------------
#  PDF Export
# ----------------------------------------------------
class ExportPdfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "PDF export disabled until auth is added"})
