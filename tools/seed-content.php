<?php
// Script de uso único (rodar com o php.exe do XAMPP) pra (re)gerar data/content.sqlite
// a partir dos dados que hoje moram em js/data/{ships,weapons,phases}.js, mais uma
// Fase 2 de exemplo reaproveitando o fundo solto img/a-17202525498312.jpg.
// Uso: php tools/seed-content.php

$dbPath = __DIR__ . '/../data/content.sqlite';
if (file_exists($dbPath)) {
    unlink($dbPath);
}

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec('
    CREATE TABLE naves (
        id TEXT PRIMARY KEY,
        nome TEXT,
        imagem TEXT,
        imagem_explosao TEXT,
        velocidade_pct_por_segundo REAL,
        largura_pct REAL,
        altura_pct REAL
    )
');

$pdo->exec('
    CREATE TABLE armas (
        id TEXT PRIMARY KEY,
        nome TEXT,
        cadencia_ms INTEGER,
        dano INTEGER,
        velocidade_pct_por_segundo REAL,
        largura_pct REAL,
        altura_pct REAL,
        cor TEXT
    )
');

$pdo->exec('
    CREATE TABLE fases (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        background TEXT,
        base_avanco_pct_por_segundo REAL,
        multiplicador_acelerar REAL,
        multiplicador_frear REAL,
        fuel_start REAL,
        fuel_drain_per_second REAL,
        fuel_bonus_factor REAL
    )
');

$pdo->exec('
    CREATE TABLE fase_inimigos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fase_id INTEGER REFERENCES fases(id),
        at_progress_pct REAL,
        tipo TEXT,
        y REAL,
        hp INTEGER,
        pontos INTEGER,
        velocidade_pct_por_segundo REAL
    )
');

$pdo->prepare('
    INSERT INTO naves (id, nome, imagem, imagem_explosao, velocidade_pct_por_segundo, largura_pct, altura_pct)
    VALUES (:id, :nome, :imagem, :imagem_explosao, :velocidade, :largura, :altura)
')->execute([
    ':id' => 'foguete-padrao',
    ':nome' => 'Foguete Padrão',
    ':imagem' => './img/foguete.png',
    ':imagem_explosao' => './img/fogueteExplodindo.png',
    ':velocidade' => 55,
    ':largura' => 9,
    ':altura' => 12,
]);

$pdo->prepare('
    INSERT INTO armas (id, nome, cadencia_ms, dano, velocidade_pct_por_segundo, largura_pct, altura_pct, cor)
    VALUES (:id, :nome, :cadencia, :dano, :velocidade, :largura, :altura, :cor)
')->execute([
    ':id' => 'tiro-simples',
    ':nome' => 'Tiro Simples',
    ':cadencia' => 350,
    ':dano' => 1,
    ':velocidade' => 110,
    ':largura' => 3,
    ':altura' => 2,
    ':cor' => '#ffd93d',
]);

$inserirFase = $pdo->prepare('
    INSERT INTO fases (id, nome, background, base_avanco_pct_por_segundo, multiplicador_acelerar, multiplicador_frear, fuel_start, fuel_drain_per_second, fuel_bonus_factor)
    VALUES (:id, :nome, :background, :base_avanco, :mult_acelerar, :mult_frear, :fuel_start, :fuel_drain, :fuel_bonus)
');

$inserirInimigo = $pdo->prepare('
    INSERT INTO fase_inimigos (fase_id, at_progress_pct, tipo, y, hp, pontos, velocidade_pct_por_segundo)
    VALUES (:fase_id, :at_progress, :tipo, :y, :hp, :pontos, :velocidade)
');

function inserirTimeline(PDOStatement $stmt, int $faseId, array $timeline): void
{
    foreach ($timeline as $inimigo) {
        $stmt->execute([
            ':fase_id' => $faseId,
            ':at_progress' => $inimigo['atProgressPct'],
            ':tipo' => $inimigo['tipo'],
            ':y' => $inimigo['y'],
            ':hp' => $inimigo['hp'],
            ':pontos' => $inimigo['pontos'],
            ':velocidade' => $inimigo['velocidadePctPorSegundo'],
        ]);
    }
}

// Fase 1 — dados migrados de js/data/phases.js
$inserirFase->execute([
    ':id' => 1,
    ':nome' => 'Fase 1 — Campo de Asteroides',
    ':background' => './img/background1.png',
    ':base_avanco' => 1.2,
    ':mult_acelerar' => 1.6,
    ':mult_frear' => 0.5,
    ':fuel_start' => 100,
    ':fuel_drain' => 1,
    ':fuel_bonus' => 4,
]);
inserirTimeline($inserirInimigo, 1, [
    ['atProgressPct' => 5, 'tipo' => 'asteroide', 'y' => 20, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 20],
    ['atProgressPct' => 12, 'tipo' => 'asteroide', 'y' => 65, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 20],
    ['atProgressPct' => 20, 'tipo' => 'asteroide', 'y' => 40, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 22],
    ['atProgressPct' => 28, 'tipo' => 'asteroide', 'y' => 15, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 22],
    ['atProgressPct' => 28, 'tipo' => 'asteroide', 'y' => 75, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 22],
    ['atProgressPct' => 36, 'tipo' => 'asteroide', 'y' => 50, 'hp' => 2, 'pontos' => 20, 'velocidadePctPorSegundo' => 24],
    ['atProgressPct' => 44, 'tipo' => 'asteroide', 'y' => 25, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 26],
    ['atProgressPct' => 44, 'tipo' => 'asteroide', 'y' => 70, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 26],
    ['atProgressPct' => 52, 'tipo' => 'asteroide', 'y' => 45, 'hp' => 2, 'pontos' => 20, 'velocidadePctPorSegundo' => 28],
    ['atProgressPct' => 58, 'tipo' => 'asteroide', 'y' => 15, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 28],
    ['atProgressPct' => 58, 'tipo' => 'asteroide', 'y' => 80, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 28],
    ['atProgressPct' => 65, 'tipo' => 'asteroide', 'y' => 55, 'hp' => 2, 'pontos' => 20, 'velocidadePctPorSegundo' => 30],
    ['atProgressPct' => 72, 'tipo' => 'asteroide', 'y' => 30, 'hp' => 2, 'pontos' => 20, 'velocidadePctPorSegundo' => 32],
    ['atProgressPct' => 72, 'tipo' => 'asteroide', 'y' => 65, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 32],
    ['atProgressPct' => 80, 'tipo' => 'asteroide', 'y' => 20, 'hp' => 2, 'pontos' => 20, 'velocidadePctPorSegundo' => 34],
    ['atProgressPct' => 80, 'tipo' => 'asteroide', 'y' => 50, 'hp' => 2, 'pontos' => 20, 'velocidadePctPorSegundo' => 34],
    ['atProgressPct' => 80, 'tipo' => 'asteroide', 'y' => 80, 'hp' => 2, 'pontos' => 20, 'velocidadePctPorSegundo' => 34],
    ['atProgressPct' => 90, 'tipo' => 'asteroide', 'y' => 40, 'hp' => 3, 'pontos' => 30, 'velocidadePctPorSegundo' => 36],
]);

// Fase 2 — exemplo novo, pra provar o pipeline ponta a ponta, reaproveitando
// o fundo solto img/a-17202525498312.jpg e o mesmo sprite de asteroide (mais rápido/resistente).
$inserirFase->execute([
    ':id' => 2,
    ':nome' => 'Fase 2 — Cinturão Profundo',
    ':background' => './img/a-17202525498312.jpg',
    ':base_avanco' => 1.4,
    ':mult_acelerar' => 1.7,
    ':mult_frear' => 0.5,
    ':fuel_start' => 100,
    ':fuel_drain' => 1.3,
    ':fuel_bonus' => 4,
]);
inserirTimeline($inserirInimigo, 2, [
    ['atProgressPct' => 6, 'tipo' => 'asteroide', 'y' => 30, 'hp' => 2, 'pontos' => 15, 'velocidadePctPorSegundo' => 26],
    ['atProgressPct' => 14, 'tipo' => 'asteroide', 'y' => 60, 'hp' => 2, 'pontos' => 15, 'velocidadePctPorSegundo' => 26],
    ['atProgressPct' => 22, 'tipo' => 'asteroide', 'y' => 20, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 30],
    ['atProgressPct' => 22, 'tipo' => 'asteroide', 'y' => 75, 'hp' => 1, 'pontos' => 10, 'velocidadePctPorSegundo' => 30],
    ['atProgressPct' => 32, 'tipo' => 'asteroide', 'y' => 45, 'hp' => 2, 'pontos' => 15, 'velocidadePctPorSegundo' => 32],
    ['atProgressPct' => 40, 'tipo' => 'asteroide', 'y' => 15, 'hp' => 2, 'pontos' => 15, 'velocidadePctPorSegundo' => 34],
    ['atProgressPct' => 40, 'tipo' => 'asteroide', 'y' => 80, 'hp' => 2, 'pontos' => 15, 'velocidadePctPorSegundo' => 34],
    ['atProgressPct' => 50, 'tipo' => 'asteroide', 'y' => 55, 'hp' => 3, 'pontos' => 25, 'velocidadePctPorSegundo' => 36],
    ['atProgressPct' => 58, 'tipo' => 'asteroide', 'y' => 25, 'hp' => 2, 'pontos' => 15, 'velocidadePctPorSegundo' => 38],
    ['atProgressPct' => 58, 'tipo' => 'asteroide', 'y' => 70, 'hp' => 2, 'pontos' => 15, 'velocidadePctPorSegundo' => 38],
    ['atProgressPct' => 68, 'tipo' => 'asteroide', 'y' => 40, 'hp' => 3, 'pontos' => 25, 'velocidadePctPorSegundo' => 40],
    ['atProgressPct' => 76, 'tipo' => 'asteroide', 'y' => 20, 'hp' => 3, 'pontos' => 25, 'velocidadePctPorSegundo' => 42],
    ['atProgressPct' => 76, 'tipo' => 'asteroide', 'y' => 50, 'hp' => 3, 'pontos' => 25, 'velocidadePctPorSegundo' => 42],
    ['atProgressPct' => 76, 'tipo' => 'asteroide', 'y' => 80, 'hp' => 3, 'pontos' => 25, 'velocidadePctPorSegundo' => 42],
    ['atProgressPct' => 88, 'tipo' => 'asteroide', 'y' => 45, 'hp' => 4, 'pontos' => 35, 'velocidadePctPorSegundo' => 45],
]);

echo "Banco gerado em: $dbPath\n";
