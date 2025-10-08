# ten_puzzle/forms.py
from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User


class SignUpForm(UserCreationForm):
    """ユーザー登録フォーム"""
    name = forms.CharField(
        max_length=50,
        required=True,
        label='ユーザー名',
        widget=forms.TextInput(attrs={
            'class': 'form-input',
            'placeholder': 'ユーザー名',
            'autofocus': True,
        }),
        error_messages={
            'required': 'ユーザー名を入力してください',
            'max_length': 'ユーザー名は50文字以内で入力してください',
        }
    )
    password1 = forms.CharField(
        required=True,
        label='パスワード',
        widget=forms.PasswordInput(attrs={
            'class': 'form-input',
            'placeholder': 'パスワード',
        }),
        error_messages={
            'required': 'パスワードを入力してください',
        }
    )
    password2 = forms.CharField(
        required=True,
        label='パスワード（確認）',
        widget=forms.PasswordInput(attrs={
            'class': 'form-input',
            'placeholder': 'パスワード（確認）',
        }),
        error_messages={
            'required': 'パスワード（確認）を入力してください',
        }
    )
    
    class Meta:
        model = User
        fields = ('name', 'password1', 'password2')
    
    def clean_name(self):
        name = self.cleaned_data.get('name')
        if User.objects.filter(name=name).exists():
            raise forms.ValidationError('このユーザー名は既に使用されています')
        return name
    
    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('パスワードが一致しません')
        
        return password2
    
    # パスワードバリデーションのエラーメッセージを日本語化
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].help_text = None
        self.fields['password2'].help_text = None


class LoginForm(AuthenticationForm):
    """ログインフォーム"""
    username = forms.CharField(
        max_length=50,
        required=True,
        label='ユーザー名',
        widget=forms.TextInput(attrs={
            'class': 'form-input',
            'placeholder': 'ユーザー名',
            'autofocus': True,
        }),
        error_messages={
            'required': 'ユーザー名を入力してください',
        }
    )
    password = forms.CharField(
        required=True,
        label='パスワード',
        widget=forms.PasswordInput(attrs={
            'class': 'form-input',
            'placeholder': 'パスワード',
        }),
        error_messages={
            'required': 'パスワードを入力してください',
        }
    )
    
    error_messages = {
        'invalid_login': 'ユーザー名またはパスワードが正しくありません',
        'inactive': 'このアカウントは無効です',
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.username_field = User._meta.get_field('name')