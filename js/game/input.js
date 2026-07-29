export function createInputState() {
    return { cima: false, baixo: false, esquerda: false, direita: false, atirando: false };
}

const TECLA_PARA_DIRECAO = {
    ArrowUp: 'cima',
    ArrowDown: 'baixo',
    ArrowLeft: 'esquerda',
    ArrowRight: 'direita',
};

export function bindKeyboard(inputState, onTrocarArma) {
    const onKeyDown = (e) => {
        const direcao = TECLA_PARA_DIRECAO[e.code];
        if (direcao) {
            e.preventDefault();
            inputState[direcao] = true;
            return;
        }
        if (e.code === 'Space') {
            e.preventDefault();
            inputState.atirando = true;
            return;
        }
        if (e.code === 'KeyX' && !e.repeat) {
            e.preventDefault();
            onTrocarArma?.();
        }
    };
    const onKeyUp = (e) => {
        const direcao = TECLA_PARA_DIRECAO[e.code];
        if (direcao) {
            e.preventDefault();
            inputState[direcao] = false;
            return;
        }
        if (e.code === 'Space') {
            e.preventDefault();
            inputState.atirando = false;
        }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        Object.keys(inputState).forEach((chave) => (inputState[chave] = false));
    };
}

function bindPress(el, onPress, onRelease) {
    const press = (e) => {
        e.preventDefault();
        onPress();
    };
    const release = (e) => {
        e.preventDefault();
        onRelease();
    };
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function bindDpad(dpadRoot, inputState) {
    for (const direcao of ['cima', 'baixo', 'esquerda', 'direita']) {
        const botao = dpadRoot.querySelector(`[data-direcao="${direcao}"]`);
        if (!botao) continue;
        bindPress(
            botao,
            () => (inputState[direcao] = true),
            () => (inputState[direcao] = false)
        );
    }
}

export function bindAtirar(botao, inputState) {
    bindPress(
        botao,
        () => (inputState.atirando = true),
        () => (inputState.atirando = false)
    );
}

export function bindTrocarArma(botao, onTrocar) {
    botao.addEventListener('click', onTrocar);
}
