# Sistema de Desempenho de Funcionários

Sistema completo de gestão de desempenho desenvolvido com HTML, CSS, JavaScript, Bootstrap e MySQL.

## 📋 Funcionalidades

### Casos de Uso Implementados:
- ✅ Cadastro de colaboradores e estrutura (área, cargo, gestor)
- ✅ Cadastro de avaliações de desempenho
- ✅ Gestão de status de avaliações
- ✅ Dashboard com indicadores
- ✅ Relatórios e gráficos

### Atores Suportados:
- Colaborador
- Gestor
- RH / Business Partner
- Administrador do Sistema

## 🛠️ Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Framework CSS:** Bootstrap 5.3
- **Backend:** PHP 7.4+
- **Banco de Dados:** MySQL 5.7+
- **Bibliotecas:**
  - Chart.js (gráficos)
  - Bootstrap Icons

## 📁 Estrutura do Projeto

```
Rh_project/
├── api/                    # Endpoints PHP
│   ├── login.php
│   ├── logout.php
│   ├── pessoas.php
│   ├── avaliacoes.php
│   ├── tipos.php
│   └── status.php
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js
│       ├── dashboard.js
│       ├── pessoas.js
│       └── avaliacoes.js
├── config/
│   └── database.php       # Configuração do banco
├── database/
│   └── schema.sql         # Script de criação do banco
├── index.html             # Página de login
├── dashboard.html         # Dashboard principal
└── README.md
```

## 🚀 Instalação

### 1. Pré-requisitos
- PHP 7.4 ou superior
- MySQL 5.7 ou superior
- Servidor web (Apache/Nginx) ou PHP built-in server

### 2. Configuração do Banco de Dados

1. Importe o script SQL:
```bash
mysql -u root -p < database/schema.sql
```

2. Configure as credenciais em `config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'sua_senha');
```

### 3. Executar o Projeto

**Opção 1: PHP Built-in Server**
```bash
php -S localhost:8000
```

**Opção 2: Apache/Nginx**
Configure o virtual host apontando para a pasta do projeto.

### 4. Acessar o Sistema

Abra no navegador: `http://localhost:8000`

**Credenciais padrão:**
- Login: `admin`
- Senha: `admin123`

## 📊 Modelo de Dados

O sistema utiliza as seguintes tabelas conforme o ERD:

- `tbUsuarios` - Usuários do sistema
- `tbPessoas` - Colaboradores
- `tbPessoaTipo` - Tipos de pessoa (Colaborador, Gestor, etc.)
- `tbAvaliacao` - Avaliações de desempenho
- `dominio.tbAvaliacaoStatus` - Status das avaliações

## 🔐 Segurança

- Senhas são criptografadas usando `password_hash()` do PHP
- Autenticação via sessão PHP
- Validação de dados no frontend e backend
- Proteção contra SQL Injection usando PDO prepared statements

## 📝 Próximas Funcionalidades

- [ ] Sistema de metas (OKR/KPI)
- [ ] Check-ins e feedback contínuo
- [ ] Autoavaliação do colaborador
- [ ] Avaliação 360°
- [ ] Calibração de notas/competências
- [ ] Geração de PDI (Plano de Desenvolvimento Individual)
- [ ] Fechamento e homologação de ciclos
- [ ] Sistema de notificações

## 👥 Desenvolvido para

Este sistema foi desenvolvido para atender aos requisitos de um sistema de gestão de desempenho de funcionários, seguindo as especificações do ERD e casos de uso fornecidos.

## 📄 Licença

Este projeto é de uso interno.

# Rh_project
