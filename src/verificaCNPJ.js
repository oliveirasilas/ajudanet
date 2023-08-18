const fs = require('fs/promises')

const cadastroCNPJ = './src/cadastroCNPJs.json'; // '/home/ajudaNet/cadastroCNPJs.json' XXX

async function verificarCadastroCNPJ(cnpj) {
  cnpj = cnpj.match(/(\d)+/g).join("")
  let resultado = {}
  // const data = await fs.readFile(cadastroCNPJ, 'utf8');
  const listaCNPJ = JSON.parse(await fs.readFile(cadastroCNPJ, 'utf8'))
  for (const key in listaCNPJ) {
    if (listaCNPJ.hasOwnProperty.call(listaCNPJ, key) && listaCNPJ[key].hasOwnProperty('cnpj')) {
      var element = listaCNPJ[key]['cnpj'].match(/(\d)+/g).join("")
      if (element === cnpj) resultado = listaCNPJ[key]
    }
  }
  return resultado
}

function validarCNPJ(cnpj) {
  if (cnpj == undefined) cnpj = '00000000000000';
  cnpj = cnpj.replace(/[^\d]+/g, '');
  //console.log('#debug verificaCNPJ.22', cnpj)
  if (cnpj == '') return false;

  if (cnpj.length != 14)
    return false;

  // Elimina CNPJs invalidos conhecidos
  if (cnpj == "00000000000000" ||
    cnpj == "11111111111111" ||
    cnpj == "22222222222222" ||
    cnpj == "33333333333333" ||
    cnpj == "44444444444444" ||
    cnpj == "55555555555555" ||
    cnpj == "66666666666666" ||
    cnpj == "77777777777777" ||
    cnpj == "88888888888888" ||
    cnpj == "99999999999999")
    return { Ok: false };

  // Valida DVs
  let tamanho = cnpj.length - 2
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let i, pos = tamanho - 7;
  for (i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2)
      pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0))
    return { Ok: false };

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2)
      pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(1))
    return { Ok: false };

  return { Ok: true, cnpj: cnpj, cnpjString: cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') };
}

module.exports = { verificarCadastroCNPJ, validarCNPJ }

