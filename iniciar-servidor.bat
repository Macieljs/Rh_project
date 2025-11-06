@echo off
echo ========================================
echo Iniciando Servidor PHP
echo ========================================
echo.

cd /d "%~dp0"
echo Pasta do projeto: %CD%
echo.
echo Servidor iniciando em: http://localhost:8000
echo Pressione Ctrl+C para parar o servidor
echo.

php -S localhost:8000

pause

