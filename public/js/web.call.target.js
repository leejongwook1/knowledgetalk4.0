const CPCODE = "KP-CCC-demouser-01";
const AUTHKEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidGVzdHNlcnZpY2UiLCJtYXhVc2VyIjoiMTAwIiwic3RhcnREYXRlIjoiMjAyMC0wOC0yMCIsImVuZERhdGUiOiIyMDIwLTEyLTMwIiwiYXV0aENvZGUiOiJLUC1DQ0MtdGVzdHNlcnZpY2UtMDEiLCJjb21wYW55Q29kZSI6IkxJQy0wMyIsImlhdCI6MTU5Nzk3NjQ3Mn0.xh_JgK67rNPufN2WoBa_37LzenuX_P7IEvvx5IbFZI4";

document.addEventListener("DOMContentLoaded", function () {
  const localVideo = document.getElementById("localVideo");
  const remoteVideo = document.getElementById("remoteVideo");

  const CreateRoomBtn = document.getElementById("CreateRoomBtn");
  const RoomJoinBtn = document.getElementById("RoomJoinBtn");
  const SDPBtn = document.getElementById("SDPBtn");

  let reqNo = 1;
  let localStream;
  let peerCon;
  let configuration = [];

  let members;
  let roomId;
  let userId;
  let host;

  let peers = {};
  let streams = {};

  CreateRoomBtn.addEventListener("click", function (e) {
    let createData = {
      cpCode: CPCODE,
      authKey: AUTHKEY,
      eventOp: "CreateRoom",
    };

    try {
      tLogBox("send", createData);
      signalSocketIo.emit("knowledgetalk", createData);
    } catch (err) {
      if (err instanceof SyntaxError) {
        alert(" there was a syntaxError it and try again : " + err.message);
      } else {
        throw err;
      }
    }
  });

  RoomJoinBtn.addEventListener("click", function (e) {
    let RoomJoinData = {
      cpCode: CPCODE,
      authKey: AUTHKEY,
      eventOp: "RoomJoin",
      roomId: roomIdInput.value,
    };

    try {
      tLogBox("send", RoomJoinData);
      signalSocketIo.emit("knowledgetalk", RoomJoinData);
    } catch (err) {
      if (err instanceof SyntaxError) {
        alert(" there was a syntaxError it and try again : " + err.message);
      } else {
        throw err;
      }
    }
  });

  signalSocketIo.on("knowledgetalk", function (data) {
    tLogBox("receive", data);

    if (!data.eventOp) {
      tLogBox("error", "eventOp undefined");
    }

    //통화 방 생성 응답
    if (data.eventOp === "CreateRoom") {
      tTextbox(`방이 생성되었습니다.`);
      roomIdInput.value = data.roomId;

      roomIdInput.select();
      roomIdInput.setSelectionRange(0, 99999);
      document.execCommand("copy");

      alert("room id copied");

      CreateRoomBtn.disabled = true;
    }

    //방 입장
    else if (data.eventOp === "RoomJoin") {
      tTextbox(`방에 입장하었습니다.`);
      userId = data.userId;
      members = data.members;

      RoomJoinBtn.disabled = true;
      CreateRoomBtn.disabled = true;
    }

    //startsession
    else if (data.eventOp === "StartSession") {
      tTextbox(`다른 사용자가 입장하였으니 통화 시작합니다.`);

      members = Object.keys(data.members);
      console.log("통화시작");
    }
  });
});
