const CPCODE = "KP-CCC-demouser-01";
const AUTHKEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidGVzdHNlcnZpY2UiLCJtYXhVc2VyIjoiMTAwIiwic3RhcnREYXRlIjoiMjAyMC0wOC0yMCIsImVuZERhdGUiOiIyMDIwLTEyLTMwIiwiYXV0aENvZGUiOiJLUC1DQ0MtdGVzdHNlcnZpY2UtMDEiLCJjb21wYW55Q29kZSI6IkxJQy0wMyIsImlhdCI6MTU5Nzk3NjQ3Mn0.xh_JgK67rNPufN2WoBa_37LzenuX_P7IEvvx5IbFZI4";

document.addEventListener("DOMContentLoaded", function () {
  const localVideo = document.getElementById("localVideo");
  const remoteVideo = document.getElementById("remoteVideo");

  const CreateRoomBtn = document.getElementById("CreateRoomBtn");
  const RoomJoinBtn = document.getElementById("RoomJoinBtn");
  const SDPBtn = document.getElementById("SDPBtn");
  const exitBtn = document.getElementById("exitBtn");

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

  SDPBtn.addEventListener("click", async () => {
    let sdp = await createSDPOffer(userId);
    console.log(userId);

    let data = {
      cpCode: CPCODE,
      authKey: AUTHKEY,
      eventOp: "SDP",
      roomId: roomIdInput.value,
      sdp: sdp,
      usage: "cam",
      userId: userId,
      host: true,
    };

    try {
      tLogBox("send", data);
      signalSocketIo.emit("knowledgetalk", data);
    } catch (err) {
      if (err instanceof SyntaxError) {
        alert(" there was a syntaxError it and try again : " + err.message);
      } else {
        throw err;
      }
    }
  });

  exitBtn.addEventListener("click", function (e) {
    localStream.getTracks()[0].stop();
    localStream.getTracks()[1].stop();
    localStream = null;
    peerCon.close();
    peerCon = null;

    localVideo.srcObject = null;
    remoteVideo.srcObject = null;

    CreateRoomBtn.disabled = false;
    RoomJoinBtn.disabled = false;
    SDPBtn.disabled = true;
    exitBtn.disabled = true;

    let EndData = {
      cpCode: CPCODE,
      authKey: AUTHKEY,
      eventOp: "ExitRoom",
      roomId: roomId,
      userId: userId,
    };

    try {
      tLogBox("send", EndData);
      signalSocketIo.emit("knowledgetalk", EndData);

      //추가한부분 : 텍스트박스 내용변경
      tTextbox("전화를 종료했습니다.");
    } catch (err) {
      if (err instanceof SyntaxError) {
        alert("there was a syntaxError it and try again:" + err.message);
      } else {
        throw err;
      }
    }
  });

  /******** event receive *******/
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

      members = {
        ...Object.keys(data.members),
      };
      console.log(members);

      SDPBtn.disabled = false;
      host = data.host;

      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then((stream) => {
          localStream = stream;
          localVideo.srcObject = stream;
        })
        .catch((err) => {
          alert("카메라 또 마이크를 활성화 해주시기 바랍니다.");
        });

      peerCon = new RTCPeerConnection();
      peerCon.ontrack = onAddStreamHandler;
    }

    //startsession
    else if (data.eventOp === "StartSession") {
      tTextbox(`다른 사용자가 입장하였으니 통화 시작합니다.`);

      SDPBtn.disabled = false;
    }

    //SDP Offer/ANSWER
    else if (data.eventOp === "SDP") {
      if (data.useMediaSvr == "N") {
        if (data.sdp && data.sdp.type == "offer") {
          createSDPAnswer(data);
        } else if (data.sdp && data.sdp.type == "answer") {
          peerCon.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
        console.log(peerCon);
        SDPBtn.disabled = true;
        exitBtn.disabled = false;
      }
    }

    //Presence 응답
    else if (data.signalOp === "Presence" && data.action === "exit") {
      localStream.getTracks()[0].stop();
      localStream.getTracks()[1].stop();
      localStream = null;
      peerCon.close();
      peerCon = null;

      localVideo.srcObject = null;
      remoteVideo.srcObject = null;

      CreateRoomBtn.disabled = false;
      RoomJoinBtn.disabled = false;
      SDPBtn.disabled = true;
      exitBtn.disabled = true;
      tTextbox("통화가 종료되었습니다.");
    }
  });

  //sdp offer
  const createSDPOffer = async (id) => {
    return new Promise(async (resolve, reject) => {
      localStream.getTracks().forEach((track) => {
        peerCon.addTrack(track, localStream);
      });

      peerCon
        .createOffer()
        .then((sdp) => {
          peerCon.setLocalDescription(sdp);
          return sdp;
        })
        .then((sdp) => {
          resolve(sdp);
        });
    });
  };

  //send sdp answer
  const createSDPAnswer = async (data) => {
    peerCon = new RTCPeerConnection();
    peerCon.ontrack = (e) => {
      streams = e.streams[0];

      remoteVideo.srcObject = streams;
    };
    console.log(data);

    await peerCon.setRemoteDescription(data.sdp);
    let answerSdp = await peerCon.createAnswer();
    await peerCon.setLocalDescription(answerSdp);

    console.log(answerSdp);
    console.log(peerCon);

    // peerCon.onicecandidate = (e) => {
    // if (!e.candidate) {
    let reqData = {
      cpCode: CPCODE,
      authKey: AUTHKEY,
      eventOp: "SDP",
      sdp: peerCon.localDescription,
      roomId: data.roomId,
      usage: "cam",
      userId: userId,
    };

    try {
      tLogBox("send", reqData);
      signalSocketIo.emit("knowledgetalk", reqData);
    } catch (err) {
      if (err instanceof SyntaxError) {
        alert(" there was a syntaxError it and try again : " + err.message);
      } else {
        throw err;
      }
    }
    // }
    // };
  };

  function onAddStreamHandler(e) {
    remoteVideo.srcObject = e.streams[0];
  }
});
