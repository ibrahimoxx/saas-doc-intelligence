import subprocess
import sys

if __name__ == '__main__':
    print("Pre-installing missing requirements...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "structlog", "django-structlog", "filetype"])
    print("Done!")
