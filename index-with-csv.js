const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

// Conexão para leitura (stream)
const readConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

// Conexão para inserção
const insertConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

// Cria ou sobrescreve o arquivo CSV e escreve o cabeçalho
const csvFile = 'resultado.csv';
const csvStream = fs.createWriteStream(csvFile);
csvStream.write('nascido_em,registro_id\n');  // Cabeçalho

// Função para inserir um batch de registros usando a conexão de insert
async function insertBatch(batch) {
  if (batch.length === 0) return Promise.resolve();
  
  // Mapeia os valores e prepara as linhas para o CSV
  const values = batch.map(row => {
    const nascido_em = 2025 - row.idade;
    return [nascido_em, row.id];
  });
  
  // Escreve os registros no arquivo CSV
  for (const [nascido_em, registro_id] of values) {
    csvStream.write(`${nascido_em},${registro_id}\n`);
  }
  
  const insertQuery = 'INSERT INTO base_calculo (nascido_em, registro_id) VALUES ?';
  
  console.log(`Inserindo batch com ${batch.length} registros...`);
  
  try {
    await insertConnection.promise().query(insertQuery, [values]);
    console.log('Batch inserido com sucesso.');
  } catch (err) {
    console.error('Erro ao inserir batch:', err);
    throw err;
  }
}

function readAndInsertRecords() {
  console.log('Iniciando leitura e inserção via stream...');
  const query = 'SELECT * FROM registros';
  
  // Cria o stream de leitura usando a conexão de leitura
  const readStream = readConnection.query(query).stream({ highWaterMark: 100 });
  
  // Defina o tamanho do batch conforme sua necessidade
  const batchSize = 10000;
  let batch = [];
  let totalProcessed = 0;
  
  console.time('streamProcessing');
  
  readStream.on('data', (row) => {
    totalProcessed++;
    batch.push(row);
    
    if (totalProcessed % 100 === 0) {
      console.log(`Lidos ${totalProcessed} registros...`);
    }
    
    if (batch.length >= batchSize) {
      // Pausa o stream de leitura enquanto processa o batch
      readStream.pause();
      insertBatch(batch)
        .then(() => {
          batch = [];
          readStream.resume();
        })
        .catch((err) => {
          console.error('Erro ao processar batch:', err);
          readStream.destroy(err);
        });
    }
  });
  
  readStream.on('end', () => {
    console.log('Leitura do stream finalizada.');
    // Insere os registros restantes, se houver
    insertBatch(batch)
      .then(() => {
        console.timeEnd('streamProcessing');
        console.log(`Processamento finalizado. Total lidos: ${totalProcessed}`);
        // Fecha ambas as conexões
        readConnection.end();
        insertConnection.end();
        csvStream.end(); // Fecha o WriteStream do CSV
      })
      .catch((err) => {
        console.error('Erro ao inserir registros restantes:', err);
        readConnection.end();
        insertConnection.end();
        csvStream.end();
      });
  });
  
  readStream.on('error', (err) => {
    console.error('Erro no stream de leitura:', err);
    readConnection.end();
    insertConnection.end();
    csvStream.end();
  });
}

readAndInsertRecords();
