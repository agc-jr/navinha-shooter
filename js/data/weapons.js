export const WEAPONS = [
    {
        id: 'tiro-simples',
        nome: 'Tiro Simples',
        cadenciaMs: 350,
        dano: 1,
        velocidadePctPorSegundo: 110,
        larguraPct: 3,
        alturaPct: 2,
        cor: '#ffd93d',
    },
];

export function getWeaponById(id) {
    return WEAPONS.find((arma) => arma.id === id) ?? WEAPONS[0];
}
