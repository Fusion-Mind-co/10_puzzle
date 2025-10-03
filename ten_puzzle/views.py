from django.shortcuts import render
from .models import Problem
import random

def game_page(request):
    print('game_page関数実行')

    # idをランダムに選出
    random_id = random.randint(1, 552)

    data = Problem.objects.get(id=random_id)
    context = {
        'data': data 
    }
    print(f'取得データ = {data}')
    return render(request, 'game.html', context)