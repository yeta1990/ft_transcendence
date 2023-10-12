import { Injectable } from '@nestjs/common';
import { ChatMessage, SocketPayload, GameRoom, ChatUser } from '@shared/types';
import { GameGateway } from 'src/events/game.gateway';
@Injectable()
export class PongService {

    private gameContext: any;
    private canvas: any;
    private gameCanvas: any;
    public static keysPressed: boolean[] = [];
    public static playerScore: number = 0;
    public static computerScore: number = 0;
    private player1: PaddleComponent | null = null;
    public static init: boolean = false;
    //pongService:PongService = new PongService();
    public playerOne: boolean = false;
    //private subscriptions = new Subscription();
    //destroy: Subject<any> = new Subject();
    public game: GameRoom;
    public gameGateaway: GameGateway;
    games: Map<string, GameRoom> = new Map<string, GameRoom>;
    //public playerOneVel: number = 0;
    //public playerTwoVel: number = 0;
    public numberOfGames: number = 0;

    initGame (name: string, gameGateaway: GameGateway, viwer: number, nick:string): GameRoom {
        
        if (this.games.get(name))
            return(this.games.get(name));
        this.gameGateaway = gameGateaway;
        this.game = new GameRoom(
            name,               //room
	        "Welcome",          //message
	        "",                 //nick
	        null,               //date
	        0,                  //y
	        0,                  //height           

	        //PaddleOneComponent
	        20,                 //playerOneX
	        400 /2 - 60 / 2,    //playerOneY    //this.canvas.height / 2 - 60 / 2,
	        20,                 //playerOneW
	        60,                 //playerOneH
            10,                 //playerOneS 10
            0,                  //playerOneVel

	        //PaddleTwoComponent
	        700 - (20 + 20),    //playerTwoX    //this.canvas.width - (20 + 20),
	        400 /2 - 60 / 2,    //playerTwoY    //this.canvas.height / 2 - 60 / 2,
	        20,                 //playerTwoW
	        60,                 //playerTwoH
            10,                 //playerTwoS
            0,                  //playerTwoVel

	        //Canvas
	        400,                //canvasheight
	        700,                //canvasWidth

	        //Ball
	        10,                 //ballHeight
	        10,                 //ballWidth
	        5,                  //ballSpeed
	        0,                  //ballXVel
	        0,                  //ballYVel
	        700 /2 - 10 / 2,    //ballX         //this.canvas.width / 2 - 10 / 2,
        	400 /2 - 10 / 2,    //ballY         //this.canvas.height / 2 - 10 / 2,
            0,                  //ballDir

	        //Scores
	        0,                  //playerOneScore
	        0,                  //playerTwoScore

            //Mode
            0,                  //gameMode
            true,
            false,

            //Viwer
            viwer,              //viwer
            "",                 //playerOne
            ""                  //playerTwo
        );
        this.randomDir();
        this.games.set(name, this.game);
        this.numberOfGames++;
        if (this.numberOfGames == 1){
            this.updateGame(gameGateaway)
        }
        return (this.games.get(name));
    }

    updateGame(gameGateway :GameGateway){
        this.games.forEach(element => {
            element.gameMode = 1;
            setInterval(()=>{
                this.updateBall(element.room) 
                if (element.playerTwo == "") {
                    this.updateComputer(element);
                }              
                this.move(element);
                const targetUsers: Array<ChatUser> = gameGateway
	            .getActiveUsersInRoom("#pongRoom");
	            for (let i = 0; i < targetUsers.length; i++){
		            gameGateway.server.to(targetUsers[i].client_id).emit('getStatus', this.games.get(this.game.room));
	            }            
            },1000/64)
        }
    //     });
    //     this.game.gameMode = 1;
    //     setInterval(()=>{
    //         this.updateBall() 
    //         if (this.game.playerTwo == "") {
    //             this.updateComputer();
    //         }              
    //         this.move();
    //         const targetUsers: Array<ChatUser> = gameGateway
	// .getActiveUsersInRoom("#pongRoom");
	// for (let i = 0; i < targetUsers.length; i++){
	// 	gameGateway.server.to(targetUsers[i].client_id).emit('getStatus', this.games.get(this.game.room));
	// }            
    //     },1000/64)
    )}

    getStatus(room: string){
        return (this.games.get(room));
    }

    randomDir() {
        var randomDirection = Math.floor(Math.random() * 2) + 1; 
        if(randomDirection % 2){
            this.game.ballXVel = 1;
        }else{
            this.game.ballXVel = -1;
        }
        this.game.ballYVel = 1;
    }

    updateBall(room:string){
        var g = this.games.get(room);
        if(g.pause){
            return;
        }
        //check top canvas bounds
            if(g.ballY <= 10){
              g.ballYVel = 1;
            }
        //check bottom canvas bounds
            if(g.ballY + g.ballHeight >= g.canvasheight - 10){
                g.ballYVel = -1;
            }
        //check left canvas bounds
            if(g.ballX <= 0){  
                g.ballX = g.canvasWidth / 2 - g.ballWidth / 2;
                g.playerTwoScore += 1;
                this.checkScores(g);
            }
        //check right canvas bounds
            if(g.ballX + g.ballWidth >= g.canvasWidth){
                g.ballX = g.canvasWidth / 2 - g.ballWidth / 2;
                g.playerOneScore += 1;
                this.checkScores(g);
            }
        //check player collision
            if(g.ballX <= g.playerOneX + g.playerOneW){
                if(g.ballY >= g.playerOneY && g.ballY  + g.ballHeight <= g.playerOneY + g.playerOneH){
                g.ballXVel = 1;
                }
            }
        //check computer collision
            if(g.ballX + g.ballWidth >= g.playerTwoX){
                if(g.ballY >= g.playerTwoY && g.ballY + g.ballHeight <= g.playerTwoY + g.playerTwoH){
                    g.ballXVel = -1;
                }
            }
            g.ballX += g.ballXVel * g.ballSpeed;
            g.ballY += g.ballYVel * g.ballSpeed;
    }
    checkScores(g: GameRoom){
        if (g.playerOneScore >= 3 || g.playerTwoScore >= 3){
            g.pause = true;
            g.finish = true;
        }
    }

    updateComputer(g: GameRoom){ 
 
        //chase ball
        var yVel = 0;
        if(g.ballY < g.playerTwoY && g.ballXVel == 1){
             yVel = -1; 
      
            if(g.playerTwoY <= 20){
                yVel = 0;
            }
        }
        else if(g.ballY > g.playerTwoY + g.playerTwoH && g.ballXVel == 1){
            yVel = 1;
            
            if(g.playerTwoY + g.playerTwoH >= g.canvasheight - 20){
                yVel = 0;
            }
        }
        else{
            yVel = 0;
        }  
 
        g.playerTwoY += yVel * g.playerTwoS;
        //this.y += this.yVel * speed;
    }

    move(g: GameRoom){
        g.playerOneY += g.playerOneVel * g.playerOneS;
        if(g.playerOneY <= 20) {
            g.playerOneVel = 0;
        }else if (g.playerOneY + g.playerOneH >= g.canvasheight - 20){
            g.playerOneVel = 0;
        }
        if (g.playerTwo != ""){
            g.playerTwoY += g.playerTwoVel * g.playerTwoS;
            if(g.playerTwoY <= 20) {
                g.playerTwoVel = 0;
            }else if (g.playerTwoY + g.playerTwoH >= g.canvasheight - 20){
                g.playerTwoVel = 0;
            }
        }           
    }

    keyStatus(room: string, key: number, nick:string){
        var g = this.games.get(room);
        if ((nick == g.playerOne) || (nick == g.playerTwo)){
            if(key == 27){
                if (g.pause == true){
                    if(g.finish){
                        this.restartScores(g);
                    }
                    g.pause = false;
                }
                else {                    
                    g.pause = true
                }
                return;
            }
        }
        //this.game = this.games.get(room);
        if (nick == g.playerOne) {
            if (key === 87 && (g.playerOneY > 20)){ //w
                g.playerOneVel = -1;
            } else if ( key === 83 && (g.playerOneY + g.playerOneH < g.canvasheight - 20)) {//s
                g.playerOneVel = 1;
            } else {
                g.playerOneVel = 0;
            }
        }
        if (nick == g.playerTwo){
            if (key === 87 && (g.playerTwoY > 20)){ //w
                g.playerTwoVel = -1;
            } else if ( key === 83 && (g.playerTwoY + g.playerTwoH < g.canvasheight - 20)) {//s
                g.playerTwoVel = 1;
            } else {
                g.playerTwoVel = 0;
            }
        }
    }

    mode(i: number) {
        // this.restartScores();
        // if (i == 1) {
        //     // this.computerPlayer = new ComputerPaddle(
        //     //     this.game.playerTwoW,
        //     //     this.game.playerTwoH,
        //     //     this.game.playerTwoX,
        //     //     this.game.playerTwoY,
        //     //     this.game.playerTwoS);
        // } else if (i == 2) {
        //     // this.computerPlayer = new ComputerPaddle(20, 60, this.canvas.width - (20 + 20), this.canvas.height / 2 - 60 / 2, 20);
        // }
        // PongService.init = true;
    }

    restartScores(g: GameRoom) {
        g.finish = false
        g.playerOneScore = 0;
        g.playerTwoScore = 0;
    }

    setPlayerTwo(nick:string){
        this.game.playerTwo = nick;
      }
    
    setPlayer(room:string, nick:string) {
        var g = this.games.get(room)
        if (g.playerOne == ""){
            g.playerOne = nick;
        }          
        if (g.playerTwo == "" && g.playerOne != "" && g.playerOne != nick){
            g.playerTwo = nick;
        }     
        // this.game = this.games.get(room)
        // if (this.game.playerOne == ""){
        //     this.game.playerOne = nick;
        // }          
        // if (this.game.playerTwo == "" && this.game.playerOne != "" && this.game.playerOne != nick){
        //     this.game.playerTwo = nick;
        // }           
    }

    disconectPlayer(room:string, nick:string) {
        var g = this.games.get(room)
        if (g.playerOne == nick){
            g.playerOne = "";
        }         
        if (g.playerTwo == nick){
            g.playerTwo = "";
        }
        // this.game = this.games.get(room)
        // if (this.game.playerOne == nick){
        //     this.game.playerOne = "";
        // }         
        // if (this.game.playerTwo == nick){
        //     this.game.playerTwo = "";
        // }
            
    }
}

export class EntityComponent {
  
    width:number;
      height:number;
      x:number;
      y:number;
      xVel:number = 0;
      yVel:number = 0;
      speed:number;
      constructor(
        w:number,
        h:number,
        x:number,
        y:number,
        speed:number){       
          this.width = w;
          this.height = h;
          this.x = x;
          this.y = y;
          this.speed = speed;
      }
      draw(context: any){
          context.fillStyle = "#fff";
          context.fillRect(this.x,this.y,this.width,this.height);
      }
  }





export class PaddleComponent extends EntityComponent {
    move:string = "";
  
    constructor(
      w:number,
      h:number,
      x:number,
      y:number,
      speed:number){   
        super(w,h,x,y,speed);
        }
  /*
    update(canvas: any){
        if( PongService.keysPressed[KeyBindings.UP] ){
            this.pongService.sendSignal("up", "#pongRoom", "pong", this.y, this.height, canvas.height);
        }else if(PongService.keysPressed[KeyBindings.DOWN]){
            this.pongService.sendSignal("down", "pongRoom", "pong", this.y, this.height, canvas.height);
        }else{
            this.yVel = 0;
        }
    }*/
}

enum KeyBindings{
    UP = 38,
    DOWN = 40,
    SPACE = 32,
    ESCAPE = 27
  }
