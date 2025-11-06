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
$connDominio = getDominioConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $avaliacaoId = $_GET['id'] ?? null;
        
        if ($avaliacaoId) {
            // Buscar avaliação específica com competências
            $stmt = $conn->prepare("
                SELECT a.*, 
                       p.nome as funcionario_nome,
                       av.nome as avaliador_nome,
                       s.descricao as status_descricao,
                       t.descricao as tipo_descricao,
                       u.nome as atualizado_por_nome
                FROM tbAvaliacao a
                LEFT JOIN tbPessoas p ON a.funcionario_id = p.pessoa_id
                LEFT JOIN tbPessoas av ON a.avaliador_id = av.pessoa_id
                LEFT JOIN dominio.tbAvaliacaoStatus s ON a.avaliacao_status_id = s.avaliacao_status_id
                LEFT JOIN dominio.tbAvaliacaoTipo t ON a.avaliacao_tipo_id = t.avaliacao_tipo_id
                LEFT JOIN tbUsuarios u ON a.atualizado_por = u.usuario_id
                WHERE a.avaliacao_id = ?
            ");
            $stmt->execute([$avaliacaoId]);
            $avaliacao = $stmt->fetch();
            
            if ($avaliacao) {
                // Buscar competências
                $stmtComp = $conn->prepare("
                    SELECT ac.*, c.nome as competencia_nome, c.descricao as competencia_descricao
                    FROM tbAvaliacaoCompetencia ac
                    JOIN tbCompetencia c ON ac.competencia_id = c.competencia_id
                    WHERE ac.avaliacao_id = ?
                ");
                $stmtComp->execute([$avaliacaoId]);
                $avaliacao['competencias'] = $stmtComp->fetchAll();
            }
            
            echo json_encode(['success' => true, 'data' => $avaliacao]);
        } else {
            // Listar todas as avaliações
            $stmt = $conn->query("
                SELECT a.*, 
                       p.nome as funcionario_nome,
                       av.nome as avaliador_nome,
                       s.descricao as status_descricao,
                       t.descricao as tipo_descricao,
                       u.nome as atualizado_por_nome
                FROM tbAvaliacao a
                LEFT JOIN tbPessoas p ON a.funcionario_id = p.pessoa_id
                LEFT JOIN tbPessoas av ON a.avaliador_id = av.pessoa_id
                LEFT JOIN dominio.tbAvaliacaoStatus s ON a.avaliacao_status_id = s.avaliacao_status_id
                LEFT JOIN dominio.tbAvaliacaoTipo t ON a.avaliacao_tipo_id = t.avaliacao_tipo_id
                LEFT JOIN tbUsuarios u ON a.atualizado_por = u.usuario_id
                ORDER BY a.data DESC
            ");
            $avaliacoes = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $avaliacoes]);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $conn->beginTransaction();
        
        // Inserir avaliação
        $stmt = $conn->prepare("
            INSERT INTO tbAvaliacao (data, ciclo_periodo, observacao, funcionario_id, avaliador_id, avaliacao_tipo_id, avaliacao_status_id, atualizado_por, nota_final)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['data'],
            $data['ciclo_periodo'] ?? null,
            $data['observacao'] ?? null,
            $data['funcionario_id'],
            $data['avaliador_id'] ?? null,
            $data['avaliacao_tipo_id'] ?? 1,
            $data['avaliacao_status_id'],
            $_SESSION['usuario_id'],
            $data['nota_final'] ?? null
        ]);
        
        $avaliacaoId = $conn->lastInsertId();
        
        // Inserir competências
        if (isset($data['competencias']) && is_array($data['competencias'])) {
            $stmtComp = $conn->prepare("
                INSERT INTO tbAvaliacaoCompetencia (avaliacao_id, competencia_id, nota, observacao)
                VALUES (?, ?, ?, ?)
            ");
            
            foreach ($data['competencias'] as $comp) {
                $stmtComp->execute([
                    $avaliacaoId,
                    $comp['competencia_id'],
                    $comp['nota'],
                    $comp['observacao'] ?? null
                ]);
            }
            
            // Calcular nota final se não foi fornecida
            if (!isset($data['nota_final'])) {
                $totalNotas = array_sum(array_column($data['competencias'], 'nota'));
                $count = count($data['competencias']);
                $notaFinal = $count > 0 ? round($totalNotas / $count, 2) : null;
                
                if ($notaFinal) {
                    $stmtUpdate = $conn->prepare("UPDATE tbAvaliacao SET nota_final = ? WHERE avaliacao_id = ?");
                    $stmtUpdate->execute([$notaFinal, $avaliacaoId]);
                }
            }
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Avaliação cadastrada com sucesso', 'avaliacao_id' => $avaliacaoId]);
    } catch(PDOException $e) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $conn->beginTransaction();
        
        // Atualizar avaliação
        $stmt = $conn->prepare("
            UPDATE tbAvaliacao 
            SET data = ?, ciclo_periodo = ?, observacao = ?, funcionario_id = ?, avaliador_id = ?, 
                avaliacao_tipo_id = ?, avaliacao_status_id = ?, atualizado_por = ?, nota_final = ?
            WHERE avaliacao_id = ?
        ");
        $stmt->execute([
            $data['data'],
            $data['ciclo_periodo'] ?? null,
            $data['observacao'] ?? null,
            $data['funcionario_id'],
            $data['avaliador_id'] ?? null,
            $data['avaliacao_tipo_id'] ?? 1,
            $data['avaliacao_status_id'],
            $_SESSION['usuario_id'],
            $data['nota_final'] ?? null,
            $data['avaliacao_id']
        ]);
        
        // Atualizar competências
        if (isset($data['competencias']) && is_array($data['competencias'])) {
            // Deletar competências antigas
            $stmtDel = $conn->prepare("DELETE FROM tbAvaliacaoCompetencia WHERE avaliacao_id = ?");
            $stmtDel->execute([$data['avaliacao_id']]);
            
            // Inserir novas competências
            $stmtComp = $conn->prepare("
                INSERT INTO tbAvaliacaoCompetencia (avaliacao_id, competencia_id, nota, observacao)
                VALUES (?, ?, ?, ?)
            ");
            
            foreach ($data['competencias'] as $comp) {
                $stmtComp->execute([
                    $data['avaliacao_id'],
                    $comp['competencia_id'],
                    $comp['nota'],
                    $comp['observacao'] ?? null
                ]);
            }
            
            // Calcular nota final
            $totalNotas = array_sum(array_column($data['competencias'], 'nota'));
            $count = count($data['competencias']);
            $notaFinal = $count > 0 ? round($totalNotas / $count, 2) : null;
            
            if ($notaFinal) {
                $stmtUpdate = $conn->prepare("UPDATE tbAvaliacao SET nota_final = ? WHERE avaliacao_id = ?");
                $stmtUpdate->execute([$notaFinal, $data['avaliacao_id']]);
            }
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Avaliação atualizada com sucesso']);
    } catch(PDOException $e) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    
    if ($id) {
        try {
            $stmt = $conn->prepare("DELETE FROM tbAvaliacao WHERE avaliacao_id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Avaliação removida com sucesso']);
        } catch(PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
