@echo off
echo ==========================================
echo CORRIGINDO BANCO DE DADOS THRONUS
echo ==========================================
echo.
echo 1. Instalando ferramenta Supabase CLI (pode demorar um pouco)...
call npm install -D supabase
echo.
echo 2. Aplicando correcoes de seguranca...
call npx supabase migration up
echo.
echo ==========================================
echo PROCESSO CONCLUIDO!
echo ==========================================
echo.
echo Por favor, recarregue a pagina no navegador e tente novamente.
echo.
pause
