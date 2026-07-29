import { getSqlJs } from '../db/sqljs-loader.js';

let db = null;

export async function loadContentDb() {
    const [SQL, buffer] = await Promise.all([
        getSqlJs(),
        fetch('./data/content.sqlite').then((res) => res.arrayBuffer()),
    ]);
    db = new SQL.Database(new Uint8Array(buffer));
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

function mapNave(row) {
    return {
        id: row.id,
        nome: row.nome,
        imagem: row.imagem,
        imagemExplosao: row.imagem_explosao,
        velocidadePctPorSegundo: row.velocidade_pct_por_segundo,
        larguraPct: row.largura_pct,
        alturaPct: row.altura_pct,
    };
}

function mapArma(row) {
    return {
        id: row.id,
        nome: row.nome,
        cadenciaMs: row.cadencia_ms,
        dano: row.dano,
        velocidadePctPorSegundo: row.velocidade_pct_por_segundo,
        larguraPct: row.largura_pct,
        alturaPct: row.altura_pct,
        cor: row.cor,
    };
}

function mapInimigo(row) {
    return {
        atProgressPct: row.at_progress_pct,
        tipo: row.tipo,
        y: row.y,
        hp: row.hp,
        pontos: row.pontos,
        velocidadePctPorSegundo: row.velocidade_pct_por_segundo,
    };
}

function mapItem(row) {
    return {
        atProgressPct: row.at_progress_pct,
        tipo: row.tipo,
        y: row.y,
        valor: row.valor,
    };
}

function mapChefe(row) {
    return {
        id: row.id,
        nome: row.nome,
        imagem: row.imagem,
        hp: row.hp,
        danoProjetil: row.dano_projetil,
        cadenciaMs: row.cadencia_ms,
        velocidadeProjetilPctPorSegundo: row.velocidade_projetil_pct_por_segundo,
        pontosRecompensa: row.pontos_recompensa,
        larguraPct: row.largura_pct,
        alturaPct: row.altura_pct,
    };
}

function mapFase(row) {
    const inimigos = queryAll('SELECT * FROM fase_inimigos WHERE fase_id = ? ORDER BY at_progress_pct', [row.id]);
    const itens = queryAll('SELECT * FROM fase_itens WHERE fase_id = ? ORDER BY at_progress_pct', [row.id]);
    const chefeRows = row.chefe_id ? queryAll('SELECT * FROM chefes WHERE id = ?', [row.chefe_id]) : [];
    return {
        id: row.id,
        nome: row.nome,
        background: row.background,
        baseAvancoPctPorSegundo: row.base_avanco_pct_por_segundo,
        multiplicadorAcelerar: row.multiplicador_acelerar,
        multiplicadorFrear: row.multiplicador_frear,
        fuelStart: row.fuel_start,
        fuelDrainPerSecond: row.fuel_drain_per_second,
        fuelBonusFactor: row.fuel_bonus_factor,
        enemyTimeline: inimigos.map(mapInimigo),
        itemTimeline: itens.map(mapItem),
        chefe: chefeRows.length ? mapChefe(chefeRows[0]) : null,
        chefeTriggerProgressPct: row.chefe_trigger_progress_pct,
    };
}

export function getShips() {
    return queryAll('SELECT * FROM naves').map(mapNave);
}

export function getWeapons() {
    return queryAll('SELECT * FROM armas').map(mapArma);
}

export function getPhases() {
    return queryAll('SELECT * FROM fases ORDER BY id').map(mapFase);
}

export function getShipById(id) {
    return getShips().find((nave) => nave.id === id) ?? getShips()[0];
}

export function getWeaponById(id) {
    return getWeapons().find((arma) => arma.id === id) ?? getWeapons()[0];
}

export function getPhaseById(id) {
    return getPhases().find((fase) => fase.id === id) ?? null;
}

export function getChefes() {
    return queryAll('SELECT * FROM chefes').map(mapChefe);
}

export function getChefeById(id) {
    return getChefes().find((chefe) => chefe.id === id) ?? null;
}
