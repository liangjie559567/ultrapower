import sys
from pathlib import Path

# Allow tests to import modules from nexus-daemon/ regardless of working directory.
sys.path.insert(0, str(Path(__file__).parent.parent))
