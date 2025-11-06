<?php
/**
 * Script PHP para executar o SQL de avaliações completo
 * Execute: php executar-avaliacoes-final.php
 */

echo "========================================\n";
echo "Instalando Funcionalidade de Avaliações\n";
echo "========================================\n\n";

require_once 'config/database.php';

try {
    $conn = getConnection();
    $connDominio = getDominioConnection();
    
    echo "✓ Conectado aos bancos de dados!\n\n";
    
    // 1. Criar tabela de competências
    echo "1. Criando tabela de competências...\n";
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS tbCompetencia (
            competencia_id INT(10) NOT NULL AUTO_INCREMENT,
            nome VARCHAR(200) NOT NULL,
            descricao TEXT NULL,
            ativo BOOLEAN DEFAULT TRUE,
            PRIMARY KEY (competencia_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        echo "   ✓ Tabela tbCompetencia criada\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') === false) {
            echo "   ⚠ " . $e->getMessage() . "\n";
        } else {
            echo "   ✓ Tabela tbCompetencia já existe\n";
        }
    }
    
    // 2. Criar tabela de tipos de avaliação no banco dominio
    echo "2. Criando tabela de tipos de avaliação...\n";
    try {
        $connDominio->exec("CREATE TABLE IF NOT EXISTS tbAvaliacaoTipo (
            avaliacao_tipo_id INT(10) NOT NULL AUTO_INCREMENT,
            descricao VARCHAR(200) NOT NULL UNIQUE,
            PRIMARY KEY (avaliacao_tipo_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        echo "   ✓ Tabela tbAvaliacaoTipo criada\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') === false) {
            echo "   ⚠ " . $e->getMessage() . "\n";
        } else {
            echo "   ✓ Tabela tbAvaliacaoTipo já existe\n";
        }
    }
    
    // 3. Adicionar colunas na tabela de avaliação
    echo "3. Adicionando colunas na tabela tbAvaliacao...\n";
    
    $columns = [
        ['name' => 'avaliacao_tipo_id', 'type' => 'INT(10) NULL', 'after' => 'avaliacao_status_id'],
        ['name' => 'avaliador_id', 'type' => 'INT(11) NULL', 'after' => 'funcionario_id'],
        ['name' => 'ciclo_periodo', 'type' => 'VARCHAR(50) NULL', 'after' => 'data'],
        ['name' => 'nota_final', 'type' => 'DECIMAL(5,2) NULL', 'after' => 'observacao']
    ];
    
    foreach ($columns as $col) {
        try {
            // Verificar se a coluna já existe
            $stmt = $conn->query("SHOW COLUMNS FROM tbAvaliacao LIKE '{$col['name']}'");
            if ($stmt->rowCount() == 0) {
                $conn->exec("ALTER TABLE tbAvaliacao ADD COLUMN {$col['name']} {$col['type']} AFTER {$col['after']}");
                echo "   ✓ Coluna {$col['name']} adicionada\n";
            } else {
                echo "   ✓ Coluna {$col['name']} já existe\n";
            }
        } catch (PDOException $e) {
            echo "   ⚠ Erro ao adicionar {$col['name']}: " . $e->getMessage() . "\n";
        }
    }
    
    // 4. Adicionar foreign keys
    echo "4. Adicionando foreign keys...\n";
    
    try {
        // Verificar se a FK já existe
        $stmt = $conn->query("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                             WHERE TABLE_SCHEMA = 'sistema_rh' 
                             AND TABLE_NAME = 'tbAvaliacao' 
                             AND CONSTRAINT_NAME = 'fk_avaliacao_tipo'");
        if ($stmt->rowCount() == 0) {
            $conn->exec("ALTER TABLE tbAvaliacao 
                        ADD CONSTRAINT fk_avaliacao_tipo 
                        FOREIGN KEY (avaliacao_tipo_id) REFERENCES dominio.tbAvaliacaoTipo(avaliacao_tipo_id)");
            echo "   ✓ Foreign key fk_avaliacao_tipo criada\n";
        } else {
            echo "   ✓ Foreign key fk_avaliacao_tipo já existe\n";
        }
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false) {
            echo "   ⚠ Erro ao criar FK: " . $e->getMessage() . "\n";
        } else {
            echo "   ✓ Foreign key fk_avaliacao_tipo já existe\n";
        }
    }
    
    try {
        $stmt = $conn->query("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                             WHERE TABLE_SCHEMA = 'sistema_rh' 
                             AND TABLE_NAME = 'tbAvaliacao' 
                             AND CONSTRAINT_NAME = 'fk_avaliador'");
        if ($stmt->rowCount() == 0) {
            $conn->exec("ALTER TABLE tbAvaliacao 
                        ADD CONSTRAINT fk_avaliador 
                        FOREIGN KEY (avaliador_id) REFERENCES tbPessoas(pessoa_id)");
            echo "   ✓ Foreign key fk_avaliador criada\n";
        } else {
            echo "   ✓ Foreign key fk_avaliador já existe\n";
        }
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') === false) {
            echo "   ⚠ Erro ao criar FK: " . $e->getMessage() . "\n";
        } else {
            echo "   ✓ Foreign key fk_avaliador já existe\n";
        }
    }
    
    // 5. Criar tabela de competências da avaliação
    echo "5. Criando tabela de avaliação por competências...\n";
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS tbAvaliacaoCompetencia (
            avaliacao_competencia_id INT(10) NOT NULL AUTO_INCREMENT,
            avaliacao_id INT(10) NOT NULL,
            competencia_id INT(10) NOT NULL,
            nota DECIMAL(5,2) NOT NULL,
            observacao TEXT NULL,
            PRIMARY KEY (avaliacao_competencia_id),
            FOREIGN KEY (avaliacao_id) REFERENCES tbAvaliacao(avaliacao_id) ON DELETE CASCADE,
            FOREIGN KEY (competencia_id) REFERENCES tbCompetencia(competencia_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        echo "   ✓ Tabela tbAvaliacaoCompetencia criada\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') === false) {
            echo "   ⚠ " . $e->getMessage() . "\n";
        } else {
            echo "   ✓ Tabela tbAvaliacaoCompetencia já existe\n";
        }
    }
    
    // 6. Inserir tipos de avaliação
    echo "6. Inserindo tipos de avaliação...\n";
    $tipos = ['Autoavaliação', 'Avaliação do Gestor', 'Avaliação 360°', 'Avaliação de RH'];
    foreach ($tipos as $tipo) {
        try {
            $stmt = $connDominio->prepare("INSERT IGNORE INTO tbAvaliacaoTipo (descricao) VALUES (?)");
            $stmt->execute([$tipo]);
        } catch (PDOException $e) {
            // Ignorar duplicatas
        }
    }
    echo "   ✓ Tipos de avaliação inseridos\n";
    
    // 7. Inserir competências padrão
    echo "7. Inserindo competências padrão...\n";
    $competencias = [
        ['Comunicação', 'Capacidade de se expressar claramente e de forma eficaz'],
        ['Trabalho em Equipe', 'Capacidade de colaborar e trabalhar em conjunto'],
        ['Liderança', 'Capacidade de liderar e motivar equipes'],
        ['Proatividade', 'Iniciativa e capacidade de antecipar necessidades'],
        ['Organização', 'Capacidade de organizar e planejar tarefas'],
        ['Resolução de Problemas', 'Capacidade de identificar e resolver problemas'],
        ['Adaptabilidade', 'Capacidade de se adaptar a mudanças'],
        ['Orientação a Resultados', 'Foco em atingir objetivos e metas']
    ];
    
    foreach ($competencias as $comp) {
        try {
            $stmt = $conn->prepare("INSERT IGNORE INTO tbCompetencia (nome, descricao) VALUES (?, ?)");
            $stmt->execute([$comp[0], $comp[1]]);
        } catch (PDOException $e) {
            // Ignorar duplicatas
        }
    }
    echo "   ✓ Competências inseridas\n";
    
    echo "\n========================================\n";
    echo "✅ Instalação concluída com sucesso!\n";
    echo "========================================\n\n";
    echo "Próximos passos:\n";
    echo "1. Recarregue a página do sistema (Ctrl + Shift + R)\n";
    echo "2. Vá em Avaliações → Nova Avaliação\n";
    echo "3. Teste criando uma avaliação completa\n\n";
    
} catch (PDOException $e) {
    die("ERRO: " . $e->getMessage() . "\n");
}
?>

