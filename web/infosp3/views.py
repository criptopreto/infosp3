from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from django.shortcuts import render
from constance import config

class Index(LoginRequiredMixin, TemplateView):
    login_url = "/accounts/login"
    redirect_field_name = 'redirect_to'
    template_name = "index.html"

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name, {"config": config})