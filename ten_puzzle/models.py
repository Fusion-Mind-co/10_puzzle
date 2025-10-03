from django.db import models

class Problem(models.Model):

    # 問題の数字４つ
    number1 = models.IntegerField()
    number2 = models.IntegerField()
    number3 = models.IntegerField()
    number4 = models.IntegerField()

    # ユーザーのプレイ状況
    is_cleared = models.BooleanField(default=False)
    reset_count = models.IntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    cleared_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'problems'
        unique_together = ['number1', 'number2', 'number3', 'number4']

    def __str__(self):
        return f"{self.number1}, {self.number2}, {self.number3}, {self.number4}"