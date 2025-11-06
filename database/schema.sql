-- Sistema de Desempenho de Funcionários
-- Script de criação do banco de dados MySQL

CREATE DATABASE IF NOT EXISTS sistema_rh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sistema_rh;

-- Tabela de tipos de pessoa
CREATE TABLE IF NOT EXISTS tbPessoaTipo (
    pessoa_tipo_id INT(10) NOT NULL AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL UNIQUE,
    PRIMARY KEY (pessoa_tipo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS tbUsuarios (
    usuario_id INT(10) NOT NULL AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    atualizado_por INT(10) NOT NULL,
    PRIMARY KEY (usuario_id),
    FOREIGN KEY (atualizado_por) REFERENCES tbUsuarios(usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de pessoas
CREATE TABLE IF NOT EXISTS tbPessoas (
    pessoa_id INT(11) NOT NULL AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    nascimento DATE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    pessoa_tipo_id INT(10) NOT NULL,
    atualizado_por INT(10) NOT NULL,
    atualizado_em DATE NOT NULL,
    PRIMARY KEY (pessoa_id),
    FOREIGN KEY (pessoa_tipo_id) REFERENCES tbPessoaTipo(pessoa_tipo_id),
    FOREIGN KEY (atualizado_por) REFERENCES tbUsuarios(usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de status de avaliação (dominio)
CREATE DATABASE IF NOT EXISTS dominio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dominio;

CREATE TABLE IF NOT EXISTS tbAvaliacaoStatus (
    avaliacao_status_id INT(10) NOT NULL AUTO_INCREMENT,
    descricao VARCHAR(200) NOT NULL UNIQUE,
    PRIMARY KEY (avaliacao_status_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE sistema_rh;

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS tbAvaliacao (
    avaliacao_id INT(10) NOT NULL AUTO_INCREMENT,
    data DATE NOT NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    observacao VARCHAR(255) NULL,
    funcionario_id INT(11) NOT NULL,
    avaliacao_status_id INT(10) NOT NULL,
    atualizado_por INT(10) NOT NULL,
    PRIMARY KEY (avaliacao_id),
    FOREIGN KEY (funcionario_id) REFERENCES tbPessoas(pessoa_id),
    FOREIGN KEY (avaliacao_status_id) REFERENCES dominio.tbAvaliacaoStatus(avaliacao_status_id),
    FOREIGN KEY (atualizado_por) REFERENCES tbUsuarios(usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados iniciais
USE dominio;

INSERT INTO tbAvaliacaoStatus (descricao) VALUES
('Pendente'),
('Em Andamento'),
('Concluída'),
('Cancelada');

USE sistema_rh;

INSERT INTO tbPessoaTipo (nome) VALUES
('Colaborador'),
('Gestor'),
('RH / Business Partner'),
('Administrador');

-- Criar usuário administrador padrão
-- NOTA: Execute o script database/init_admin.php para criar/atualizar a senha do admin
-- Ou execute: INSERT INTO tbUsuarios (nome, login, senha, atualizado_por) VALUES
-- ('Administrador', 'admin', '[hash gerado com password_hash()]', 1);

