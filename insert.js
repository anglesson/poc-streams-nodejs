const pool = require("./db");

async function insertRecords() {
  let totalRecords = 400000;
  console.log(`Iniciando inserção de ${totalRecords} registros...`);

  const batchSize = 1000; // você pode ajustar esse valor para balancear desempenho e uso de memória
  let inserted = 0;

  try {
    for (
      let batchStart = 0;
      batchStart < totalRecords;
      batchStart += batchSize
    ) {
      const queries = [];
      for (
        let i = batchStart;
        i < Math.min(batchStart + batchSize, totalRecords);
        i++
      ) {
        const nome = `User_${i}`;
        const idade = Math.floor(Math.random() * 60) + 18;
        const query = pool.query(
          "INSERT INTO registros (nome, idade) VALUES (?, ?)",
          [nome, idade]
        );
        queries.push(query);
      }

      // Aguarda a finalização do batch atual
      await Promise.all(queries);
      inserted += queries.length;
      console.log(`${inserted} registros inseridos...`);
    }
    console.log("Inserção concluída.");
  } catch (err) {
    console.error("Erro ao inserir registros:", err);
  } finally {
    // Encerra o pool somente após todas as inserções
    await pool.end();
  }
}

insertRecords();
