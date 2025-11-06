<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$connDominio = getDominioConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $connDominio->query("SELECT * FROM tbAvaliacaoTipo ORDER BY descricao");
        $tipos = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $tipos]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>

