'use strict';

require('dotenv').config()

const path = require('path')
const express = require('express')
const edge = require('edge.js')
const { config, engine } = require('express-edge');
const bodyParser = require("body-parser");

const HTTPS = require("https");
const FS = require("fs");

//const request = require('http').request();
const request = require('request');

const passport = require("passport")
const FacebookStrategy = require("passport-facebook").Strategy

const homepageController = require('./controllers/homePage')
const messengerController = require('./controllers/messenger')
const fbRedirectController = require('./controllers/fbRedirect')
const instaController = require('./controllers/insta')
//const webhookController = require('./controllers/webhook')


const app = express()

app.use(passport.initialize())
app.use(passport.session())


app.use(engine);
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))



app.set('vioews', '${__dirname}/views')

app.get('/', homepageController)
app.get('/msg', messengerController)
app.get('/insta', instaController)

app.get('/oauth-redirect', fbRedirectController)


app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/" }),
    function(req, res) {
      console.log("req", req.user)
      res.render("data", {
        user: req.user,
      })
    }
  )


// Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;

  // Check if the message contains text
  if (received_message.text) {    

    // Create the payload for a basic text message
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an image!`
    }
  }  
  else if (received_message.attachments) {
      console.log("attachment");
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    console.log(attachment_url)
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  } 
  
  // Sends the response message
  callSendAPI(sender_psid, response);    

}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

    let response;
  
    // Get the payload for the postback
    let payload = received_postback.payload;
  
    // Set the response based on the postback payload
    if (payload === 'yes') {
      response = { "text": "Thanks!" }
    } else if (payload === 'no') {
      response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {

    // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": '##########' },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
  
}


  // Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];

        let sender_psid = webhook_event.sender.id;
        console.log('Sender PSID: ' + sender_psid);


        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);        
        } else if (webhook_event.postback) {
            handlePostback(sender_psid, webhook_event.postback);
        }

      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
  });


  // Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "random_token"
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });

app.listen(process.env.PORT || 5000)

/*HTTPS.createServer({
    key: FS.readFileSync("server.key"),
    cert: FS.readFileSync("server.cert")
}, app).listen(5000, () => {
    console.log("Listening at :5000...");
});*/
