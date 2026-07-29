<?php
// Helper de geração de imagem via API do Gemini (gemini-3.1-flash-image).
// Uso via CLI: php tools/gemini-image.php "prompt aqui" caminho/saida.png
// Também pode ser incluído por outros scripts (ver gerar-naves.php) via require + chamarGeminiImagem().

function carregarEnvLocal(string $caminho): array
{
    $variaveis = [];
    if (!file_exists($caminho)) return $variaveis;
    foreach (file($caminho, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linha) {
        $linha = trim($linha);
        if ($linha === '' || str_starts_with($linha, '#') || !str_contains($linha, '=')) continue;
        [$chave, $valor] = explode('=', $linha, 2);
        $variaveis[trim($chave)] = trim($valor);
    }
    return $variaveis;
}

function chamarGeminiImagem(string $prompt, string $apiKey, string $modelo = 'gemini-3.1-flash-image'): array
{
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelo}:generateContent";
    $corpo = [
        'contents' => [
            ['parts' => [['text' => $prompt]]],
        ],
        'generationConfig' => [
            'responseModalities' => ['TEXT', 'IMAGE'],
        ],
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "x-goog-api-key: {$apiKey}",
        ],
        CURLOPT_POSTFIELDS => json_encode($corpo),
        CURLOPT_TIMEOUT => 60,
    ]);
    $respostaBruta = curl_exec($ch);
    $statusHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $erroCurl = curl_error($ch);
    curl_close($ch);

    if ($erroCurl) {
        return ['ok' => false, 'erro' => "Erro de rede: $erroCurl"];
    }
    if ($statusHttp !== 200) {
        return ['ok' => false, 'erro' => "HTTP $statusHttp", 'corpo' => $respostaBruta];
    }

    $json = json_decode($respostaBruta, true);
    $partes = $json['candidates'][0]['content']['parts'] ?? [];
    foreach ($partes as $parte) {
        if (isset($parte['inlineData']['data'])) {
            return [
                'ok' => true,
                'bytes' => base64_decode($parte['inlineData']['data']),
                'mimeType' => $parte['inlineData']['mimeType'] ?? 'image/png',
            ];
        }
    }
    return ['ok' => false, 'erro' => 'Nenhuma imagem retornada na resposta', 'corpo' => $respostaBruta];
}

// --- CLI ---------------------------------------------------------------

if (php_sapi_name() === 'cli' && realpath($argv[0]) === realpath(__FILE__)) {
    $prompt = $argv[1] ?? null;
    $saida = $argv[2] ?? null;
    if (!$prompt || !$saida) {
        fwrite(STDERR, "Uso: php tools/gemini-image.php \"prompt\" caminho/saida.png\n");
        exit(1);
    }

    $env = carregarEnvLocal(__DIR__ . '/../.env.local');
    $apiKey = $env['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY');
    if (!$apiKey) {
        fwrite(STDERR, "GEMINI_API_KEY não encontrada em .env.local\n");
        exit(1);
    }

    echo "Chamando Gemini...\n";
    $resultado = chamarGeminiImagem($prompt, $apiKey);
    if (!$resultado['ok']) {
        fwrite(STDERR, "Falhou: {$resultado['erro']}\n");
        if (isset($resultado['corpo'])) fwrite(STDERR, substr($resultado['corpo'], 0, 2000) . "\n");
        exit(1);
    }

    file_put_contents($saida, $resultado['bytes']);
    echo "Imagem salva em: $saida (" . strlen($resultado['bytes']) . " bytes, {$resultado['mimeType']})\n";
}
