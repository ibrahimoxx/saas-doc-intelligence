@echo off
cd /d "d:\saas-doc-intelligence\backend"
call venv\Scripts\activate.bat
pip install structlog django-structlog filetype
echo Done installing packages!
pause
