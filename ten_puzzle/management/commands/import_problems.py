import csv
from django.core.management.base import BaseCommand
from ten_puzzle.models import Problem


class Command(BaseCommand):
    help = 'CSVファイルから問題データをインポートします'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='インポートするCSVファイルのパス'
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        
        # 既存のデータを削除するか確認
        if Problem.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    f'既に{Problem.objects.count()}件のデータが存在します。'
                )
            )
            confirm = input('既存データを削除してインポートしますか？ (yes/no): ')
            if confirm.lower() == 'yes':
                Problem.objects.all().delete()
                self.stdout.write(self.style.SUCCESS('既存データを削除しました'))
            else:
                self.stdout.write(self.style.ERROR('インポートをキャンセルしました'))
                return

        # CSVを読み込んでインポート
        imported_count = 0
        skipped_count = 0
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                
                for row in reader:
                    if len(row) != 4:
                        self.stdout.write(
                            self.style.WARNING(f'スキップ: {row} (4つの数字が必要)')
                        )
                        skipped_count += 1
                        continue
                    
                    try:
                        number1, number2, number3, number4 = map(int, row)
                        
                        # 重複チェック
                        if Problem.objects.filter(
                            number1=number1,
                            number2=number2,
                            number3=number3,
                            number4=number4
                        ).exists():
                            skipped_count += 1
                            continue
                        
                        Problem.objects.create(
                            number1=number1,
                            number2=number2,
                            number3=number3,
                            number4=number4
                        )
                        imported_count += 1
                        
                    except ValueError as e:
                        self.stdout.write(
                            self.style.WARNING(f'スキップ: {row} (数値変換エラー)')
                        )
                        skipped_count += 1
                        continue
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'インポート完了: {imported_count}件'
                )
            )
            if skipped_count > 0:
                self.stdout.write(
                    self.style.WARNING(f'スキップ: {skipped_count}件')
                )
                
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(f'ファイルが見つかりません: {csv_file}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'エラー: {str(e)}')
            )