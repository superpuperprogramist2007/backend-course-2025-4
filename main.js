// main.js - ВИПРАВЛЕНА ВЕРСІЯ (з парсингом JSON Lines)

const http = require('http');
const fs = require('fs').promises; // Використовуємо 'fs.promises'
const { program } = require('commander');
const url = require('url');
const { XMLBuilder } = require('fast-xml-parser');

// --- ЧАСТИНА 1: Налаштування Commander ---
program
  .requiredOption('-i, --input <type>', "шлях до файлу, який даємо для читання")
  .requiredOption('-h, --host <type>', "адреса сервера")
  .requiredOption('-p, --port <type>', "порт сервера");

program.parse(process.argv);
const options = program.opts();

const inputFile = options.input;
const host = options.host;
const port = options.port;

// --- ЧАСТИНА 1: Перевірка файлу (синхронна) ---
const fsSync = require('fs');
if (!fsSync.existsSync(inputFile)) {
  console.error('Cannot find input file');
  process.exit(1);
}

// --- ЧАСТИНА 2: Оптимізація ---
let flightsData = []; // Глобальна змінна

async function startServer() {
  
  // 1. ЗАВАНТАЖУЄМО ДАНІ ОДИН РАЗ (з логікою для JSONL)
  try {
    console.log(`Завантаження даних з ${inputFile}... Це може зайняти хвилину...`);
    const fileData = await fs.readFile(inputFile, 'utf-8');

    // === ПОЧАТОК ЗМІНЕНОЇ ЛОГІКИ ===
    // Файл 'flights-1m.json' - це, ймовірно, JSON Lines (jsonl),
    // де кожен рядок - це окремий JSON.
    
    const lines = fileData.split('\n'); // Ділимо файл на рядки
    flightsData = []; // Ініціалізуємо масив

    for (const line of lines) {
      if (line.trim() === '') {
        continue; // Пропускаємо порожні рядки (напр. в кінці файлу)
      }
      try {
        const jsonObject = JSON.parse(line); // Парсимо КОЖЕН рядок
        flightsData.push(jsonObject);
      } catch (parseError) {
        // Якщо якийсь рядок пошкоджений, ми його пропустимо
        console.warn(`Помилка парсингу рядка, рядок пропущено: ${parseError.message}`);
      }
    }
    // === КІНЕЦЬ ЗМІНЕНОЇ ЛОГІКИ ===

    if (flightsData.length === 0) {
      console.error('Дані не завантажено, файл може бути порожнім або повністю пошкодженим.');
      process.exit(1);
    }

    console.log(`Дані успішно завантажено. ${flightsData.length} записів.`);
  } catch (err) {
    console.error('Не вдалося завантажити файл даних:', err);
    process.exit(1);
  }

  // 2. СТВОРЮЄМО СЕРВЕР
  const server = http.createServer((req, res) => {
    console.log(`Обробка запиту: ${req.url}`);
    
    const parsedUrl = url.parse(req.url, true);
    const queryParams = parsedUrl.query;
    const showDate = queryParams.date === 'true';
    const minAirTime = parseFloat(queryParams.airtime_min);

    try {
      let filteredFlights = flightsData; 

      if (!isNaN(minAirTime)) {
        filteredFlights = filteredFlights.filter(flight => flight.AIR_TIME > minAirTime);
      }

      const xmlReadyData = filteredFlights.map(flight => {
        const flightRecord = {
          AIR_TIME: flight.AIR_TIME,
          DISTANCE: flight.DISTANCE,
        };
        if (showDate) {
          flightRecord.FL_DATE = flight.FL_DATE;
        }
        return flightRecord;
      });

      const builderOptions = { format: true, ignoreAttributes: false };
      const builder = new XMLBuilder(builderOptions);
      const xmlObject = { flights: { flight: xmlReadyData } };
      const xmlOutput = builder.build(xmlObject);

      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      res.end(xmlOutput);

    } catch (error) {
      console.error('Помилка обробки запиту:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Внутрішня помилка сервера');
    }
  });

  // 3. ЗАПУСКАЄМО СЕРВЕР
  server.listen(port, host, () => {
    console.log(`Сервер запущено та готовий до прийому запитів на http://${host}:${port}`);
  });
}

// Запускаємо головну функцію
startServer();