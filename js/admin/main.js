import { getSqlJs } from '../db/sqljs-loader.js';

const SCHEMA_SQL = `
    CREATE TABLE IF NOT EXISTS naves (
        id TEXT PRIMARY KEY,
        nome TEXT,
        imagem TEXT,
        imagem_explosao TEXT,
        velocidade_pct_por_segundo REAL,
        largura_pct REAL,
        altura_pct REAL
    );
    CREATE TABLE IF NOT EXISTS armas (
        id TEXT PRIMARY KEY,
        nome TEXT,
        cadencia_ms INTEGER,
        dano INTEGER,
        velocidade_pct_por_segundo REAL,
        largura_pct REAL,
        altura_pct REAL,
        cor TEXT
    );
    CREATE TABLE IF NOT EXISTS fases (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        background TEXT,
        base_avanco_pct_por_segundo REAL,
        multiplicador_acelerar REAL,
        multiplicador_frear REAL,
        fuel_start REAL,
        fuel_drain_per_second REAL,
        fuel_bonus_factor REAL,
        chefe_id TEXT REFERENCES chefes(id),
        chefe_trigger_progress_pct REAL
    );
    CREATE TABLE IF NOT EXISTS fase_inimigos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fase_id INTEGER REFERENCES fases(id),
        at_progress_pct REAL,
        tipo TEXT,
        y REAL,
        hp INTEGER,
        pontos INTEGER,
        velocidade_pct_por_segundo REAL
    );
    CREATE TABLE IF NOT EXISTS fase_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fase_id INTEGER REFERENCES fases(id),
        at_progress_pct REAL,
        tipo TEXT,
        y REAL,
        valor INTEGER
    );
    CREATE TABLE IF NOT EXISTS chefes (
        id TEXT PRIMARY KEY,
        nome TEXT,
        imagem TEXT,
        hp INTEGER,
        dano_projetil INTEGER,
        cadencia_ms INTEGER,
        velocidade_projetil_pct_por_segundo REAL,
        pontos_recompensa INTEGER,
        largura_pct REAL,
        altura_pct REAL
    );
`;

let db = null;
let faseSelecionadaId = null;

// Bancos antigos (gerados antes da mecânica de chefe) não têm essas colunas em `fases`.
function migrarColunasFases() {
    const colunas = queryAll("PRAGMA table_info(fases)").map((c) => c.name);
    if (!colunas.includes('chefe_id')) {
        db.run('ALTER TABLE fases ADD COLUMN chefe_id TEXT REFERENCES chefes(id)');
    }
    if (!colunas.includes('chefe_trigger_progress_pct')) {
        db.run('ALTER TABLE fases ADD COLUMN chefe_trigger_progress_pct REAL');
    }
}

function queryAll(sql, params = []) {
    const linhas = [];
    const stmt = db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
        linhas.push(stmt.getAsObject());
    }
    stmt.free();
    return linhas;
}

async function carregarBanco() {
    const SQL = await getSqlJs();
    let bytes = null;
    try {
        const res = await fetch('./data/content.sqlite');
        if (res.ok) bytes = new Uint8Array(await res.arrayBuffer());
    } catch {
        // sem banco existente, começa vazio
    }
    db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    db.run(SCHEMA_SQL);
    migrarColunasFases();
}

function exportarBanco() {
    const bytes = db.export();
    const blob = new Blob([bytes], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.sqlite';
    a.click();
    URL.revokeObjectURL(url);
}

function celula(texto) {
    const td = document.createElement('td');
    td.textContent = texto;
    return td;
}

function botaoAcao(texto, onClick) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = texto;
    botao.addEventListener('click', onClick);
    return botao;
}

// --- Naves ---

function renderNaves() {
    const corpo = document.querySelector('#tabela-naves tbody');
    corpo.innerHTML = '';
    for (const nave of queryAll('SELECT * FROM naves ORDER BY id')) {
        const tr = document.createElement('tr');
        tr.append(
            celula(nave.id),
            celula(nave.nome),
            celula(nave.imagem),
            celula(nave.velocidade_pct_por_segundo),
            celula(nave.largura_pct),
            celula(nave.altura_pct)
        );
        const tdAcoes = document.createElement('td');
        tdAcoes.append(
            botaoAcao('Editar', () => preencherFormNave(nave)),
            botaoAcao('Excluir', () => {
                db.run('DELETE FROM naves WHERE id = ?', [nave.id]);
                renderNaves();
            })
        );
        tr.append(tdAcoes);
        corpo.appendChild(tr);
    }
}

function preencherFormNave(nave) {
    const form = document.querySelector('#form-nave');
    form.id.value = nave.id;
    form.nome.value = nave.nome;
    form.imagem.value = nave.imagem;
    form.imagemExplosao.value = nave.imagem_explosao;
    form.velocidadePctPorSegundo.value = nave.velocidade_pct_por_segundo;
    form.larguraPct.value = nave.largura_pct;
    form.alturaPct.value = nave.altura_pct;
}

document.querySelector('#form-nave').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    db.run(
        'INSERT OR REPLACE INTO naves (id, nome, imagem, imagem_explosao, velocidade_pct_por_segundo, largura_pct, altura_pct) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            form.id.value.trim(),
            form.nome.value.trim(),
            form.imagem.value.trim(),
            form.imagemExplosao.value.trim(),
            Number(form.velocidadePctPorSegundo.value),
            Number(form.larguraPct.value),
            Number(form.alturaPct.value),
        ]
    );
    form.reset();
    renderNaves();
});

document.querySelector('#botao-limpar-nave').addEventListener('click', () => {
    document.querySelector('#form-nave').reset();
});

// --- Armas ---

function renderArmas() {
    const corpo = document.querySelector('#tabela-armas tbody');
    corpo.innerHTML = '';
    for (const arma of queryAll('SELECT * FROM armas ORDER BY id')) {
        const tr = document.createElement('tr');
        tr.append(
            celula(arma.id),
            celula(arma.nome),
            celula(arma.cadencia_ms),
            celula(arma.dano),
            celula(arma.velocidade_pct_por_segundo),
            celula(arma.cor)
        );
        const tdAcoes = document.createElement('td');
        tdAcoes.append(
            botaoAcao('Editar', () => preencherFormArma(arma)),
            botaoAcao('Excluir', () => {
                db.run('DELETE FROM armas WHERE id = ?', [arma.id]);
                renderArmas();
            })
        );
        tr.append(tdAcoes);
        corpo.appendChild(tr);
    }
}

function preencherFormArma(arma) {
    const form = document.querySelector('#form-arma');
    form.id.value = arma.id;
    form.nome.value = arma.nome;
    form.cadenciaMs.value = arma.cadencia_ms;
    form.dano.value = arma.dano;
    form.velocidadePctPorSegundo.value = arma.velocidade_pct_por_segundo;
    form.larguraPct.value = arma.largura_pct;
    form.alturaPct.value = arma.altura_pct;
    form.cor.value = arma.cor;
}

document.querySelector('#form-arma').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    db.run(
        'INSERT OR REPLACE INTO armas (id, nome, cadencia_ms, dano, velocidade_pct_por_segundo, largura_pct, altura_pct, cor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
            form.id.value.trim(),
            form.nome.value.trim(),
            Number(form.cadenciaMs.value),
            Number(form.dano.value),
            Number(form.velocidadePctPorSegundo.value),
            Number(form.larguraPct.value),
            Number(form.alturaPct.value),
            form.cor.value.trim(),
        ]
    );
    form.reset();
    renderArmas();
});

document.querySelector('#botao-limpar-arma').addEventListener('click', () => {
    document.querySelector('#form-arma').reset();
});

// --- Chefes ---

function renderChefes() {
    const corpo = document.querySelector('#tabela-chefes tbody');
    corpo.innerHTML = '';
    for (const chefe of queryAll('SELECT * FROM chefes ORDER BY id')) {
        const tr = document.createElement('tr');
        tr.append(
            celula(chefe.id),
            celula(chefe.nome),
            celula(chefe.imagem),
            celula(chefe.hp),
            celula(chefe.dano_projetil),
            celula(chefe.cadencia_ms),
            celula(chefe.pontos_recompensa)
        );
        const tdAcoes = document.createElement('td');
        tdAcoes.append(
            botaoAcao('Editar', () => preencherFormChefe(chefe)),
            botaoAcao('Excluir', () => {
                db.run('DELETE FROM chefes WHERE id = ?', [chefe.id]);
                renderChefes();
            })
        );
        tr.append(tdAcoes);
        corpo.appendChild(tr);
    }
}

function preencherFormChefe(chefe) {
    const form = document.querySelector('#form-chefe');
    form.id.value = chefe.id;
    form.nome.value = chefe.nome;
    form.imagem.value = chefe.imagem;
    form.hp.value = chefe.hp;
    form.danoProjetil.value = chefe.dano_projetil;
    form.cadenciaMs.value = chefe.cadencia_ms;
    form.velocidadeProjetilPctPorSegundo.value = chefe.velocidade_projetil_pct_por_segundo;
    form.pontosRecompensa.value = chefe.pontos_recompensa;
    form.larguraPct.value = chefe.largura_pct;
    form.alturaPct.value = chefe.altura_pct;
}

document.querySelector('#form-chefe').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    db.run(
        `INSERT OR REPLACE INTO chefes
            (id, nome, imagem, hp, dano_projetil, cadencia_ms, velocidade_projetil_pct_por_segundo, pontos_recompensa, largura_pct, altura_pct)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            form.id.value.trim(),
            form.nome.value.trim(),
            form.imagem.value.trim(),
            Number(form.hp.value),
            Number(form.danoProjetil.value),
            Number(form.cadenciaMs.value),
            Number(form.velocidadeProjetilPctPorSegundo.value),
            Number(form.pontosRecompensa.value),
            Number(form.larguraPct.value),
            Number(form.alturaPct.value),
        ]
    );
    form.reset();
    renderChefes();
});

document.querySelector('#botao-limpar-chefe').addEventListener('click', () => {
    document.querySelector('#form-chefe').reset();
});

// --- Fases ---

function renderFases() {
    const corpo = document.querySelector('#tabela-fases tbody');
    corpo.innerHTML = '';
    for (const fase of queryAll('SELECT * FROM fases ORDER BY id')) {
        const tr = document.createElement('tr');
        tr.append(celula(fase.id), celula(fase.nome), celula(fase.background), celula(fase.chefe_id ?? '—'));
        const tdAcoes = document.createElement('td');
        tdAcoes.append(
            botaoAcao('Editar', () => preencherFormFase(fase)),
            botaoAcao('Gerenciar Inimigos', () => selecionarFase(fase)),
            botaoAcao('Excluir', () => {
                db.run('DELETE FROM fase_inimigos WHERE fase_id = ?', [fase.id]);
                db.run('DELETE FROM fases WHERE id = ?', [fase.id]);
                if (faseSelecionadaId === fase.id) {
                    faseSelecionadaId = null;
                    document.querySelector('#painel-inimigos').hidden = true;
                }
                renderFases();
            })
        );
        tr.append(tdAcoes);
        corpo.appendChild(tr);
    }
}

function preencherFormFase(fase) {
    const form = document.querySelector('#form-fase');
    form.id.value = fase.id;
    form.nome.value = fase.nome;
    form.background.value = fase.background;
    form.baseAvancoPctPorSegundo.value = fase.base_avanco_pct_por_segundo;
    form.multiplicadorAcelerar.value = fase.multiplicador_acelerar;
    form.multiplicadorFrear.value = fase.multiplicador_frear;
    form.fuelStart.value = fase.fuel_start;
    form.fuelDrainPerSecond.value = fase.fuel_drain_per_second;
    form.fuelBonusFactor.value = fase.fuel_bonus_factor;
    form.chefeId.value = fase.chefe_id ?? '';
    form.chefeTriggerProgressPct.value = fase.chefe_trigger_progress_pct ?? '';
}

document.querySelector('#form-fase').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    db.run(
        `INSERT OR REPLACE INTO fases
            (id, nome, background, base_avanco_pct_por_segundo, multiplicador_acelerar, multiplicador_frear, fuel_start, fuel_drain_per_second, fuel_bonus_factor, chefe_id, chefe_trigger_progress_pct)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            Number(form.id.value),
            form.nome.value.trim(),
            form.background.value.trim(),
            Number(form.baseAvancoPctPorSegundo.value),
            Number(form.multiplicadorAcelerar.value),
            Number(form.multiplicadorFrear.value),
            Number(form.fuelStart.value),
            Number(form.fuelDrainPerSecond.value),
            Number(form.fuelBonusFactor.value),
            form.chefeId.value.trim() || null,
            form.chefeTriggerProgressPct.value ? Number(form.chefeTriggerProgressPct.value) : null,
        ]
    );
    form.reset();
    renderFases();
});

document.querySelector('#botao-limpar-fase').addEventListener('click', () => {
    document.querySelector('#form-fase').reset();
});

// --- Inimigos de uma fase ---

function selecionarFase(fase) {
    faseSelecionadaId = fase.id;
    document.querySelector('#painel-inimigos').hidden = false;
    document.querySelector('#fase-selecionada-nome').textContent = fase.nome;
    document.querySelector('#form-inimigo').reset();
    document.querySelector('#form-inimigo').inimigoId.value = '';
    document.querySelector('#form-item').reset();
    document.querySelector('#form-item').itemId.value = '';
    renderInimigos();
    renderItens();
}

function renderInimigos() {
    const corpo = document.querySelector('#tabela-inimigos tbody');
    corpo.innerHTML = '';
    const inimigos = queryAll('SELECT * FROM fase_inimigos WHERE fase_id = ? ORDER BY at_progress_pct', [faseSelecionadaId]);
    for (const inimigo of inimigos) {
        const tr = document.createElement('tr');
        tr.append(
            celula(inimigo.at_progress_pct),
            celula(inimigo.tipo),
            celula(inimigo.y),
            celula(inimigo.hp),
            celula(inimigo.pontos),
            celula(inimigo.velocidade_pct_por_segundo)
        );
        const tdAcoes = document.createElement('td');
        tdAcoes.append(
            botaoAcao('Editar', () => preencherFormInimigo(inimigo)),
            botaoAcao('Excluir', () => {
                db.run('DELETE FROM fase_inimigos WHERE id = ?', [inimigo.id]);
                renderInimigos();
            })
        );
        tr.append(tdAcoes);
        corpo.appendChild(tr);
    }
}

function preencherFormInimigo(inimigo) {
    const form = document.querySelector('#form-inimigo');
    form.inimigoId.value = inimigo.id;
    form.atProgressPct.value = inimigo.at_progress_pct;
    form.tipo.value = inimigo.tipo;
    form.y.value = inimigo.y;
    form.hp.value = inimigo.hp;
    form.pontos.value = inimigo.pontos;
    form.velocidadePctPorSegundo.value = inimigo.velocidade_pct_por_segundo;
}

document.querySelector('#form-inimigo').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const valores = [
        Number(form.atProgressPct.value),
        form.tipo.value.trim(),
        Number(form.y.value),
        Number(form.hp.value),
        Number(form.pontos.value),
        Number(form.velocidadePctPorSegundo.value),
    ];
    if (form.inimigoId.value) {
        db.run(
            'UPDATE fase_inimigos SET at_progress_pct = ?, tipo = ?, y = ?, hp = ?, pontos = ?, velocidade_pct_por_segundo = ? WHERE id = ?',
            [...valores, Number(form.inimigoId.value)]
        );
    } else {
        db.run(
            'INSERT INTO fase_inimigos (fase_id, at_progress_pct, tipo, y, hp, pontos, velocidade_pct_por_segundo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [faseSelecionadaId, ...valores]
        );
    }
    form.reset();
    form.inimigoId.value = '';
    renderInimigos();
});

document.querySelector('#botao-limpar-inimigo').addEventListener('click', () => {
    const form = document.querySelector('#form-inimigo');
    form.reset();
    form.inimigoId.value = '';
});

// --- Itens bônus de uma fase ---

function renderItens() {
    const corpo = document.querySelector('#tabela-itens tbody');
    corpo.innerHTML = '';
    const itens = queryAll('SELECT * FROM fase_itens WHERE fase_id = ? ORDER BY at_progress_pct', [faseSelecionadaId]);
    for (const item of itens) {
        const tr = document.createElement('tr');
        tr.append(celula(item.at_progress_pct), celula(item.tipo), celula(item.y), celula(item.valor));
        const tdAcoes = document.createElement('td');
        tdAcoes.append(
            botaoAcao('Editar', () => preencherFormItem(item)),
            botaoAcao('Excluir', () => {
                db.run('DELETE FROM fase_itens WHERE id = ?', [item.id]);
                renderItens();
            })
        );
        tr.append(tdAcoes);
        corpo.appendChild(tr);
    }
}

function preencherFormItem(item) {
    const form = document.querySelector('#form-item');
    form.itemId.value = item.id;
    form.atProgressPct.value = item.at_progress_pct;
    form.tipo.value = item.tipo;
    form.y.value = item.y;
    form.valor.value = item.valor;
}

document.querySelector('#form-item').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const valores = [Number(form.atProgressPct.value), form.tipo.value, Number(form.y.value), Number(form.valor.value)];
    if (form.itemId.value) {
        db.run('UPDATE fase_itens SET at_progress_pct = ?, tipo = ?, y = ?, valor = ? WHERE id = ?', [...valores, Number(form.itemId.value)]);
    } else {
        db.run('INSERT INTO fase_itens (fase_id, at_progress_pct, tipo, y, valor) VALUES (?, ?, ?, ?, ?)', [faseSelecionadaId, ...valores]);
    }
    form.reset();
    form.itemId.value = '';
    renderItens();
});

document.querySelector('#botao-limpar-item').addEventListener('click', () => {
    const form = document.querySelector('#form-item');
    form.reset();
    form.itemId.value = '';
});

document.querySelector('#botao-exportar').addEventListener('click', exportarBanco);

carregarBanco().then(() => {
    renderNaves();
    renderArmas();
    renderChefes();
    renderFases();
});
