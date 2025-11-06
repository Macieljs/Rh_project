@echo off
echo ========================================
echo Instalando Funcionalidade de Avaliacoes
echo ========================================
echo.

cd /d "%~dp0"
echo Diretorio atual: %CD%
echo.

if not exist "database\avaliacoes_completo.sql" (
    echo ERRO: Arquivo database\avaliacoes_completo.sql nao encontrado!
    pause
    exit /b 1
)

echo Arquivo SQL encontrado!
echo.
echo Executando script SQL...
echo.

mysql -u root -p < database\avaliacoes_completo.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Script executado com sucesso!
    echo.
    echo Proximos passos:
    echo 1. Recarregue a pagina do sistema (Ctrl + Shift + R)
    echo 2. Va em Avaliacoes -^> Nova Avaliacao
    echo 3. Teste criando uma avaliacao completa
) else (
    echo.
    echo [ERRO] Falha ao executar o script SQL
    echo Verifique se o MySQL esta instalado e no PATH
)

echo.
pause

