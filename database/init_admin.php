<?php
// Script para inicializar o usuário administrador
// Execute este script após criar o banco de dados

// Ajustar o caminho baseado de onde o script é executado
$basePath = dirname(__DIR__);
require_once $basePath . '/config/database.php';

$senha = 'admin123';
$hash = password_hash($senha, PASSWORD_DEFAULT);

try {
    $conn = getConnection();
    
    // Verificar se já existe
    $stmt = $conn->prepare("SELECT usuario_id FROM tbUsuarios WHERE login = 'admin'");
    $stmt->execute();
    
    if ($stmt->fetch()) {
        // Atualizar senha
        $stmt = $conn->prepare("UPDATE tbUsuarios SET senha = ?, atualizado_por = 1 WHERE login = 'admin'");
        $stmt->execute([$hash]);
        echo "Senha do administrador atualizada com sucesso!\n";
        echo "Login: admin\n";
        echo "Senha: admin123\n";
    } else {
        // Criar usuário
        $stmt = $conn->prepare("INSERT INTO tbUsuarios (nome, login, senha, atualizado_por) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Administrador', 'admin', $hash, 1]);
        
        // Atualizar o próprio registro para ter atualizado_por válido
        $stmt = $conn->prepare("UPDATE tbUsuarios SET atualizado_por = usuario_id WHERE login = 'admin'");
        $stmt->execute();
        
        echo "Usuário administrador criado com sucesso!\n";
        echo "Login: admin\n";
        echo "Senha: admin123\n";
    }
} catch(PDOException $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>

