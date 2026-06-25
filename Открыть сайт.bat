@echo off
chcp 65001 >nul
title ЗАРЕЧЬЕ — демо
cd /d "%~dp0"

rem Пытаемся запустить локальный сервер на Python (лучший вариант), иначе открываем файл напрямую.
where py >nul 2>&1 && (
  echo Запуск локального сервера на http://localhost:5173 ...
  start "" http://localhost:5173/index.html
  py -m http.server 5173
  goto :eof
)
where python >nul 2>&1 && (
  echo Запуск локального сервера на http://localhost:5173 ...
  start "" http://localhost:5173/index.html
  python -m http.server 5173
  goto :eof
)

echo Python не найден — открываю сайт напрямую в браузере.
start "" "index.html"
