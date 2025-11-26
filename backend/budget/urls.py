# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet, CategoryViewSet, financial_overview, SpendingAnalysisView,
    BudgetLimitViewSet, FinancialGoalViewSet,MonthlySpendingView,
    CategorySpendingView,
)

from .views import AlertsView, ExportCsvView, ExportPdfView



router = DefaultRouter()
router.register(r"transactions", TransactionViewSet, basename="transactions")
router.register(r"categories", CategoryViewSet, basename="categories")
router.register(r"budget-limits", BudgetLimitViewSet, basename="budget-limits")
router.register(r"goals", FinancialGoalViewSet, basename="goals")

urlpatterns = [
    path("financial-overview/", financial_overview, name="financial-overview"),
    path("spending-analysis/", SpendingAnalysisView.as_view(), name="spending-analysis"),
    path("spending/alerts/", AlertsView.as_view(), name="spending-alerts"),
    path("export/csv/", ExportCsvView.as_view(), name="export-csv"),
    path("export/pdf/", ExportPdfView.as_view(), name="export-pdf"),
    path("", include(router.urls)),
    path("monthly-spending/", MonthlySpendingView),
    path("category-spending/", CategorySpendingView),
]
