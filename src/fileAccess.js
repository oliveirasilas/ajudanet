/* NOVA PROPOSTA DE GERENCIAMENTO DE CHATS*/
const fs = require('fs/promises');
const { unlink } = require('fs');

const { getFlowStep } = require('./jsonFiles.js')

const startChatPath = './src/atendimentos/chatInicial.json'; // '/home/ajudaNet/atendimentos/chatInicial.json' XXX

async function gerenciarChats(action, chatKey, chatPayload) {
  const chatfilePath = `./src/atendimentos/${chatKey}.json`; // `/home/ajudaNet/atendimentos/${chatKey}.json` XXX

  var startChat, loadedChatPayload = {}
  switch (action) {
    case "getChat":
      // Carregando o arquivo de chat inicial...
      //console.log('#debug fileAccess.16', 'Carregando o arquivo de chat inicial...');
      await fs.access(startChatPath)
        .then(async () => {
          //console.log('#debug fileAccess.19', `O arquivo ${startChatPath} existe.`);
          const data = await fs.readFile(startChatPath, 'utf8');
          startChat = JSON.parse(data)['startChat'];
          //console.log('#debug fileAccess.22','Carregado o chat Inicial: ', JSON.stringify(startChat, undefined, 2));
          startChat.startDate = new Date();
          startChat.loadFlow = await getFlowStep(0);
          //console.log('#debug fileAcess.25', JSON.stringify(startChat.loadFlow, undefined, 2))
        })
        .catch(() => {
          console.log('#debug fileAccess.28', `O arquivo ${startChatPath} não existe.`);
        });

      // Verificando se existe um arquivo de chat e carregando-o se existir...
      //console.log('#debug fileAccess.32', 'Verificando se existe um arquivo de chat e carregando-o se existir...')
      await fs.access(chatfilePath)
      .then(async () => {
        //console.log('#debug fileAccess.35', `O arquivo ${chatfilePath} existe.`);
        const data = await fs.readFile(chatfilePath, 'utf8');
        loadedChatPayload = JSON.parse(data)
        if (loadedChatPayload.loadFlow.step == 7 && !!startChat) loadedChatPayload = startChat
      })
      .catch(() => {
        console.log('#debug fileAccess.41', `O arquivo ${chatfilePath} não existe.`);
        loadedChatPayload = startChat
      });

      //console.log('#debug fileAccess.45', loadedChatPayload);
      loadedChatPayload.updatedDate = new Date();

      return loadedChatPayload

    case 'setChat':
      // Salvando o objeto servChat em jsonFile.
      await fs.writeFile(chatfilePath, JSON.stringify(chatPayload, null, 2), 'utf8');
      return { Ok: true }
    case 'deleteChat':
      unlink(chatfilePath, (erro) => {
        if (erro) throw erro;
        console.log('#debug fileAccess.57', `O atendimento "${chatfilePath}" foi excluído!`);
      });
    default:

      break;
  }
}

// Encerra os atendimentos com mais de 180 segundos de inatividade apagando o arquivo JSON do chat.
function deleteExpiredChats() {
  let dir = './src/atendimentos'; // '/home/ajudaNet/atendimentos' XXX
  let arquivos = [[], [], []];
  let fileName, fileList = readdirSync(dir);
  let uTime, minTime = new Date().getTime();
  for (let f in fileList) {
    fileName = dir + '/' + fileList[f];
    var JsonData = JSON.parse(readFileSync(fileName, "utf-8"));
    uTime = new Date(JsonData.updatedDate).getTime();
    var difTime = (new Date().getTime()) - uTime;
    //console.log('#debug fileAccess.76', 'Diferença de tempo', difTime)
    if (difTime > 180000)
      if (JsonData.whatsappId) {
        arquivos[0].push(fileName);
        arquivos[1].push(uTime);
        arquivos[2].push(JsonData.whatsappId);
      }
    if (uTime < minTime) minTime = uTime;
  }

  let index = arquivos[1].indexOf(minTime)
  let stepFlow = 0
  let waId = arquivos[2][index]
  fileName = arquivos[0][index];
  if (fileName) {
    stepFlow = gerenciarChats('getChat', fileName.match(/[\w]+[\d]+/i)).loadFlow.step;
    if (stepFlow <= 6) {
      unlink(fileName, (erro) => console.log(erro));
      return waId
    } else
      return false
  } else
    return false
}

module.exports = {
  gerenciarChats,
  deleteExpiredChats
}