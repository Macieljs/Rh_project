<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$conn = getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM tbCompetencia WHERE ativo = 1 ORDER BY nome");
        $competencias = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $competencias]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>

