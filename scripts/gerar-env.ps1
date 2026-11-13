$ErrorActionPreference = 'Stop'

$raiz = Split-Path $PSScriptRoot -Parent
$modelo = Join-Path $raiz '.env.example'
$destino = Join-Path $raiz '.env'

if (Test-Path $destino) {
  Write-Host 'O arquivo .env já existe. Nada foi alterado.' -ForegroundColor Yellow
  exit 1
}

$caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
$gerador = [System.Security.Cryptography.RandomNumberGenerator]::Create()

function NovaSenha([int]$tamanho) {
  do {
    $bytes = New-Object byte[] $tamanho
    $gerador.GetBytes($bytes)
    $senha = -join ($bytes | ForEach-Object { $caracteres[$_ % $caracteres.Length] })
  } until ($senha -cmatch '[A-Za-z]' -and $senha -match '[0-9]')
  $senha
}

$senhas = @{
  DB_SUPERUSER_PASSWORD = NovaSenha 24
  DB_OWNER_PASSWORD     = NovaSenha 24
  DB_APP_PASSWORD       = NovaSenha 24
  DB_LEITURA_PASSWORD   = NovaSenha 24
  ADMIN_SENHA           = NovaSenha 16
}

$linhas = Get-Content $modelo | ForEach-Object {
  $chave = ($_ -split '=', 2)[0]
  if ($senhas.ContainsKey($chave)) { "$chave=$($senhas[$chave])" } else { $_ }
}

$utf8SemBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($destino, (($linhas -join "`n") + "`n"), $utf8SemBom)

$email = (($linhas | Select-String '^ADMIN_EMAIL=').Line -split '=', 2)[1]

Write-Host '.env criado com senhas aleatórias.' -ForegroundColor Green
Write-Host "Administrador: $email"
Write-Host "Senha:         $($senhas.ADMIN_SENHA)"
Write-Host 'A senha também fica salva no .env (ADMIN_SENHA).'
