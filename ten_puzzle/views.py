# views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from .models import Problem, User
from .forms import SignUpForm, LoginForm
import random
import json


# ========================
# 認証関連
# ========================

def title_page(request):
    """タイトル画面"""
    if request.user.is_authenticated:
        return redirect('game_page')
    return render(request, 'title.html')


def signup_view(request):
    """ユーザー登録"""
    if request.user.is_authenticated:
        return redirect('game_page')
    
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('game_page')
    else:
        form = SignUpForm()
    
    return render(request, 'signup.html', {'form': form})


def login_view(request):
    """ログイン"""
    if request.user.is_authenticated:
        return redirect('game_page')
    
    if request.method == 'POST':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            name = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            
            # nameフィールドで認証
            user = authenticate(request, username=name, password=password)
            
            if user is not None:
                login(request, user)
                user.last_login_at = timezone.now()
                user.save(update_fields=['last_login_at'])
                return redirect('game_page')
    else:
        form = LoginForm()
    
    return render(request, 'login.html', {'form': form})


@login_required
def logout_view(request):
    """ログアウト"""
    logout(request)
    return redirect('login')


# ========================
# ゲーム関連
# ========================

@login_required
def game_page(request):
    """ゲーム画面"""
    user = request.user
    
    # 現在プレイ中の問題を取得または新規取得
    if user.now_playing_id:
        try:
            data = Problem.objects.get(id=user.now_playing_id)
        except Problem.DoesNotExist:
            data = get_new_problem(user)
    else:
        data = get_new_problem(user)
    
    # 全問クリア済みの場合
    if data is None:
        return render(request, 'all_cleared.html', {
            'all_cleared_count': user.all_cleared_count,
            'cleared_count': user.cleared_count
        })
    
    context = {
        'data': data,
        'cleared_count': user.cleared_count,
        'all_cleared_count': user.all_cleared_count,
    }
    
    return render(request, 'game.html', context)


def get_new_problem(user):
    """未クリア問題をランダムに取得"""
    # 未クリア問題
    not_cleared = Problem.objects.exclude(id__in=user.cleared_problem_ids)
    
    if not not_cleared.exists():
        return None  # 全問クリア
    
    # ランダムに選択
    random_problem = not_cleared.order_by('?').first()
    
    # 現在プレイ中として保存
    user.now_playing_id = random_problem.id
    user.save(update_fields=['now_playing_id'])
    
    return random_problem

@login_required
@require_http_methods(["POST"])
def stage_clear(request):
    """ステージクリア処理"""
    data = json.loads(request.body)
    problem_id = data.get('data_id')
    
    user = request.user
    problem = get_object_or_404(Problem, id=problem_id)
    
    # 問題をクリア済みにする
    user.mark_problem_cleared(problem_id)
    user.total_attempts += 1
    user.save(update_fields=['total_attempts'])
    
    # 全問クリア判定
    if user.is_all_cleared:
        user.complete_all_clear()
        
        return JsonResponse({
            'status': 'all_cleared',
            'message': f'🎊 全問クリアおめでとうございます！ 🎊\n{user.all_cleared_count}周目達成！',
            'all_cleared_count': user.all_cleared_count,
        })
    
    # 次の問題を取得
    next_problem = get_new_problem(user)
    
    if next_problem:
        # 次の問題番号 = クリア数 + 1
        current_problem_number = user.cleared_count + 1
        
        return JsonResponse({
            'status': 'success',
            'next_problem': {
                'id': next_problem.id,
                'number1': next_problem.number1,
                'number2': next_problem.number2,
                'number3': next_problem.number3,
                'number4': next_problem.number4,
            },
            'cleared_count': user.cleared_count,
            'current_problem_number': current_problem_number,  # 追加
        })
    
    return JsonResponse({'status': 'error'}, status=400)


@login_required
@require_http_methods(["POST"])
def skip_problem(request):
    """問題スキップ"""
    user = request.user
    next_problem = get_new_problem(user)
    
    if next_problem:
        # 現在の問題番号 = クリア数 + 1
        current_problem_number = user.cleared_count + 1
        
        return JsonResponse({
            'status': 'success',
            'next_problem': {
                'id': next_problem.id,
                'number1': next_problem.number1,
                'number2': next_problem.number2,
                'number3': next_problem.number3,
                'number4': next_problem.number4,
            },
            'cleared_count': user.cleared_count,
            'current_problem_number': current_problem_number,  # 追加
        })
    else:
        return JsonResponse({
            'status': 'no_problems',
            'message': 'これ以上問題がありません'
        })


# ========================
# 設定関連
# ========================

@login_required
def settings_page(request):
    """設定画面"""
    return render(request, 'settings.html', {
        'user': request.user,
        'cleared_count': request.user.cleared_count,
        'all_cleared_count': request.user.all_cleared_count,
    })


@login_required
@require_http_methods(["POST"])
def reset_progress(request):
    """進行状況リセット"""
    if not request.POST.get('confirm'):
        return JsonResponse({'status': 'error', 'message': '確認が必要です'}, status=400)
    
    user = request.user
    user.reset_progress()
    
    return JsonResponse({
        'status': 'success',
        'message': '進行状況をリセットしました'
    })


@login_required
def game_page(request):
    """ゲーム画面"""
    user = request.user
    
    # 問題が存在するかチェック
    total_problems = Problem.objects.count()
    
    if total_problems == 0:
        # 問題がまだ登録されていない場合
        return render(request, 'no_problems.html', {
            'message': '問題がまだ登録されていません。管理画面から問題を追加してください。'
        })
    
    # 現在プレイ中の問題を取得または新規取得
    if user.now_playing_id:
        try:
            data = Problem.objects.get(id=user.now_playing_id)
        except Problem.DoesNotExist:
            data = get_new_problem(user)
    else:
        data = get_new_problem(user)
    
    # 全問クリア済みの場合
    if data is None:
        return render(request, 'all_cleared.html', {
            'all_cleared_count': user.all_cleared_count,
            'cleared_count': user.cleared_count,
            'total_problems': total_problems,
        })
    
    # 現在の問題番号 = クリア数 + 1
    current_problem_number = user.cleared_count + 1
    
    context = {
        'data': data,
        'cleared_count': user.cleared_count,
        'current_problem_number': current_problem_number,  # 追加
        'total_problems': total_problems,
        'all_cleared_count': user.all_cleared_count,
    }
    
    return render(request, 'game.html', context)


# ========================
# 設定関連
# ========================

@login_required
def settings_page(request):
    """設定画面"""
    return render(request, 'settings.html', {
        'user': request.user,
        'cleared_count': request.user.cleared_count,
        'all_cleared_count': request.user.all_cleared_count,
    })


@login_required
@require_http_methods(["POST"])
def reset_progress(request):
    """進行状況リセット"""
    if not request.POST.get('confirm'):
        return JsonResponse({'status': 'error', 'message': '確認が必要です'}, status=400)
    
    user = request.user
    user.reset_progress()
    
    return JsonResponse({
        'status': 'success',
        'message': '進行状況をリセットしました'
    })


@login_required
@require_http_methods(["POST"])
def delete_account(request):
    """アカウント削除"""
    if not request.POST.get('confirm'):
        return JsonResponse({'status': 'error', 'message': '確認が必要です'}, status=400)
    
    user = request.user
    logout(request)
    user.delete()
    
    return JsonResponse({
        'status': 'success',
        'message': 'アカウントを削除しました'
    })