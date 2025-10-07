from django.contrib import admin
from django.urls import path
from ten_puzzle import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.game_page, name='game_page'),  # ルートパスも追加
    path('game_page/', views.game_page, name='game_page'),
    path('stage_clear/', views.stage_clear, name='stage_clear'),
    path('skip_problem/', views.skip_problem, name='skip_problem'),
]