var express = require('express'),
app = express(),
server = require('http').createServer(app),
io = require('socket.io').listen(server),
mongoose = require('mongoose'),
users = {};
var port = process.env.PORT || 3000;
server.listen(port);
mongoose.connect('MONGOHQ_URL', function(err){
  if(err){
    console.log("err");
  } else {
    console.log("connected");
  }
});

var chatSchema = mongoose.Schema({
  nick: String,
  msg: String,
  created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', function(socket){
  var query = Chat.find({});
  query.sort('-created').limit(20).exec(function(err, docs){
    if(err) throw err;
    console.log("sending old msgs");
    socket.emit('load old msgs', docs);
  });

  socket.on('new user', function(data, callback){
    if(data in users){
      callback(false);
    } else {
      callback(true);
      socket.nickname = data;
      users[socket.nickname] = socket;
      updateNicknames();
    }
  });
  function updateNicknames() {
    io.sockets.emit('usernames', Object.keys(users));
  }
  socket.on('send message', function(data, callback){
    var msg = data.trim();
    if(msg.substr(0,3) === "/w "){
      msg = msg.substr(3);
      var ind = msg.indexOf(' ');
      if(ind !== -1){
        var name = msg.substring(0, ind);
        var msg = msg.substring(ind+1);
        if(name in users){
          users[name].emit('whisper', {msg: msg, nick: socket.nickname});
          console.log("whisper");
        } else {
          callback('Error: Enter a valid user');
        }
      } else {
        callback('Error: please enter a message and a user.');
      }
    } else {
      var newMsg = new Chat({msg: msg, nick: socket.nickname});
      newMsg.save(function(err){
        if(err) throw err;
        io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
      });
    }
  });

  socket.on('disconnect', function(data){
    if(!socket.nickname) return;
    delete users[socket.nickname];
    updateNicknames();
  });
});
