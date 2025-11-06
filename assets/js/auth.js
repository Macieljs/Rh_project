// Gerenciamento de autenticação

// Verificar se está logado
function checkAuth() {
    // Verificação simples via sessionStorage
    const loggedIn = sessionStorage.getItem('loggedIn');
    if (!loggedIn && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
}

// Função de login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const login = document.getElementById('login').value;
            const senha = document.getElementById('senha').value;
            
            try {
                const response = await fetch('api/login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ login, senha })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    sessionStorage.setItem('loggedIn', 'true');
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    showAlert('danger', data.message);
                }
            } catch (error) {
                showAlert('danger', 'Erro ao fazer login: ' + error.message);
            }
        });
    }
    
    // Verificar autenticação em páginas protegidas
    checkAuth();
    
    // Carregar informações do usuário no dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (user.nome) {
            document.getElementById('userName').textContent = user.nome;
        }
    }
});

// Função de logout
async function logout() {
    try {
        await fetch('api/logout.php');
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Função para exibir alertas
function showAlert(type, message, containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    container.innerHTML = '';
    container.appendChild(alert);
    
    // Auto remover após 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

