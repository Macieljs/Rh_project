# Script PowerShell para importar o banco de dados MySQL
# Execute: .\importar-banco.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Importação do Banco de Dados MySQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
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
Write-Host "Importando banco de dados..." -ForegroundColor Yellow

$schemaPath = Join-Path $PSScriptRoot "database\schema.sql"

if (-not (Test-Path $schemaPath)) {
    Write-Host "ERRO: Arquivo schema.sql não encontrado em: $schemaPath" -ForegroundColor Red
    exit 1
}

# Importar o banco
$env:MYSQL_PWD = $senhaPlain
$command = "& '$mysqlPath' -u $usuario -p$senhaPlain < `"$schemaPath`""

try {
    Get-Content $schemaPath | & $mysqlPath -u $usuario -p$senhaPlain
    Write-Host "Banco de dados importado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximo passo: Execute o script database/init_admin.php para criar o usuário admin" -ForegroundColor Cyan
    Write-Host "Comando: php database/init_admin.php" -ForegroundColor Gray
} catch {
    Write-Host "ERRO ao importar: $_" -ForegroundColor Red
    exit 1
}

$env:MYSQL_PWD = $null

