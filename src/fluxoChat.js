/* FLUXO DE CONVERSAÇÃO WABot */
//import { Presence } from '@adiwajshing/baileys'
const { validarCNPJ, verificarCadastroCNPJ } = require('./verificaCNPJ.js')
const { gerenciarChats } = require('./fileAccess.js')
const { getFlowStep } = require('./jsonFiles.js')
const Glpi = require('glpi-api');

const configSrv1 = { // Servidor Local
  app_token: 'CpsdNH7mAGyK8DUf4fBH60ldRRSXLvHr3vrfE4bp',
  apiurl: 'http://192.168.1.176/glpi/apirest.php',
  auth: { username: 'waBot', password: 'waglpi' }
};
const configSrv2 = { // Servidor Externo
  app_token: 'jbfB2vpGUorp83ejcQw5QRmmfLHXN4KRJOr1qzov',
  apiurl: 'http://appajudanet.ddns.net:831/glpi/apirest.php',
  auth: { username: 'WaBot', password: 'waglpi' }
};

// Fluxo de chat - enviando resposta do bot ao cliente
async function sendBotResponse(sock, msgPayload, loadedServChat) {
  //console.log('#debug fluxoChat.21', 'loadedServChat: ', JSON.stringify(loadedServChat, undefined, 2))
  let contactId = loadedServChat.whatsappId; //msgPayload.key.remoteJid;
  await sock.sendPresenceUpdate('available', contactId) // Enviando status: "Digitando..."

  switch (loadedServChat.loadFlow.step) {
    case 0:
      //console.log('#debug fluxoChat.27', 'sendBotResponse case 0')
      enviarResposta(sock, contactId, loadedServChat.loadFlow);
      // chat de serviço iniciado
      loadedServChat.loadFlow = await getFlowStep(0)
      loadedServChat.loadFlow.step = 1;
      break;
    case 1:
      //console.log('#debug fluxoChat.34', 'sendBotResponse case 1')
      loadedServChat.request = {
        requesterName: "",
        businessCNPJ: undefined,
        entitiesId: 0,
        businessName: "Não Informado",
        type: undefined,
        description: ''
      }
      switch (loadedServChat.receivedAnswer) {
        case "1":
          loadedServChat.loadFlow = await getFlowStep(2);
          loadedServChat.request.type = 'Problema'
          loadedServChat.loadFlow.step = 2;
          break;
        case "2":
          loadedServChat.loadFlow = await getFlowStep(1)
          loadedServChat.request.type = 'Dúvida'
          loadedServChat.loadFlow.step = 2;
          break;
        default:
          loadedServChat.loadFlow = await getFlowStep(0)
          loadedServChat.loadFlow.step = 1;
          break;
      }
      //console.log('#debug fluxoChat.59', 'loadFlow:', JSON.stringify(loadedServChat.loadFlow, undefined, 2))
      enviarResposta(sock, contactId, loadedServChat.loadFlow);
      break;
    case 2:
      //console.log('#debug fluxoChat.63', 'sendBotResponse case 2')
      if (loadedServChat.receivedAnswer.match(/[A-záàâãéèêíïóôõöúçñ]{2,}/)) {
        loadedServChat.loadFlow = await getFlowStep(3)
        loadedServChat.loadFlow.step = 3;
        loadedServChat.request.requesterName = loadedServChat.receivedAnswer;
        loadedServChat.loadFlow.msgToSend.text = loadedServChat.loadFlow.msgToSend.text.replace(/requesterName/g, loadedServChat.request.requesterName)
      } else {
        loadedServChat.loadFlow = await getFlowStep(2)
        loadedServChat.loadFlow.step = 2;
        loadedServChat.loadFlow.msgToSend.text = 'Seu nome deve ter no mínimo duas letras. ' + loadedServChat.loadFlow.msgToSend.text.split('. ')[1]
      }
      enviarResposta(sock, contactId, loadedServChat.loadFlow);
      break;
    case 3:
      if (loadedServChat.receivedAnswer != undefined) {
        let objCNPJ = validarCNPJ(loadedServChat.receivedAnswer)
        if (objCNPJ.Ok) {
          loadedServChat.request.businessCNPJ = objCNPJ.cnpj;
          let cnpjNum = loadedServChat.receivedAnswer.replace(/[^\d]+/g, '');
          let clienteCadastrado = await verificarCadastroCNPJ(cnpjNum);
          //console.log('#debug fluxoChat.83', 'Resp. verificação cliente cadastrado: ', clienteCadastrado)
          if (clienteCadastrado.hasOwnProperty('cnpj')) {
            loadedServChat.request.entitiesId = clienteCadastrado.id;
            loadedServChat.request.businessCNPJ = clienteCadastrado.cnpj;
            loadedServChat.request.businessName = clienteCadastrado.businessName;
            loadedServChat.request.glpiServer = clienteCadastrado.glpiServer;
          }
          if (loadedServChat.request.type == 'Dúvida') {
            loadedServChat.loadFlow = await getFlowStep(4)
            loadedServChat.loadFlow.step = 4;
          }
          if (loadedServChat.request.type == 'Problema') {
            loadedServChat.loadFlow = await getFlowStep(5)
            loadedServChat.loadFlow.step = 5;
          }
        } else {
          loadedServChat.loadFlow = await getFlowStep(3)
          let cnpjLido = loadedServChat.receivedAnswer.match(/\d+/g);
          if (cnpjLido != null) {
            cnpjLido = cnpjLido.join("");
            cnpjLido = ` *${cnpjLido.padStart(14, 0).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}*`;
          }
          else cnpjLido = "";
          loadedServChat.loadFlow.msgToSend.text = `O CNPJ informado${cnpjLido} parece estar incorreto. Por favor, verifique se está tudo certo e digite novamente.`
          loadedServChat.loadFlow.step = 3;
        }
      }
      enviarResposta(sock, contactId, loadedServChat.loadFlow);
      break;
    case 4:
    case 5:
      if (loadedServChat.receivedAnswer != undefined && loadedServChat.receivedAnswer.match(/[A-záàâãéèêíïóôõöúçñ ?]{10,}/)) {
        // Registrando a solicitação do cliente...
        sock.sendMessage(contactId, { text: 'Aguarde enquanto registramos a sua solicitação ... ⌛⏳⌛ ' })
        loadedServChat.request.description = loadedServChat.receivedAnswer;
        loadedServChat.loadFlow = await getFlowStep(6)
        let callText = `Sua <request> foi registrada com sucesso:
    _Número: *numDocumento*_
    _Solicitante: *${loadedServChat.request.requesterName}*_
    _Empresa: *${loadedServChat.request.businessName}*_
    _CNPJ: *${loadedServChat.request.businessCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}*_
    _Tipo: *${loadedServChat.request.type}*_
    _Descrição: *${loadedServChat.request.description}*_ 
    _Data/Hora: *${new Date(loadedServChat.updatedDate).toLocaleString('pt-BR')}*_`
        if (loadedServChat.request.type == 'Problema') callText = callText.replace('<request>', '*Solicitação*')
        if (loadedServChat.request.type == 'Dúvida') callText = callText.replace('<request>', '*Requisição*')
        loadedServChat.loadFlow.msgToSend.text = loadedServChat.loadFlow.msgToSend.text.replace(/requestInfoMessage/, callText)
        loadedServChat.loadFlow.step = 6;
        setTimeout(() => openTicket(loadedServChat.request, sock, loadedServChat, msgPayload), 2000)
      } else {
        if (loadedServChat.request.type == 'Dúvida') loadedServChat.loadFlow = getFlowStep(4)
        if (loadedServChat.request.type == 'Problema') loadedServChat.loadFlow = getFlowStep(5)
        loadedServChat.loadFlow.msgToSend.text = ('Essa descrição está muito curta, então' + loadedServChat.loadFlow.msgToSend.text.split('Agora')[1]).replace('uma breve', 'outra')
        sock.sendMessage(contactId, { text: loadedServChat.loadFlow.msgToSend.text })
      }
      break;
    case 6:
      loadedServChat.loadFlow = getFlowStep(7)
      setTimeout(() => {
        enviarResposta(sock, contactId, loadedServChat.loadFlow);
        gerenciarChats('deleteChat', "servChat" + contactId.match(/^\d+/));
      }, 2000)
      break;
  }
  loadedServChat.receivedAnswer = undefined;
  gerenciarChats('setChat', "servChat" + contactId.match(/^\d+/), loadedServChat)

}

function enviarResposta(sock, contactId, loadFlow) {
  //console.log('#debug fluxoChat.153','função enviarResposta foi chamada', JSON.stringify(loadFlow, undefined, 2))
  switch (loadFlow.msgToSendType) {
    case "buttonsMessage":
      setTimeout(async () => {
        //console.log('#debug fluxoChat.157', 'mensagem de botões:', JSON.stringify(loadFlow.msgToSend, undefined, 2))
        await sock.sendMessage(contactId, loadFlow.msgToSend)
          .then(result => console.log('#debug fluxoChat.159', 'Result', result))
          .catch(erro => console.log('#debug fluxoChat.160', 'Erro', erro))
      }, 500);
      break;
    case "textMessage":
      setTimeout(async () => {
        await sock.sendMessage(contactId, loadFlow.msgToSend)
      }, 500);
      break;
    default:
      // comunicar falha de processo no fluxo de conversa...
      break;
  }
}

function openTicket(request, sock, loadedServChat, msgPayload) {
  let contactId = msgPayload.key.remoteJid;
  let contactPhone = getPhoneNumber(contactId)
  request.type = request.type.replace("Problema", 1).replace("Dúvida", 2)
  let origemRequisicao = 6 // Other
  let vNameTicket, nameTicket = request.description;
  if (nameTicket.length > 50) {
    vNameTicket = request.description.substring(0, 50).split(' ');
    vNameTicket.pop();
    nameTicket = vNameTicket.join(' ') + '...';
  };
  let ticketData = {
    entities_id: request.entitiesId,
    name: nameTicket,
    content: `${request.description}\n(Por ${request.requesterName} - ${contactPhone} / CNPJ ${request.businessCNPJ}) - ${request.businessName}`,
    type: request.type, // 1 - Incidente (Problema) | 2 - Requisição / (Dúvida)
    requesttypes_id: origemRequisicao,
    status: 1,
  }
  if (request.glpiServer) {
    ticketData.glpiServer = request.glpiServer
  } else {
    ticketData.glpiServer = "Srv2";
  }

  //console.log('#debug fluxoChat.199', "Dados do Ticket ---> ", ticketData, 'Servidor GLPI: ', request.glpiServer )

  let config = configSrv1;
  if (ticketData.glpiServer == 'Srv2') config = configSrv2;

  const glpi = new Glpi(config);

  glpi.initSession()
    .then(() => glpi.addItems('Ticket', ticketData))
    .then((ret) => {
      const ticket = ret.data;
      // Do what you want with your ticket
      let numDocumento = ticket.id.toString().padStart(5, '0') + ticketData.glpiServer.replace("Srv", ".");
      loadedServChat.loadFlow.msgToSend.text = loadedServChat.loadFlow.msgToSend.text.replace(/numDocumento/, numDocumento);
      enviarResposta(sock, contactId, loadedServChat.loadFlow);
      setTimeout(() => {
        let contatoSuporte = [
          { nome: "00000" },
          { nome: "Aryel", numero: '5511910129410' },
          { nome: "Jailton", numero: '5511940242975' },
          { nome: "Vitor", numero: '5511940227816' },
          { nome: "11111" }
        ]
        let contatoSuporteSrv2 = [
          { nome: "00000" },
          { nome: "Jailton", numero: '5511940242975' },
          { nome: "Vitor", numero: '5511940227816' },
          { nome: "11111" }
        ]
        if (ticketData.glpiServer == 'Srv2') contatoSuporte = contatoSuporteSrv2;
        let linkSuporte = `Especialista *NomeSuporte*:\n https://api.whatsapp.com/send?phone=NumeroSuporte&text=Oi%2C%20abri%20o%20Chamado%20%2A${numDocumento}%2A%0APode%20me%20ajudar%3F`
        contatoSuporte.map((suporte, i) => {
          if (suporte.nome == '00000') {
            sock.sendMessage(contactId, { text: 'Segue abaixo alguns contatos de técnicos que podem te ajudar, é só clicar no link para iniciar uma conversa pelo WhatsApp!' })
          } else {
            setTimeout(() => {
              if (suporte.nome != '11111')
                sock.sendMessage(contactId, { text: linkSuporte.replace('NomeSuporte', suporte.nome).replace('NumeroSuporte', suporte.numero) });
              else sendBotResponse(sock, msgPayload, loadedServChat);
            }, i * 1000)
          }
        })
      }, 2000);
    })
    .catch((erro) => {
      console.log('#debug fluxoChat.244', 'erro GLPI: ', erro)
      // Manage error
    })
    .then(() => glpi.killSession());
}

// Extrair número de telefone do contato de whatsapp
function getPhoneNumber(waContact) {
  let contactNumber = waContact.match(/\d+/).toString()
  if (contactNumber.length == 13) contactNumber = contactNumber.replace(/(^\d{2})(\d{2})(\d{5})(\d{4})/, '$1 ($2) $3-$4')
  if (contactNumber.length == 12) contactNumber = contactNumber.replace(/(^\d{2})(\d{2})(\d{4})(\d{4})/, '$1 ($2) $3-$4')
  return contactNumber
}

module.exports = { sendBotResponse }