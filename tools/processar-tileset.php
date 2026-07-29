<?php
// Ferramenta pra limpar o fundo (preto ou xadrez falso-transparente) das imagens
// geradas no Gemini e recortar cada item numa figura separada.
// Uso: php -d extension=gd tools/processar-tileset.php
set_time_limit(0);

function carregarComoTruecolorAlpha(string $caminho)
{
    $original = imagecreatefrompng($caminho);
    $w = imagesx($original);
    $h = imagesy($original);
    $novo = imagecreatetruecolor($w, $h);
    imagesavealpha($novo, true);
    imagealphablending($novo, false);
    $transparente = imagecolorallocatealpha($novo, 0, 0, 0, 127);
    imagefill($novo, 0, 0, $transparente);
    imagealphablending($novo, false);
    imagecopy($novo, $original, 0, 0, 0, 0, $w, $h);
    imagedestroy($original);
    return $novo;
}

// Remove fundo (preto sólido OU xadrez cinza) via flood-fill a partir das bordas,
// preservando qualquer coisa que não seja "fundo" mesmo que seja escura (contornos).
function removerFundoFloodFill($im, callable $ehFundo): void
{
    $w = imagesx($im);
    $h = imagesy($im);
    imagealphablending($im, false);
    $visitado = array_fill(0, $w * $h, false);
    $fila = new SplQueue();

    $semear = function ($x, $y) use (&$fila, &$visitado, $w, $h) {
        if ($x < 0 || $x >= $w || $y < 0 || $y >= $h) return;
        $idx = $y * $w + $x;
        if ($visitado[$idx]) return;
        $visitado[$idx] = true;
        $fila->push([$x, $y]);
    };

    for ($x = 0; $x < $w; $x++) { $semear($x, 0); $semear($x, $h - 1); }
    for ($y = 0; $y < $h; $y++) { $semear(0, $y); $semear($w - 1, $y); }

    $totalRemovidos = 0;
    while (!$fila->isEmpty()) {
        [$x, $y] = $fila->pop();
        $rgba = imagecolorat($im, $x, $y);
        $r = ($rgba >> 16) & 0xFF; $g = ($rgba >> 8) & 0xFF; $b = $rgba & 0xFF;
        if (!$ehFundo($r, $g, $b)) continue;

        $transparente = imagecolorallocatealpha($im, $r, $g, $b, 127);
        imagesetpixel($im, $x, $y, $transparente);
        $totalRemovidos++;

        foreach ([[1,0],[-1,0],[0,1],[0,-1]] as [$dx,$dy]) {
            $nx = $x + $dx; $ny = $y + $dy;
            if ($nx < 0 || $nx >= $w || $ny < 0 || $ny >= $h) continue;
            $nIdx = $ny * $w + $nx;
            if ($visitado[$nIdx]) continue;
            $visitado[$nIdx] = true;
            $fila->push([$nx, $ny]);
        }
    }
    fwrite(STDERR, "  pixels de fundo removidos: $totalRemovidos\n");
}

function distanciaCor(int $r, int $g, int $b, array $alvo): float
{
    return sqrt(($r - $alvo[0]) ** 2 + ($g - $alvo[1]) ** 2 + ($b - $alvo[2]) ** 2);
}

// Alpha gradual pra sprites de "brilho sobre preto" (tiros): quanto mais escuro, mais transparente.
// $pisoRuido corta de vez o grão/ruído do fundo (evita que ele "ligue" os blobs uns aos outros).
function extrairAlphaPorLuminancia($im, int $pisoRuido = 45): void
{
    $w = imagesx($im); $h = imagesy($im);
    imagealphablending($im, false);
    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            $rgba = imagecolorat($im, $x, $y);
            $r = ($rgba >> 16) & 0xFF; $g = ($rgba >> 8) & 0xFF; $b = $rgba & 0xFF;
            $luminancia = max($r, $g, $b); // 0-255
            if ($luminancia < $pisoRuido) {
                $alphaGd = 127;
            } else {
                $alphaGd = 127 - (int) round((($luminancia - $pisoRuido) / (255 - $pisoRuido)) * 127);
            }
            $cor = imagecolorallocatealpha($im, $r, $g, $b, $alphaGd);
            imagesetpixel($im, $x, $y, $cor);
        }
    }
}

// Rotula componentes conectados de pixels "opacos o suficiente" (alpha gd < limiarAlpha)
// e devolve as caixas delimitadoras, ordenadas em ordem de leitura (linha a linha).
function detectarBlobs($im, int $limiarAlpha = 100, int $areaMinima = 400): array
{
    $w = imagesx($im); $h = imagesy($im);
    $visitado = array_fill(0, $w * $h, false);
    $blobs = [];

    for ($y0 = 0; $y0 < $h; $y0++) {
        for ($x0 = 0; $x0 < $w; $x0++) {
            $idx0 = $y0 * $w + $x0;
            if ($visitado[$idx0]) continue;
            $visitado[$idx0] = true;
            $rgba = imagecolorat($im, $x0, $y0);
            $alpha = ($rgba >> 24) & 0x7F;
            if ($alpha >= $limiarAlpha) continue; // fundo (transparente/quase)

            $minX = $x0; $maxX = $x0; $minY = $y0; $maxY = $y0; $area = 0;
            $fila = new SplQueue();
            $fila->push([$x0, $y0]);
            while (!$fila->isEmpty()) {
                [$x, $y] = $fila->pop();
                $area++;
                $minX = min($minX, $x); $maxX = max($maxX, $x);
                $minY = min($minY, $y); $maxY = max($maxY, $y);
                foreach ([[1,0],[-1,0],[0,1],[0,-1]] as [$dx,$dy]) {
                    $nx = $x + $dx; $ny = $y + $dy;
                    if ($nx < 0 || $nx >= $w || $ny < 0 || $ny >= $h) continue;
                    $nIdx = $ny * $w + $nx;
                    if ($visitado[$nIdx]) continue;
                    $nrgba = imagecolorat($im, $nx, $ny);
                    $nalpha = ($nrgba >> 24) & 0x7F;
                    if ($nalpha >= $limiarAlpha) continue;
                    $visitado[$nIdx] = true;
                    $fila->push([$nx, $ny]);
                }
            }
            if ($area >= $areaMinima) {
                $blobs[] = ['x' => $minX, 'y' => $minY, 'w' => $maxX - $minX + 1, 'h' => $maxY - $minY + 1, 'area' => $area];
            }
        }
    }

    usort($blobs, function ($a, $b) {
        $linhaA = (int) round($a['y'] / 80);
        $linhaB = (int) round($b['y'] / 80);
        if ($linhaA !== $linhaB) return $linhaA <=> $linhaB;
        return $a['x'] <=> $b['x'];
    });
    return $blobs;
}

function salvarRecorte($im, array $blob, string $destino, int $margem = 10): void
{
    $w = imagesx($im); $h = imagesy($im);
    $x = max(0, $blob['x'] - $margem);
    $y = max(0, $blob['y'] - $margem);
    $x2 = min($w, $blob['x'] + $blob['w'] + $margem);
    $y2 = min($h, $blob['y'] + $blob['h'] + $margem);
    $novaW = $x2 - $x; $novaH = $y2 - $y;

    $recorte = imagecreatetruecolor($novaW, $novaH);
    imagesavealpha($recorte, true);
    imagealphablending($recorte, false);
    $transparente = imagecolorallocatealpha($recorte, 0, 0, 0, 127);
    imagefill($recorte, 0, 0, $transparente);
    imagecopy($recorte, $im, 0, 0, $x, $y, $novaW, $novaH);
    imagepng($recorte, $destino);
    imagedestroy($recorte);
    fwrite(STDERR, "  salvo: $destino ({$novaW}x{$novaH})\n");
}

function processarChecker(string $entrada, string $pastaSaida, array $nomes): void
{
    fwrite(STDERR, "Processando (checker cinza): $entrada\n");
    $im = carregarComoTruecolorAlpha($entrada);
    removerFundoFloodFill($im, function ($r, $g, $b) {
        if (abs($r - $g) > 15 || abs($g - $b) > 15) return false; // precisa ser neutro (cinza)
        $luz = ($r + $g + $b) / 3;
        return ($luz >= 130 && $luz <= 230);
    });
    $blobs = detectarBlobs($im);
    fwrite(STDERR, "  blobs encontrados: " . count($blobs) . "\n");
    foreach ($blobs as $i => $blob) {
        $nome = $nomes[$i] ?? ("item" . ($i + 1));
        salvarRecorte($im, $blob, "$pastaSaida/$nome.png");
    }
    imagedestroy($im);
}

function processarPretoLuminancia(string $entrada, string $pastaSaida, array $nomes): void
{
    fwrite(STDERR, "Processando (preto -> alpha por luminancia): $entrada\n");
    $im = carregarComoTruecolorAlpha($entrada);
    extrairAlphaPorLuminancia($im);
    $blobs = detectarBlobs($im, 120, 150);
    fwrite(STDERR, "  blobs encontrados: " . count($blobs) . "\n");
    foreach ($blobs as $i => $blob) {
        $nome = $nomes[$i] ?? ("item" . ($i + 1));
        salvarRecorte($im, $blob, "$pastaSaida/$nome.png");
    }
    imagedestroy($im);
}

// Naves: fundo preto puro encostando no contorno preto. Só extrai blobs "largos o
// suficiente" pra ser uma nave inteira (o desenho do foguete clássico se fragmenta
// em pedaços pequenos porque o contorno dele se conecta ao fundo — como já temos
// esse mesmo estilo em img/foguete.png, simplesmente ignoramos os fragmentos).
function processarNaves(string $entrada, string $pastaSaida, array $nomes, int $larguraMinima = 500): void
{
    fwrite(STDERR, "Processando (preto puro, só blobs largos): $entrada\n");
    $im = carregarComoTruecolorAlpha($entrada);
    removerFundoFloodFill($im, function ($r, $g, $b) {
        return $r <= 4 && $g <= 4 && $b <= 4;
    });
    $todosBlobs = detectarBlobs($im, 100, 2000);
    $blobs = array_values(array_filter($todosBlobs, fn ($b) => $b['w'] >= $larguraMinima));
    fwrite(STDERR, "  blobs totais: " . count($todosBlobs) . ", usados (largura >= $larguraMinima): " . count($blobs) . "\n");
    foreach ($blobs as $i => $blob) {
        $nome = $nomes[$i] ?? ("nave" . ($i + 1));
        salvarRecorte($im, $blob, "$pastaSaida/$nome.png");
    }
    imagedestroy($im);
}

// --- pipeline ---------------------------------------------------------------

if (php_sapi_name() === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    processarChecker(
        "img/tileset/inimigos/inimigos-gemini.png",
        "img/tileset/inimigos",
        ["asteroide-cinza", "drone-robo", "nave-alien", "meteoro-gelo"]
    );

    processarChecker(
        "img/tileset/itens/itens-gemini.png",
        "img/tileset/itens",
        ["item-combustivel", "item-pontos", "item-powerup-arma"]
    );

    processarChecker(
        "img/tileset/chefes/boss01-gemini.png",
        "img/tileset/chefes",
        ["chefe-fase-final"]
    );

    processarPretoLuminancia(
        "img/tileset/tiros/tiros-gemini.png",
        "img/tileset/tiros",
        ["tiro-simples-dourado", "tiro-laser-azul", "tiro-plasma-roxo"]
    );

    processarNaves(
        "img/tileset/naves/naves-gemini.png",
        "img/tileset/naves",
        ["nave-caca-azul", "nave-tanque-verde", "nave-elite-dourada"]
    );

    fwrite(STDERR, "Concluído.\n");
}
