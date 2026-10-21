@echo off
REM Levanta el backend de GestaPro para la demo de API (Postman): base H2 en memoria del perfil de test
REM + usuario de prueba admin.api / ApiTest2026. No se conecta a Supabase ni a ninguna base real.
REM Queda escuchando en http://localhost:8080 hasta cerrar esta ventana (Ctrl+C).
set "BACKEND=%~dp0..\..\Backend\sistema-gestion-elsur"
pushd "%BACKEND%"
call "%BACKEND%\mvnw.cmd" spring-boot:test-run "-Dspring-boot.run.arguments=--spring.config.location=file:src/test/resources/application.properties --spring.profiles.active=test,api --server.port=8080"
popd
