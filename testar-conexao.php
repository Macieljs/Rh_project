<?php
/**
 * Script simples para testar conexão com MySQL
 * Execute: php testar-conexao.php
 */

echo "=== Teste de Conexão MySQL ===\n\n";

// Testar conexão básica sem senha
echo "1. Testando conexão sem senha...\n";
try {
    $conn = new PDO("mysql:host=localhost", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "   ✓ Conexão estabelecida!\n\n";
    
    // Verificar se os bancos existem
    echo "2. Verificando bancos de dados...\n";
    $stmt = $conn->query("SHOW DATABASES LIKE 'sistema_rh'");
    if ($stmt->rowCount() > 0) {
        echo "   ✓ Banco 'sistema_rh' existe!\n";
    } else {
        echo "   ✗ Banco 'sistema_rh' NÃO existe - precisa importar!\n";
    }
    
    $stmt = $conn->query("SHOW DATABASES LIKE 'dominio'");
    if ($stmt->rowCount() > 0) {
        echo "   ✓ Banco 'dominio' existe!\n";
    } else {
        echo "   ✗ Banco 'dominio' NÃO existe - precisa importar!\n";
    }
    
} catch (PDOException $e) {
    echo "   ✗ Erro: " . $e->getMessage() . "\n\n";
    
    if (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "   O MySQL está pedindo senha.\n";
        echo "   Edite o arquivo config/database.php e adicione a senha:\n";
        echo "   define('DB_PASS', 'sua_senha_aqui');\n\n";
        
        // Tentar com senha comum
        echo "   Tentando com senha vazia...\n";
        try {
            $conn = new PDO("mysql:host=localhost", "root", "");
            echo "   ✓ Funcionou com senha vazia!\n";
        } catch (PDOException $e2) {
            echo "   ✗ Não funcionou. Você precisa configurar a senha.\n";
        }
    } elseif (strpos($e->getMessage(), 'Connection refused') !== false || 
              strpos($e->getMessage(), 'No connection') !== false) {
        echo "   O MySQL não está rodando!\n";
        echo "   Inicie o serviço MySQL (XAMPP/WAMP ou serviço do Windows)\n";
    }
}

echo "\n=== Fim do Teste ===\n";
?>

