from django import template

register = template.Library()

@register.filter
def replace_invalid_model_chars(string):
    return string.replace(' ', '').replace('-', '_').replace('(', '').replace(')', '').\
        replace(' - ', '_').replace(' , ', '_').replace(',', '_').replace('__', '_')

