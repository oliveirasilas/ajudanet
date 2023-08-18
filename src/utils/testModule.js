const fs = require('fs/promises');

// Função para ler propriedades JSON de um arquivo
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Erro ao ler ${filePath}: ${error.message}`);
  }
}

// Função para escrever propriedades JSON em um arquivo
async function writeJsonFile(filePath, jsonData) {
  try {
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`Dados escritos em ${filePath}`);
  } catch (error) {
    throw new Error(`Erro ao escrever ${filePath}: ${error.message}`);
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile
}