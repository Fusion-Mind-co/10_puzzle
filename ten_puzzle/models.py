# ten_puzzle/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """カスタムユーザーモデル"""
    username = None
    name = models.CharField(max_length=50, unique=True)
    
    # JSONFieldを使用（SQLiteでもPostgreSQLでも動く）
    cleared_problem_ids = models.JSONField(
        default=list,
        blank=True,
    )
    
    all_cleared_count = models.IntegerField(default=0)
    now_playing_id = models.IntegerField(null=True, blank=True)
    total_attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'name'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return self.name
    
    @property
    def is_all_cleared(self):
        return len(self.cleared_problem_ids) >= 552
    
    @property
    def cleared_count(self):
        return len(self.cleared_problem_ids)
    
    def mark_problem_cleared(self, problem_id):
        if problem_id not in self.cleared_problem_ids:
            self.cleared_problem_ids.append(problem_id)
            self.save(update_fields=['cleared_problem_ids'])
    
    def reset_progress(self):
        self.cleared_problem_ids = []
        self.now_playing_id = None
        self.save(update_fields=['cleared_problem_ids', 'now_playing_id'])
    
    def complete_all_clear(self):
        self.all_cleared_count += 1
        self.cleared_problem_ids = []
        self.now_playing_id = None
        self.save(update_fields=['all_cleared_count', 'cleared_problem_ids', 'now_playing_id'])


class Problem(models.Model):
    number1 = models.IntegerField()
    number2 = models.IntegerField()
    number3 = models.IntegerField()
    number4 = models.IntegerField()
    
    class Meta:
        db_table = 'problems'
        unique_together = ['number1', 'number2', 'number3', 'number4']
    
    def __str__(self):
        return f"{self.number1}, {self.number2}, {self.number3}, {self.number4}"