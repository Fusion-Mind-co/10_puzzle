from django.contrib import admin
from django.urls import path
from ten_puzzle import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('game_page', views.game_page , name='game_page'),
]
