<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

// Configurar CORS e cookies de sessão
header('Access-Control-Allow-Credentials: true');
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado. Faça login novamente.']);
    exit;
}

$conn = getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->query("
            SELECT p.*, pt.nome as tipo_nome, u.nome as atualizado_por_nome
            FROM tbPessoas p
            LEFT JOIN tbPessoaTipo pt ON p.pessoa_tipo_id = pt.pessoa_tipo_id
            LEFT JOIN tbUsuarios u ON p.atualizado_por = u.usuario_id
            ORDER BY p.nome
        ");
        $pessoas = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $pessoas]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $stmt = $conn->prepare("
            INSERT INTO tbPessoas (nome, cpf, nascimento, telefone, pessoa_tipo_id, atualizado_por, atualizado_em)
            VALUES (?, ?, ?, ?, ?, ?, CURDATE())
        ");
        $stmt->execute([
            $data['nome'],
            $data['cpf'],
            $data['nascimento'],
            $data['telefone'],
            $data['pessoa_tipo_id'],
            $_SESSION['usuario_id']
        ]);
        echo json_encode(['success' => true, 'message' => 'Pessoa cadastrada com sucesso']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $stmt = $conn->prepare("
            UPDATE tbPessoas 
            SET nome = ?, cpf = ?, nascimento = ?, telefone = ?, pessoa_tipo_id = ?, atualizado_por = ?, atualizado_em = CURDATE()
            WHERE pessoa_id = ?
        ");
        $stmt->execute([
            $data['nome'],
            $data['cpf'],
            $data['nascimento'],
            $data['telefone'],
            $data['pessoa_tipo_id'],
            $_SESSION['usuario_id'],
            $data['pessoa_id']
        ]);
        echo json_encode(['success' => true, 'message' => 'Pessoa atualizada com sucesso']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    
    if ($id) {
        try {
            $stmt = $conn->prepare("DELETE FROM tbPessoas WHERE pessoa_id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Pessoa removida com sucesso']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>

