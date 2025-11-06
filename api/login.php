<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $login = $data['login'] ?? '';
    $senha = $data['senha'] ?? '';
    
    if (empty($login) || empty($senha)) {
        echo json_encode(['success' => false, 'message' => 'Login e senha são obrigatórios']);
        exit;
    }
    
    try {
        $conn = getConnection();
        $stmt = $conn->prepare("SELECT usuario_id, nome, login, senha FROM tbUsuarios WHERE login = ?");
        $stmt->execute([$login]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($senha, $user['senha'])) {
            $_SESSION['usuario_id'] = $user['usuario_id'];
            $_SESSION['usuario_nome'] = $user['nome'];
            $_SESSION['usuario_login'] = $user['login'];
            
            echo json_encode([
                'success' => true,
                'message' => 'Login realizado com sucesso',
                'user' => [
                    'id' => $user['usuario_id'],
                    'nome' => $user['nome'],
                    'login' => $user['login']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Login ou senha incorretos']);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Erro ao processar login: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
}
?>

