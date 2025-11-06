# Script para executar o SQL de avaliações completo
# Execute: .\executar-avaliacoes-completo.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalando Funcionalidade de Avaliações" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na pasta correta
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Diretório atual: $scriptPath" -ForegroundColor Green
Write-Host ""

# Verificar se o arquivo existe
$sqlFile = Join-Path $scriptPath "database\avaliacoes_completo.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "ERRO: Arquivo não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Arquivo SQL encontrado: $sqlFile" -ForegroundColor Green
Write-Host ""

# Verificar se o MySQL está instalado
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Host "MySQL não encontrado no PATH." -ForegroundColor Yellow
    Write-Host "Por favor, informe o caminho completo do mysql.exe" -ForegroundColor Yellow
    Write-Host "Exemplo: C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -ForegroundColor Gray
    $mysqlPath = Read-Host "Caminho do mysql.exe"
} else {
    $mysqlPath = $mysqlPath.Source
    Write-Host "MySQL encontrado: $mysqlPath" -ForegroundColor Green
}

Write-Host ""
$usuario = Read-Host "Usuário do MySQL (padrão: root)"
if ([string]::IsNullOrWhiteSpace($usuario)) {
    $usuario = "root"
}

$senha = Read-Host "Senha do MySQL" -AsSecureString
$senhaPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha))

Write-Host ""
Write-Host "Executando script SQL..." -ForegroundColor Yellow

$env:MYSQL_PWD = $senhaPlain

try {
    Get-Content $sqlFile | & $mysqlPath -u $usuario -p$senhaPlain
    Write-Host ""
    Write-Host "✅ Script executado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Recarregue a página do sistema (Ctrl + Shift + R)" -ForegroundColor Gray
    Write-Host "2. Vá em Avaliações → Nova Avaliação" -ForegroundColor Gray
    Write-Host "3. Teste criando uma avaliação completa" -ForegroundColor Gray
} catch {
    Write-Host ""
    Write-Host "❌ ERRO ao executar: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente executar manualmente:" -ForegroundColor Yellow
    Write-Host "mysql -u $usuario -p < database\avaliacoes_completo.sql" -ForegroundColor Gray
}

$env:MYSQL_PWD = $null

