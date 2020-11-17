from django.template import Library
 
register = Library()
 
@register.filter(name='addclass')
def addclass(field, class_attr):
    return field.as_widget(attrs={'class': class_attr})

@register.filter(name='add_class_placeholder')
def add_class_placeholder(field, class_placeholder_attr):
    attrs = class_placeholder_attr.split(",")
    return field.as_widget(attrs={'class': attrs[0], 'placeholder': attrs[1]})

@register.filter(name='has_group')
def has_group(user, group_name):
    return user.groups.filter(name=group_name).exists()
