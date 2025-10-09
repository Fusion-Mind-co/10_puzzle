#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# 問題データを自動インポート
if [ -f "10_puzzel.csv" ]; then
    python manage.py import_problems 10_puzzel.csv
    echo "✅ 問題データをインポートしました"
fi