// Gerenciamento de Avaliações

let avaliacoesList = [];
let statusList = [];
// pessoasList pode estar definido em pessoas.js, então verificamos antes
if (typeof pessoasList === 'undefined') {
    var pessoasList = [];
}
let competenciasList = [];
let tiposAvaliacaoList = [];

// Garantir que as funções estejam no escopo global
window.loadAvaliacoes = async function() {
    try {
        const response = await fetch('api/avaliacoes.php');
        const data = await response.json();
        
        if (data.success) {
            avaliacoesList = data.data;
            renderAvaliacoesTable();
        } else {
            showAlert('danger', 'Erro ao carregar avaliações: ' + data.message);
        }
    } catch (error) {
        showAlert('danger', 'Erro ao carregar avaliações: ' + error.message);
    }
};

// Renderizar tabela de avaliações
function renderAvaliacoesTable() {
    const tbody = document.getElementById('avaliacoesTableBody');
    
    if (!tbody) {
        console.error('Elemento avaliacoesTableBody não encontrado');
        return;
    }
    
    if (avaliacoesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma avaliação cadastrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = avaliacoesList.map(av => `
        <tr>
            <td>${av.avaliacao_id}</td>
            <td>${formatDate(av.data)}</td>
            <td>${av.funcionario_nome || '-'}</td>
            <td>${av.tipo_descricao || '-'}</td>
            <td>
                <span class="badge bg-${getStatusColor(av.status_descricao)}">
                    ${av.status_descricao || '-'}
                </span>
            </td>
            <td>${formatNota(av.nota_final)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="const func = window.editAvaliacao || editAvaliacao; if(typeof func === 'function') func(${av.avaliacao_id});" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="const func = window.viewAvaliacao || viewAvaliacao; if(typeof func === 'function') func(${av.avaliacao_id});" title="Ver detalhes">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Obter cor do badge por status
function getStatusColor(status) {
    if (!status) return 'secondary';
    const s = status.toLowerCase();
    if (s.includes('pendente')) return 'warning';
    if (s.includes('concluída')) return 'success';
    if (s.includes('cancelada')) return 'danger';
    return 'info';
}

// Formatar data
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Formatar nota de forma segura
function formatNota(nota) {
    if (nota === null || nota === undefined || nota === '') {
        return '-';
    }
    const numNota = parseFloat(nota);
    if (isNaN(numNota)) {
        return '-';
    }
    return numNota.toFixed(2);
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Carregar status
async function loadStatus() {
    try {
        const response = await fetch('api/status.php');
        const data = await response.json();
        
        if (data.success) {
            statusList = data.data;
            const select = document.getElementById('avaliacao_status_id');
            if (select) {
                select.innerHTML = '<option value="">Selecione...</option>' +
                    statusList.map(status => 
                        `<option value="${status.avaliacao_status_id}">${status.descricao}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar status:', error);
    }
}

// Carregar tipos de avaliação
async function loadTiposAvaliacao() {
    try {
        const response = await fetch('api/tipos_avaliacao.php');
        const data = await response.json();
        
        if (data.success) {
            tiposAvaliacaoList = data.data;
            const select = document.getElementById('avaliacao_tipo_id');
            if (select) {
                select.innerHTML = '<option value="">Selecione...</option>' +
                    tiposAvaliacaoList.map(tipo => 
                        `<option value="${tipo.avaliacao_tipo_id}">${tipo.descricao}</option>`
                    ).join('');
            
                // Mostrar campo avaliador se não for autoavaliação
                select.addEventListener('change', function() {
                    const tipoId = parseInt(this.value);
                    const tipo = tiposAvaliacaoList.find(t => t.avaliacao_tipo_id === tipoId);
                    const container = document.getElementById('avaliadorContainer');
                    if (container && tipo && !tipo.descricao.toLowerCase().includes('auto')) {
                        container.style.display = 'block';
                    } else {
                        container.style.display = 'none';
                    }
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar tipos de avaliação:', error);
    }
}

// Carregar competências
async function loadCompetencias() {
    try {
        const response = await fetch('api/competencias.php');
        const data = await response.json();
        
        if (data.success) {
            competenciasList = data.data;
            renderCompetenciasForm();
        }
    } catch (error) {
        console.error('Erro ao carregar competências:', error);
    }
}

// Renderizar formulário de competências
function renderCompetenciasForm(competenciasAvaliacao = []) {
    const container = document.getElementById('competenciasContainer');
    if (!container) return;
    
    if (competenciasList.length === 0) {
        container.innerHTML = '<p class="text-warning">Nenhuma competência cadastrada no sistema.</p>';
        return;
    }
    
    container.innerHTML = competenciasList.map(comp => {
        const avaliacao = competenciasAvaliacao.find(c => c.competencia_id == comp.competencia_id);
        return `
            <div class="card mb-2">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-5">
                            <strong>${comp.nome}</strong>
                            ${comp.descricao ? `<br><small class="text-muted">${comp.descricao}</small>` : ''}
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Nota (0-10)</label>
                            <input type="number" class="form-control competencia-nota" 
                                   data-competencia-id="${comp.competencia_id}"
                                   value="${avaliacao ? avaliacao.nota : ''}"
                                   step="0.1" min="0" max="10" 
                                   onchange="calcularNotaFinal()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Observação</label>
                            <textarea class="form-control competencia-obs" 
                                      data-competencia-id="${comp.competencia_id}"
                                      rows="2" placeholder="Opcional">${avaliacao ? (avaliacao.observacao || '') : ''}</textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Calcular nota final
window.calcularNotaFinal = function() {
    const notas = document.querySelectorAll('.competencia-nota');
    let total = 0;
    let count = 0;
    
    notas.forEach(input => {
        const nota = parseFloat(input.value);
        if (!isNaN(nota) && nota >= 0 && nota <= 10) {
            total += nota;
            count++;
        }
    });
    
    const notaFinal = count > 0 ? (total / count).toFixed(2) : '';
    const inputNotaFinal = document.getElementById('avaliacao_nota_final');
    if (inputNotaFinal) {
        inputNotaFinal.value = notaFinal;
    }
}

// Carregar pessoas para o select
async function loadPessoasForSelect() {
    try {
        const response = await fetch('api/pessoas.php');
        const data = await response.json();
        
        if (data.success) {
            // Usar window.pessoasList se existir, senão criar local
            if (typeof window.pessoasList !== 'undefined') {
                window.pessoasList = data.data;
            } else if (typeof pessoasList !== 'undefined') {
                pessoasList = data.data;
            } else {
                window.pessoasList = data.data;
            }
            
            const pessoasData = window.pessoasList || pessoasList || data.data;
            const selectFunc = document.getElementById('avaliacao_funcionario_id');
            const selectAval = document.getElementById('avaliacao_avaliador_id');
            
            const options = '<option value="">Selecione...</option>' +
                pessoasData.map(pessoa => 
                    `<option value="${pessoa.pessoa_id}">${pessoa.nome}</option>`
                ).join('');
            
            if (selectFunc) selectFunc.innerHTML = options;
            if (selectAval) selectAval.innerHTML = options;
        }
    } catch (error) {
        console.error('Erro ao carregar pessoas:', error);
    }
}

// Abrir modal de avaliação - garantir escopo global
window.openAvaliacaoModal = async function(avaliacaoId = null) {
    try {
        await Promise.all([
            loadStatus(), 
            loadPessoasForSelect(), 
            loadTiposAvaliacao(),
            loadCompetencias()
        ]);
        
        // Verificar se há pessoas cadastradas
        const pessoasData = window.pessoasList || pessoasList || [];
        if (pessoasData.length === 0) {
            showAlert('warning', 'Você precisa cadastrar pelo menos um colaborador antes de criar uma avaliação. Vá em Colaboradores e cadastre alguém.');
            return;
        }
        
        // Verificar se há competências
        if (competenciasList.length === 0) {
            showAlert('warning', 'Nenhuma competência cadastrada. O sistema precisa de competências para realizar avaliações.');
            return;
        }
        
        const modalElement = document.getElementById('avaliacaoModal');
        if (!modalElement) {
            console.error('Modal de avaliação não encontrado');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        const form = document.getElementById('avaliacaoForm');
        
        if (!form) {
            console.error('Formulário de avaliação não encontrado');
            return;
        }
        
        // Limpar formulário
        form.reset();
        document.getElementById('avaliacao_id').value = '';
        document.getElementById('avaliacao_data').value = new Date().toISOString().split('T')[0];
        document.getElementById('avaliacao_nota_final').value = '';
        
        if (avaliacaoId) {
            // Editar avaliação existente
            const response = await fetch(`api/avaliacoes.php?id=${avaliacaoId}`);
            const result = await response.json();
            
            if (result.success && result.data) {
                const avaliacao = result.data;
                document.getElementById('avaliacaoModalTitle').textContent = 'Editar Avaliação';
                document.getElementById('avaliacao_id').value = avaliacao.avaliacao_id;
                document.getElementById('avaliacao_data').value = avaliacao.data;
                document.getElementById('avaliacao_ciclo').value = avaliacao.ciclo_periodo || '';
                document.getElementById('avaliacao_funcionario_id').value = avaliacao.funcionario_id;
                document.getElementById('avaliacao_tipo_id').value = avaliacao.avaliacao_tipo_id || '';
                document.getElementById('avaliacao_avaliador_id').value = avaliacao.avaliador_id || '';
                document.getElementById('avaliacao_status_id').value = avaliacao.avaliacao_status_id;
                document.getElementById('avaliacao_observacao').value = avaliacao.observacao || '';
                document.getElementById('avaliacao_nota_final').value = avaliacao.nota_final || '';
                
                // Renderizar competências com dados existentes
                renderCompetenciasForm(avaliacao.competencias || []);
            }
        } else {
            document.getElementById('avaliacaoModalTitle').textContent = 'Nova Avaliação';
            renderCompetenciasForm([]);
        }
        
        modal.show();
    } catch (error) {
        console.error('Erro ao abrir modal de avaliação:', error);
        showAlert('danger', 'Erro ao abrir formulário: ' + error.message);
    }
};

// Salvar avaliação - garantir escopo global
window.saveAvaliacao = async function() {
    const form = document.getElementById('avaliacaoForm');
    if (!form) {
        showAlert('danger', 'Formulário não encontrado');
        return;
    }
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Coletar competências
    const competencias = [];
    document.querySelectorAll('.competencia-nota').forEach(input => {
        const nota = parseFloat(input.value);
        if (!isNaN(nota) && nota >= 0 && nota <= 10) {
            const competenciaId = parseInt(input.getAttribute('data-competencia-id'));
            const obsInput = document.querySelector(`.competencia-obs[data-competencia-id="${competenciaId}"]`);
            
            competencias.push({
                competencia_id: competenciaId,
                nota: nota,
                observacao: obsInput ? obsInput.value : null
            });
        }
    });
    
    if (competencias.length === 0) {
        showAlert('warning', 'Preencha pelo menos uma competência com nota.');
        return;
    }
    
    const avaliacaoId = document.getElementById('avaliacao_id').value;
    const data = {
        data: document.getElementById('avaliacao_data').value,
        ciclo_periodo: document.getElementById('avaliacao_ciclo').value || null,
        funcionario_id: parseInt(document.getElementById('avaliacao_funcionario_id').value),
        avaliador_id: document.getElementById('avaliacao_avaliador_id').value ? 
                      parseInt(document.getElementById('avaliacao_avaliador_id').value) : null,
        avaliacao_tipo_id: parseInt(document.getElementById('avaliacao_tipo_id').value),
        avaliacao_status_id: parseInt(document.getElementById('avaliacao_status_id').value),
        observacao: document.getElementById('avaliacao_observacao').value || null,
        competencias: competencias
    };
    
    try {
        const url = 'api/avaliacoes.php';
        const method = avaliacaoId ? 'PUT' : 'POST';
        
        if (avaliacaoId) {
            data.avaliacao_id = parseInt(avaliacaoId);
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            const modalElement = document.getElementById('avaliacaoModal');
            if (modalElement) {
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
            loadAvaliacoes();
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        } else {
            // Se não autorizado, redirecionar para login
            if (result.message && result.message.includes('Não autorizado')) {
                showAlert('warning', 'Sessão expirada. Redirecionando para login...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showAlert('danger', result.message || 'Erro ao salvar avaliação');
            }
        }
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        showAlert('danger', 'Erro ao salvar avaliação: ' + error.message);
    }
};

// Ver detalhes da avaliação
window.viewAvaliacao = async function(avaliacaoId) {
    console.log('viewAvaliacao chamado com ID:', avaliacaoId);
    try {
        const response = await fetch(`api/avaliacoes.php?id=${avaliacaoId}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Resposta da API:', result);
        
        if (result.success && result.data) {
            const av = result.data;
            
            // Criar estrutura HTML do modal
            let competenciasHtml = '';
            if (av.competencias && av.competencias.length > 0) {
                competenciasHtml = av.competencias.map(comp => `
                    <tr>
                        <td>${comp.competencia_nome || '-'}</td>
                        <td><strong>${formatNota(comp.nota)}</strong></td>
                        <td>${comp.observacao || '-'}</td>
                    </tr>
                `).join('');
            } else {
                competenciasHtml = '<tr><td colspan="3" class="text-center">Nenhuma competência avaliada</td></tr>';
            }
            
            let html = `
                <div class="modal fade" id="modalViewAvaliacao" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Detalhes da Avaliação #${av.avaliacao_id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <dl class="row">
                                    <dt class="col-sm-3">Data:</dt>
                                    <dd class="col-sm-9">${formatDate(av.data)}</dd>
                                    
                                    <dt class="col-sm-3">Funcionário:</dt>
                                    <dd class="col-sm-9">${av.funcionario_nome || '-'}</dd>
                                    
                                    <dt class="col-sm-3">Tipo:</dt>
                                    <dd class="col-sm-9">${av.tipo_descricao || '-'}</dd>
                                    
                                    <dt class="col-sm-3">Status:</dt>
                                    <dd class="col-sm-9"><span class="badge bg-${getStatusColor(av.status_descricao)}">${av.status_descricao || '-'}</span></dd>
                                    
                                    <dt class="col-sm-3">Nota Final:</dt>
                                    <dd class="col-sm-9"><strong>${formatNota(av.nota_final)}</strong></dd>
                                </dl>
                                
                                <h6 class="mt-3">Competências:</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Competência</th>
                                                <th>Nota</th>
                                                <th>Observação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${competenciasHtml}
                                        </tbody>
                                    </table>
                                </div>
                                
                                ${av.observacao ? `<h6 class="mt-3">Observações:</h6><p>${escapeHtml(av.observacao)}</p>` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal anterior se existir
            const existingModal = document.getElementById('modalViewAvaliacao');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Criar e adicionar novo modal
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html.trim();
            const modalElement = tempDiv.firstElementChild;
            
            if (modalElement) {
                document.body.appendChild(modalElement);
                
                // Inicializar e mostrar modal
                const modal = new bootstrap.Modal(modalElement, {
                    backdrop: true,
                    keyboard: true
                });
                
                modal.show();
                
                // Remover modal do DOM quando fechar
                modalElement.addEventListener('hidden.bs.modal', function() {
                    if (modalElement && modalElement.parentNode) {
                        modalElement.remove();
                    }
                });
            } else {
                console.error('Erro ao criar elemento do modal');
                showAlert('danger', 'Erro ao exibir detalhes da avaliação');
            }
        } else {
            showAlert('warning', 'Avaliação não encontrada');
        }
    } catch (error) {
        console.error('Erro ao carregar avaliação:', error);
        showAlert('danger', 'Erro ao carregar detalhes da avaliação');
    }
};

// Editar avaliação - garantir escopo global
window.editAvaliacao = function(avaliacaoId) {
    const func = window.openAvaliacaoModal || openAvaliacaoModal;
    if (typeof func === 'function') {
        func(avaliacaoId);
    }
};

// Garantir que as funções também estejam disponíveis sem o prefixo window
// (para compatibilidade com código que não usa window.)
loadAvaliacoes = window.loadAvaliacoes;
openAvaliacaoModal = window.openAvaliacaoModal;
saveAvaliacao = window.saveAvaliacao;
editAvaliacao = window.editAvaliacao;
viewAvaliacao = window.viewAvaliacao;

// Log de confirmação
console.log('✓ avaliacoes.js carregado - Funções disponíveis:', {
    loadAvaliacoes: typeof window.loadAvaliacoes,
    openAvaliacaoModal: typeof window.openAvaliacaoModal,
    saveAvaliacao: typeof window.saveAvaliacao,
    editAvaliacao: typeof window.editAvaliacao
});
