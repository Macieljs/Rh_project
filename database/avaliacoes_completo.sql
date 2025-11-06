-- Script para expandir funcionalidades de avaliação
-- Execute após o schema.sql

USE sistema_rh;

-- Tabela de competências
CREATE TABLE IF NOT EXISTS tbCompetencia (
    competencia_id INT(10) NOT NULL AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (competencia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de tipo de avaliação
USE dominio;

CREATE TABLE IF NOT EXISTS tbAvaliacaoTipo (
    avaliacao_tipo_id INT(10) NOT NULL AUTO_INCREMENT,
    descricao VARCHAR(200) NOT NULL UNIQUE,
    PRIMARY KEY (avaliacao_tipo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE sistema_rh;

-- Adicionar campos na tabela de avaliação (verificar se já existem primeiro)
SET @dbname = DATABASE();
SET @tablename = 'tbAvaliacao';
SET @columnname = 'avaliacao_tipo_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT(10) NULL AFTER avaliacao_status_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'avaliador_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT(11) NULL AFTER funcionario_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'ciclo_periodo';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL AFTER data')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'nota_final';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(5,2) NULL AFTER observacao')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Adicionar foreign keys (verificar se já existem)
SET @constraintname = 'fk_avaliacao_tipo';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT ', @constraintname, ' FOREIGN KEY (avaliacao_tipo_id) REFERENCES dominio.tbAvaliacaoTipo(avaliacao_tipo_id)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @constraintname = 'fk_avaliador';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT ', @constraintname, ' FOREIGN KEY (avaliador_id) REFERENCES tbPessoas(pessoa_id)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Tabela de notas de competências
CREATE TABLE IF NOT EXISTS tbAvaliacaoCompetencia (
    avaliacao_competencia_id INT(10) NOT NULL AUTO_INCREMENT,
    avaliacao_id INT(10) NOT NULL,
    competencia_id INT(10) NOT NULL,
    nota DECIMAL(5,2) NOT NULL,
    observacao TEXT NULL,
    PRIMARY KEY (avaliacao_competencia_id),
    FOREIGN KEY (avaliacao_id) REFERENCES tbAvaliacao(avaliacao_id) ON DELETE CASCADE,
    FOREIGN KEY (competencia_id) REFERENCES tbCompetencia(competencia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir tipos de avaliação
USE dominio;

INSERT IGNORE INTO tbAvaliacaoTipo (descricao) VALUES
('Autoavaliação'),
('Avaliação do Gestor'),
('Avaliação 360°'),
('Avaliação de RH');

-- Inserir competências padrão
USE sistema_rh;

INSERT IGNORE INTO tbCompetencia (nome, descricao) VALUES
('Comunicação', 'Capacidade de se expressar claramente e de forma eficaz'),
('Trabalho em Equipe', 'Capacidade de colaborar e trabalhar em conjunto'),
('Liderança', 'Capacidade de liderar e motivar equipes'),
('Proatividade', 'Iniciativa e capacidade de antecipar necessidades'),
('Organização', 'Capacidade de organizar e planejar tarefas'),
('Resolução de Problemas', 'Capacidade de identificar e resolver problemas'),
('Adaptabilidade', 'Capacidade de se adaptar a mudanças'),
('Orientação a Resultados', 'Foco em atingir objetivos e metas');
