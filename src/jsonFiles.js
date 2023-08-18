const fs = require('fs/promises');

const arquivoDeChats = './src/allServiceChats.json'; // '/home/ajudaNet/allServiceChats.json' XXX
const processFlowFile = './src/processFlow.json'; // '/home/ajudaNet/processFlow.json' XXX

async function getFlowStep(step) {
  //console.log('#debug jsonFiles.07','Acessando getFlowStep')
  const data = await fs.readFile(processFlowFile, 'utf8');
  const processFlow = JSON.parse(data)
  if (step == undefined) return processFlow;
  else return processFlow[step]
}

function getServChat(servChatKey) {
  //console.log('#debug jsonFiles.15', `obterServChat com a Key: ${servChatKey}`)
  let resposta = { undefined }
  try {
    let allServiceChats = JSON.parse(readFileSync(arquivoDeChats, 'utf8'));
    if (allServiceChats.hasOwnProperty(servChatKey)) {
      resposta = { hasServChat: true }
      resposta[servChatKey] = allServiceChats[servChatKey]

    } else {
      resposta = { hasServChat: false }
      resposta[servChatKey] = allServiceChats['startChat']

    }
  } catch (erro) {
    console.log('#debug jsonFiles.29', `Erro na manipulação do arquivo ${arquivoDeChats}`, erro)
    throw erro
  }
  //console.log('#debug jsonFiles.32', "Solicitação Json: ", resposta)
  return resposta
}

function atualizarServChat(servChatKey, servChatToSave) {
  servChatToSave['updatedDate'] = new Date();
  let resposta = { Ok: false }
  try {
    let allServiceChats = JSON.parse(readFileSync(arquivoDeChats, 'utf8'));
    allServiceChats[servChatKey] = servChatToSave
    writeFileSync(arquivoDeChats, JSON.stringify(allServiceChats, null, 2))
    if (servChatToSave.loadFlow.step != 7) resposta = { Ok: true }
  } catch (erro) {
    //console.log('#debug jsonFiles.45', `Erro na manipulação do arquivo ${arquivoDeChats}`, erro)
    throw erro
  }
  return resposta
}

// Chave de monitormamento de fucionamento do robô e finalização de chamados por inatividade
const monitorKeyFile = './src/atendimentos/botMonitor.json';
async function setMonitoringKey(key) {
  const data = await fs.readFile(monitorKeyFile, 'utf8');
  const objMonitor = JSON.parse(data);
  objMonitor.key = key;
  objMonitor.updated = new Date();
  await fs.writeFile(monitorKeyFile, JSON.stringify(objMonitor, null, 2), 'utf8');
}

async function getMonitoringKey() {
  let data = await fs.readFile(monitorKeyFile, 'utf8');
  const objMonitor = JSON.parse(data);
  return objMonitor.key
}


async function testarResultado(chatKey) {
  const teste = obterServChat(chatKey, (resultado) => { console.log('#debug jsonFiles.69', 'Testando... ', resultado) })
}
//testarResultado('servChat556292066444')
//atualizarServChat('servChat556292066444', { businessCNPJ: "01.123.456/0001-23", requesterName: "Xico" })  // "02.442.585/0001-25",

module.exports = {
  getFlowStep,
  getServChat,
  getMonitoringKey,
  setMonitoringKey,
  atualizarServChat
}