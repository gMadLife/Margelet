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
    socket.emit("receiveHistory");
  });

  socket.on("message", addMessage);

  socket.on("history", messages => {
    for (let message of messages) {
      addMessage(message);
    }
  });

  $(".chat-message button").on("click", e => {
    e.preventDefault();

    var messageBox = $("textarea[name='message']");
    var messageContent = messageBox.val().trim();

    var chatName = $(".about-name").text();

    if (messageContent !== "") {
      socket.emit("msg", messageContent, chatName);
      messageBox.val("");
    }
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
      
      //fix sending and it hould be good
      //socket.emit("FIXME", inputStr);
      //socket.emit("CUNT", descrStr);

    }
  });
////////////////////////////////////////////////////////////////////

  function encodeHTML(str) {
    return $("<div />")
      .text(str)
      .html();
  }

  function addMessage(message) {
    message.date = new Date(message.date).toLocaleString();
    message.username = encodeHTML(message.username);
    message.content = encodeHTML(message.content);

    var html = `
            <li>
                <div class="message-data">
                    <span class="message-data-name">${message.username}</span>
                    <span class="message-data-time">${message.date}</span>
                </div>
                <div class="message my-message" dir="auto">${message.content}</div>
            </li>`;

    $(html)
      .hide()
      .appendTo(".chat-history ul")
      .slideDown(200);

    //$(".chat-history").animate(
    //  { scrollTop: $(".chat-history")[0].scrollHeight },
    //  1000
    //);
  }

});
