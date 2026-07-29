export const STARTING_LIVES = 3;
export const MAX_LIVES = 5;

const PROFILE_KEY = 'navinha_profile';
const RANKING_KEY = 'navinha_ranking';
const MUTED_KEY = 'navinha_muted';

let telas = null;

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
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function hasProfile() {
    return loadProfile() !== null;
}

export function saveProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function createProfile(nome, naveId, armaId) {
    const profile = {
        nome,
        naveId,
        armaId,
        vidas: STARTING_LIVES,
        pontosAcumulados: 0,
        fasesDesbloqueadas: [1],
    };
    saveProfile(profile);
    return profile;
}

export function clearProfile() {
    localStorage.removeItem(PROFILE_KEY);
}

export function desbloquearFase(profile, faseId) {
    if (!profile.fasesDesbloqueadas.includes(faseId)) {
        profile.fasesDesbloqueadas.push(faseId);
        saveProfile(profile);
    }
}

export function loadRanking() {
    const raw = localStorage.getItem(RANKING_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

export function addRankingEntry(nome, pontos) {
    const ranking = loadRanking();
    ranking.push({ nome, pontos, data: new Date().toISOString() });
    ranking.sort((a, b) => b.pontos - a.pontos);
    const top = ranking.slice(0, 10);
    localStorage.setItem(RANKING_KEY, JSON.stringify(top));
    return top;
}

export function isMuted() {
    return localStorage.getItem(MUTED_KEY) === '1';
}

export function setMuted(muted) {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
}
