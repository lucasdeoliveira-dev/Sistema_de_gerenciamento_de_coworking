$raiz = Split-Path $PSScriptRoot -Parent
$url = 'http://sgec.localhost'
$linha = Get-Content (Join-Path $raiz '.env') -ErrorAction SilentlyContinue | Select-String '^SGEC_URL='
if ($linha) { $url = ($linha.Line -split '=', 2)[1].Trim() }
$API = "$url/api"

function Chamar($metodo, $rota, $pote, $corpo) {
  try {
    $p = @{ Method = $metodo; Uri = "$API$rota" }
    if ($pote) { $p.WebSession = $pote }
    if ($null -ne $corpo) { $p.Body = ($corpo | ConvertTo-Json); $p.ContentType = 'application/json' }
    $r = Invoke-RestMethod @p
    if (-not $r) { "$metodo $rota -> OK (sem corpo)" } else { $r | ConvertTo-Json -Depth 4 }
  } catch {
    if ($_.ErrorDetails.Message) { "$metodo $rota -> $($_.ErrorDetails.Message)" } else { "ERRO: $($_.Exception.Message)" }
  }
}

function Entrar($email) {
  $segura = Read-Host "Senha de $email" -AsSecureString
  $senha = [System.Net.NetworkCredential]::new('', $segura).Password
  $corpo = @{ email = $email; senha = $senha } | ConvertTo-Json
  try {
    Invoke-RestMethod -Method Post -Uri "$API/auth/login" -Body $corpo -ContentType 'application/json' -SessionVariable pote | Out-Null
    Write-Host "Entrou como $email" -ForegroundColor Green
    $pote
  } catch {
    Write-Host "Falha no login: $($_.ErrorDetails.Message)" -ForegroundColor Red
  }
}

Write-Host "Funções Chamar e Entrar carregadas para $API" -ForegroundColor Green
