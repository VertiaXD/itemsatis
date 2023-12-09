const fs = require('fs');
const io = require('socket.io-client');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const SocketToken = config.SocketToken;
const YourUserName = config.YourUserName;
const YourUserID = config.YourUserID;

const options = {
  agent: false,
  closeOnBeforeunload: true,
  hostname: "chat.itemsatis.com",
  path: "/socket.io/",
  perMessageDeflate: { threshold: 1024 },
  port: 443,
  query: {
    userData: SocketToken,
    EIO: 4,
    transport: ["websocket", "polling"],
  },
  rejectUnauthorized: true,
  rememberUpgrade: true,
  secure: true,
  timestampParam: "t",
  transportOptions: {},
  upgrade: true,
  withCredentials: false,
};

const socket = io.connect("https://chat.itemsatis.com", options);

const userMessages = new Map();

// Read responses from 'cevaplar.json'
const responses = JSON.parse(fs.readFileSync('cevaplar.json', 'utf8'));

const defaultResponse = responses.varsayilan.mesaj || "Üzgünüm, size yardımcı olamıyorum.";
const defaultDelay = responses.varsayilan.gecikme || 6000;

function sendMessage(message, toUserName, userName, toUserID, userID) {
  socket.emit('sendMessage', message, toUserName, userName, toUserID, userID);
}

socket.on('connect', () => {
  console.log('Socket Sistemine Bağlandı.');

  const sid = socket.id;

  socket.io.opts.query.sid = sid;
});

socket.on('receiveMessage', (message, fromUser, avatar, userId, chatId) => {
  if (!userMessages.has(userId)) {
    userMessages.set(userId, Date.now());

    console.log(`${fromUser} >> ${message}`);

    let responded = false;

    for (const keyword in responses) {
      if (message.toLowerCase().includes(keyword)) {
        const responseMessage = responses[keyword];
        setTimeout(() => {
          sendMessage(responseMessage, fromUser, YourUserName, userId, YourUserID);
        }, Math.random() * 1000 + 5000);
        responded = true;
        break;
      }
    }

    if (!responded) {
      setTimeout(() => {
        sendMessage(defaultResponse, fromUser, YourUserName, userId, YourUserID);
      }, defaultDelay);
    }
  }
});

socket.on('disconnect', () => {
  console.log('Socket Sisteminin Bağlantısı Koptu, Yeniden Bağlanılıyor.');
  socket.open();
});

socket.on('connect_error', (error) => {
  console.log('Socket Sisteminin Bağlantısı Koptu:', error);
  socket.open()
});

socket.on('connect_timeout', () => {
  console.log('Socket Bağlantısı Zaman Aşımına Uğradı, Yeniden Bağlanılıyor.');
  socket.open();
});

socket.on('error', (error) => {
  console.log('Hata:', error);
  socket.open();
});
