import JSEncrypt from 'jsencrypt/bin/jsencrypt.min';

// 公钥
const _pubKey = `-----BEGIN PUBLIC KEY-----
  MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCK3siV2MKl7ADFMajEsbc/ZrST
  fo9h37c6+m0cUHOTqGR4V+Ugzc5Wzpcrz6QGu7/umQBJRC3LZ8xRW8+J6Z1lI0+T
  r6LT8NfLUeyBTBXkBI1j0BIzmEjsW/a1vDr2ahXn1RFvtnHeKs41lbICkY7mRA2c
  AyiMWhrteM1d1MR3gQIDAQAB
  -----END PUBLIC KEY-----`;

// 私钥
const _priKey = `-----BEGIN RSA PRIVATE KEY-----
  MIICXQIBAAKBgQCK3siV2MKl7ADFMajEsbc/ZrSTfo9h37c6+m0cUHOTqGR4V+Ug
  zc5Wzpcrz6QGu7/umQBJRC3LZ8xRW8+J6Z1lI0+Tr6LT8NfLUeyBTBXkBI1j0BIz
  mEjsW/a1vDr2ahXn1RFvtnHeKs41lbICkY7mRA2cAyiMWhrteM1d1MR3gQIDAQAB
  AoGACUU8ELzKqbbqij95a8ANYp8hmOMPAVKk8bv8ArLgNFA+fMYpVppGlwbtkpAm
  /AgWlQADw+BYSkbgneHKJgPBbQB+G8/AmMY/u3KIFS4wJifaIAv2evDlFqtw2zI6
  bG7bg65YF9AS1l9B+O3IdqMDNBKqQYiItx1A/SfogAXJctECQQDeIzh3k8mkzyMe
  lxrFY5kJ5u+ydse82nOmawxo3kS/WEZh2jadeUdAXvXDhXrQ4O1t8zrG4gY6sAq4
  3KqeouBdAkEAoAobkEY/M/Rtya8tomm3Dg9+Hc9yNphVr8fG3tLpphALuGSP+0Qp
  9ONyoC4G71MnIPtqBl6JDNzKARY2NUjRdQJBANw/57kIW6KBjrzB7dVRD2h2BavZ
  gemKX6jd8wv3dgqSqBZVmllA6pi0jtEyA7gfjMq7o8eWS77c1YS9pp5ruDECQQCJ
  Ep8xHzmbAkvWZpgrd2g2PsbCOZ+VazxY5j9LMlK0zSF8uYUorOVSvky7LTD7Yrks
  4qmY8vdncOQDskaTtN7RAkBc/3Brhc5eG0/XHqKrATY+H0GD/muzpLSLuDXVjgqh
  lEYH3FAsW+VP5dQ6AuzW+wkFDbztdvr5MF9Mluyxc3Fe
  -----END RSA PRIVATE KEY-----`;


function splitString(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) {
        chunks.push(str.substr(i, chunkSize));
    }
    return chunks;
}

// 长字符串加密
export function encryptLong(txt) {
   const encryptor = new JSEncrypt();
   encryptor.setPublicKey(_pubKey);
   const chunkSize = 150;
   const chunks = splitString(txt, chunkSize);
   const encryptedChunks = chunks.map(chunk => encryptor.encrypt(chunk));
   const encryptedString = encryptedChunks.join('');
   return encryptedString;
}


// 加密
export function encrypt(txt) {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(_pubKey); // 设置公钥
  return encryptor.encrypt(txt); // 对数据进行加密
}

// 解密
export function decrypt(txt) {
  const encryptor = new JSEncrypt();
  encryptor.setPrivateKey(_priKey); // 设置私钥
  return encryptor.decrypt(txt); // 对数据进行解密
}

// 长字符串加密
/*export function encryptLong(txt) {
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(_pubKey); // 设置公钥
  return encryptor.encrypt(txt); // 对数据进行加密
}

// 长字符串解密
export function decryptLong(txt) {
  const encryptor = new JSEncrypt();
  encryptor.setPrivateKey(_priKey); // 设置私钥
  return encryptor.decrypt(txt); // 对数据进行解密
}*/