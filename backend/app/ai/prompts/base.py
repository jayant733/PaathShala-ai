# Base utilities for prompt formatting can go here
def format_prompt(template: str, **kwargs) -> str:
    return template.format(**kwargs)
