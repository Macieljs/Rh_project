<?php
/**
 * Script de Verificação do Banco de Dados
 * Execute: php verificar-banco.php
 * Ou acesse: http://localhost:8000/verificar-banco.php
 */

// Cores para terminal (se executado via CLI)
function colorize($text, $color = 'green') {
    $colors = [
        'green' => "\033[32m",
        'red' => "\033[31m",
        'yellow' => "\033[33m",
        'blue' => "\033[34m",
        'reset' => "\033[0m"
    ];
    
    if (php_sapi_name() === 'cli') {
        return $colors[$color] . $text . $colors['reset'];
    }
    return $text;
}

// HTML para navegador
$isCli = php_sapi_name() === 'cli';
if (!$isCli) {
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Verificação do Banco</title>";
    echo "<style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .info { color: blue; }
        .section { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; }
    </style></head><body>";
    echo "<h1>🔍 Verificação do Banco de Dados</h1>";
}

function printResult($message, $status = 'success') {
    global $isCli;
    if ($isCli) {
        $color = $status === 'success' ? 'green' : ($status === 'error' ? 'red' : 'yellow');
        echo colorize("[$status] ", $color) . $message . "\n";
    } else {
        $class = $status === 'success' ? 'success' : ($status === 'error' ? 'error' : 'warning');
        echo "<div class='$class'>[$status] " . htmlspecialchars($message) . "</div>";
    }
}

function printSection($title) {
    global $isCli;
    if ($isCli) {
        echo "\n" . colorize("=== $title ===", 'blue') . "\n";
    } else {
        echo "<div class='section'><h2>$title</h2>";
    }
}

function endSection() {
    global $isCli;
    if (!$isCli) {
        echo "</div>";
    }
}

// Verificar configuração
printSection("1. Verificando Configuração");

try {
    require_once 'config/database.php';
    printResult("Arquivo de configuração encontrado", 'success');
    printResult("Host: " . DB_HOST, 'info');
    printResult("Banco Principal: " . DB_NAME, 'info');
    printResult("Banco Domínio: " . DB_DOMINIO, 'info');
} catch (Exception $e) {
    printResult("Erro ao carregar configuração: " . $e->getMessage(), 'error');
    exit(1);
}
endSection();

// Verificar conexão
printSection("2. Verificando Conexão com MySQL");

try {
    $conn = getConnection();
    printResult("Conexão com o banco principal (sistema_rh) estabelecida", 'success');
} catch (PDOException $e) {
    printResult("Erro ao conectar ao banco principal: " . $e->getMessage(), 'error');
    printResult("Verifique se o banco 'sistema_rh' existe e as credenciais estão corretas", 'warning');
    exit(1);
}

try {
    $connDominio = getDominioConnection();
    printResult("Conexão com o banco de domínio (dominio) estabelecida", 'success');
} catch (PDOException $e) {
    printResult("Erro ao conectar ao banco de domínio: " . $e->getMessage(), 'error');
    printResult("Verifique se o banco 'dominio' existe", 'warning');
}
endSection();

// Verificar tabelas do banco principal
printSection("3. Verificando Tabelas do Banco Principal (sistema_rh)");

$tabelasPrincipais = ['tbUsuarios', 'tbPessoas', 'tbPessoaTipo', 'tbAvaliacao'];
$tabelasOk = true;

foreach ($tabelasPrincipais as $tabela) {
    try {
        $stmt = $conn->query("SHOW TABLES LIKE '$tabela'");
        if ($stmt->rowCount() > 0) {
            // Contar registros
            $countStmt = $conn->query("SELECT COUNT(*) as total FROM $tabela");
            $count = $countStmt->fetch()['total'];
            printResult("✓ Tabela '$tabela' existe ($count registros)", 'success');
        } else {
            printResult("✗ Tabela '$tabela' NÃO encontrada", 'error');
            $tabelasOk = false;
        }
    } catch (PDOException $e) {
        printResult("✗ Erro ao verificar tabela '$tabela': " . $e->getMessage(), 'error');
        $tabelasOk = false;
    }
}
endSection();

// Verificar tabela de domínio
printSection("4. Verificando Tabela de Domínio (dominio.tbAvaliacaoStatus)");

try {
    $stmt = $connDominio->query("SHOW TABLES LIKE 'tbAvaliacaoStatus'");
    if ($stmt->rowCount() > 0) {
        $countStmt = $connDominio->query("SELECT COUNT(*) as total FROM tbAvaliacaoStatus");
        $count = $countStmt->fetch()['total'];
        printResult("✓ Tabela 'tbAvaliacaoStatus' existe ($count registros)", 'success');
        
        // Listar status
        $statusStmt = $connDominio->query("SELECT * FROM tbAvaliacaoStatus");
        $statuses = $statusStmt->fetchAll();
        if (!$isCli) {
            echo "<table><tr><th>ID</th><th>Descrição</th></tr>";
        }
        foreach ($statuses as $status) {
            if ($isCli) {
                printResult("  - ID {$status['avaliacao_status_id']}: {$status['descricao']}", 'info');
            } else {
                echo "<tr><td>{$status['avaliacao_status_id']}</td><td>{$status['descricao']}</td></tr>";
            }
        }
        if (!$isCli) {
            echo "</table>";
        }
    } else {
        printResult("✗ Tabela 'tbAvaliacaoStatus' NÃO encontrada", 'error');
    }
} catch (PDOException $e) {
    printResult("✗ Erro ao verificar tabela de domínio: " . $e->getMessage(), 'error');
}
endSection();

// Verificar tipos de pessoa
printSection("5. Verificando Dados Iniciais");

try {
    $stmt = $conn->query("SELECT COUNT(*) as total FROM tbPessoaTipo");
    $count = $stmt->fetch()['total'];
    printResult("Tipos de pessoa cadastrados: $count", $count > 0 ? 'success' : 'warning');
    
    if ($count > 0) {
        $tiposStmt = $conn->query("SELECT * FROM tbPessoaTipo");
        $tipos = $tiposStmt->fetchAll();
        if (!$isCli) {
            echo "<table><tr><th>ID</th><th>Nome</th></tr>";
        }
        foreach ($tipos as $tipo) {
            if ($isCli) {
                printResult("  - ID {$tipo['pessoa_tipo_id']}: {$tipo['nome']}", 'info');
            } else {
                echo "<tr><td>{$tipo['pessoa_tipo_id']}</td><td>{$tipo['nome']}</td></tr>";
            }
        }
        if (!$isCli) {
            echo "</table>";
        }
    }
} catch (PDOException $e) {
    printResult("Erro ao verificar tipos: " . $e->getMessage(), 'error');
}

// Verificar usuário admin
printSection("6. Verificando Usuário Administrador");

try {
    $stmt = $conn->query("SELECT usuario_id, nome, login FROM tbUsuarios WHERE login = 'admin'");
    $admin = $stmt->fetch();
    
    if ($admin) {
        printResult("✓ Usuário 'admin' encontrado (ID: {$admin['usuario_id']}, Nome: {$admin['nome']})", 'success');
        printResult("Você pode fazer login com: admin / admin123", 'info');
    } else {
        printResult("✗ Usuário 'admin' NÃO encontrado", 'warning');
        printResult("Execute: php database/init_admin.php", 'info');
    }
} catch (PDOException $e) {
    printResult("Erro ao verificar usuário admin: " . $e->getMessage(), 'error');
}
endSection();

// Resumo final
printSection("📊 Resumo Final");

if ($tabelasOk) {
    printResult("✅ Banco de dados importado com SUCESSO!", 'success');
    printResult("O sistema está pronto para uso!", 'success');
    printResult("Acesse: http://localhost:8000", 'info');
} else {
    printResult("⚠️ Alguns problemas foram encontrados", 'warning');
    printResult("Verifique os erros acima e tente importar novamente", 'warning');
}

if (!$isCli) {
    echo "</div></body></html>";
}

?>

