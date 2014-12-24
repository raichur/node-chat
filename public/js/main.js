$(function($){
  var socket = io.connect(),
  $messageForm = $('#send-message'),
  $nickForm = $('#setNick'),
  $nickError = $('#nickError'),
  $nickBox = $('#nickname'),
  $messageBox = $('#message'),
  $users = $('#users'),
  $nickWrap = $('#nickWrap'),
  $contentWrap = $('#contentWrap'),
  $chat = $('#chat');


  $nickForm.submit(function(e){
    e.preventDefault();
    socket.emit('new user', $nickBox.val(), function(data){
      if(data){
        $nickWrap.hide();
        $contentWrap.show();
      } else {
        $nickError.html('Username already taken. Please try again.');
      }
    });
    $nickBox.val('');
  });

  $messageForm.submit(function(e){
    e.preventDefault();
    socket.emit('send message', $messageBox.val(), function(data){
      $chat.append('<span class="error"><b>' + data + '</span><br/>');
    });
    $messageBox.val('');
  });
  socket.on('whisper', function(data){
    $chat.append('<span class="whisper"><b>' + data.nick + ': </b>' + data.msg + '</span><br/>');
  });
  socket.on('new message', function(data){
    displayMessage(data);
  });

  function displayMessage(data){
    $chat.append('<span class="msg"><b>' + data.nick + ': </b>' + data.msg + '</span><br/>');
  }

  socket.on('usernames', function(data){
    var html = '';
    for(var i = 0; i < data.length; i++){
      html += data[i] + '<br/>';
    }
    $users.html(html);
  });
  socket.on('load old msgs', function(docs){
    for(var i=docs.length-1; i >= 0; i--) {
      displayMessage(docs[i]);
    }
  });


});
