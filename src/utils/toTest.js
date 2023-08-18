const { readJsonFile, writeJsonFile } = require('./testModule')
const { getFlowStep } = require('../jsonFiles')
const arquivoDeChats = './src/allServiceChats.json'; // '/home/ajudaNet/allServiceChats.json' XXX
const processFlowFile = './src/processFlow.json'; // '/home/ajudaNet/processFlow.json' XXX

async function testar() {
  const processFlow = await readJsonFile(arquivoDeChats);
  console.log(JSON.stringify(processFlow, undefined, 2))
}

testar()