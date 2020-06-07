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
    console.log("Connected!");
    socket.emit("getChatList");
  });

  socket.on("message", addMessage);
  
  socket.on("chatList", chats => {
    for (let chat of chats) {
      addChat(chat);
    }

    if (currentChat() == null && chats.length > 0) {
      console.log("Switching to " + chats[0].name);
      setCurrentChat(chats[0]._id);
    }
    else {
      console.log("Current " + currentChat());
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
    console.log(`Setting current chat to ${chatId}`);

    $("label[name='chat-id']").text( encodeHTML(chatId) );
    socket.emit("getChat", chatId);
  }

/////////////////////////////////////////////////////////////////////////////
  socket.on("chat", (chat) => {
    console.log(`Chat event for ${chat.name} (${chat.id})`);

    var b = 0;
    $(".chat-btn button").each((index) => {
      if ($(this).id == chat._id ) { b = 1; }    
    });

    if (b = 0) {
      addChat(chat);
    }
      addUserList(chat.users);
      $("label[name='about-name-label'").text(  encodeHTML(chat.title) );
      $("pre[name='about-label']").text(  encodeHTML(chat.description) );
      socket.emit("getChatHistory", chat._id);

      //setCurrentChat(chat._id);
    

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
    console.log("currentChat"+$("label[name='chat-id']").length);

    var chatId = $("label[name='chat-id']").text();
    if (chatId == "") {
      chatId = null;
    }
    
    return chatId;
  }

  // function addChat(chat) {
  //   chat.title = encodeHTML(chat.title)
  //   chat.description = encodeHTML(chat.description);
  //   //chat.admin = encodeHTML(chat.admin);
  //   //chat.id
  //   console.log(`Adding chat ${chat.title} (${chat._id})`);

  //   var html = null;
    
  //   html = `
  //   <button id="${chat._id}" name="hitler" class="btn btn-primary text-left mt-2 mr-2 w-100" style="height:fit-content">${chat.title}</button>`;
  //   $(html)
  //     .appendTo("span[name='chat-list']");
  // }


  function addChat(chat) {
  
    var element = document.createElement("button");
    //Assign different attributes to the element. 
    element.textContent = encodeHTML(chat.title);
    element.id = chat._id;
    element.classList = "chat-btn btn btn-primary text-left mt-2 mr-2 w-100";


    element.onclick = function() { // Note this is a function
      setCurrentChat( element.id );
    };

    var foo = document.getElementById("clz");
    //Append the element in page (in span).  
    foo.appendChild(element);
  }

});





