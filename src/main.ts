import Gun from "gun/gun";

type DB = {
  chats: {
    [chatName: string]: {
      messages: { [messageId: string]: string };
    };
  };
};

function main() {
  // ["http://185.104.249.143:8765/gun"]
  const gun = Gun<DB>();

  // gun.get("mark").put({
  //   name: "Mark",
  //   email: "mark@gunDB.io",
  // });

  gun
    .get("chats")
    .get("my_first_chat")
    .get("messages")
    .get("0")
    .put("hello my friend")
    .promise()
    .then((res) => {
      console.log(res);
    });

  gun
    .get("chats")
    .get("my_first_chat")
    .get("messages")
    .map()
    .on((d, c) => {
      console.log(d);
    });
}

setTimeout(() => {
  main();
}, 100);
