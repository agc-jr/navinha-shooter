// atProgressPct define ONDE no percurso da fase (0-100) o inimigo aparece,
// não quando (em segundos) — assim o timeline continua fixo e editável
// mesmo o jogador andando mais rápido ou mais devagar.
export const PHASES = [
    {
        id: 1,
        nome: 'Fase 1 — Campo de Asteroides',
        background: './img/background1.png',
        baseAvancoPctPorSegundo: 1.2,
        multiplicadorAcelerar: 1.6,
        multiplicadorFrear: 0.5,
        fuelStart: 100,
        fuelDrainPerSecond: 1,
        fuelBonusFactor: 4,
        enemyTimeline: [
            { atProgressPct: 5, tipo: 'asteroide', y: 20, hp: 1, pontos: 10, velocidadePctPorSegundo: 20 },
            { atProgressPct: 12, tipo: 'asteroide', y: 65, hp: 1, pontos: 10, velocidadePctPorSegundo: 20 },
            { atProgressPct: 20, tipo: 'asteroide', y: 40, hp: 1, pontos: 10, velocidadePctPorSegundo: 22 },
            { atProgressPct: 28, tipo: 'asteroide', y: 15, hp: 1, pontos: 10, velocidadePctPorSegundo: 22 },
            { atProgressPct: 28, tipo: 'asteroide', y: 75, hp: 1, pontos: 10, velocidadePctPorSegundo: 22 },
            { atProgressPct: 36, tipo: 'asteroide', y: 50, hp: 2, pontos: 20, velocidadePctPorSegundo: 24 },
            { atProgressPct: 44, tipo: 'asteroide', y: 25, hp: 1, pontos: 10, velocidadePctPorSegundo: 26 },
            { atProgressPct: 44, tipo: 'asteroide', y: 70, hp: 1, pontos: 10, velocidadePctPorSegundo: 26 },
            { atProgressPct: 52, tipo: 'asteroide', y: 45, hp: 2, pontos: 20, velocidadePctPorSegundo: 28 },
            { atProgressPct: 58, tipo: 'asteroide', y: 15, hp: 1, pontos: 10, velocidadePctPorSegundo: 28 },
            { atProgressPct: 58, tipo: 'asteroide', y: 80, hp: 1, pontos: 10, velocidadePctPorSegundo: 28 },
            { atProgressPct: 65, tipo: 'asteroide', y: 55, hp: 2, pontos: 20, velocidadePctPorSegundo: 30 },
            { atProgressPct: 72, tipo: 'asteroide', y: 30, hp: 2, pontos: 20, velocidadePctPorSegundo: 32 },
            { atProgressPct: 72, tipo: 'asteroide', y: 65, hp: 1, pontos: 10, velocidadePctPorSegundo: 32 },
            { atProgressPct: 80, tipo: 'asteroide', y: 20, hp: 2, pontos: 20, velocidadePctPorSegundo: 34 },
            { atProgressPct: 80, tipo: 'asteroide', y: 50, hp: 2, pontos: 20, velocidadePctPorSegundo: 34 },
            { atProgressPct: 80, tipo: 'asteroide', y: 80, hp: 2, pontos: 20, velocidadePctPorSegundo: 34 },
            { atProgressPct: 90, tipo: 'asteroide', y: 40, hp: 3, pontos: 30, velocidadePctPorSegundo: 36 },
        ],
    },
];

export function getPhaseById(id) {
    return PHASES.find((fase) => fase.id === id) ?? null;
}
