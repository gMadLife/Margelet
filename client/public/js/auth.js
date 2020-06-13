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
    console.log("Event chat history");
    clearMessages();
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

    var status = "";
    if ( document.getElementById("radio-anc-1").checked ) {
      status = "0";
    } else if ( document.getElementById("radio-anc-2").checked ) {
      status = "1";
    } else if ( document.getElementById("radio-anc-3").checked ) {
      status = "2";
    } else {
      console.log("status error");
      status = "";
    }

    const chat = {
      title: name,
      description: description,
      status: status,
    }
    socket.emit("submitChat", chat);
  });

  // "About section" html editing ======================================================================================
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
    
    if ( $("#status").hasClass( "status-0" ) ) {
      document.getElementById("radio1").checked = true;
    } else if ( $("#status").hasClass( "status-1" ) ) {
      document.getElementById("radio2").checked = true;
    } else if ( $("#status").hasClass( "status-2" ) ) {
      document.getElementById("radio3").checked = true;
    }

  });
  // same =====================
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
      
      $("#status").removeClass("status-0");
      $("#status").removeClass("status-1");
      $("#status").removeClass("status-2");
      
      var status = "";
      if ( document.getElementById("radio1").checked ) {
        status = "0";
      } else if ( document.getElementById("radio2").checked ) {
        status = "1";
      } else if ( document.getElementById("radio3").checked ) {
        status = "2";
      } else {
        console.log("status error");
        status = "";
      }

      $("#status").addClass( "status-" + status );

      const chat = {
        title: inputStr,
        description: descrStr,
        status: status,
        _id: currentChat(),
      }
      socket.emit("submitEditChat", chat);
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
    console.log(`Chat event for ${chat.title} (${chat._id})`);

    var chatExists = false;
    $(".chat-btn").each((index, value) => {
      if (value.id == chat._id ) { chatExists = true; }
    });

    if (!chatExists) {
      addChat(chat);
    }

    addUserList(chat.users);
    $("label[name='about-name-label'").text(  encodeHTML(chat.title) );
    $("pre[name='about-label']").text(  encodeHTML(chat.description) );

    $("#status").removeClass("status-0");
    $("#status").removeClass("status-1");
    $("#status").removeClass("status-2");
    $("#status").addClass("status-" + chat.status);

    $("#"+chat._id).text( encodeHTML(chat.title) );

    socket.emit("getChatHistory", chat._id);

      //setCurrentChat(chat._id);

  });

  function addUserList(users) {
  $("span[name='chatters']").html("");

    var html = null;

    for (let user of users) {
      html = `<button type="button" class="user-btn btn btn-primary text-left w-100 mt-3">${user}</button>`;
      $(html)
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

  function addChat(chat) {
    
    console.log("addChat " + chat.title + " (" + chat._id + ") ");


    var element = document.createElement("button");
    //Assign different attributes to the element. 
    element.textContent = encodeHTML(chat.title);
    element.id = chat._id;
    element.classList = "chat-btn btn btn-primary text-left mt-2 pr-2 w-100";


    element.onclick = function() { // Note this is a function
      setCurrentChat( element.id );
    };

    var foo = document.getElementById("clz");
    //Append the element in page (in span).  
    foo.appendChild(element);
  }

  $("button[name='add-users-btn']").on("click", e => {
    e.preventDefault();
    socket.emit("getUserList");
  });

  socket.on("userList", (users) => {
  console.log("possible users shown");

    $("div[name='new-chatters']").html("");
    var html = null;
    
    var oldUserList = [];

    $(".user-btn").each((index, value) => {
      oldUserList.push(value.textContent);
    });

    for (let user of users) {
      var us = false;
      
      $(".user-btn").each((index, value) => {
        if (value.textContent == user) { us = true; }
      });

      if (!us) {
        (function (user, oldUserList) {
        var element = document.createElement("button");
        //Assign different attributes to the element. 
        element.textContent = encodeHTML(user);
        element.name = encodeHTML(user);
        element.classList = "new-user-btn btn btn-primary text-left w-100 mt-2";
    
        var newUserList = oldUserList.slice(0);
    
        element.onclick = function() { // Note this is a function
          var newUserList = [element.name, ...oldUserList];
          newUserList.sort();
          //console.log(newUserList);
          var chat = {
            users: newUserList,
            _id: currentChat(),
          }
          socket.emit("submitEditChat", chat);
          document.getElementById("close-new-user").click();
        };
    
        var foo = document.getElementById("new-chatters");
        foo.appendChild(element);
        // html = <button type="button" name="${user}" class="new-user-btn btn btn-primary text-left w-100 mt-3">${user}</button>;
        // $(html)
        //   .appendTo("div[name='new-chatters']");
        }) (user, oldUserList);
     }



    }

    //input.click();
  });

});

