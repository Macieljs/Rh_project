// Gerenciamento de Metas (OKR/KPI)

let metasList = [];
let metaStatusList = [];

// Garantir que pessoasList esteja acessível
if (typeof window.pessoasList === 'undefined') {
    window.pessoasList = [];
}

// Carregar metas
window.loadMetas = async function() {
    try {
        const response = await fetch('api/metas.php');
        const data = await response.json();
        
        if (data.success) {
            metasList = data.data;
            renderMetasTable();
        } else {
            showAlert('danger', 'Erro ao carregar metas: ' + data.message);
        }
    } catch (error) {
        showAlert('danger', 'Erro ao carregar metas: ' + error.message);
    }
};

// Renderizar tabela de metas
function renderMetasTable() {
    const tbody = document.getElementById('metasTableBody');
    if (!tbody) {
        console.error('Elemento metasTableBody não encontrado');
        return;
    }
    
    if (metasList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma meta cadastrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = metasList.map(meta => `
        <tr>
            <td>${meta.meta_id}</td>
            <td>${meta.funcionario_nome || '-'}</td>
            <td>${escapeHtml(meta.titulo)}</td>
            <td>${meta.ciclo}</td>
            <td>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar" role="progressbar" style="width: ${meta.progresso_calculado || 0}%;" 
                         aria-valuenow="${meta.progresso_calculado || 0}" aria-valuemin="0" aria-valuemax="100">
                         ${parseFloat(meta.progresso_calculado || 0).toFixed(0)}%
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-${getStatusColor(meta.status_descricao)}">
                    ${meta.status_descricao || '-'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="window.editMeta(${meta.meta_id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.deleteMeta(${meta.meta_id})" title="Excluir">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Carregar status das metas (para o modal)
async function loadMetaStatus() {
    try {
        // Criar um endpoint simples para status de metas ou reutilizar o de avaliações se for o caso
        // Vamos criar um novo: api/meta_status.php
        // Por simplicidade, vamos usar o de avaliações se existir, ou criar um novo
        // NOVO: Vamos buscar do novo endpoint que criamos (tbMetaStatus)
        // Precisamos criar api/meta_status.php
        
        // --- Rota Rápida: Criar api/meta_status.php ---
        // (Copie api/status.php para api/meta_status.php e mude 
        // "tbAvaliacaoStatus" para "tbMetaStatus")
        // Assumindo que você criou "api/meta_status.php" similar ao "api/status.php":
        
        // Simples: faremos o fetch dos status de meta
        const response = await fetch('api/meta_status.php'); // CRIE ESTE ARQUIVO!
        const data = await response.json();
        
        if (data.success) {
            metaStatusList = data.data;
            const select = document.getElementById('meta_status_id');
            if (select) {
                select.innerHTML = '<option value="">Selecione...</option>' +
                    metaStatusList.map(status => 
                        `<option value="${status.meta_status_id}">${status.descricao}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar status de metas:', error);
        // Fallback manual se a API falhar
        const select = document.getElementById('meta_status_id');
        if (select) {
            select.innerHTML = `
                <option value="">Selecione...</option>
                <option value="1">Pendente</option>
                <option value="2">Em Andamento</option>
                <option value="3">Concluída</option>
                <option value="4">Cancelada</option>
            `;
        }
    }
}

// (Reutiliza a função loadPessoasForSelect de avaliacoes.js se estiver carregado, senão redefine)
if (typeof window.loadPessoasForSelect === 'undefined') {
    window.loadPessoasForSelect = async function() {
        try {
            const response = await fetch('api/pessoas.php');
            const data = await response.json();
            
            if (data.success) {
                window.pessoasList = data.data;
            }
        } catch (error) {
            console.error('Erro ao carregar pessoas:', error);
        }
    };
}

// Preencher selects do modal
async function preencherSelectsMeta() {
    if (window.pessoasList.length === 0) {
        await window.loadPessoasForSelect();
    }
    
    const selectPessoa = document.getElementById('meta_pessoa_id');
    const options = '<option value="">Selecione...</option>' +
        window.pessoasList.map(pessoa => 
            `<option value="${pessoa.pessoa_id}">${pessoa.nome}</option>`
        ).join('');
    
    if (selectPessoa) selectPessoa.innerHTML = options;
    
    // Carregar status
    await loadMetaStatus();
}

// Abrir modal de meta
window.openMetaModal = async function(metaId = null) {
    await preencherSelectsMeta();
    
    const modalElement = document.getElementById('metaModal');
    if (!modalElement) {
        console.error('Modal #metaModal não encontrado');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    const form = document.getElementById('metaForm');
    
    form.reset();
    document.getElementById('meta_id').value = '';
    document.getElementById('meta_progresso').value = '0';
    document.getElementById('resultadosChaveContainer').innerHTML = '';
    
    if (metaId) {
        // Editar
        document.getElementById('metaModalTitle').textContent = 'Editar Meta';
        
        try {
            const response = await fetch(`api/metas.php?id=${metaId}`);
            const result = await response.json();
            
            if (result.success && result.data) {
                const meta = result.data;
                document.getElementById('meta_id').value = meta.meta_id;
                document.getElementById('meta_pessoa_id').value = meta.pessoa_id;
                document.getElementById('meta_ciclo').value = meta.ciclo;
                document.getElementById('meta_titulo').value = meta.titulo;
                document.getElementById('meta_descricao').value = meta.descricao || '';
                document.getElementById('meta_status_id').value = meta.meta_status_id;
                document.getElementById('meta_progresso').value = meta.progresso_calculado || 0;
                
                if (meta.resultados_chave) {
                    meta.resultados_chave.forEach(kr => adicionarResultadoChave(kr));
                }
            } else {
                showAlert('danger', result.message || 'Erro ao carregar meta');
            }
        } catch (error) {
            showAlert('danger', 'Erro: ' + error.message);
        }
    } else {
        // Novo
        document.getElementById('metaModalTitle').textContent = 'Nova Meta';
        adicionarResultadoChave(); // Adiciona um KR em branco
    }
    
    modal.show();
};

// Adicionar campo de resultado-chave
window.adicionarResultadoChave = function(kr = null) {
    const container = document.getElementById('resultadosChaveContainer');
    const krId = Date.now(); // ID temporário
    
    const krHtml = `
        <div class="card mb-2" id="kr-card-${krId}">
            <div class="card-body">
                <div class="mb-2">
                    <label class="form-label">Descrição do KR</label>
                    <input type="text" class="form-control kr-descricao" value="${kr ? escapeHtml(kr.descricao) : ''}" required>
                </div>
                <div class="row">
                    <div class="col-md-3">
                        <label class="form-label">Inicial</label>
                        <input type="number" class="form-control kr-valor-inicial" value="${kr ? kr.valor_inicial : '0'}" step="any" onchange="calcularProgresso()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Alvo</label>
                        <input type="number" class="form-control kr-valor-alvo" value="${kr ? kr.valor_alvo : ''}" step="any" required onchange="calcularProgresso()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Atual</label>
                        <input type="number" class="form-control kr-valor-atual" value="${kr ? kr.valor_atual : '0'}" step="any" required onchange="calcularProgresso()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Unidade</label>
                        <select class="form-select kr-unidade" required>
                            <option value="%" ${kr && kr.unidade === '%' ? 'selected' : ''}>%</option>
                            <option value="R$" ${kr && kr.unidade === 'R$' ? 'selected' : ''}>R$</option>
                            <option value="unidades" ${kr && kr.unidade === 'unidades' ? 'selected' : ''}>Unidades</option>
                            <option value="dias" ${kr && kr.unidade === 'dias' ? 'selected' : ''}>Dias</option>
                        </select>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger mt-2" onclick="removerResultadoChave('kr-card-${krId}')">
                    Remover KR
                </button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', krHtml);
};

// Remover KR
window.removerResultadoChave = function(elementId) {
    document.getElementById(elementId)?.remove();
    calcularProgresso();
};

// Calcular progresso
window.calcularProgresso = function() {
    let progressoTotal = 0;
    let krCount = 0;
    
    document.querySelectorAll('#resultadosChaveContainer .card').forEach(card => {
        const inicial = parseFloat(card.querySelector('.kr-valor-inicial').value) || 0;
        const alvo = parseFloat(card.querySelector('.kr-valor-alvo').value);
        const atual = parseFloat(card.querySelector('.kr-valor-atual').value);
        
        if (!isNaN(alvo) && !isNaN(atual) && (alvo - inicial) !== 0) {
            let progressoKr = ((atual - inicial) / (alvo - inicial)) * 100;
            progressoKr = Math.max(0, Math.min(100, progressoKr)); // Limita entre 0 e 100
            progressoTotal += progressoKr;
            krCount++;
        }
    });
    
    const progressoMedio = krCount > 0 ? (progressoTotal / krCount) : 0;
    document.getElementById('meta_progresso').value = progressoMedio.toFixed(2);
};

// Salvar meta
window.saveMeta = async function() {
    const form = document.getElementById('metaForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const metaId = document.getElementById('meta_id').value;
    
    // Coletar KRs
    const resultadosChave = [];
    let krsValidos = true;
    document.querySelectorAll('#resultadosChaveContainer .card').forEach(card => {
        const descricao = card.querySelector('.kr-descricao').value;
        const valorAlvo = card.querySelector('.kr-valor-alvo').value;
        
        if (!descricao || !valorAlvo) {
            krsValidos = false;
        }
        
        resultadosChave.push({
            descricao: descricao,
            valor_inicial: parseFloat(card.querySelector('.kr-valor-inicial').value) || 0,
            valor_alvo: parseFloat(valorAlvo),
            valor_atual: parseFloat(card.querySelector('.kr-valor-atual').value) || 0,
            unidade: card.querySelector('.kr-unidade').value
        });
    });
    
    if (!krsValidos || resultadosChave.length === 0) {
        showAlert('warning', 'Preencha todos os campos dos Resultados-Chave (Descrição e Alvo). Pelo menos um KR é necessário.');
        return;
    }
    
    const data = {
        pessoa_id: parseInt(document.getElementById('meta_pessoa_id').value),
        ciclo: document.getElementById('meta_ciclo').value,
        titulo: document.getElementById('meta_titulo').value,
        descricao: document.getElementById('meta_descricao').value,
        meta_status_id: parseInt(document.getElementById('meta_status_id').value),
        progresso_calculado: parseFloat(document.getElementById('meta_progresso').value),
        resultados_chave: resultadosChave
    };
    
    try {
        const url = 'api/metas.php';
        const method = metaId ? 'PUT' : 'POST';
        
        if (metaId) {
            data.meta_id = parseInt(metaId);
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            bootstrap.Modal.getInstance(document.getElementById('metaModal')).hide();
            loadMetas();
        } else {
            showAlert('danger', result.message || 'Erro ao salvar meta');
        }
    } catch (error) {
        showAlert('danger', 'Erro: ' + error.message);
    }
};

// Editar meta
window.editMeta = function(metaId) {
    window.openMetaModal(metaId);
};

// Deletar meta
window.deleteMeta = async function(metaId) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) {
        return;
    }
    
    try {
        const response = await fetch(`api/metas.php?id=${metaId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            loadMetas();
        } else {
            showAlert('danger', result.message);
        }
    } catch (error) {
        showAlert('danger', 'Erro ao deletar meta: ' + error.message);
    }
};

// Funções utilitárias (podem já existir em outros JS, mas garantimos aqui)
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

if (typeof getStatusColor === 'undefined') {
    function getStatusColor(status) {
        if (!status) return 'secondary';
        const s = status.toLowerCase();
        if (s.includes('pendente')) return 'warning';
        if (s.includes('concluída')) return 'success';
        if (s.includes('cancelada')) return 'danger';
        return 'info';
    }
}

console.log('✓ metas.js carregado');