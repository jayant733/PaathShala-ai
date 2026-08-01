import os

env_py_path = r'c:/Users/jayan/Downloads/PathShala/backend/app/database/migrations/env.py'

with open(env_py_path, 'r') as f:
    content = f.read()

import_block = """import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from app.core.config import settings
from app.database.models import Base"""

content = content.replace('target_metadata = None', 'target_metadata = Base.metadata')

content = content.replace('config = context.config', 'config = context.config\n' + import_block + '\nconfig.set_main_option("sqlalchemy.url", settings.DATABASE_URL)')

with open(env_py_path, 'w') as f:
    f.write(content)
print('env.py updated successfully.')
