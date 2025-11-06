// Gerenciamento do Dashboard

let statusChart = null;
let monthlyChart = null;

// Função para mostrar seções - garantir escopo global
window.showSection = function(sectionName) {
    console.log('showSection chamado com:', sectionName);
    
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar a seção solicitada
    const section = document.getElementById(`section-${sectionName}`);
    console.log('Seção encontrada:', section ? 'SIM' : 'NÃO', 'ID:', `section-${sectionName}`);
    
    if (section) {
        section.style.display = 'block';
        console.log('Seção exibida:', sectionName);
        
        // Carregar dados específicos da seção
        if (sectionName === 'dashboard') {
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        } else if (sectionName === 'pessoas') {
            if (typeof loadPessoas === 'function') {
                loadPessoas();
            } else {
                console.error('loadPessoas não está definido');
            }
        } else if (sectionName === 'avaliacoes') {
            console.log('Tentando carregar avaliações...');
            // Verificar tanto window.loadAvaliacoes quanto loadAvaliacoes
            const loadFunc = window.loadAvaliacoes || (typeof loadAvaliacoes !== 'undefined' ? loadAvaliacoes : null);
            console.log('loadAvaliacoes disponível?', typeof loadFunc);
            
            if (typeof loadFunc === 'function') {
                console.log('Chamando loadAvaliacoes...');
                try {
                    loadFunc();
                } catch (error) {
                    console.error('Erro ao chamar loadAvaliacoes:', error);
                    showAlert('danger', 'Erro ao carregar avaliações: ' + error.message);
                }
            } else {
                console.error('loadAvaliacoes não está definido. Verifique se assets/js/avaliacoes.js está carregado.');
                // Tentar carregar novamente após um pequeno delay
                setTimeout(() => {
                    const loadFunc2 = window.loadAvaliacoes || (typeof loadAvaliacoes !== 'undefined' ? loadAvaliacoes : null);
                    if (typeof loadFunc2 === 'function') {
                        console.log('Carregando avaliações após delay...');
                        loadFunc2();
                    } else {
                        console.error('Ainda não foi possível carregar loadAvaliacoes');
                        // Mostrar alerta visual
                        if (typeof showAlert === 'function') {
                            showAlert('warning', 'Erro ao carregar avaliações. Recarregue a página.');
                        } else {
                            alert('Erro: Não foi possível carregar avaliações. Recarregue a página (Ctrl+Shift+R).');
                        }
                    }
                }, 500);
            }
        } else if (sectionName === 'metas') {
                if (typeof window.loadMetas === 'function') {
                    window.loadMetas();
                } else {
                    console.error('loadMetas não está definido');
                }
        } else if (sectionName === 'relatorios') {
            if (typeof loadRelatorios === 'function') {
                loadRelatorios();
            }
        }
    } else {
        console.error('Seção não encontrada:', `section-${sectionName}`);
        alert('Erro: Seção não encontrada. Verifique o console para mais detalhes.');
    }
}

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        // Carregar pessoas
        const pessoasResponse = await fetch('api/pessoas.php');
        const pessoasData = await pessoasResponse.json();
        const totalPessoas = pessoasData.success ? pessoasData.data.length : 0;
        document.getElementById('totalColaboradores').textContent = totalPessoas;
        
        // Carregar avaliações
        const avaliacoesResponse = await fetch('api/avaliacoes.php');
        const avaliacoesData = await avaliacoesResponse.json();
        
        if (avaliacoesData.success) {
            const avaliacoes = avaliacoesData.data;
            document.getElementById('totalAvaliacoes').textContent = avaliacoes.length;
            
            // Contar por status
            const pendentes = avaliacoes.filter(a => 
                a.status_descricao && a.status_descricao.toLowerCase().includes('pendente')
            ).length;
            const concluidas = avaliacoes.filter(a => 
                a.status_descricao && a.status_descricao.toLowerCase().includes('concluída')
            ).length;
            
            document.getElementById('avaliacoesPendentes').textContent = pendentes;
            document.getElementById('avaliacoesConcluidas').textContent = concluidas;
        } else {
            document.getElementById('totalAvaliacoes').textContent = '0';
            document.getElementById('avaliacoesPendentes').textContent = '0';
            document.getElementById('avaliacoesConcluidas').textContent = '0';
        }
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    }
}

// Carregar relatórios
async function loadRelatorios() {
    try {
        const response = await fetch('api/avaliacoes.php');
        const data = await response.json();
        
        if (data.success) {
            const avaliacoes = data.data;
            
            // Gráfico de status
            const statusCount = {};
            avaliacoes.forEach(av => {
                const status = av.status_descricao || 'Desconhecido';
                statusCount[status] = (statusCount[status] || 0) + 1;
            });
            
            const statusCtx = document.getElementById('statusChart');
            if (statusCtx && statusChart) {
                statusChart.destroy();
            }
            
            if (statusCtx) {
                statusChart = new Chart(statusCtx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(statusCount),
                        datasets: [{
                            data: Object.values(statusCount),
                            backgroundColor: [
                                '#FF6384',
                                '#36A2EB',
                                '#FFCE56',
                                '#4BC0C0'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true
                    }
                });
            }
            
            // Gráfico mensal
            const monthlyCount = {};
            avaliacoes.forEach(av => {
                if (av.data) {
                    const month = new Date(av.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    monthlyCount[month] = (monthlyCount[month] || 0) + 1;
                }
            });
            
            const monthlyCtx = document.getElementById('monthlyChart');
            if (monthlyCtx && monthlyChart) {
                monthlyChart.destroy();
            }
            
            if (monthlyCtx) {
                monthlyChart = new Chart(monthlyCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(monthlyCount),
                        datasets: [{
                            label: 'Avaliações',
                            data: Object.values(monthlyCount),
                            backgroundColor: '#36A2EB'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
    }
}

// Criar alias para compatibilidade
showSection = window.showSection;

// Inicializar dashboard ao carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard inicializado');
    console.log('showSection disponível?', typeof window.showSection);
    loadDashboardData();
    
    // Mostrar dashboard por padrão
    if (typeof showSection === 'function') {
        showSection('dashboard');
    }
});

