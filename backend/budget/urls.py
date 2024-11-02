from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, CategoryViewSet, FinancialOverview

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('financial-overview/', FinancialOverview.as_view(), name='financial-overview'),
    path('', include(router.urls)),
]
