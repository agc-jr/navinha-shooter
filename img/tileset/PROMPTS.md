# Prompts pra gerar o tileset no Gemini

Cole um prompt de cada vez no Gemini (gemini.google.com), baixe o PNG e salve na
subpasta indicada com o nome sugerido. Quando tiver um lote pronto, é só avisar
que a gente liga no jogo (código + `data/content.sqlite` via `admin.html`).

## Estilo base (repita/adapte em todo prompt de personagem/item)

> Flat 2D vector illustration, cartoon sci-fi arcade shooter game asset in the
> style of classic R-Type/Gradius side-scrolling shooters. Bold clean black
> outlines, simple flat cel-shading, bright saturated colors, no gradients-heavy
> realism. Isolated single subject, perfectly centered, transparent background
> (PNG), no text, no watermark, no drop shadow baked into the image.

Fundos (background) são a exceção: pedimos foto realista de espaço (ver seção
própria), pra manter o mesmo contraste "cenário fotográfico + sprite flat" que
o jogo já usa hoje.

---

## Naves — `img/tileset/naves/`

Referência: a nave atual (`foguete.png`) é um foguete branco/vermelho visto de
perfil, apontando pra direita, com chama de propulsão saindo pela esquerda.
Mantenha a MESMA orientação (bico apontando pra direita) pras novas naves.

**nave-caca-azul.png**
> [estilo base] A sleek blue and silver fighter spaceship, side view, facing
> right, angular aerodynamic design with a small cockpit bubble, engine
> exhaust flames on the left side, similar proportions to a classic arcade
> shooter ship (wider than tall).

**nave-tanque-verde.png**
> [estilo base] A bulky green and gray armored spaceship, side view, facing
> right, heavier and wider than a standard fighter, visible armor plating and
> twin engine exhausts on the left side.

**nave-elite-dourada.png**
> [estilo base] A sleek golden and black premium fighter spaceship, side view,
> facing right, glowing energy lines along the hull, sharp swept-back wings,
> engine exhaust flames on the left side.

---

## Inimigos — `img/tileset/inimigos/`

Referência: o inimigo atual (`asteroid.png`) é um asteroide cinza simples,
visto de frente (funciona pra qualquer direção). Pra inimigos com "cara" (nave
alienígena, drone), eles se movem da direita pra esquerda na tela, então peça
sempre **de frente para a esquerda** (facing left), pra parecer que estão
avançando contra o jogador.

**inimigo-drone.png**
> [estilo base] A small hostile robotic drone enemy, front-left facing view,
> single glowing red eye/sensor, dark metallic gray body with red accent
> lights, compact and slightly menacing, similar scale to a small fighter
> ship.

**inimigo-nave-alien.png**
> [estilo base] A small alien fighter ship enemy, side view, facing left,
> organic biomechanical design with a purple and green color scheme, glowing
> eye-like cockpit, slightly smaller than the player's ship.

**inimigo-meteoro-gelo.png**
> [estilo base] An icy blue crystalline meteor/asteroid, front view, jagged
> crystal shard shapes with a cracked glowing blue core, works from any
> facing angle.

---

## Chefe (boss) — `img/tileset/chefes/`

A fase final é aberta: o chefe fica parado (ou se move pouco) do lado direito
da tela e atira contra o jogador, que vem da esquerda. Peça **de frente para a
esquerda**, bem maior/mais detalhado que os inimigos comuns.

**chefe-fase-final.png**
> [estilo base] A large intimidating boss spaceship/organic-mechanical hybrid
> creature, front-left facing view, much bigger and more detailed than a
> normal enemy ship, multiple weapon turrets/cannons visible, glowing red
> core weak point clearly visible in the center of its body, dark
> red-and-black color scheme, dramatic and menacing silhouette.

---

## Itens bônus / coletáveis — `img/tileset/itens/`

Pequenos ícones, mesma família visual das naves/inimigos.

**item-combustivel.png**
> [estilo base] A small glowing fuel canister/battery pickup icon, blue-green
> energy glow, compact and simple, easily readable as a small collectible
> icon.

**item-pontos.png**
> [estilo base] A small glowing golden gem/star bonus point pickup icon,
> bright yellow-gold, compact and simple, easily readable as a small
> collectible icon.

**item-powerup-arma.png**
> [estilo base] A small glowing weapon power-up capsule pickup icon, red
> energy glow with a lightning bolt symbol, compact and simple, easily
> readable as a small collectible icon.

---

## Tiros/projéteis por arma — `img/tileset/tiros/` (opcional, hoje são só retângulos coloridos no código)

Formato horizontal (viajam da esquerda pra direita), bem pequenos e recortados
rente ao efeito (pouca margem transparente).

**tiro-simples.png**
> [estilo base] A small simple yellow energy bolt projectile, horizontal
> orientation, glowing bright yellow-orange, tight crop, minimal transparent
> padding.

**tiro-laser-azul.png**
> [estilo base] A thin blue laser beam projectile, horizontal orientation,
> glowing cyan-blue with a bright white core, tight crop, minimal transparent
> padding.

**tiro-plasma-roxo.png**
> [estilo base] A round purple plasma ball projectile, glowing magenta-purple
> with energy wisps, tight crop, minimal transparent padding.

---

## Fundos de fase — `img/tileset/fundos/`

Diferente dos personagens: aqui queremos **foto realista de espaço** (não
vetor/cartoon), igual aos fundos que já existem (`background1.png`,
`a-17202525498312.jpg`), só que com cenários diferentes. Formato bem largo
(paisagem), sem nenhum personagem/nave/texto na imagem.

**fundo-nebulosa-vermelha.png**
> Ultra-realistic deep space photography, wide panoramic view, a vast red and
> orange nebula with scattered bright stars, in the style of a Hubble Space
> Telescope photograph, no planets or spaceships in frame, no text, richly
> detailed, wide landscape aspect ratio.

**fundo-campo-detritos.png**
> Ultra-realistic deep space photography, wide panoramic view, a debris field
> with scattered rocky asteroid chunks silhouetted against a starry
> dark blue nebula backdrop, in the style of a Hubble Space Telescope
> photograph, no spaceships or text, wide landscape aspect ratio.

---

## Depois de gerar

1. Salva os PNGs nas subpastas indicadas (nomes sugeridos, pode ajustar).
2. Me avisa quais arquivos colocou.
3. A gente cadastra cada um no `admin.html` (naves/armas/fases) e, se forem
   inimigos/tiros novos, eu ajusto um pouco o CSS/código pra usar a imagem
   certa por tipo (hoje só existe uma imagem de inimigo fixa no CSS).
