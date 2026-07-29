export function createHud(root) {
    const nomeEl = root.querySelector('.hud-nome-valor');
    const vidasEl = root.querySelector('.hud-vidas-valor');
    const pontosEl = root.querySelector('.hud-pontos-valor');
    const combustivelBarraEl = root.querySelector('.hud-combustivel-barra');
    const progressoBarraEl = root.querySelector('.hud-progresso-barra');
    const armaEl = root.querySelector('.hud-arma-valor');

    return {
        update({ nome, vidas, pontos, fuelPct, progressoPct, armaNome }) {
            nomeEl.textContent = nome;
            vidasEl.textContent = vidas;
            pontosEl.textContent = Math.floor(pontos);
            combustivelBarraEl.style.width = `${Math.max(0, Math.min(100, fuelPct))}%`;
            progressoBarraEl.style.width = `${Math.max(0, Math.min(100, progressoPct))}%`;
            armaEl.textContent = armaNome;
        },
    };
}
