function response(data) {
  let resp = data.responseText;
  try {
    if (data.message != void 0) {
      resp = data.message;
    } else {
      resp = JSON.parse(data.responseText);
      resp = resp.message;
    }
  } catch (e) {}
  return resp;
}

$(".logout-btn").on("click", e => {
  e.preventDefault();
  $.ajax({
    url: "/logout",
    type: "POST",
    data: {},
    success: res => {
      alert(response(res));
      location.reload();
    },
    error: res => {
      alert(response(res));
    }
  });
});

$(document).ready(() => {
  var socket = io.connect("/");
  socket.on("connected", function(msg) {
    socket.emit("getChatList");
  });

  socket.on("message", addMessage);
  
  socket.on("chatList", chats => {
    for (let chat of chats) {
      addChat(chat);
    }

    if ( (currentChat() == null) && ( chats.length > 0 )) {
      setCurrentChat(chats[0]._id);
    }
  });

  socket.on("chatHistory", (chatId, messages) => {
    for (let message of messages) {
      addMessage(message);
    }
  });

  // Submit text message ===============================================================================================
  $(".chat-message button[type='submit']").on("click", e => {
    e.preventDefault();

    var messageBox = $("textarea[name='message']");
    var messageContent = messageBox.val().trim();

    var chatId = currentChat();

    if (messageContent !== "") {
      socket.emit("submitMessage", chatId, messageContent, null);
      messageBox.val("");
    }
  });

  // Attach file =======================================================================================================
  $(".chat-message button[type='attach']").on("click", e => {
    e.preventDefault();

    var input = document.createElement('input');
    input.type = 'file';

    input.onchange = e => { 
      var file = e.target.files[0];

      var reader = new FileReader();
      reader.readAsArrayBuffer(file);

      // here we tell the reader what to do when it's done reading...
      reader.onload = readerEvent => {
        var content = readerEvent.target.result; // this is the content!
        console.log(content);
        var chatId = currentChat();

        socket.emit("submitMessage", chatId, file.name, content);
      }
    }

    input.click();
  });

  // Add new chat ======================================================================================================
  $("button[name='add-chat']").on("click", e => {
    e.preventDefault();

    name = $("input[name='new-name-input']").val();
    description = $("textarea[name='new-text']").val();
    socket.emit("submitChat", name, description);
  });

////////////////////////////////////////////////////////////////////////
  $(".chat-about-label button").on("click", e => {
    e.preventDefault();

    //get chat name from label to input
    $("input[name='about-name-input']").val( $("label[name='about-name-label']").text() );
    //get text from description to editor
    $("textarea[name='about-text']").text( $("pre[name='about-label']").text() );
    //hide label-like about
    $(".chat-about-label").addClass("d-none");
    //show editor-like about    
    $(".chat-about-description").removeClass("d-none");
  });



  $(".chat-about-description button").on("click", e => {
    e.preventDefault();

    var inputStr = $("input[name='about-name-input']").val();
    var descrStr = $("textarea[name='about-text']").val();

    if ( ( inputStr !== "" ) && 
        ( descrStr !== "" ) ) {
      //get chat name from input to label
      $("label[name='about-name-label']").text( inputStr );
      //get text from editor to description
      $("pre[name='about-label']").text( descrStr );
      //show label-like about
      $(".chat-about-label").removeClass("d-none");
      //hide editor-like about    
      $(".chat-about-description").addClass("d-none");
      
      socket.emit("submitEditChat", currentChat(), inputStr, descrStr);
    }
  });
////////////////////////////////////////////////////////////////////
  function clearMessages() {
    $("ul[name='messages-list'").empty();
  }


  function encodeHTML(str) {
    return $("<div />")
      .text(str)
      .html();
  }

  function addMessage(message) {
    if(currentChat() != message.chat) return;

    message.date = new Date(message.date).toLocaleString();
    message.username = encodeHTML(message.username);
    message.content = encodeHTML(message.content);

    var html = null;

    if (message.file != null) {
      html = `
      <li>
        <div class="message-data">
          <span class="message-data-name">${message.username}</span>
          <span class="message-data-time">${message.date}</span>
        </div>
        <div class="message my-message" dir="auto">
          <a href="./uploads/${message.file}" download="${message.content}">${message.content}</a>
        </div>
      </li>
      `;
    }
    else {
      html = `
        <li>
          <div class="message-data">
            <span class="message-data-name">${message.username}</span>
            <span class="message-data-time">${message.date}</span>
          </div>
          <div class="message my-message" dir="auto">${message.content}</div>
        </li>`;
    }

    $(html)
      .hide()
      .appendTo(".chat-history ul")
      .slideDown(200);

    //$(".chat-history").animate(
    //  { scrollTop: $(".chat-history")[0].scrollHeight },
    //  1000
    //);
  }


  function setCurrentChat(chatId) {
    $("label[name='chat-id'").text( encodeHTML(chatId) );
    socket.emit("getChat", chatId);
  }


  socket.on("chat",(chat) => {
    addUserList(chat.users);
    $("label[name='about-name-label'").text(  encodeHTML(chat.title) );
    $("pre[name='about-label']").text(  encodeHTML(chat.description) );
    socket.emit("getChatHistory", chat.id);
  });


  function addUserList(users) {
    var html = null;

    for (let user of users) {
      html = `<button type="button" class="btn btn-primary text-left w-100 mt-3">${user.username}</button>`;
      $(html)
        .hide()
        .appendTo("span[name='chatters']");
    }

  }


  function currentChat() {
    var chatId = $("label[name='chat-id']").text();
    if (chatId == "") {
      chatId = null;
    }
    
    return chatId;
  }

  function addChat(chat) {
    chat.title = encodeHTML(chat.title)
    chat.description = encodeHTML(chat.description);
    //chat.admin = encodeHTML(chat.admin);
    //chat.id
    console.log(chat.title);

    var html = null;

    html = `
    <button class="btn btn-primary text-left mt-2 mr-2 w-100" style="height:fit-content">${chat.title}<label class="d-none" name="chat-id">${chat._id}</label></button>`;

    $(html)
      //.hide()
      .appendTo("span[name='chat-list']");

    //$(".chat-history").animate(
    //  { scrollTop: $(".chat-history")[0].scrollHeight },
    //  1000
    //);
  }

});





