const { BOT_EMOJI } = require('./config')
const { isCommand, extractDataFromMessage } = require('./utils')
const { setMonitoringKey, getMonitoringKey } = require('./jsonFiles.js')
const { gerenciarChats, deleteExpiredChats } = require('./fileAccess.js')
const { sendBotResponse } = require('./fluxoChat.js');

var serviceStarted;
const masterContactId = '5511940227816@s.whatsapp.net';
const devContact = '556292066444@s.whatsapp.net'; //'556282248066@s.whatsapp.net'

async function middlewares(bot) {

  bot.ev.on('connection.update', ({ connection, lastDisconnect }) => {

    if (connection === 'open') {
      console.log('#debug middlewares.17', 'Conexão com WhatsApp Multi-device estabelecida');
      if (!serviceStarted) {
        console.log('#debug middlewares.19', 'Bot de Serviços iniciado: ');
        serviceStarted = true;
        let newKey = Math.round(Math.random() * 900 + 100);
        setMonitoringKey(newKey);
        encerrarAtendimentoInativo(newKey, bot, 5000);
        notificarBotOk(newKey, bot, 1);
      }
    }
  })

  bot.ev.on('messages.upsert', async ({ messages }) => {

    const msgPayload = messages[0]
    //console.log('#debug middlewares.32', 'Mensagem:', JSON.stringify(msgPayload, undefined, 2))
    //console.log('#debug middlewares.33', 'extractDataFromMessage:', JSON.stringify(extractDataFromMessage(msgPayload), undefined, 2))

    const { command, remoteJid, args, isConversation, isGroup, fromMe } = extractDataFromMessage(msgPayload);

    if (isConversation && !fromMe) {
      if (!isGroup) {
        //console.log('#debug middlewares.40', 'Mensagem simples de texto privada', JSON.stringify(msgPayload, undefined, 2));

        await bot.readMessages(remoteJid) // Marcando mensagens como lidas
        await bot.sendPresenceUpdate('composing', remoteJid) // Enviando status: "Digitando..."
        let chatServKey = "servChat" + remoteJid.match(/^\d+/);  // Gerando chave de pesquisa de chats: "chatServ+NumeroDoContato"
        var loadedServChat = await gerenciarChats('getChat', chatServKey) // Obtendo o chat do cliente ou gerando um chat inicial
        //console.log('#debug middlewares.45', `Chat de serviço carregado para o cliente: `, loadedServChat)

        if (loadedServChat.whatsappId != remoteJid) {
          //console.log('#debug middlewares.48', `Enviando mensagem de boas vindas a ${remoteJid}`)
          bot.sendMessage(remoteJid, { text: 'Olá! Sou um *Bot* para abertura de chamados 🤖' })
          loadedServChat.whatsappId = remoteJid;
        }

        // Extraindo o texto das mensagens recebidas e válidas
        switch (true) {
          case msgPayload.message.hasOwnProperty('extendedTextMessage'): // A mensagem recebida é do tipo texto
            loadedServChat.receivedAnswer = msgPayload.message.extendedTextMessage.text;
            break;
          case msgPayload.message.hasOwnProperty('conversation'): // A mensagem recebida é do tipo texto (conversation)
            loadedServChat.receivedAnswer = msgPayload.message.conversation;
            break;
          case msgPayload.message.hasOwnProperty('buttonsResponseMessage'): // A mensagem recebida é do tipo texto
            loadedServChat.receivedAnswer = msgPayload.message.buttonsResponseMessage.selectedButtonId;
            break;
          default:  // A mensagem rebebida é de outro tipo não aceito pelo bot
            sock.sendMessage(contactId, { text: 'Envie apenas texto ou use o botões de resposta. Não aceitamos outros tipos de mensagem.' })
            loadedServChat.receivedAnswer = '';
            break;
        }
        //console.log('#debug middlewares.69', 'Enviando resposta do bot')
        sendBotResponse(bot, msgPayload, loadedServChat)

      } else {
        console.log('#debug middlewares.73', 'Mensagem simples de texto de grupo', JSON.stringify(msgPayload, undefined, 2));
      }
    }


    if (isCommand) {

      switch (command.toLowerCase()) {
        case 'ping':
          await bot.sendMessage(remoteJid, { text: `${BOT_EMOJI} Pong!` })
          break
        case 'tecnico':
          console.log('#debug middlewares.90', 'argumentos: ', args)
          await bot.sendMessage(remoteJid, { text: `${BOT_EMOJI} Comando de atualização de dados de profissionais: inativo!` })
          break
        case 'glpiserver':
          console.log('#debug middlewares.94', 'argumentos: ', args)
          await bot.sendMessage(remoteJid, { text: `${BOT_EMOJI} Comando de atualização do servidor GLPI: inativo!` })
          break
      }
    }
  })
}

// Encerrando atendimentos inativos
function encerrarAtendimentoInativo(key, bot) {
  let loadedKey = getMonitoringKey();
  if (loadedKey == key) {
    setTimeout(() => {
      let contactId = deleteExpiredChats()
      if (contactId)
        bot.sendMessage(
          contactId,
          { text: 'Seu atendimento foi encerrado por inatividade' }
        )
      encerrarAtendimentoInativo(key, bot)
    }, 30000)
  }
}

// Enviando notificação ao gerente para que saiba que o serviço (bot) está no ar.
var hora, horaUltimoEnvio;
async function notificarBotOk(key, bot, sendTimer) {
  let agora = new Date().toLocaleString('pt-br', { dateStyle: "short", timeStyle: "short" })
  if (sendTimer == 1) {
    // Notificando Inicialização
    bot.sendMessage(devContact, { text: `🤖 Olá, DevBrother!\nO bot AjudaNet foi iniciado agora: ${agora.replace(' ', ' às ')}!` });
    // bot.sendMessage(masterContactId, { text: `🤖 Olá, Comandante!\nO bot AjudaNet foi iniciado agora: ${agora.replace(' ',' às ')}!` });
  }
  let loadedKey = getMonitoringKey();
  if (loadedKey == key) {
    setTimeout(() => {
      hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit' });
      if (hora > 7 && hora <= 20 && hora != horaUltimoEnvio) {
        horaUltimoEnvio = hora;
        // bot.sendMessage(masterContactId, { text: "🤖 Olá, meu Comandante!\nFica tranquilo que estou na ativa aqui fazendo o meu trabalho!" });
        bot.sendMessage(devContact, { text: `🤖 Olá, DevBrother!\nO bot AjudaNet está funcionando 100%! [${horaUltimoEnvio}]` });
        sendTimer = 20;
      }
      notificarBotOk(key, bot, sendTimer)
    }, sendTimer * 60000)
  }
}

module.exports = middlewares