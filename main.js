// main.js - Початок

const http = require('http');
const fs = require('fs'); // Використаємо 'fs.promises' для async в Частині 2
const { program } = require('commander');
const url = require('url'); // Потрібен для Частини 2
const { XMLBuilder } = require('fast-xml-parser'); // Потрібен для Частини 2

// --- ЧАСТИНА 1: Налаштування Commander ---

program
  .requiredOption('-i, --input <type>', "шлях до файлу, який даємо для читання") [cite: 37]
  .requiredOption('-h, --host <type>', "адреса сервера") [cite: 38]
  .requiredOption('-p, --port <type>', "порт сервера"); [cite: 39]

program.parse(process.argv);
const options = program.opts();

const inputFile = options.input;
const host = options.host;
const port = options.port;

// --- ЧАСТИНА 1: Перевірка файлу ---

if (!fs.existsSync(inputFile)) {
  console.error('Cannot find input file'); [cite: 40]
  process.exit(1);
}

// --- ЧАСТИНА 1: Створення HTTP-сервера ---

const server = http.createServer(async (req, res) => {
  // Ця функція буде розширена в Кроці 4 (Частина 2)
  console.log(`Обробка запиту: ${req.url}`);
  
  // ======================================================
  // ЛОГІКА ДЛЯ ЧАСТИНИ 2 (Варіант 2) БУДЕ ТУТ
  // ======================================================

  // Тимчасова відповідь для перевірки Частини 1
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Сервер працює. Файл ${inputFile} знайдено.`);

});

// --- ЧАСТИНА 1: Запуск сервера ---

server.listen(port, host, () => {
  console.log(`Сервер запущено на http://${host}:${port}`); [cite: 42]
});

// main.js - Кінець