

const http = require('http');
const fs = require('fs'); // Використаємо 'fs.promises' для async в Частині 2
const { program } = require('commander');
const url = require('url'); // Потрібен для Частини 2
const { XMLBuilder } = require('fast-xml-parser'); // Потрібен для Частини 2



program
  .requiredOption('-i, --input <type>', "шлях до файлу, який даємо для читання") 
  .requiredOption('-h, --host <type>', "адреса сервера") 
  .requiredOption('-p, --port <type>', "порт сервера"); 

program.parse(process.argv);
const options = program.opts();

const inputFile = options.input;
const host = options.host;
const port = options.port;

// --- ЧАСТИНА 1: Перевірка файлу ---

if (!fs.existsSync(inputFile)) {
  console.error('Cannot find input file'); 
  process.exit(1);
}

// --- ЧАСТИНА 1: Створення HTTP-сервера ---

const server = http.createServer(async (req, res) => {
  
  console.log(`Обробка запиту: ${req.url}`);
  
 

const server = http.createServer(async (req, res) => {
  console.log(`Обробка запиту: ${req.url}`);
  
  

  // 1. Отримуємо параметри URL
  const parsedUrl = url.parse(req.url, true);
  const queryParams = parsedUrl.query;

  const showDate = queryParams.date === 'true'; // ?date=true [cite: 80]
  const minAirTime = parseFloat(queryParams.airtime_min); // ?airtime_min=X [cite: 81]

  try {
    // 2. Асинхронно читаємо JSON файл [cite: 48, 52]
    const fileData = await fs.promises.readFile(inputFile, 'utf-8');
    const flightsData = JSON.parse(fileData);

    // 3. Фільтруємо дані
    let filteredFlights = flightsData;

    // Фільтр ?airtime_min=X [cite: 81]
    if (!isNaN(minAirTime)) {
      filteredFlights = filteredFlights.filter(flight => flight.AIR_TIME > minAirTime);
    }

    // 4. Форматуємо дані для XML
    const xmlReadyData = filteredFlights.map(flight => {
      const flightRecord = {
        // Вихідні поля: AIR_TIME, DISTANCE 
        AIR_TIME: flight.AIR_TIME,
        DISTANCE: flight.DISTANCE,
      };

      // Додаємо дату, якщо ?date=true [cite: 80, 82]
      if (showDate) {
        flightRecord.FL_DATE = flight.FL_DATE;
      }
      
      return flightRecord;
    });

    // 5. Створюємо XML за допомогою fast-xml-parser 
    const builderOptions = {
      format: true, // Для красивого виводу
      ignoreAttributes: false,
    };
    const builder = new XMLBuilder(builderOptions);
    
    // Структура XML: <flights><flight>...</flight></flights> [cite: 83, 84]
    const xmlObject = {
      flights: {
        flight: xmlReadyData
      }
    };
    const xmlOutput = builder.build(xmlObject);

    // 6. Надсилаємо відповідь XML [cite: 54]
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xmlOutput);

  } catch (error) {
    console.error('Помилка обробки запиту:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Внутрішня помилка сервера');
  }
});


  
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Сервер працює. Файл ${inputFile} знайдено.`);

});

// --- ЧАСТИНА 1: Запуск сервера ---

server.listen(port, host, () => {
  console.log(`Сервер запущено на http://${host}:${port}`); 
});

