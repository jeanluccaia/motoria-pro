# set-admin-passwords.ps1
# Wrapper PowerShell nativo para definir/alterar senhas dos admins do
# Loud Flow no Windows. Usa Read-Host -AsSecureString (mascaramento
# nativo do Windows, comprovadamente com * e sem depender do stdin de
# npm/Node).
#
# Arquivo escrito em ASCII puro de proposito -- Windows PowerShell 5.1
# le .ps1 sem BOM como Windows-1252, e caracteres UTF-8 quebram o
# parser (aspas fantasmas dentro de comentarios acentuados).
#
# Modos:
#   * padrao (individual): pede uma senha por admin e aplica.
#   * -Single: pede UMA senha e aplica a todos os admins exceto os do
#     LF_SKIP_EMAILS (default: jean.lucca@icloud.com). Use quando
#     quiser alinhar as senhas de N admins com a de uma conta de
#     referencia ja cadastrada, sem tocar nela.
#
# Uso:
#   cd loudflow
#   powershell -NoProfile -ExecutionPolicy Bypass -File supabase\seed\set-admin-passwords.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File supabase\seed\set-admin-passwords.ps1 -Single
# (ou npm run admin:passwords:pwsh / admin:passwords:pwsh:single)
#
# Em ambos os casos:
#   1. Carrega variaveis de .env.local (SUPABASE_URL, SERVICE_ROLE_KEY)
#   2. Descobre a lista de admins via list_admins.mjs
#   3. Pede a(s) senha(s) com * nativo
#   4. Pipeia JSON para o script Node em modo --stdin
#   5. Apaga o arquivo temporario e limpa as variaveis sensiveis

param(
    [switch] $Single
)

$ErrorActionPreference = "Stop"

$MinPasswordLength = 10
$DefaultSkipEmails = @("jean.lucca@icloud.com")

# ---- resolve dirs -------------------------------------------------

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent (Split-Path -Parent $scriptDir)
Set-Location -Path $projectDir

# ---- carrega .env.local ------------------------------------------

$envFile = Join-Path $projectDir ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Error "Nao encontrei $envFile. Crie a partir de .env.example."
    exit 1
}
Get-Content -Path $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0) { return }
    if ($line.StartsWith("#")) { return }
    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { return }
    $name = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    if ($value.Length -ge 2) {
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
    }
    Set-Item -Path "env:$name" -Value $value
}

if (-not $env:NEXT_PUBLIC_SUPABASE_URL) {
    Write-Error "NEXT_PUBLIC_SUPABASE_URL ausente em .env.local."
    exit 1
}
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Error "SUPABASE_SERVICE_ROLE_KEY ausente em .env.local."
    exit 1
}

# ---- helper: SecureString -> String (temporario) ------------------

function ConvertFrom-SecureStringToPlain {
    param([Security.SecureString] $Secure)
    if ($null -eq $Secure) { return "" }
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

# ---- descobre admins ----------------------------------------------

if ($Single) {
    # -Single: alinhar a senha de N contas da mesma org, qualquer papel.
    # Discovery via list_org_members (nao filtra por role='admin').
    Write-Host "Consultando membros da organizacao..."
    $listScript = "supabase/seed/list_org_members.mjs"
} else {
    # modo individual: mesma abordagem historica, so admins.
    Write-Host "Consultando admins da rede..."
    $listScript = "supabase/seed/list_admins.mjs"
}
$listOutput = node --env-file=.env.local $listScript
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao listar usuarios."
    exit 1
}
$emails = @()
if ($listOutput) {
    $emails = @($listOutput -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 })
}
if ($emails.Count -eq 0 -or ($emails.Count -eq 1 -and $emails[0].Length -eq 0)) {
    Write-Error "Nenhum admin encontrado no projeto."
    exit 1
}

# ---- prompt individual --------------------------------------------

Write-Host ""
$pairs = @{}
$skipped = @()

if ($Single) {
    # ---- modo -Single: uma senha para varios admins -------------

    # Skip list: env LF_SKIP_EMAILS ou default (jean.lucca@icloud.com)
    $skipSource = if ($env:LF_SKIP_EMAILS) { $env:LF_SKIP_EMAILS } else { ($DefaultSkipEmails -join ",") }
    $skipList = @($skipSource.ToLower() -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 0 })

    $targets = @($emails | Where-Object { $skipList -notcontains $_.ToLower() })
    $skipped = @($emails | Where-Object { $skipList -contains $_.ToLower() })

    if ($targets.Count -eq 0) {
        Write-Error "Nenhum admin restante depois de aplicar LF_SKIP_EMAILS. Skip: $($skipList -join ', ')"
        exit 1
    }

    Write-Host ""
    Write-Host "Modo -Single: UMA senha para $($targets.Count) admin(s)."
    Write-Host "Cada tecla aparece como * (mascaramento nativo do PowerShell)."
    Write-Host "Minimo $MinPasswordLength caracteres. Confirmacao obrigatoria."
    Write-Host "Ctrl+C aborta o script sem aplicar nada."
    Write-Host ""
    Write-Host "Serao atualizados:"
    foreach ($e in $targets) { Write-Host "  $e" }
    if ($skipped.Count -gt 0) {
        Write-Host ""
        Write-Host "Preservados (LF_SKIP_EMAILS):"
        foreach ($e in $skipped) { Write-Host "  $e" }
    }
    Write-Host ""

    $accepted = $false
    $attempts = 0
    $singlePlain = ""
    while (-not $accepted -and $attempts -lt 3) {
        $attempts += 1
        $sec1 = Read-Host -Prompt "senha   " -AsSecureString
        $plain1 = ConvertFrom-SecureStringToPlain -Secure $sec1
        if ([string]::IsNullOrEmpty($plain1)) {
            Write-Host "senha em branco -- abortando sem aplicar nada."
            exit 0
        }
        if ($plain1.Length -lt $MinPasswordLength) {
            Write-Host "senha muito curta (minimo $MinPasswordLength). Tente de novo."
            continue
        }
        $sec2 = Read-Host -Prompt "confirme" -AsSecureString
        $plain2 = ConvertFrom-SecureStringToPlain -Secure $sec2
        if ($plain1 -ne $plain2) {
            Write-Host "as senhas nao conferem. Tente de novo."
            continue
        }
        $singlePlain = $plain1
        $accepted = $true
    }
    if (-not $accepted) {
        Write-Error "Desisti depois de 3 tentativas. Nada foi aplicado."
        exit 1
    }

    foreach ($email in $targets) { $pairs[$email] = $singlePlain }

} else {
    # ---- modo individual: uma senha por admin -------------------
    Write-Host "Vou pedir a senha de $($emails.Count) admin(s)."
    Write-Host "Cada tecla aparece como * (mascaramento nativo do PowerShell)."
    Write-Host "Minimo $MinPasswordLength caracteres. Confirmacao obrigatoria."
    Write-Host "Enter em branco pula o admin. Ctrl+C aborta o script."
    Write-Host ""

    foreach ($email in $emails) {
        Write-Host $email
        $accepted = $false
        $attempts = 0
        while (-not $accepted -and $attempts -lt 3) {
            $attempts += 1
            $sec1 = Read-Host -Prompt "  senha   " -AsSecureString
            $plain1 = ConvertFrom-SecureStringToPlain -Secure $sec1
            if ([string]::IsNullOrEmpty($plain1)) {
                Write-Host "  pulado (senha em branco)."
                $skipped += $email
                break
            }
            if ($plain1.Length -lt $MinPasswordLength) {
                Write-Host "  senha muito curta (minimo $MinPasswordLength). Tente de novo."
                continue
            }
            $sec2 = Read-Host -Prompt "  confirme" -AsSecureString
            $plain2 = ConvertFrom-SecureStringToPlain -Secure $sec2
            if ($plain1 -ne $plain2) {
                Write-Host "  as senhas nao conferem. Tente de novo."
                continue
            }
            $pairs[$email] = $plain1
            $accepted = $true
            Write-Host "  aceita."
        }
        if (-not $accepted -and $attempts -ge 3 -and -not ($skipped -contains $email)) {
            Write-Host "  desisti depois de 3 tentativas. Pulado."
            $skipped += $email
        }
        Write-Host ""
    }
}

if ($pairs.Count -eq 0) {
    Write-Host "Nenhuma senha fornecida. Nada foi alterado."
    exit 0
}

# ---- monta JSON e pipeia para o script Node --stdin ---------------

$tmp = [System.IO.Path]::GetTempFileName()
$rc = 1
try {
    # Restringe permissoes: so o usuario atual le/escreve.
    $acl = Get-Acl $tmp
    $acl.SetAccessRuleProtection($true, $false)
    $ruleArgs = @(
        [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
        "FullControl",
        "Allow"
    )
    $rule = New-Object -TypeName System.Security.AccessControl.FileSystemAccessRule -ArgumentList $ruleArgs
    $acl.SetAccessRule($rule)
    Set-Acl -Path $tmp -AclObject $acl

    $json = $pairs | ConvertTo-Json -Compress
    Set-Content -Path $tmp -Value $json -Encoding utf8 -NoNewline

    Write-Host "Aplicando via Supabase (service_role)..."
    Write-Host ""
    Get-Content -Path $tmp -Raw | node --env-file=.env.local supabase/seed/set_admin_passwords.mjs --stdin
    $rc = $LASTEXITCODE
}
finally {
    # Sobrescreve o arquivo temp antes de apagar (best-effort).
    try {
        if (Test-Path $tmp) {
            $len = (Get-Item $tmp).Length
            if ($len -gt 0) {
                $zeros = [byte[]]::new($len)
                [System.IO.File]::WriteAllBytes($tmp, $zeros)
            }
            Remove-Item -Path $tmp -Force
        }
    } catch {
        Write-Warning "Falha ao apagar arquivo temporario $tmp -- apague manualmente."
    }
    Remove-Variable -Name pairs, json, plain1, plain2, sec1, sec2, singlePlain -ErrorAction SilentlyContinue
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

if ($skipped.Count -gt 0) {
    Write-Host ""
    Write-Host "Pulados (nenhuma senha aplicada):"
    foreach ($e in $skipped) {
        Write-Host "  $e"
    }
}

exit $rc
