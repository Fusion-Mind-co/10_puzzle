# ten_puzzle/management/commands/import_problems.py
import csv
from django.core.management.base import BaseCommand
from ten_puzzle.models import Problem


class Command(BaseCommand):
    help = 'CSVファイルから問題をインポート'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            default='10_puzzel.csv',
            nargs='?',
            help='CSVファイルのパス'
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        
        # 除外する問題
        exclude_list = [
            (1, 3, 3, 7),
            (1, 1, 9, 9),
            (1, 1, 5, 8),
        ]
        
        # 既存の問題を削除
        Problem.objects.all().delete()
        self.stdout.write(self.style.WARNING('既存の問題を削除しました'))
        
        problems = []
        skipped = []
        line_count = 0
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                csv_reader = csv.reader(file)
                # ヘッダー行のスキップを削除！
                # next(csv_reader)  # ← この行を削除またはコメントアウト
                
                for row in csv_reader:
                    line_count += 1
                    
                    # 空行をスキップ
                    if not row or len(row) < 4:
                        continue
                    
                    try:
                        num1 = int(row[0].strip())
                        num2 = int(row[1].strip())
                        num3 = int(row[2].strip())
                        num4 = int(row[3].strip())
                        
                        # 除外リストのチェック
                        problem_tuple = tuple(sorted([num1, num2, num3, num4]))
                        if problem_tuple in exclude_list:
                            skipped.append(f"{num1}, {num2}, {num3}, {num4}")
                            continue
                        
                        problems.append(Problem(
                            number1=num1,
                            number2=num2,
                            number3=num3,
                            number4=num4,
                        ))
                    
                    except (ValueError, IndexError) as e:
                        self.stdout.write(
                            self.style.ERROR(f'行{line_count}のスキップ: {row} - {e}')
                        )
                        continue
            
            self.stdout.write(f"\n読み込んだ行数: {line_count}")
            self.stdout.write(f"追加する問題数: {len(problems)}")
            
            # 一括作成
            Problem.objects.bulk_create(problems, ignore_conflicts=True)
            
            count = Problem.objects.count()
            
            self.stdout.write(self.style.SUCCESS(
                f'\n✅ {count}個の問題をインポートしました！'
            ))
            
            if skipped:
                self.stdout.write(self.style.WARNING(
                    f'\n⚠️  除外した問題（{len(skipped)}個）:'
                ))
                for problem in skipped:
                    self.stdout.write(f'  - {problem}')
            
            # 期待値との比較
            expected = line_count - len(skipped)
            if count == expected:
                self.stdout.write(self.style.SUCCESS(
                    f'\n✅ 完璧！期待値と一致しています'
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f'\n⚠️  期待値: {expected}問、実際: {count}問、差分: {expected - count}問'
                ))
        
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(
                f'\n❌ ファイルが見つかりません: {csv_file}'
            ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'\n❌ エラーが発生しました: {e}'
            ))