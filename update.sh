#!/bin/bash
set -e

echo "=============================================="
echo "[MANTAUMAGANG] Memulai Pembaruan Otomatis..."
echo "=============================================="

echo "[1/4] Menarik kode terbaru dari GitHub..."
git pull origin main

echo "[2/4] Memeriksa dan memperbarui dependensi..."
npm install

echo "[3/4] Melakukan kompilasi build produksi Next.js..."
npm run build

echo "[4/4] Memperbarui dan merestart proses PM2..."
pm2 restart mantaumagang || pm2 start npm --name "mantaumagang" -- start

echo "=============================================="
echo "[SUKSES] Aplikasi MANTAUMAGANG Berhasil Diperbarui!"
echo "Akses Web: https://magang.stimiapps.my.id"
echo "=============================================="
