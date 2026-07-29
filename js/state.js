import { getSqlJs } from './db/sqljs-loader.js';
import { getBytes, putBytes } from './db/idb-store.js';

export const STARTING_LIVES = 3;
export const MAX_LIVES = 5;

const PLAYER_DB_KEY = 'player-db';
const MUTED_KEY = 'navinha_muted';

let telas = null;
let db = null;

export async function loadPlayerDb() {
    const [SQL, bytes] = await Promise.all([getSqlJs(), getBytes(PLAYER_DB_KEY)]);
    db = bytes ? new SQL.Database(bytes) : new SQL.Database();
    db.run(`
        CREATE TABLE IF NOT EXISTS perfil (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            nome TEXT,
            nave_id TEXT,
            arma_id TEXT,
            vidas INTEGER,
            pontos_acumulados INTEGER
        );
        CREATE TABLE IF NOT EXISTS fases_desbloqueadas (fase_id INTEGER PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS ranking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            pontos INTEGER,
            data TEXT
        );
    `);
}

async function persist() {
    await putBytes(PLAYER_DB_KEY, db.export());
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

export function registerScreens(root) {
    telas = Array.from(root.querySelectorAll('[data-screen]'));
}

export function showScreen(nome) {
    if (!telas) return;
    for (const tela of telas) {
        tela.classList.toggle('tela-ativa', tela.dataset.screen === nome);
    }
}

export function loadProfile() {
    const linhas = queryAll('SELECT * FROM perfil WHERE id = 1');
    if (linhas.length === 0) return null;
    const row = linhas[0];
    const fasesDesbloqueadas = queryAll('SELECT fase_id FROM fases_desbloqueadas ORDER BY fase_id').map((r) => r.fase_id);
    return {
        nome: row.nome,
        naveId: row.nave_id,
        armaId: row.arma_id,
        vidas: row.vidas,
        pontosAcumulados: row.pontos_acumulados,
        fasesDesbloqueadas,
    };
}

export function hasProfile() {
    return loadProfile() !== null;
}

export async function saveProfile(profile) {
    db.run(
        'INSERT OR REPLACE INTO perfil (id, nome, nave_id, arma_id, vidas, pontos_acumulados) VALUES (1, ?, ?, ?, ?, ?)',
        [profile.nome, profile.naveId, profile.armaId, profile.vidas, profile.pontosAcumulados]
    );
    db.run('DELETE FROM fases_desbloqueadas');
    for (const faseId of profile.fasesDesbloqueadas) {
        db.run('INSERT INTO fases_desbloqueadas (fase_id) VALUES (?)', [faseId]);
    }
    await persist();
}

export async function createProfile(nome, naveId, armaId) {
    const profile = {
        nome,
        naveId,
        armaId,
        vidas: STARTING_LIVES,
        pontosAcumulados: 0,
        fasesDesbloqueadas: [1],
    };
    await saveProfile(profile);
    return profile;
}

export async function clearProfile() {
    db.run('DELETE FROM perfil');
    db.run('DELETE FROM fases_desbloqueadas');
    await persist();
}

export async function desbloquearFase(profile, faseId) {
    if (!profile.fasesDesbloqueadas.includes(faseId)) {
        profile.fasesDesbloqueadas.push(faseId);
        await saveProfile(profile);
    }
}

export function loadRanking() {
    return queryAll('SELECT nome, pontos, data FROM ranking ORDER BY pontos DESC LIMIT 10');
}

export async function addRankingEntry(nome, pontos) {
    db.run('INSERT INTO ranking (nome, pontos, data) VALUES (?, ?, ?)', [nome, pontos, new Date().toISOString()]);
    db.run('DELETE FROM ranking WHERE id NOT IN (SELECT id FROM ranking ORDER BY pontos DESC LIMIT 10)');
    await persist();
    return loadRanking();
}

export function isMuted() {
    return localStorage.getItem(MUTED_KEY) === '1';
}

export function setMuted(muted) {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
}
