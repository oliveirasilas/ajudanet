const { PREFIX, TEMP_FOLDER } = require('../config')
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const path = require('path')
const { writeFile } = require('fs/promises')

function extractDataFromMessage(payload) {
  const textMessage = payload.message?.conversation;
  const extendedTextMessage = payload.message?.extendedTextMessage?.text;
  const imageTextMessage = payload.message?.imageMessage?.caption;

  const fullMessage = textMessage || extendedTextMessage || imageTextMessage

  if (!fullMessage) {
    return {
      remoteJid: '',
      fullMessage: '',
      isCommand: false,
      command: '',
      args: '',
      isImageTosticker: false,
      isConversation: false,
      isGroup: false,
      fromMe: false
    }
  }

  // Imagem válida para converter em sticker
  const isImageTosticker = !!payload?.message?.imageMessage ||
    !!payload?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

  const isCommand = fullMessage.startsWith(PREFIX);
  const isConversation = (!!textMessage || !!extendedTextMessage) && !isCommand;
  const isGroup = payload.key.remoteJid.match(/^(\d+)@g.us/g) ? true : false;
  const fromMe = payload.key?.fromMe;

  const [command, ...args] = fullMessage.trim().split(' ')
  const arg = args.reduce((acc, arg) => acc + ' ' + arg, '').trim();

  return {
    remoteJid: payload?.key?.remoteJid,
    fullMessage,
    isCommand,
    command: isCommand ? command.replace(PREFIX, '').trim() : '',
    args: isCommand ? arg.trim() : '',
    isImageTosticker,
    isConversation,
    isGroup,
    fromMe
  }
}

/*
function isCommand(payload) {
  const { fullMessage } = extractDataFromMessage(payload)

  return fullMessage && fullMessage.startsWith(PREFIX)
}


async function downloadImage(payload, fileName) {
  const content = payload.message?.imageMessage ||
    payload.message?.extendedTextMessage?.contextInfo?.quoteMessage?.imageMessage

  if (!content) { return null }

  const stream = await downloadContentFromMessage(content, 'image')

  let buffer = Buffer.from([])

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }

  const filePath = path.resolve(TEMP_FOLDER, `${fileName}.png`)

  await writeFile(filePath, buffer)

  return filePath
}
*/


module.exports = {
  //downloadImage,
  extractDataFromMessage
}