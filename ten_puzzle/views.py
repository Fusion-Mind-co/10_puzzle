from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from .models import Problem
import random
import json

# ゲーム画面(初回アクセス時)
def game_page(request):
    print('game_page関数実行')
    
    # セッションに現在の問題IDがあるかチェック
    current_problem_id = request.session.get('current_problem_id')
    
    if current_problem_id:
        # 既存の問題を取得
        try:
            data = Problem.objects.get(id=current_problem_id)
        except Problem.DoesNotExist:
            # 問題が見つからない場合は新しい問題を取得
            data = get_new_problem(request)
    else:
        # 新しい問題を取得
        data = get_new_problem(request)
    
    cleared_count = Problem.objects.filter(is_cleared=True).count() + 1
    
    context = {
        'data': data,
        'cleared_count': cleared_count
    }
    
    return render(request, 'game.html', context)


# 新しい問題を取得してセッションに保存
def get_new_problem(request):
    random_id = stage_select()
    data = Problem.objects.get(id=random_id)
    
    # セッションに保存
    request.session['current_problem_id'] = data.id
    
    return data


# クリアしていない問題からランダムに選出
def stage_select():
    datas = Problem.objects.filter(is_cleared=False)
    
    if not datas.exists():
        # 全問クリアした場合の処理
        return None
    
    not_cleared_id = list(datas.values_list('id', flat=True))
    result = random.choice(not_cleared_id)
    
    return result


# ステージクリア処理
def stage_clear(request):
    print('stage_clear関数実行')
    
    if request.method == "POST":
        data = json.loads(request.body)
        get_id = data.get('data_id')
        
        clear_problem = get_object_or_404(Problem, id=get_id)
        clear_problem.is_cleared = True
        clear_problem.save(update_fields=['is_cleared'])
        
        # セッションから現在の問題を削除
        if 'current_problem_id' in request.session:
            del request.session['current_problem_id']
        
        # 次の問題を取得
        next_problem = get_new_problem(request)
        
        if next_problem:
            cleared_count = Problem.objects.filter(is_cleared=True).count() + 1
            return JsonResponse({
                'status': 'success',
                'next_problem': {
                    'id': next_problem.id,
                    'number1': next_problem.number1,
                    'number2': next_problem.number2,
                    'number3': next_problem.number3,
                    'number4': next_problem.number4,
                },
                'cleared_count': cleared_count
            })
        else:
            return JsonResponse({
                'status': 'all_cleared',
                'message': '全問クリアおめでとうございます！'
            })
    
    return JsonResponse({'status': 'error'}, status=400)


# スキップ処理
def skip_problem(request):
    print('skip_problem関数実行')
    
    if request.method == "POST":
        # セッションから現在の問題を削除
        if 'current_problem_id' in request.session:
            del request.session['current_problem_id']
        
        # 次の問題を取得
        next_problem = get_new_problem(request)
        
        if next_problem:
            cleared_count = Problem.objects.filter(is_cleared=True).count() + 1
            return JsonResponse({
                'status': 'success',
                'next_problem': {
                    'id': next_problem.id,
                    'number1': next_problem.number1,
                    'number2': next_problem.number2,
                    'number3': next_problem.number3,
                    'number4': next_problem.number4,
                },
                'cleared_count': cleared_count
            })
        else:
            return JsonResponse({
                'status': 'no_problems',
                'message': 'これ以上問題がありません'
            })
    
    return JsonResponse({'status': 'error'}, status=400)