<?php
// Migração de uso único: acrescenta chefes de fase e itens bônus ao content.sqlite
// que já existe, sem apagar o que já foi cadastrado (naves/armas/fases/inimigos).
// Uso: php tools/migrate-chefes-itens.php

$dbPath = __DIR__ . '/../data/content.sqlite';
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec('
    CREATE TABLE IF NOT EXISTS chefes (
        id TEXT PRIMARY KEY,
        nome TEXT,
        imagem TEXT,
        hp INTEGER,
        dano_projetil INTEGER,
        cadencia_ms INTEGER,
        velocidade_projetil_pct_por_segundo REAL,
        pontos_recompensa INTEGER,
        largura_pct REAL,
        altura_pct REAL
    )
');

$pdo->exec('
    CREATE TABLE IF NOT EXISTS fase_itens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fase_id INTEGER REFERENCES fases(id),
        at_progress_pct REAL,
        tipo TEXT,
        y REAL,
        valor INTEGER
    )
');

$colunasFases = $pdo->query("PRAGMA table_info(fases)")->fetchAll(PDO::FETCH_COLUMN, 1);
if (!in_array('chefe_id', $colunasFases, true)) {
    $pdo->exec('ALTER TABLE fases ADD COLUMN chefe_id TEXT REFERENCES chefes(id)');
}
if (!in_array('chefe_trigger_progress_pct', $colunasFases, true)) {
    $pdo->exec('ALTER TABLE fases ADD COLUMN chefe_trigger_progress_pct REAL');
}

echo "Migração concluída.\n";
