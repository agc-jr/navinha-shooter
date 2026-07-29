export const SHIPS = [
    {
        id: 'foguete-padrao',
        nome: 'Foguete Padrão',
        imagem: './img/foguete.png',
        imagemExplosao: './img/fogueteExplodindo.png',
        velocidadePctPorSegundo: 55,
        larguraPct: 9,
        alturaPct: 12,
    },
];

export function getShipById(id) {
    return SHIPS.find((nave) => nave.id === id) ?? SHIPS[0];
}
