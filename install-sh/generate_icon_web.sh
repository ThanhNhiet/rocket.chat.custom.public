#!/bin/bash

# ==========================================
# PHẦN 1: KIEM TRA VA CAI DAT
# ==========================================

# Kiem tra xem lenh 'magick' hoac 'convert' da co chua
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "[!] ImageMagick chua duoc cai dat."
    echo "[*] Dang tien hanh cai dat tu dong..."
    
    # Cap nhat va cai dat (THEM potrace de ho tro xu ly vector)
    sudo apt-get update
    sudo apt-get install -y imagemagick inkscape potrace

    echo "[v] Da cai dat xong."
else
    # Kiem tra xem potrace da co chua, neu chua thi cai them
    if ! command -v potrace &> /dev/null; then
        echo "[!] Thieu thu vien xu ly vector (potrace)."
        echo "[*] Dang cai dat them potrace..."
        sudo apt-get install -y potrace
    fi
    echo "[v] Moi truong da san sang."
fi

# Map lenh convert sang magick neu can
if ! command -v magick &> /dev/null; then
    if command -v convert &> /dev/null; then
        function magick() {
            convert "$@"
        }
    else
        echo "[x] Loi: Khong tim thay ImageMagick."
        exit 1
    fi
fi

# ==========================================
# PHẦN 2: CAU HINH VA XU LY ANH
# ==========================================

# --- CAU HINH ---
SOURCE="sgt_logo.png"
SOURCE_FULL="sgt_logo_full.png"
# File SVG goc (chat luong cao nhat)
SOURCE_SVG="sgt_logo.svg"
SOURCE_FULL_SVG="sgt_logo_full.svg"

# Tao thu muc logo
mkdir -p logo

echo "Dang xu ly hinh anh..."

# --- 1. XU LY PNG (Tu file PNG goc) ---
magick "$SOURCE" -resize 1024x1024 logo/1024x1024.png

magick "$SOURCE" -resize 192x192 logo/android-chrome-192x192.png
magick "$SOURCE" -resize 512x512 logo/android-chrome-512x512.png

magick "$SOURCE" -resize 180x180 logo/apple-touch-icon-precomposed.png
magick "$SOURCE" -resize 180x180 logo/apple-touch-icon.png

magick "$SOURCE" -resize 16x16 logo/favicon-16x16.png
magick "$SOURCE" -resize 32x32 logo/favicon-32x32.png

magick "$SOURCE_FULL" -resize 1000x169 logo/logo_dark.png
magick "$SOURCE_FULL" -resize 1000x169 logo/logo.png

# Mstiles (Colorize White)
magick "$SOURCE" -fill white -colorize 100% -resize 70x70 logo/mstile-70x70.png
magick "$SOURCE" -fill white -colorize 100% -resize 144x144 logo/mstile-144x144.png
magick "$SOURCE" -fill white -colorize 100% -resize 150x150 logo/mstile-150x150.png
magick "$SOURCE" -fill white -colorize 100% -resize 310x150 logo/mstile-310x150.png
magick "$SOURCE" -fill white -colorize 100% -resize 310x310 logo/mstile-310x310.png


# --- 2. XU LY SVG (Dung lenh CP de giu nguyen chat luong vector) ---
# Thay vi convert tu PNG (bi vo hat), ta copy tu file SVG goc
echo "Dang xu ly vector..."

if [ -f "$SOURCE_SVG" ]; then
    cp "$SOURCE_SVG" logo/icon.svg
    # Safari Pinned Tab thuong can icon don sac (monochrome)
    # Neu file SVG cua ban da don gian, copy luon la tot nhat.
    # Neu can xu ly phuc tap, potrace se duoc dung o duoi (fallback).
    cp "$SOURCE_SVG" logo/safari-pinned-tab.svg 
else
    echo "[!] Canh bao: Khong tim thay $SOURCE_SVG. Bo qua tao icon.svg"
fi

if [ -f "$SOURCE_FULL_SVG" ]; then
    cp "$SOURCE_FULL_SVG" logo/logo_dark.svg
    cp "$SOURCE_FULL_SVG" logo/logo.svg
else
    echo "[!] Canh bao: Khong tim thay $SOURCE_FULL_SVG. Bo qua tao logo.svg"
fi

echo "Xong! Kiem tra thu muc logo."
read -p "Nhan Enter de thoat..."