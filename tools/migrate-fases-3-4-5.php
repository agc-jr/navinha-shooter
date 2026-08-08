<?php
// Migração não-destrutiva: reorganiza a progressão de dificuldade.
// - Fase 1 e 2 passam a usar o mesmo fundo (fase1e2.png) e a Fase 2 perde o chefe
//   (o chefe antigo "Guardião do Vazio" muda pra Fase 3, com a arte re-exportada
//   como chefe-fase-3.png).
// - Cria as Fases 3, 4 e 5, com dificuldade crescente porém vencível:
//   Fase 3 = chefe "Guardião do Vazio", Fase 4 = fase normal mais difícil (sem chefe),
//   Fase 5 = chefe final "Serpente Ômega".
// Uso: php tools/migrate-fases-3-4-5.php
$pdo = new PDO('sqlite:' . __DIR__ . '/../data/content.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->beginTransaction();

// --- Fase 1 e 2: fundo compartilhado, chefe sai da Fase 2 ---
$pdo->exec("UPDATE fases SET background = './img/tileset/fundos/fase1e2.png' WHERE id IN (1, 2)");
$pdo->exec("UPDATE fases SET chefe_id = NULL, chefe_trigger_progress_pct = NULL WHERE id = 2");

// --- Chefes: remove o antigo (arquivo de imagem já não existe mais) e cadastra os dois novos ---
$pdo->exec("DELETE FROM chefes WHERE id = 'chefe-fase-final'");

$stmtChefe = $pdo->prepare(
    "INSERT INTO chefes (id, nome, imagem, hp, dano_projetil, cadencia_ms, velocidade_projetil_pct_por_segundo, pontos_recompensa, largura_pct, altura_pct)
     VALUES (:id, :nome, :imagem, :hp, :dano, :cadencia, :velproj, :pontos, :largura, :altura)"
);
$stmtChefe->execute([
    ':id' => 'chefe-fase-3', ':nome' => 'Guardião do Vazio', ':imagem' => './img/tileset/chefes/chefe-fase-3.png',
    ':hp' => 40, ':dano' => 1, ':cadencia' => 1400, ':velproj' => 45.0, ':pontos' => 500, ':largura' => 32.0, ':altura' => 28.0,
]);
$stmtChefe->execute([
    ':id' => 'boss-final', ':nome' => 'Serpente Ômega', ':imagem' => './img/tileset/chefes/boss-final.png',
    ':hp' => 55, ':dano' => 1, ':cadencia' => 1100, ':velproj' => 55.0, ':pontos' => 1000, ':largura' => 34.0, ':altura' => 30.0,
]);

// --- Fases 3, 4 e 5 ---
$stmtFase = $pdo->prepare(
    "INSERT INTO fases (id, nome, background, base_avanco_pct_por_segundo, multiplicador_acelerar, multiplicador_frear, fuel_start, fuel_drain_per_second, fuel_bonus_factor, chefe_id, chefe_trigger_progress_pct)
     VALUES (:id, :nome, :background, :avanco, :acelerar, :frear, :fuelStart, :fuelDrain, :fuelBonus, :chefeId, :chefeTrigger)"
);
$stmtFase->execute([
    ':id' => 3, ':nome' => 'Fase 3 — Território do Guardião', ':background' => './img/tileset/fundos/fase3.png',
    ':avanco' => 1.3, ':acelerar' => 1.65, ':frear' => 0.5, ':fuelStart' => 100.0, ':fuelDrain' => 1.2, ':fuelBonus' => 4.0,
    ':chefeId' => 'chefe-fase-3', ':chefeTrigger' => 85.0,
]);
$stmtFase->execute([
    ':id' => 4, ':nome' => 'Fase 4 — Nebulosa Glacial', ':background' => './img/tileset/fundos/fase4.png',
    ':avanco' => 1.45, ':acelerar' => 1.7, ':frear' => 0.5, ':fuelStart' => 100.0, ':fuelDrain' => 1.3, ':fuelBonus' => 4.0,
    ':chefeId' => null, ':chefeTrigger' => null,
]);
$stmtFase->execute([
    ':id' => 5, ':nome' => 'Fase 5 — Confronto Final', ':background' => './img/tileset/fundos/fase5.png',
    ':avanco' => 1.5, ':acelerar' => 1.7, ':frear' => 0.5, ':fuelStart' => 110.0, ':fuelDrain' => 1.3, ':fuelBonus' => 4.5,
    ':chefeId' => 'boss-final', ':chefeTrigger' => 85.0,
]);

// --- Inimigos ---
$stmtIn = $pdo->prepare(
    "INSERT INTO fase_inimigos (fase_id, at_progress_pct, tipo, y, hp, pontos, velocidade_pct_por_segundo)
     VALUES (:fase, :pct, :tipo, :y, :hp, :pontos, :vel)"
);

function inserirInimigos(PDOStatement $stmt, int $faseId, array $linhas): void
{
    foreach ($linhas as [$pct, $tipo, $y, $hp, $pontos, $vel]) {
        $stmt->execute([
            ':fase' => $faseId, ':pct' => $pct, ':tipo' => $tipo, ':y' => $y,
            ':hp' => $hp, ':pontos' => $pontos, ':vel' => $vel,
        ]);
    }
}

// Fase 3 — território do Guardião (chefe dispara em 85%)
inserirInimigos($stmtIn, 3, [
    [4,  'asteroide',       25, 1, 10, 24],
    [10, 'drone-robo',      60, 2, 15, 28],
    [16, 'asteroide',       40, 1, 10, 26],
    [22, 'asteroide-cinza', 70, 2, 15, 28],
    [28, 'nave-alien',      20, 2, 15, 30],
    [28, 'asteroide',       55, 1, 10, 28],
    [34, 'meteoro-gelo',    35, 3, 25, 30],
    [40, 'asteroide',       15, 2, 15, 32],
    [40, 'asteroide',       75, 2, 15, 32],
    [46, 'drone-robo',      50, 3, 25, 34],
    [52, 'asteroide-cinza', 25, 2, 15, 34],
    [52, 'nave-alien',      65, 3, 25, 34],
    [58, 'asteroide',       45, 3, 25, 36],
    [64, 'meteoro-gelo',    20, 4, 35, 36],
    [64, 'asteroide',       80, 3, 25, 36],
    [70, 'drone-robo',      40, 4, 35, 38],
    [70, 'nave-alien',      60, 4, 35, 38],
    [75, 'asteroide-cinza', 30, 4, 35, 40],
    [78, 'meteoro-gelo',    55, 5, 45, 42],
    [80, 'asteroide',       45, 4, 35, 40],
]);

// Fase 4 — nebulosa glacial (sem chefe, é o nível "normal" mais difícil)
inserirInimigos($stmtIn, 4, [
    [4,  'asteroide',       30, 1, 10, 26],
    [9,  'meteoro-gelo',    60, 2, 15, 30],
    [14, 'drone-robo',      20, 2, 15, 30],
    [19, 'asteroide-cinza', 70, 2, 15, 32],
    [24, 'asteroide',       45, 2, 15, 32],
    [29, 'meteoro-gelo',    15, 3, 25, 34],
    [29, 'nave-alien',      80, 3, 25, 34],
    [34, 'drone-robo',      55, 3, 25, 36],
    [39, 'asteroide-cinza', 25, 3, 25, 36],
    [44, 'asteroide',       65, 3, 25, 38],
    [49, 'meteoro-gelo',    40, 4, 35, 38],
    [54, 'nave-alien',      20, 4, 35, 40],
    [54, 'drone-robo',      75, 4, 35, 40],
    [59, 'asteroide-cinza', 50, 4, 35, 42],
    [64, 'meteoro-gelo',    30, 5, 45, 42],
    [69, 'asteroide',       60, 4, 35, 44],
    [69, 'nave-alien',      15, 5, 45, 44],
    [74, 'drone-robo',      80, 5, 45, 46],
    [79, 'meteoro-gelo',    45, 5, 45, 46],
    [84, 'asteroide-cinza', 25, 6, 55, 48],
    [89, 'nave-alien',      65, 6, 55, 48],
    [94, 'meteoro-gelo',    40, 6, 55, 50],
]);

// Fase 5 — confronto final (chefe dispara em 85%)
inserirInimigos($stmtIn, 5, [
    [4,  'asteroide',       40, 2, 15, 30],
    [9,  'nave-alien',      65, 2, 15, 32],
    [14, 'drone-robo',      25, 3, 25, 34],
    [19, 'meteoro-gelo',    55, 3, 25, 34],
    [24, 'asteroide-cinza', 35, 3, 25, 36],
    [29, 'asteroide',       70, 3, 25, 36],
    [34, 'nave-alien',      20, 4, 35, 38],
    [34, 'drone-robo',      60, 4, 35, 38],
    [39, 'meteoro-gelo',    45, 4, 35, 40],
    [44, 'asteroide-cinza', 15, 4, 35, 40],
    [49, 'asteroide',       75, 4, 35, 42],
    [54, 'nave-alien',      30, 5, 45, 44],
    [54, 'drone-robo',      65, 5, 45, 44],
    [59, 'meteoro-gelo',    50, 5, 45, 46],
    [64, 'asteroide-cinza', 20, 5, 45, 46],
    [69, 'asteroide',       80, 5, 45, 48],
    [69, 'nave-alien',      40, 6, 55, 48],
    [74, 'drone-robo',      55, 6, 55, 50],
    [78, 'meteoro-gelo',    25, 6, 55, 52],
    [80, 'asteroide-cinza', 60, 6, 55, 52],
]);

// --- Itens bônus ---
$stmtItem = $pdo->prepare(
    "INSERT INTO fase_itens (fase_id, at_progress_pct, tipo, y, valor)
     VALUES (:fase, :pct, :tipo, :y, :valor)"
);

function inserirItens(PDOStatement $stmt, int $faseId, array $linhas): void
{
    foreach ($linhas as [$pct, $tipo, $y, $valor]) {
        $stmt->execute([':fase' => $faseId, ':pct' => $pct, ':tipo' => $tipo, ':y' => $y, ':valor' => $valor]);
    }
}

inserirItens($stmtItem, 3, [
    [15, 'combustivel',  50, 25],
    [38, 'pontos',       30, 60],
    [58, 'combustivel',  60, 30],
    [76, 'powerup-arma', 45, 0],
]);

inserirItens($stmtItem, 4, [
    [12, 'combustivel',  40, 25],
    [35, 'pontos',       55, 60],
    [55, 'powerup-arma', 30, 0],
    [78, 'combustivel',  65, 30],
]);

inserirItens($stmtItem, 5, [
    [12, 'combustivel',  45, 30],
    [30, 'pontos',       30, 70],
    [48, 'powerup-arma', 60, 0],
    [64, 'pontos',       40, 70],
    [76, 'combustivel',  55, 35],
]);

$pdo->commit();
echo "Migração concluída: fases 3, 4 e 5 criadas; fase 2 sem chefe; fundos atualizados.\n";
