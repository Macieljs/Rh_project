// Gerenciamento de Pessoas

// Usar window para evitar conflitos com outros arquivos
window.pessoasList = window.pessoasList || [];
var pessoasList = window.pessoasList; // Alias para compatibilidade
let tiposList = [];

// Carregar lista de pessoas
async function loadPessoas() {
    try {
        const response = await fetch('api/pessoas.php');
        const data = await response.json();
        
        if (data.success) {
            window.pessoasList = data.data;
            pessoasList = data.data;
            renderPessoasTable();
        } else {
            showAlert('danger', 'Erro ao carregar pessoas: ' + data.message);
        }
    } catch (error) {
        showAlert('danger', 'Erro ao carregar pessoas: ' + error.message);
    }
}

// Renderizar tabela de pessoas
function renderPessoasTable() {
    const tbody = document.getElementById('pessoasTableBody');
    
    const pessoasData = window.pessoasList || pessoasList || [];
    if (pessoasData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma pessoa cadastrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = pessoasData.map(pessoa => `
        <tr>
            <td>${pessoa.pessoa_id}</td>
            <td>${pessoa.nome}</td>
            <td>${pessoa.cpf}</td>
            <td>${pessoa.telefone}</td>
            <td>${pessoa.tipo_nome || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editPessoa(${pessoa.pessoa_id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePessoa(${pessoa.pessoa_id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Carregar tipos de pessoa
async function loadTipos() {
    try {
        const response = await fetch('api/tipos.php');
        const data = await response.json();
        
        if (data.success) {
            tiposList = data.data;
            const select = document.getElementById('pessoa_tipo_id');
            if (select) {
                select.innerHTML = '<option value="">Selecione...</option>' +
                    tiposList.map(tipo => 
                        `<option value="${tipo.pessoa_tipo_id}">${tipo.nome}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar tipos:', error);
    }
}

// Abrir modal de pessoa
async function openPessoaModal(pessoaId = null) {
    await loadTipos();
    
    const modal = new bootstrap.Modal(document.getElementById('pessoaModal'));
    const form = document.getElementById('pessoaForm');
    
    // Limpar formulário
    form.reset();
    document.getElementById('pessoa_id').value = '';
    
    if (pessoaId) {
        // Editar pessoa existente
        const pessoasData = window.pessoasList || pessoasList || [];
        const pessoa = pessoasData.find(p => p.pessoa_id == pessoaId);
        if (pessoa) {
            document.getElementById('pessoaModalTitle').textContent = 'Editar Pessoa';
            document.getElementById('pessoa_id').value = pessoa.pessoa_id;
            document.getElementById('pessoa_nome').value = pessoa.nome;
            document.getElementById('pessoa_cpf').value = pessoa.cpf;
            document.getElementById('pessoa_nascimento').value = pessoa.nascimento;
            document.getElementById('pessoa_telefone').value = pessoa.telefone;
            document.getElementById('pessoa_tipo_id').value = pessoa.pessoa_tipo_id;
        }
    } else {
        document.getElementById('pessoaModalTitle').textContent = 'Nova Pessoa';
    }
    
    modal.show();
}

// Salvar pessoa
async function savePessoa() {
    const form = document.getElementById('pessoaForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const pessoaId = document.getElementById('pessoa_id').value;
    const data = {
        nome: document.getElementById('pessoa_nome').value,
        cpf: document.getElementById('pessoa_cpf').value,
        nascimento: document.getElementById('pessoa_nascimento').value,
        telefone: document.getElementById('pessoa_telefone').value,
        pessoa_tipo_id: parseInt(document.getElementById('pessoa_tipo_id').value)
    };
    
    try {
        const url = 'api/pessoas.php';
        const method = pessoaId ? 'PUT' : 'POST';
        
        if (pessoaId) {
            data.pessoa_id = parseInt(pessoaId);
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
            bootstrap.Modal.getInstance(document.getElementById('pessoaModal')).hide();
            loadPessoas();
            loadDashboardData(); // Atualizar dashboard
        } else {
            // Se não autorizado, redirecionar para login
            if (result.message && result.message.includes('Não autorizado')) {
                showAlert('warning', 'Sessão expirada. Redirecionando para login...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showAlert('danger', result.message || 'Erro ao salvar pessoa');
            }
        }
    } catch (error) {
        showAlert('danger', 'Erro ao salvar pessoa: ' + error.message);
    }
}

// Editar pessoa
function editPessoa(pessoaId) {
    openPessoaModal(pessoaId);
}

// Deletar pessoa
async function deletePessoa(pessoaId) {
    if (!confirm('Tem certeza que deseja excluir esta pessoa?')) {
        return;
    }
    
    try {
        const response = await fetch(`api/pessoas.php?id=${pessoaId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            loadPessoas();
            loadDashboardData(); // Atualizar dashboard
        } else {
            showAlert('danger', result.message);
        }
    } catch (error) {
        showAlert('danger', 'Erro ao deletar pessoa: ' + error.message);
    }
}

