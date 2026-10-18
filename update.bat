@echo off
echo ==============================================
echo [MANTAUMAGANG] Memulai Pembaruan Otomatis...
echo ==============================================
echo [1/4] Menarik kode terbaru dari GitHub...
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal melakukan git pull. Periksa koneksi internet atau konflik git.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/4] Memeriksa dan memperbarui dependensi...
call npm install

echo [3/4] Melakukan kompilasi build produksi Next.js...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Kompilasi build gagal.
    pause
    exit /b %ERRORLEVEL%
)

echo [4/4] Memperbarui dan merestart proses PM2...
call pm2 restart mantaumagang
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Menjalankan start PM2 baru...
    call pm2 start npm --name "mantaumagang" -- start
)

echo ==============================================
echo [SUKSES] Aplikasi MANTAUMAGANG Berhasil Diperbarui!
echo Akses Web: https://magang.stimiapps.my.id
echo ==============================================
pause
