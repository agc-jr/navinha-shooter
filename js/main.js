import * as State from './state.js';
import { getShips, getWeapons, getPhases, getShipById } from './data/index.js';
import { iniciarFase } from './game/loop.js';

const appRoot = document.querySelector('.app');
State.registerScreens(appRoot);

const musica = document.getElementById('backgroundMusic');
const botaoSom = document.querySelector('[data-acao="som"]');
const botaoContinuar = document.querySelector('[data-acao="continuar"]');
const listaNaves = document.querySelector('.lista-naves');
const listaFases = document.querySelector('.lista-fases');
const listaRanking = document.querySelector('.lista-ranking');
const telaJogoRoot = document.querySelector('[data-screen="jogo"]');

let naveSelecionadaId = getShips()[0].id;

function atualizarBotaoSom() {
    const mutado = State.isMuted();
    botaoSom.textContent = mutado ? 'Som: Desligado' : 'Som: Ligado';
    musica.muted = mutado;
}

function atualizarBotaoContinuar() {
    botaoContinuar.disabled = !State.hasProfile();
}

function renderListaNaves() {
    listaNaves.innerHTML = '';
    for (const nave of getShips()) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'card-nave' + (nave.id === naveSelecionadaId ? ' card-nave-selecionada' : '');
        card.innerHTML = `<img src="${nave.imagem}" class="card-nave-imagem" alt="${nave.nome}" /><span>${nave.nome}</span>`;
        card.addEventListener('click', () => {
            naveSelecionadaId = nave.id;
            renderListaNaves();
        });
        listaNaves.appendChild(card);
    }
}

function mostrarTelaPerfil() {
    renderListaNaves();
    State.showScreen('perfil');
}

function renderListaFases(profile) {
    listaFases.innerHTML = '';
    for (const fase of getPhases()) {
        const desbloqueada = profile.fasesDesbloqueadas.includes(fase.id);
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'card-fase' + (desbloqueada ? '' : ' card-fase-bloqueada');
        item.textContent = desbloqueada ? fase.nome : `${fase.nome} (bloqueada)`;
        item.disabled = !desbloqueada;
        if (desbloqueada) {
            item.addEventListener('click', () => iniciarPartida(profile, fase));
        }
        listaFases.appendChild(item);
    }
}

function mostrarTelaFases(profile) {
    renderListaFases(profile);
    State.showScreen('fases');
}

function iniciarPartida(profile, fase) {
    const nave = getShipById(profile.naveId);
    const armas = getWeapons();
    State.showScreen('jogo');
    iniciarFase({
        root: telaJogoRoot,
        fase,
        nave,
        armas,
        armaInicialId: profile.armaId,
        nomeJogador: profile.nome,
        vidasIniciais: profile.vidas,
        pontosIniciais: profile.pontosAcumulados,
        onFaseCompleta: ({ pontos, bonus, vidasRestantes }) => mostrarFaseCompleta(profile, fase, pontos, bonus, vidasRestantes),
        onGameOver: ({ pontos }) => finalizarJogo(profile, pontos),
        onSaiu: ({ pontos, vidasRestantes }) => {
            profile.vidas = vidasRestantes;
            profile.pontosAcumulados = pontos;
            State.saveProfile(profile);
            mostrarTelaFases(profile);
        },
    });
}

function mostrarFaseCompleta(profile, fase, pontos, bonus, vidasRestantes) {
    document.querySelector('.fc-pontos').textContent = pontos;
    document.querySelector('.fc-bonus').textContent = bonus;
    profile.vidas = vidasRestantes;
    profile.pontosAcumulados = pontos;
    const proximaFase = getPhases().find((f) => f.id === fase.id + 1);
    if (proximaFase) {
        State.desbloquearFase(profile, proximaFase.id);
    } else {
        State.saveProfile(profile);
    }
    document.querySelector('.botao-continuar-fases').onclick = () => mostrarTelaFases(profile);
    State.showScreen('fase-completa');
}

function finalizarJogo(profile, pontos) {
    State.addRankingEntry(profile.nome, pontos);
    State.clearProfile();
    document.querySelector('.go-pontos').textContent = pontos;
    document.querySelector('.botao-ver-ranking').onclick = () => {
        atualizarBotaoContinuar();
        mostrarRanking();
    };
    State.showScreen('game-over');
}

function mostrarRanking() {
    listaRanking.innerHTML = '';
    const ranking = State.loadRanking();
    if (ranking.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhuma pontuação registrada ainda.';
        listaRanking.appendChild(li);
    }
    for (const entrada of ranking) {
        const li = document.createElement('li');
        li.textContent = `${entrada.nome} — ${entrada.pontos} pontos`;
        listaRanking.appendChild(li);
    }
    State.showScreen('ranking');
}

document.querySelector('[data-acao="iniciar"]').addEventListener('click', mostrarTelaPerfil);
document.querySelector('[data-acao="continuar"]').addEventListener('click', () => {
    const profile = State.loadProfile();
    if (!profile) return;
    mostrarTelaFases(profile);
});
document.querySelector('[data-acao="ranking"]').addEventListener('click', mostrarRanking);
botaoSom.addEventListener('click', () => {
    State.setMuted(!State.isMuted());
    atualizarBotaoSom();
});

document.querySelectorAll('[data-voltar]').forEach((botao) => {
    botao.addEventListener('click', () => {
        atualizarBotaoContinuar();
        State.showScreen(botao.dataset.voltar);
    });
});

document.querySelector('.botao-confirmar-perfil').addEventListener('click', () => {
    const nomeInput = document.querySelector('.input-nome');
    const nome = nomeInput.value.trim() || 'Piloto';
    const arma = getWeapons()[0];
    const profile = State.createProfile(nome, naveSelecionadaId, arma.id);
    mostrarTelaFases(profile);
});

atualizarBotaoSom();
atualizarBotaoContinuar();
State.showScreen('menu');
