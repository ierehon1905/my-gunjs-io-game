import P5 from "p5";

interface Player {
  positionX: number;
  positionY: number;
  color: string;
  name: string;
  health: number;
  id: string;
}

interface P5Player extends Player {
  position: P5.Vector;
}

type DB = {
  players: {
    [id: string]: Player;
  };
};

enum Direction {
  Up = 87,
  Down = 83,
  Left = 65,
  Right = 68,
}

// ["http://185.104.249.143:8765/gun"]

const gun = Gun<DB>({
  peers: [
    "http://185.104.249.143:8765/gun",
    "http://localhost:8765/gun",
    // 'https://mvp-gun.herokuapp.com/gun', 'https://e2eec.herokuapp.com/gun'
  ],
});

let myId = localStorage.getItem("userId");
if (!myId) {
  myId = Date.now().toString() + "_" + Math.random().toString().substring(2);
  localStorage.setItem("userId", myId);
}

console.log({ myId });

const players = new Map<string, Player>();

setInterval(() => {
  let cleaned = 0;
  for (const [k, value] of players) {
    if (!value) {
      cleaned += 1;
      players.delete(k);
    }
  }

  if (cleaned) {
    console.log("Cleaned", cleaned);
  }
}, 1000);

const InitialPlayer: Player = {
  id: myId,
  name: "Leon",
  color: "unset",
  positionX: 0,
  positionY: 0,
  health: 100,
};

gun
  .get("players")
  .get(myId)
  .not((key) => {
    console.log(`Player with key ${key} not found in base`);
    gun.get("players").get(myId).put(InitialPlayer);
  })
  .load((data = {} as Player) => {
    console.log("Player found", data);

    const myPlayer = _.merge(_.cloneDeep(InitialPlayer), data);
    players.set(myId, myPlayer);
    console.log({ players });
    gun.get("players").get(myId).put(myPlayer);

    initP5();
  });

const consts = {
  tileSize: 25,
};

const me = () => players.get(myId);

gun.get("players").load((data) => {
  console.log("Init");
  for (const key in data) {
    if (key === myId) continue;
    players.set(key, data[key]);
  }
});

gun
  .get("players")
  .map()
  .on((data: Player) => {
    if (!data) return;
    if (data.id === myId) {
      return;
    }

    players.set(data.id, data);
  });

const initP5 = () =>
  new p5((s: P5) => {
    const rawMe = me();
    const p5Me: P5Player = {
      ...rawMe,
      position: s.createVector(rawMe.positionX, rawMe.positionY),
    };

    s.setup = () => {
      s.createCanvas(document.body.clientWidth, document.body.clientHeight);

      s.noStroke();
      console.log("P5 setpu");
      s.frameRate(30);

      if (!p5Me.color || p5Me.color === "unset") {
        const myNewColor: string = s.random([
          "red",
          "green",
          "blue",
          "yellow",
          "cyan",
          "brown",
          "white",
          "orange",
        ]);
        console.log("Setting my color to", myNewColor);

        gun.get("players").get(myId).get("color").put(myNewColor);
        p5Me.color = myNewColor;
      }

      console.log("my position", p5Me);
    };

    s.doubleClicked = (e) => {
      console.log("Erasing");

      // gun.get("players").map((v, id) => {
      //   gun.get("players").get(id).put(null);
      // });
      for (const [k, value] of players) {
        if (k === myId) continue;
        gun.get("players").get(k).put(null);
        players.delete(k);
      }
    };

    const move = _.throttle(
      (x: number, y: number) => {
        p5Me.position.add(x * consts.tileSize, y * consts.tileSize);

        gun
          .get("players")
          .get(myId)
          .get("positionX")
          .put(p5Me.position.x)
          .back(1)
          .get("positionY")
          .put(p5Me.position.y);
      },
      100,
      {
        leading: true,
        trailing: false,
      }
    );

    s.draw = () => {
      s.background("#000");
      if (s.keyIsDown(Direction.Up)) {
        move(0, -1);
      } else if (s.keyIsDown(Direction.Down)) {
        move(0, 1);
      } else if (s.keyIsDown(Direction.Left)) {
        move(-1, 0);
      } else if (s.keyIsDown(Direction.Right)) {
        move(1, 0);
      }
      s.translate(s.width / 2, s.height / 2);

      // Center
      s.push();
      s.fill("yellow");
      s.circle(0, 0, 10);
      s.pop();

      // ME
      s.push();
      s.fill(p5Me.color);
      s.circle(p5Me.position.x, p5Me.position.y, p5Me.health);
      s.pop();

      s.push();
      for (const [k, value] of players) {
        if (k === myId || !value) continue;

        // console.log("Drawing other circles", value.positionX, value.positionY);
        s.fill(value.color);
        s.circle(value.positionX, value.positionY, value.health);
      }
      s.pop();
    };
  }, "root");
