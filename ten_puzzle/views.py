from django.shortcuts import render , redirect , get_object_or_404
from .models import Problem
import random
import json

# ゲーム画面
def game_page(request):
    print('game_page関数実行')

    # idをランダムに選出
    random_id = random.randint(1, 552)

    data = Problem.objects.get(id=random_id)
    # クリア数+1 = 何問目
    cleared_count = Problem.objects.filter(is_cleared=True).count() + 1
    context = {
        'data': data ,
        'cleared_count' : cleared_count
    }
    print(f'取得データ = {data}')
    return render(request, 'game.html', context)

# ステージクリアロジック

def stage_clear(request):
    print('stage_clear関数実行')
    if request.method == "POST":
        data = json.loads(request.body)
        get_id = data.get('data_id')

        clear_problem = get_object_or_404(Problem, id=get_id)
        clear_problem.is_cleared = True
        clear_problem.save(update_fields=['is_cleared'])

        return redirect('game_page')

    return redirect('game_page')