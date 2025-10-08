# urls.py
from django.contrib import admin
from django.urls import path
from ten_puzzle import views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 認証
    path('', views.title_page, name='title'),
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # ゲーム
    path('game/', views.game_page, name='game_page'),
    path('stage_clear/', views.stage_clear, name='stage_clear'),
    path('skip_problem/', views.skip_problem, name='skip_problem'),
    
    # 設定
    path('settings/', views.settings_page, name='settings'),
    path('reset_progress/', views.reset_progress, name='reset_progress'),
    path('delete_account/', views.delete_account, name='delete_account'),
]