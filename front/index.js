// Modelo de cada ordem de serviço. Cada instância contém os dados e as ações da OS.
class OrdemServico {
    constructor(id, cliente, equipamento, descricao, valorEstimado, concluida = false) {
        this.id = id;
        this.cliente = cliente;
        this.equipamento = equipamento;
        this.descricao = descricao;
        this.valorEstimado = Number(valorEstimado);
        this.concluida = Boolean(concluida);
    }

    concluirOS() {
        this.concluida = true;
    }

    gerarTemplate() {
        const status = this.concluida ? 'Concluída' : 'Em andamento';
        const classeStatus = this.concluida ? 'is-done' : '';
        const botao = this.concluida
            ? ''
            : `<button type="button" class="btn btn-outline-plum" data-action="concluir" data-id="${this.id}">Concluir OS</button>`;

        return `
            <article class="order-card ${classeStatus}">
                <div class="order-top">
                    <div><h3 class="order-title">${escaparHTML(this.equipamento)}</h3><p class="order-client">Cliente: ${escaparHTML(this.cliente)}</p></div>
                    <span class="status-badge">${status}</span>
                </div>
                <p class="order-description">${escaparHTML(this.descricao)}</p>
                <div class="order-bottom">
                    <span class="order-price">Estimativa: ${formatarMoeda(this.valorEstimado)}</span>
                    <div class="order-actions">${botao}<button type="button" class="btn btn-outline-secondary" data-action="remover" data-id="${this.id}" aria-label="Excluir ordem de serviço">Excluir</button></div>
                </div>
            </article>`;
    }
}

// Gerencia as instâncias, o formulário, a tela e a persistência no navegador.
class GerenciadorOS {
    constructor() {
        this.ordens = [];
        this.containerDOM = document.getElementById('container-os');
        this.contadorDOM = document.getElementById('contador-os');
        this.formularioDOM = document.getElementById('form-os');
    }

    iniciar() {
        this.carregarStorage();
        this.configurarEventos();
        this.atualizarTela();
    }

    configurarEventos() {
        this.formularioDOM.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!this.formularioDOM.reportValidity()) return;
            this.cadastrarOS();
        });

        this.containerDOM.addEventListener('click', (event) => {
            const botao = event.target.closest('button[data-action]');
            if (!botao) return;
            const id = botao.dataset.id;
            if (botao.dataset.action === 'concluir') this.concluirOS(id);
            if (botao.dataset.action === 'remover') this.removerOS(id);
        });
    }

    cadastrarOS() {
        const cliente = document.getElementById('cliente').value.trim();
        const equipamento = document.getElementById('equipamento').value.trim();
        const descricao = document.getElementById('descricao').value.trim();
        const valorEstimado = Number(document.getElementById('valorEstimado').value);
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        this.ordens.unshift(new OrdemServico(id, cliente, equipamento, descricao, valorEstimado));
        this.salvarStorage();
        this.atualizarTela();
        this.formularioDOM.reset();
        document.getElementById('cliente').focus();
    }

    concluirOS(id) {
        const ordem = this.ordens.find((item) => item.id === id);
        if (!ordem) return;
        ordem.concluirOS();
        this.salvarStorage();
        this.atualizarTela();
    }

    removerOS(id) {
        this.ordens = this.ordens.filter((item) => item.id !== id);
        this.salvarStorage();
        this.atualizarTela();
    }

    atualizarTela() {
        const total = this.ordens.length;
        this.contadorDOM.textContent = `${total} ${total === 1 ? 'ordem' : 'ordens'}`;

        if (total === 0) {
            this.containerDOM.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">⌁</span><strong>Nenhuma ordem por aqui</strong><br><span>Use o formulário para cadastrar o primeiro atendimento.</span></div>';
            return;
        }

        this.containerDOM.innerHTML = this.ordens.map((ordem) => ordem.gerarTemplate()).join('');
    }

    salvarStorage() {
        try {
            localStorage.setItem('techfix_ordens_servico', JSON.stringify(this.ordens));
        } catch (erro) {
            console.error('Não foi possível salvar as ordens neste navegador.', erro);
        }
    }

    carregarStorage() {
        try {
            const dados = JSON.parse(localStorage.getItem('techfix_ordens_servico') || '[]');
            if (!Array.isArray(dados)) return;
            this.ordens = dados.map((item) => new OrdemServico(
                String(item.id), item.cliente || '', item.equipamento || '', item.descricao || '', item.valorEstimado || 0, item.concluida
            ));
        } catch (erro) {
            console.error('Não foi possível recuperar as ordens salvas.', erro);
            this.ordens = [];
        }
    }
}

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, (caractere) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[caractere]);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

document.addEventListener('DOMContentLoaded', () => {
    const gerenciador = new GerenciadorOS();
    gerenciador.iniciar();
});
