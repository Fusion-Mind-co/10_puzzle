from django.shortcuts import render
from .models import Problem
import random

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