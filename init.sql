CREATE TABLE IF NOT EXISTS registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    idade INT NOT NULL
);

CREATE TABLE IF NOT EXISTS base_calculo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nascido_em VARCHAR(100) NOT NULL,
    registro_id INT NOT NULL,
    CONSTRAINT fk_registro
      FOREIGN KEY (registro_id) REFERENCES registros(id)
);