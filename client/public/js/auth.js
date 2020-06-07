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


    $(".chat-about-label button").on("click", e => {
      e.preventDefault();


      $("button[class='btn-label']").addClass(d-none);
      console.log("painis");
  
      //var selector = $("pre[name='about-label']");
      //var messageContent = selector.val().trim();
      //socket.emit("msg", messageContent);
      //selector.val("");
       
      
    });


    $(".chat-about-description button").on("click", e => {
      e.preventDefault();
  
      var selector = $("textarea[name='about-text']");
      var messageContent = selector.val().trim();
      if (messageContent !== "") {
        //socket.emit("msg", messageContent);
        selector.val("");
      
      }
    });


  }
});

/*
$(".chat-message button").on("click", e => {
  e.preventDefault();

  var selector = $("textarea[name='message']");
  var messageContent = selector.val().trim();
  if (messageContent !== "") {
    socket.emit("msg", messageContent);
    selector.val("");
  }
});
*/