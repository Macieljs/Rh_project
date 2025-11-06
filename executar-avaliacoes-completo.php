<?php
/**
 * Script PHP para executar o SQL de avaliações completo
 * Execute: php executar-avaliacoes-completo.php
 */

echo "========================================\n";
echo "Instalando Funcionalidade de Avaliações\n";
echo "========================================\n\n";

require_once 'config/database.php';

$sqlFile = __DIR__ . '/database/avaliacoes_completo.sql';

if (!file_exists($sqlFile)) {
    die("ERRO: Arquivo não encontrado: $sqlFile\n");
}

echo "Arquivo SQL encontrado: $sqlFile\n\n";
echo "Lendo arquivo SQL...\n";

$sql = file_get_contents($sqlFile);

// Dividir o SQL em comandos individuais
// Remover comentários e dividir por ponto e vírgula
$sql = preg_replace('/--.*$/m', '', $sql); // Remove comentários
$commands = array_filter(array_map('trim', explode(';', $sql)));

echo "Encontrados " . count($commands) . " comandos SQL\n\n";

try {
    $conn = getConnection();
    $connDominio = getDominioConnection();
    
    echo "Conectado ao banco de dados!\n\n";
    echo "Executando comandos...\n\n";
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($commands as $index => $command) {
        if (empty($command) || strlen(trim($command)) < 10) {
            continue; // Pula comandos vazios ou muito curtos
        }
        
        // Determinar qual conexão usar baseado no comando
        $useDominio = (stripos($command, 'USE dominio') !== false || 
                      stripos($command, 'CREATE TABLE') !== false && stripos($command, 'tbAvaliacaoTipo') !== false ||
                      stripos($command, 'INSERT INTO') !== false && stripos($command, 'tbAvaliacaoTipo') !== false);
        
        $currentConn = $useDominio ? $connDominio : $conn;
        
        try {
            // Se for um comando USE, não executar (já selecionamos o banco)
            if (stripos($command, 'USE ') === 0) {
                continue;
            }
            
            // Executar comando
            $currentConn->exec($command);
            $successCount++;
            
            // Mostrar progresso para comandos importantes
            if (stripos($command, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE.*?(\w+)/i', $command, $matches);
                $tableName = $matches[1] ?? 'tabela';
                echo "✓ Tabela criada: $tableName\n";
            } elseif (stripos($command, 'ALTER TABLE') !== false) {
                preg_match('/ALTER TABLE.*?ADD COLUMN.*?(\w+)/i', $command, $matches);
                $columnName = $matches[1] ?? 'coluna';
                echo "✓ Coluna adicionada: $columnName\n";
            } elseif (stripos($command, 'INSERT INTO') !== false) {
                preg_match('/INSERT INTO.*?(\w+)/i', $command, $matches);
                $tableName = $matches[1] ?? 'tabela';
                echo "✓ Dados inseridos em: $tableName\n";
            }
        } catch (PDOException $e) {
            // Ignorar erros de "já existe" ou "duplicado"
            if (strpos($e->getMessage(), 'already exists') === false && 
                strpos($e->getMessage(), 'Duplicate') === false &&
                strpos($e->getMessage(), 'already exists') === false) {
                $errorCount++;
                echo "⚠ Erro no comando " . ($index + 1) . ": " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n========================================\n";
    echo "✅ Execução concluída!\n";
    echo "Comandos executados com sucesso: $successCount\n";
    if ($errorCount > 0) {
        echo "Avisos/Erros: $errorCount\n";
    }
    echo "\nPróximos passos:\n";
    echo "1. Recarregue a página do sistema (Ctrl + Shift + R)\n";
    echo "2. Vá em Avaliações → Nova Avaliação\n";
    echo "3. Teste criando uma avaliação completa\n";
    
} catch (PDOException $e) {
    die("ERRO de conexão: " . $e->getMessage() . "\n");
}
?>

