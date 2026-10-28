# Muestra IE2 (Equipo 5): levanta el entorno local con datos de prueba y abre Playwright UI y Cypress lado a lado.
# Entorno: PostgreSQL + backend en perfil demo (8091, recarga los datos de prueba al arrancar) + frontend (5173).
# Necesita uat\entorno.local.properties y uat\datos.json (no están en git; ver los archivos *.ejemplo.*).
# La primera vez también instala lo que falte: dependencias de npm, el programa de Cypress y la base de datos vacía.
$ErrorActionPreference = 'Stop'
$uat = $PSScriptRoot
$raiz = Split-Path $uat -Parent
$backend = Join-Path $raiz 'Backend\sistema-gestion-elsur'
$frontend = Join-Path $raiz 'frontend'

function Escucha($puerto) { [bool](Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue) }

function Esperar($nombre, $url) {
    Write-Host "Esperando $nombre..." -NoNewline
    for ($i = 0; $i -lt 300; $i++) {
        try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3 | Out-Null; Write-Host ' listo'; return } catch { Start-Sleep 2; Write-Host '.' -NoNewline }
    }
    throw "$nombre no arrancó. Cerrá todas las ventanas negras y volvé a abrir INICIAR_MUESTRA.cmd."
}

function Falta($programa, $donde) {
    if (-not (Get-Command $programa -ErrorAction SilentlyContinue)) { throw "No está instalado $donde (o hay que reiniciar la PC después de instalarlo)." }
}

Falta 'node' 'Node.js'
Falta 'java' 'Java'
foreach ($archivo in 'entorno.local.properties', 'datos.json') {
    if (-not (Test-Path (Join-Path $uat $archivo))) { throw "Falta el archivo uat\$archivo. Pedíselo a Lucas y pegalo en la carpeta uat." }
}

$cfg = @{}
Get-Content (Join-Path $uat 'entorno.local.properties') -Encoding UTF8 | ForEach-Object { $_.TrimStart([char]0xFEFF) } |
    Where-Object { $_ -match '^[^#].*=' } | ForEach-Object { $k, $v = $_ -split '=', 2; $cfg[$k.Trim()] = $v.Trim() }
$datos = Get-Content (Join-Path $uat 'datos.json') -Raw -Encoding UTF8 | ConvertFrom-Json

# Primera vez: dependencias y programa de Cypress.
foreach ($carpeta in $frontend, $uat) {
    if (-not (Test-Path (Join-Path $carpeta 'node_modules'))) {
        Write-Host "Primera vez: instalando dependencias en $(Split-Path $carpeta -Leaf) (tarda unos minutos)..."
        Push-Location $carpeta; npm install --no-audit --no-fund; Pop-Location
    }
}
# Los programas externos escriben avisos en stderr; que eso no corte el script.
$ErrorActionPreference = 'Continue'
Write-Host 'Revisando Cypress...'
Push-Location $uat
npx cypress verify *> $null
if ($LASTEXITCODE -ne 0) { Write-Host 'Primera vez: instalando Cypress (baja unos 200 MB)...'; npx cypress install }
Pop-Location

# PostgreSQL portátil: solo si se configuró pg.data (si Postgres corre como servicio de Windows, dejarlo vacío).
if ($cfg['pg.data'] -and -not (Escucha $cfg['pg.puerto'])) {
    Write-Host "Iniciando PostgreSQL ($($cfg['pg.puerto']))..."
    # En su propia ventana oculta: así un Ctrl+C o cerrar esta ventana no corta la base a la mitad.
    $pgArgs = "-D `"$($cfg['pg.data'])`" -o `"-p $($cfg['pg.puerto'])`" -l `"$(Join-Path $cfg['pg.data'] '..\postgres.log')`" -w start"
    Start-Process -FilePath (Join-Path $cfg['pg.bin'] 'pg_ctl.exe') -ArgumentList $pgArgs -WindowStyle Hidden
    for ($i = 0; $i -lt 30 -and -not (Escucha $cfg['pg.puerto'])) { Start-Sleep 1 }
}
if (-not (Escucha $cfg['pg.puerto'])) { throw "PostgreSQL no está andando en el puerto $($cfg['pg.puerto']). Reiniciá la PC o revisá que esté instalado." }

# Primera vez: base de datos vacía (las tablas y los datos los carga el backend al arrancar).
Write-Host 'Revisando la base de datos...'
if ($cfg['db.url'] -match '//[^:/]+:(\d+)/([^?]+)') {
    $env:PGPASSWORD = $cfg['db.password']
    $env:PGCONNECT_TIMEOUT = '10'
    $psql = Join-Path $cfg['pg.bin'] 'psql.exe'
    # -w: nunca pedir la contraseña por teclado (si falta, falla en vez de quedarse esperando).
    # Recién arrancada (o recuperándose de un corte), la base rechaza conexiones unos segundos: reintentar antes de rendirse.
    for ($intento = 1; $intento -le 6; $intento++) {
        $existe = & $psql -w -h localhost -p $Matches[1] -U $cfg['db.usuario'] -d postgres -tAc "select 1 from pg_database where datname = '$($Matches[2])'" 2>&1 | Out-String
        if ($LASTEXITCODE -eq 0 -or $existe -match 'password|contrase') { break }
        Start-Sleep 5
    }
    if ($LASTEXITCODE -ne 0) {
        if ($existe -match 'password|contrase') { throw 'No se pudo entrar a PostgreSQL: revisá la contraseña (db.password) en uat\entorno.local.properties.' }
        throw 'PostgreSQL no responde. Reiniciá la PC y volvé a abrir INICIAR_MUESTRA.'
    }
    if (-not $existe.Trim()) {
        Write-Host "Primera vez: creando la base $($Matches[2])..."
        & $psql -w -h localhost -p $Matches[1] -U $cfg['db.usuario'] -d postgres -c "create database $($Matches[2])" | Out-Null
    }
}
$ErrorActionPreference = 'Stop'

if (-not (Escucha 8091)) {
    Write-Host 'Iniciando backend en perfil demo (8091; la primera vez baja dependencias y tarda varios minutos)...'
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
