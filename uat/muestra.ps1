# Muestra IE2 (Equipo 5): levanta el entorno local con datos de prueba y abre Playwright UI y Cypress lado a lado.
# Entorno: PostgreSQL + backend en perfil demo (8091, recarga los datos de prueba al arrancar) + frontend (5173).
# Necesita uat\entorno.local.properties y uat\datos.json (no están en git; ver los archivos *.ejemplo.*).
$ErrorActionPreference = 'Stop'
$uat = $PSScriptRoot
$raiz = Split-Path $uat -Parent
$backend = Join-Path $raiz 'Backend\sistema-gestion-elsur'
$frontend = Join-Path $raiz 'frontend'

function Escucha($puerto) { [bool](Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue) }

function Esperar($nombre, $url) {
    Write-Host "Esperando $nombre..." -NoNewline
    for ($i = 0; $i -lt 120; $i++) {
        try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3 | Out-Null; Write-Host ' listo'; return } catch { Start-Sleep 2; Write-Host '.' -NoNewline }
    }
    throw "$nombre no respondió en $url"
}

foreach ($archivo in 'entorno.local.properties', 'datos.json') {
    if (-not (Test-Path (Join-Path $uat $archivo))) { throw "Falta uat\$archivo. Copiá el archivo de ejemplo y completalo." }
}

$cfg = @{}
Get-Content (Join-Path $uat 'entorno.local.properties') -Encoding UTF8 | ForEach-Object { $_.TrimStart([char]0xFEFF) } |
    Where-Object { $_ -match '^[^#].*=' } | ForEach-Object { $k, $v = $_ -split '=', 2; $cfg[$k.Trim()] = $v.Trim() }
$datos = Get-Content (Join-Path $uat 'datos.json') -Raw -Encoding UTF8 | ConvertFrom-Json

# PostgreSQL portátil: solo si se configuró pg.data (si Postgres corre como servicio de Windows, dejarlo vacío).
if ($cfg['pg.data'] -and -not (Escucha $cfg['pg.puerto'])) {
    Write-Host "Iniciando PostgreSQL ($($cfg['pg.puerto']))..."
    & (Join-Path $cfg['pg.bin'] 'pg_ctl.exe') -D $cfg['pg.data'] -o "-p $($cfg['pg.puerto'])" -l (Join-Path $cfg['pg.data'] '..\postgres.log') start | Out-Null
}

if (-not (Escucha 8091)) {
    Write-Host 'Iniciando backend en perfil demo (8091)...'
    $env:SPRING_PROFILES_ACTIVE = 'demo'
    $env:DB_URL = $cfg['db.url']
    $env:DB_USERNAME = $cfg['db.usuario']
    $env:DB_PASSWORD = $cfg['db.password']
    $env:CRYPTO_SECRET = $cfg['crypto.secret']
    $env:JWT_SECRET = [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
    $env:CLAVE_ACCESO = $datos.clavePorton
    $env:SUPABASE_URL = 'http://localhost:9'
    $env:SUPABASE_SERVICE_ROLE_KEY = 'sin-uso'
    $env:PORT = '8091'
    $env:CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
    Start-Process -FilePath (Join-Path $backend 'mvnw.cmd') -ArgumentList '-q', 'spring-boot:run' -WorkingDirectory $backend -WindowStyle Minimized
}

if (-not (Escucha 5173)) {
    Write-Host 'Iniciando frontend (5173)...'
    $env:VITE_API_URL = 'http://localhost:8091/api'
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npx vite --port 5173 --strictPort' -WorkingDirectory $frontend -WindowStyle Minimized
}

Esperar 'backend' 'http://localhost:8091/actuator/health'
Esperar 'frontend' 'http://localhost:5173'

# Los dos runners. Acomodarlos con Win+Izquierda (Playwright) y Win+Derecha (Cypress).
$env:ELECTRON_EXTRA_LAUNCH_ARGS = '--in-process-gpu'
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npx playwright test --ui' -WorkingDirectory $uat -WindowStyle Minimized
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npx cypress open --e2e --browser chrome' -WorkingDirectory $uat -WindowStyle Minimized

Write-Host ''
Write-Host 'Listo. Playwright UI a la izquierda (Win+Izquierda), Cypress a la derecha (Win+Derecha).'
Write-Host 'Reportes HTML despues de correr: npm run pw:reporte  |  reportes\cypress\index.html'
