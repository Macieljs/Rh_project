<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado. Faça login novamente.']);
    exit;
}

$conn = getConnection();
$connDominio = getDominioConnection();
$usuarioId = $_SESSION['usuario_id'];

$metodo = $_SERVER['REQUEST_METHOD'];

try {
    if ($metodo === 'GET') {
        $metaId = $_GET['id'] ?? null;
        
        if ($metaId) {
            // Buscar meta específica com resultados-chave
            $stmt = $conn->prepare("
                SELECT m.*, 
                       p.nome as funcionario_nome,
                       s.descricao as status_descricao,
                       u.nome as atualizado_por_nome
                FROM tbMetas m
                LEFT JOIN tbPessoas p ON m.pessoa_id = p.pessoa_id
                LEFT JOIN dominio.tbMetaStatus s ON m.meta_status_id = s.meta_status_id
                LEFT JOIN tbUsuarios u ON m.atualizado_por = u.usuario_id
                WHERE m.meta_id = ?
            ");
            $stmt->execute([$metaId]);
            $meta = $stmt->fetch();
            
            if ($meta) {
                $stmtKr = $conn->prepare("SELECT * FROM tbMetaResultadoChave WHERE meta_id = ?");
                $stmtKr->execute([$metaId]);
                $meta['resultados_chave'] = $stmtKr->fetchAll();
            }
            
            echo json_encode(['success' => true, 'data' => $meta]);
        } else {
            // Listar todas as metas
            $stmt = $conn->query("
                SELECT m.*, 
                       p.nome as funcionario_nome,
                       s.descricao as status_descricao
                FROM tbMetas m
                LEFT JOIN tbPessoas p ON m.pessoa_id = p.pessoa_id
                LEFT JOIN dominio.tbMetaStatus s ON m.meta_status_id = s.meta_status_id
                ORDER BY m.ciclo DESC, p.nome
            ");
            $metas = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $metas]);
        }
    } 
    
    elseif ($metodo === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $conn->beginTransaction();
        
        // Inserir meta
        $stmt = $conn->prepare("
            INSERT INTO tbMetas (pessoa_id, titulo, descricao, ciclo, meta_status_id, atualizado_por)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['pessoa_id'],
            $data['titulo'],
            $data['descricao'] ?? null,
            $data['ciclo'],
            $data['meta_status_id'],
            $usuarioId
        ]);
        
        $metaId = $conn->lastInsertId();
        
        // Inserir resultados-chave
        if (isset($data['resultados_chave']) && is_array($data['resultados_chave'])) {
            $stmtKr = $conn->prepare("
                INSERT INTO tbMetaResultadoChave (meta_id, descricao, valor_inicial, valor_alvo, valor_atual, unidade)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($data['resultados_chave'] as $kr) {
                $stmtKr->execute([
                    $metaId,
                    $kr['descricao'],
                    $kr['valor_inicial'] ?? 0,
                    $kr['valor_alvo'],
                    $kr['valor_atual'] ?? $kr['valor_inicial'] ?? 0,
                    $kr['unidade']
                ]);
            }
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Meta cadastrada com sucesso', 'meta_id' => $metaId]);
    } 
    
    elseif ($metodo === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $metaId = $data['meta_id'];
        
        $conn->beginTransaction();
        
        // Atualizar meta
        $stmt = $conn->prepare("
            UPDATE tbMetas 
            SET pessoa_id = ?, titulo = ?, descricao = ?, ciclo = ?, meta_status_id = ?, 
                progresso_calculado = ?, atualizado_por = ?, atualizado_em = CURRENT_TIMESTAMP
            WHERE meta_id = ?
        ");
        $stmt->execute([
            $data['pessoa_id'],
            $data['titulo'],
            $data['descricao'] ?? null,
            $data['ciclo'],
            $data['meta_status_id'],
            $data['progresso_calculado'] ?? 0,
            $usuarioId,
            $metaId
        ]);
        
        // Deletar resultados-chave antigos
        $stmtDel = $conn->prepare("DELETE FROM tbMetaResultadoChave WHERE meta_id = ?");
        $stmtDel->execute([$metaId]);
        
        // Inserir novos resultados-chave
        if (isset($data['resultados_chave']) && is_array($data['resultados_chave'])) {
            $stmtKr = $conn->prepare("
                INSERT INTO tbMetaResultadoChave (meta_id, descricao, valor_inicial, valor_alvo, valor_atual, unidade)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($data['resultados_chave'] as $kr) {
                $stmtKr->execute([
                    $metaId,
                    $kr['descricao'],
                    $kr['valor_inicial'] ?? 0,
                    $kr['valor_alvo'],
                    $kr['valor_atual'] ?? 0,
                    $kr['unidade']
                ]);
            }
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Meta atualizada com sucesso']);
    } 
    
    elseif ($metodo === 'DELETE') {
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            // A tabela tbMetaResultadoChave deve ter ON DELETE CASCADE
            $stmt = $conn->prepare("DELETE FROM tbMetas WHERE meta_id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Meta removida com sucesso']);
        }
    }
} catch (PDOException $e) {
    $conn->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>