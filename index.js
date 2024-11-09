'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const config = require('./config.json');

// Create LINE SDK client
const client = new line.Client(config);

const app = express();

// Webhook callback
app.post('/v1/doscg/webhook', line.middleware(config), (req, res) => {
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// Simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text: `${text} ครับ` }))
  );
};

// Event handler function
async function handleEvent(event) {
  // Skip verify webhook events
  if (isVerifyEvent(event)) return;

  switch (event.type) {
    case 'message':
      return handleMessage(event);
    case 'follow':
      return replyText(event.replyToken, 'Got followed event');
    case 'unfollow':
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);
    case 'join':
      return replyText(event.replyToken, `Joined ${event.source.type}`);
    case 'leave':
      return console.log(`Left: ${JSON.stringify(event)}`);
    case 'postback':
      return replyText(event.replyToken, `Got postback: ${event.postback.data}`);
    case 'beacon':
      return handleBeacon(event);
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

// Check if the event is a verification event
function isVerifyEvent(event) {
  const verifyTokens = [
    '00000000000000000000000000000000',
    'ffffffffffffffffffffffffffffffff'
  ];
  return verifyTokens.includes(event.replyToken);
}

// Handle different types of message events
function handleMessage(event) {
  const { message } = event;
  const handlers = {
    text: handleText,
    image: handleImage,
    video: handleVideo,
    audio: handleAudio,
    location: handleLocation,
    sticker: handleSticker,
  };

  const handler = handlers[message.type];
  if (!handler) {
    throw new Error(`Unknown message type: ${message.type}`);
  }

  return handler(message, event.replyToken);
}

// Specific message handlers
function handleText(message, replyToken) {
  return replyText(replyToken, message.text);
}

function handleImage(message, replyToken) {
  return replyText(replyToken, 'Got Image');
}

function handleVideo(message, replyToken) {
  return replyText(replyToken, 'Got Video');
}

function handleAudio(message, replyToken) {
  return replyText(replyToken, 'Got Audio');
}

function handleLocation(message, replyToken) {
  return replyText(replyToken, 'Got Location');
}

function handleSticker(message, replyToken) {
  return replyText(replyToken, 'Got Sticker');
}

function handleBeacon(event) {
  const dm = `${Buffer.from(event.beacon.dm || '', 'hex').toString('utf8')}`;
  return replyText(event.replyToken, `${event.beacon.type} beacon hwid: ${event.beacon.hwid} with device message: ${dm}`);
}

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
