import { bindKeyboard, bindDpad, bindAtirar, bindTrocarArma, createInputState } from './input.js';
import { createHud } from './hud.js';

function clamp(valor, min, max) {
    return Math.max(min, Math.min(max, valor));
}

// Limite direito propositalmente aquém de 100% (onde os inimigos entram em cena),
// pra sempre sobrar espaço de tela entre a nave e o ponto de spawn dos inimigos.
const LIMITE_DIREITA_NAVE_PCT = 70;
const VELOCIDADE_ITEM_PCT_POR_SEGUNDO = 25;
const TURRET_OFFSETS_CHEFE = [0.2, 0.5, 0.8];
const INTERVALO_REFORCO_CHEFE_MS = 4000;

export function iniciarFase({ root, fase, nave, armas, armaInicialId, nomeJogador, vidasIniciais, pontosIniciais = 0, onFaseCompleta, onGameOver, onSaiu }) {
    const boardEl = root.querySelector('.game-board');
    const naveEl = root.querySelector('.nave');
    const fundoEl = root.querySelector('.fundo');
    const dpadEl = root.querySelector('.dpad');
    const botaoAtirar = root.querySelector('.botao-atirar');
    const botaoTrocarArma = root.querySelector('.botao-trocar-arma');
    const botaoDesistir = root.querySelector('.botao-desistir');
    const hud = createHud(root);

    fundoEl.src = fase.background;
    naveEl.style.backgroundImage = `url(${nave.imagem})`;
    naveEl.style.width = nave.larguraPct + '%';
    naveEl.style.height = nave.alturaPct + '%';

    let armaIndex = Math.max(0, armas.findIndex((a) => a.id === armaInicialId));
    let armaAtual = armas[armaIndex] ?? armas[0];

    function trocarArma() {
        armaIndex = (armaIndex + 1) % armas.length;
        armaAtual = armas[armaIndex];
    }

    const inputState = createInputState();
    const unbindTeclado = bindKeyboard(inputState, trocarArma);
    bindDpad(dpadEl, inputState);
    bindAtirar(botaoAtirar, inputState);
    bindTrocarArma(botaoTrocarArma, trocarArma);

    const ship = { xPct: 6, yPct: 44 };
    let vidas = vidasIniciais;
    let pontos = pontosIniciais;
    let fuel = fase.fuelStart;
    let progressoPct = 0;
    let cooldownTiroMs = 0;
    let invulneravelAte = 0;
    let ativo = true;
    let ultimoTimestamp = null;
    let quadroId = null;

    const inimigosAtivos = [];
    const projeteisAtivos = [];
    const projeteisInimigoAtivos = [];
    const itensAtivos = [];
    const timelinePendente = [...fase.enemyTimeline];
    const itemTimelinePendente = [...(fase.itemTimeline ?? [])];
    const gabaritoReforco = fase.enemyTimeline[fase.enemyTimeline.length - 1] ?? {
        tipo: 'asteroide', hp: 1, pontos: 10, velocidadePctPorSegundo: 30,
    };

    let lutaChefeAtiva = false;
    let chefeAtivo = false;
    let chefeEl = null;
    let chefeHpAtual = 0;
    let chefeXPct = 0;
    let chefeYPct = 0;
    let chefeCooldownMs = 0;
    let chefeTurretIndex = 0;
    let reforcoCooldownMs = 0;

    posicionar(naveEl, ship.xPct, ship.yPct);

    function posicionar(el, xPct, yPct) {
        el.style.left = xPct + '%';
        el.style.top = yPct + '%';
    }

    function criarEntidadeDom(classe) {
        const el = document.createElement('div');
        el.className = classe;
        boardEl.appendChild(el);
        return el;
    }

    function spawnInimigo(def) {
        const el = criarEntidadeDom('inimigo inimigo-' + def.tipo);
        const inimigo = { ...def, xPct: 100, el, hpAtual: def.hp };
        inimigosAtivos.push(inimigo);
        posicionar(el, inimigo.xPct, inimigo.y);
    }

    function spawnItem(def) {
        const el = criarEntidadeDom('item item-' + def.tipo);
        const item = { ...def, xPct: 100, el };
        itensAtivos.push(item);
        posicionar(el, item.xPct, item.y);
    }

    function aplicarEfeitoItem(item) {
        if (item.tipo === 'combustivel') {
            fuel = Math.min(fase.fuelStart, fuel + item.valor);
        } else if (item.tipo === 'powerup-arma') {
            trocarArma();
        } else {
            pontos += item.valor;
        }
    }

    function spawnProjetil() {
        const el = criarEntidadeDom('projetil');
        el.style.backgroundColor = armaAtual.cor;
        el.style.width = armaAtual.larguraPct + '%';
        el.style.height = armaAtual.alturaPct + '%';
        const projetil = {
            xPct: ship.xPct + nave.larguraPct,
            yPct: ship.yPct + nave.alturaPct / 2 - armaAtual.alturaPct / 2,
            dano: armaAtual.dano,
            velocidade: armaAtual.velocidadePctPorSegundo,
            el,
        };
        projeteisAtivos.push(projetil);
        posicionar(el, projetil.xPct, projetil.yPct);
    }

    function spawnProjetilInimigo(yPct) {
        const el = criarEntidadeDom('projetil-inimigo');
        const projetil = {
            xPct: chefeXPct,
            yPct,
            velocidade: fase.chefe.velocidadeProjetilPctPorSegundo,
            el,
        };
        projeteisInimigoAtivos.push(projetil);
        posicionar(el, projetil.xPct, projetil.yPct);
    }

    function iniciarLutaChefe() {
        lutaChefeAtiva = true;
        chefeAtivo = true;
        chefeHpAtual = fase.chefe.hp;
        chefeXPct = clamp(100 - fase.chefe.larguraPct - 2, 0, 100);
        chefeYPct = clamp(50 - fase.chefe.alturaPct / 2, 0, 100 - fase.chefe.alturaPct);
        chefeEl = criarEntidadeDom('chefe');
        chefeEl.style.backgroundImage = `url(${fase.chefe.imagem})`;
        chefeEl.style.width = fase.chefe.larguraPct + '%';
        chefeEl.style.height = fase.chefe.alturaPct + '%';
        posicionar(chefeEl, chefeXPct, chefeYPct);
        chefeCooldownMs = fase.chefe.cadenciaMs;
        reforcoCooldownMs = INTERVALO_REFORCO_CHEFE_MS;
        hud.mostrarBarraChefe();
    }

    function derrotarChefe() {
        chefeAtivo = false;
        if (chefeEl) chefeEl.remove();
        chefeEl = null;
        pontos += fase.chefe.pontosRecompensa;
        finalizarFaseCompleta();
    }

    function limparEntidades() {
        for (const inimigo of inimigosAtivos) inimigo.el.remove();
        for (const projetil of projeteisAtivos) projetil.el.remove();
        for (const projetil of projeteisInimigoAtivos) projetil.el.remove();
        for (const item of itensAtivos) item.el.remove();
        if (chefeEl) chefeEl.remove();
        inimigosAtivos.length = 0;
        projeteisAtivos.length = 0;
        projeteisInimigoAtivos.length = 0;
        itensAtivos.length = 0;
    }

    function sobrepoe(elA, elB) {
        const a = elA.getBoundingClientRect();
        const b = elB.getBoundingClientRect();
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }

    function perderVida() {
        if (Date.now() < invulneravelAte) return;
        vidas -= 1;
        invulneravelAte = Date.now() + 1500;
        naveEl.classList.add('nave-atingida');
        setTimeout(() => naveEl.classList.remove('nave-atingida'), 1500);
        if (vidas <= 0) {
            finalizarGameOver();
        }
    }

    function encerrar() {
        if (quadroId !== null) cancelAnimationFrame(quadroId);
        unbindTeclado();
        limparEntidades();
    }

    function finalizarGameOver() {
        if (!ativo) return;
        ativo = false;
        encerrar();
        onGameOver({ pontos: Math.floor(pontos) });
    }

    function finalizarFaseCompleta() {
        if (!ativo) return;
        ativo = false;
        const bonus = Math.round(fuel * fase.fuelBonusFactor);
        pontos += bonus;
        encerrar();
        onFaseCompleta({ pontos: Math.floor(pontos), bonus, vidasRestantes: vidas });
    }

    function desistir() {
        if (!ativo) return;
        vidas -= 1;
        if (vidas <= 0) {
            finalizarGameOver();
            return;
        }
        ativo = false;
        encerrar();
        onSaiu({ pontos: Math.floor(pontos), vidasRestantes: vidas });
    }

    botaoDesistir.addEventListener('click', desistir);

    function atualizar(dt) {
        let dx = 0;
        let dy = 0;
        if (inputState.cima) dy -= 1;
        if (inputState.baixo) dy += 1;
        if (inputState.esquerda) dx -= 1;
        if (inputState.direita) dx += 1;
        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }
        ship.xPct = clamp(ship.xPct + dx * nave.velocidadePctPorSegundo * dt, 0, Math.min(100 - nave.larguraPct, LIMITE_DIREITA_NAVE_PCT));
        ship.yPct = clamp(ship.yPct + dy * nave.velocidadePctPorSegundo * dt, 0, 100 - nave.alturaPct);
        posicionar(naveEl, ship.xPct, ship.yPct);

        let multiplicadorAvanco = 1;
        if (inputState.direita) multiplicadorAvanco = fase.multiplicadorAcelerar;
        else if (inputState.esquerda) multiplicadorAvanco = fase.multiplicadorFrear;

        if (fase.chefe && !lutaChefeAtiva && progressoPct >= fase.chefeTriggerProgressPct) {
            iniciarLutaChefe();
        }
        if (!lutaChefeAtiva) {
            progressoPct = clamp(progressoPct + fase.baseAvancoPctPorSegundo * multiplicadorAvanco * dt, 0, 100);
        }

        fuel = Math.max(0, fuel - fase.fuelDrainPerSecond * dt);
        if (fuel <= 0) {
            perderVida();
            fuel = fase.fuelStart;
        }
        if (!ativo) return;

        for (let i = timelinePendente.length - 1; i >= 0; i--) {
            if (progressoPct >= timelinePendente[i].atProgressPct) {
                spawnInimigo(timelinePendente[i]);
                timelinePendente.splice(i, 1);
            }
        }

        for (let i = itemTimelinePendente.length - 1; i >= 0; i--) {
            if (progressoPct >= itemTimelinePendente[i].atProgressPct) {
                spawnItem(itemTimelinePendente[i]);
                itemTimelinePendente.splice(i, 1);
            }
        }

        if (lutaChefeAtiva && chefeAtivo) {
            chefeCooldownMs -= dt * 1000;
            if (chefeCooldownMs <= 0) {
                const yTiro = clamp(chefeYPct + fase.chefe.alturaPct * TURRET_OFFSETS_CHEFE[chefeTurretIndex], 0, 100);
                spawnProjetilInimigo(yTiro);
                chefeTurretIndex = (chefeTurretIndex + 1) % TURRET_OFFSETS_CHEFE.length;
                chefeCooldownMs = fase.chefe.cadenciaMs;
            }
            reforcoCooldownMs -= dt * 1000;
            if (reforcoCooldownMs <= 0) {
                spawnInimigo({ ...gabaritoReforco, y: 10 + Math.random() * 80 });
                reforcoCooldownMs = INTERVALO_REFORCO_CHEFE_MS;
            }
        }

        cooldownTiroMs -= dt * 1000;
        if (inputState.atirando && cooldownTiroMs <= 0) {
            spawnProjetil();
            cooldownTiroMs = armaAtual.cadenciaMs;
        }

        for (let i = inimigosAtivos.length - 1; i >= 0 && ativo; i--) {
            const inimigo = inimigosAtivos[i];
            inimigo.xPct -= inimigo.velocidadePctPorSegundo * dt;
            posicionar(inimigo.el, inimigo.xPct, inimigo.y);
            if (inimigo.xPct < -15) {
                inimigo.el.remove();
                inimigosAtivos.splice(i, 1);
                continue;
            }
            if (sobrepoe(naveEl, inimigo.el)) {
                inimigo.el.remove();
                inimigosAtivos.splice(i, 1);
                perderVida();
            }
        }
        if (!ativo) return;

        for (let i = itensAtivos.length - 1; i >= 0 && ativo; i--) {
            const item = itensAtivos[i];
            item.xPct -= VELOCIDADE_ITEM_PCT_POR_SEGUNDO * dt;
            posicionar(item.el, item.xPct, item.y);
            if (item.xPct < -15) {
                item.el.remove();
                itensAtivos.splice(i, 1);
                continue;
            }
            if (sobrepoe(naveEl, item.el)) {
                aplicarEfeitoItem(item);
                item.el.remove();
                itensAtivos.splice(i, 1);
            }
        }
        if (!ativo) return;

        for (let i = projeteisInimigoAtivos.length - 1; i >= 0 && ativo; i--) {
            const projetil = projeteisInimigoAtivos[i];
            projetil.xPct -= projetil.velocidade * dt;
            posicionar(projetil.el, projetil.xPct, projetil.yPct);
            if (projetil.xPct < -10) {
                projetil.el.remove();
                projeteisInimigoAtivos.splice(i, 1);
                continue;
            }
            if (sobrepoe(naveEl, projetil.el)) {
                projetil.el.remove();
                projeteisInimigoAtivos.splice(i, 1);
                perderVida();
            }
        }
        if (!ativo) return;

        for (let p = projeteisAtivos.length - 1; p >= 0; p--) {
            const projetil = projeteisAtivos[p];
            projetil.xPct += projetil.velocidade * dt;
            posicionar(projetil.el, projetil.xPct, projetil.yPct);
            if (projetil.xPct > 105) {
                projetil.el.remove();
                projeteisAtivos.splice(p, 1);
                continue;
            }
            let atingiu = false;
            for (let i = inimigosAtivos.length - 1; i >= 0; i--) {
                const inimigo = inimigosAtivos[i];
                if (sobrepoe(projetil.el, inimigo.el)) {
                    inimigo.hpAtual -= projetil.dano;
                    projetil.el.remove();
                    projeteisAtivos.splice(p, 1);
                    atingiu = true;
                    if (inimigo.hpAtual <= 0) {
                        pontos += inimigo.pontos;
                        inimigo.el.remove();
                        inimigosAtivos.splice(i, 1);
                    }
                    break;
                }
            }
            if (!atingiu && chefeAtivo && chefeEl && sobrepoe(projetil.el, chefeEl)) {
                chefeHpAtual -= projetil.dano;
                projetil.el.remove();
                projeteisAtivos.splice(p, 1);
                if (chefeHpAtual <= 0) {
                    derrotarChefe();
                    return;
                }
            }
        }

        hud.update({
            nome: nomeJogador,
            vidas,
            pontos,
            fuelPct: (fuel / fase.fuelStart) * 100,
            progressoPct,
            armaNome: armaAtual.nome,
            chefeHpPct: lutaChefeAtiva && fase.chefe ? clamp((chefeHpAtual / fase.chefe.hp) * 100, 0, 100) : null,
        });

        if (ativo && !fase.chefe && progressoPct >= 100) {
            finalizarFaseCompleta();
        }
    }

    function quadro(timestamp) {
        if (!ativo) return;
        if (ultimoTimestamp === null) ultimoTimestamp = timestamp;
        const dt = Math.min(0.05, (timestamp - ultimoTimestamp) / 1000);
        ultimoTimestamp = timestamp;
        atualizar(dt);
        quadroId = requestAnimationFrame(quadro);
    }
    quadroId = requestAnimationFrame(quadro);

    return { desistir };
}
