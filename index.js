var telegram = require('telegram-bot-api');
var request = require('ajax-request');
var t_token = require('./telegram-token.js');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/pschub';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to MongoDB");
});

var api = new telegram({
  token: t_token.token(),
  updates: {
    enabled: true,
    get_interval: 40
  }
});

var getRandom = function getRandomArbitrary() {
  return Math.random() * (9600 - 100) + 100;
}

api.on('message', function(message)
{
  var chat_id = message.chat.id;
  message.text = message.text ? message.text : "this is bad";

  if(message.text == '/start') {
    api.sendMessage({
      chat_id: message.chat.id,
      text: "Yes lets start :) \n \n /quiz - Start a Quiz section \n /statistics - Get my statistics \n /help - Get help from people behind PSC HUB \n /about - about the developers \n /pegke - A Customer Loyalty Software\n /end - Stop Quiz\n"
    });
  } else if(message.text == '/quiz') {

    MongoClient.connect(url, function(err, db) {
      var collection = db.collection('questions');
      // Find some documents
      collection.ensureIndex( { _id : 1, uid:1 } )
      collection.find({}).toArray(function(err, docs) {
        var qcollection = db.collection('quizlive');
        // Insert some documents
        qcollection.update(
          {uid : message.from.id},
          {uid : message.from.id, question: docs[0]},
          {upsert: true }
        );
        var body = docs[0],
            msgTxt = {"keyboard": [["A", "B"], ["C", "D"], ["Report"]], "one_time_keyboard": true},
            theQuestion = body.qst + "\n\nA) " + body.a +  "\nB) " + body.b + "\nC) " + body.c + "\nD) " + body.d;
          api.sendMessage({
            chat_id: message.chat.id,
            reply_markup: JSON.stringify(msgTxt),
            text: theQuestion,
            parse_mode: "Markdown"
          });
      });


    });

  } else if(message.text.match(/^[abcdr]$/i) ) {
    MongoClient.connect(url, function(err, db) {
      var collection = db.collection('quizlive');
      // Find some documents
      collection.ensureIndex( { _id : 1, uid: 1} );
      collection.find({uid: message.from.id}).toArray(function(err, docs) {
        var corrAns = docs[0].question.ans,
            text = '',
            reply = message.text,
            lastQ = docs[0].question.qid;
        if(corrAns == reply) {
          var text = '👍 Correct !!';
        } else {
          var text = '👎 Wrong !!, ' + corrAns;
        }

        var qcollection = db.collection('questions');
        // Find some documents
        qcollection.ensureIndex( { _id : 1, uid: 1} );
        qcollection.find({ qid: { $lt: lastQ } } ).limit(1).toArray(function(err, cdocs) {
          // Insert some documents
          collection.update(
            {uid : message.from.id},
            {uid : message.from.id, question: cdocs[0]},
            {upsert: true }
          );
          var body = cdocs[0],
              msgTxt = {"keyboard": [["A", "B"], ["C", "D"], ["Report"]], "one_time_keyboard": true},
              theQuestion = text + "\n\n" + body.qst + "\n\nA) " + body.a +  "\nB) " + body.b + "\nC) " + body.c + "\nD) " + body.d;
            api.sendMessage({
              chat_id: message.chat.id,
              reply_markup: JSON.stringify(msgTxt),
              text: theQuestion,
              parse_mode: "Markdown"
            });
        });


      });
    });



  } else if(message.text == '/pegke') {
    api.sendMessage({
      chat_id: message.chat.id,
      text: 'Pegke Everything your Business need to create a Successful Loyalty Program and build Customer Relationships https://pegke.com'
    });
  } else if(message.text == 'Report') {
    api.sendMessage({
      chat_id: message.chat.id,
      text: 'We are working on it, please contact our admin @niksmac or @sibizulu if you have any suggestions.'
    });
  } else if(message.text == '/statistics') {
    api.sendMessage({
      chat_id: message.chat.id,
      text: 'We are working on it, please contact our admin @niksmac or @sibizulu if you have any suggestions.'
    });
  } else if(message.text == '/about') {
    api.sendMessage({
      chat_id: message.chat.id,
      text: 'With bundle of questions in General English, Numerical ability , Computer knowledge and many more in various categories.Each category consists of various subcategories consisting of 100 or more questions. http://bit.ly/pschubapp'
    });
  } else if(message.text == '/end') {
    MongoClient.connect(url, function(err, db) {
      var collection = db.collection('quizlive');
      collection.remove({uid : message.from.id}, function(err, result) { });
      api.sendMessage({
        chat_id: message.chat.id,
        text: 'Please feel free to share @pschub_bot with your friends. \n Thank you. 😊'
      });
    });
  } else {
    api.sendMessage({
      chat_id: message.chat.id,
      text: "Bots are simply Telegram accounts operated by software – not people – and they'll often have Artificial intelligence features. \nBut, sorry I really dont know what to do with -" + message.text + "-"
    });
  }

  // It'd be good to check received message type here
  // And react accordingly
  // We consider that only text messages can be received here


});



var insertDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Insert some documents
  collection.insert([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the document collection");
    callback(result);
  });
};

var findDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('questions');
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    assert.equal(2, docs.length);
    console.log("Found the following records");
    console.dir(docs);
    callback(docs);
  });
}


var insertQuestions = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('questions');
  // Insert some documents
  collection.insert([
    {
    "qst": "Name the Telugu Desam Party founder whose statue will be installed in Parliament House in India.",
    "a": "Rajshekhar Reddy",
    "b": "N.T.Rama Rao ",
    "c": " ChandraBabu Naidu",
    "d": "Rajnikanth ",
    "ans": "1"
},
{
    "qst": "The Grass Court King, Roger Federer on 16 June 2013 won Gerry Weber Open Halle ATP final after defeating Mikhail Youzhny of Russia by 6-7 (5/7), 6-3, 6-4 at the Gerry Weber Stadium in Halle, Germany. This is the _________ title won by Federer in the year 2013 and sixth Halle Title and 77th title of the career.",
    "a": "Second",
    "b": "Third",
    "c": "Fourth",
    "d": "first",
    "ans": "3"
},
{
    "qst": "The minister who resinged from Central Cabinet during the wake off Chinese aggression",
    "a": "H.K.L Bhagat",
    "b": "V.C Shukla",
    "c": "V.K Krishna Menon",
    "d": "Jaffer Sheriff",
    "ans": "2"
}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the document collection");
    callback(result);
  });
};

var findRandomQuestion = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('questions');
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    console.dir(docs[0]);
    callback(docs[0]);
  });
}



