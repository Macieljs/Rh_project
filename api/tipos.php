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
        $stmt = $conn->query("SELECT * FROM tbPessoaTipo ORDER BY nome");
        $tipos = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $tipos]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>

