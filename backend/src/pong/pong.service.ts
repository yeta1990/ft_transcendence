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
    public playerOneVel: number = 0;
    public playerTwoVel: number = 0;

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

	        //PaddleTwoComponent
	        700 - (20 + 20),    //playerTwoX    //this.canvas.width - (20 + 20),
	        400 /2 - 60 / 2,    //playerTwoY    //this.canvas.height / 2 - 60 / 2,
	        20,                 //playerTwoW
	        60,                 //playerTwoH
            10,                 //playerTwoS

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

            //Viwer
            viwer,              //viwer
            "",               //playerOne
            ""                  //playerTwo
        );
        this.randomDir();
        this.games.set(name, this.game);
        this.updateGame(gameGateaway)
        return (this.games.get(name));
    }

    updateGame(gameGateway :GameGateway){
        this.game.gameMode = 1;
        setInterval(()=>{
            this.updateBall()
            if (this.game.playerTwo == "") {
                this.updateComputer();
            }              
            this.move();
            const targetUsers: Array<ChatUser> = gameGateway
	.getActiveUsersInRoom("#pongRoom");
	for (let i = 0; i < targetUsers.length; i++){
		gameGateway.server.to(targetUsers[i].client_id).emit('getStatus', this.games.get(this.game.room));
	}            
        },1000/64)
    }

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

    updateBall(){
 
        //check top canvas bounds
            if(this.game.ballY <= 10){
              this.game.ballYVel = 1;
            }
        //check bottom canvas bounds
            if(this.game.ballY + this.game.ballHeight >= this.game.canvasheight - 10){
                this.game.ballYVel = -1;
            }
        //check left canvas bounds
            if(this.game.ballX <= 0){  
                this.game.ballX = this.game.canvasWidth / 2 - this.game.ballWidth / 2;
                this.game.playerTwoScore += 1;
            }
        //check right canvas bounds
            if(this.game.ballX + this.game.ballWidth >= this.game.canvasWidth){
                this.game.ballX = this.game.canvasWidth / 2 - this.game.ballWidth / 2;
                this.game.playerOneScore += 1;
            }
        //check player collision
            if(this.game.ballX <= this.game.playerOneX + this.game.playerOneW){
                if(this.game.ballY >= this.game.playerOneY && this.game.ballY  + this.game.ballHeight <= this.game.playerOneY + this.game.playerOneH){
                this.game.ballXVel = 1;
                }
            }
        //check computer collision
            if(this.game.ballX + this.game.ballWidth >= this.game.playerTwoX){
                if(this.game.ballY >= this.game.playerTwoY && this.game.ballY + this.game.ballHeight <= this.game.playerTwoY + this.game.playerTwoH){
                    this.game.ballXVel = -1;
                }
            }
            this.game.ballX += this.game.ballXVel * this.game.ballSpeed;
            this.game.ballY += this.game.ballYVel * this.game.ballSpeed;
    }

    updateComputer(){ 
 
        //chase ball
        var yVel = 0;
        if(this.game.ballY < this.game.playerTwoY && this.game.ballXVel == 1){
             yVel = -1; 
      
            if(this.game.playerTwoY <= 20){
                yVel = 0;
            }
        }
        else if(this.game.ballY > this.game.playerTwoY + this.game.playerTwoH && this.game.ballXVel == 1){
            yVel = 1;
            
            if(this.game.playerTwoY + this.game.playerTwoH >= this.game.canvasheight - 20){
                yVel = 0;
            }
        }
        else{
            yVel = 0;
        }  
 
        this.game.playerTwoY += yVel * this.game.playerTwoS;
        //this.y += this.yVel * speed;
    }

    move(){
        this.game.playerOneY += this.playerOneVel * this.game.playerOneS;
        if(this.game.playerOneY <= 20) {
            this.playerOneVel = 0;
        }else if (this.game.playerOneY + this.game.playerOneH >= this.game.canvasheight - 20){
            this.playerOneVel = 0;
        }
        if (this.game.playerTwo != ""){
            this.game.playerTwoY += this.playerTwoVel * this.game.playerTwoS;
            if(this.game.playerTwoY <= 20) {
                this.playerTwoVel = 0;
            }else if (this.game.playerTwoY + this.game.playerTwoH >= this.game.canvasheight - 20){
                this.playerTwoVel = 0;
            }
        }           
    }

    keyStatus(room: string, key: number, nick:string){
        //this.game = this.games.get(room);
        if (nick == this.game.playerOne) {
            if (key === 87 && (this.game.playerOneY > 20)){ //w
                this.playerOneVel = -1;
            } else if ( key === 83 && (this.game.playerOneY + this.game.playerOneH < this.game.canvasheight - 20)) {//s
                this.playerOneVel = 1;
            } else {
                this.playerOneVel = 0;
            }
        }
        if (nick == this.game.playerTwo){
            if (key === 87 && (this.game.playerTwoY > 20)){ //w
                this.playerTwoVel = -1;
            } else if ( key === 83 && (this.game.playerTwoY + this.game.playerTwoH < this.game.canvasheight - 20)) {//s
                this.playerTwoVel = 1;
            } else {
                this.playerTwoVel = 0;
            }
        }
        // if (key === 87 && (this.game.playerOneY > 20)){ //w
        //     this.playerOneVel = -1;
        // } else if ( key === 83 && (this.game.playerOneY + this.game.playerOneH < this.game.canvasheight - 20)) {//s
        //     this.playerOneVel = 1;
        // } else {
        //     this.playerOneVel = 0;
        // }

    }

    mode(i: number) {
        this.restartScores();
        if (i == 1) {
            // this.computerPlayer = new ComputerPaddle(
            //     this.game.playerTwoW,
            //     this.game.playerTwoH,
            //     this.game.playerTwoX,
            //     this.game.playerTwoY,
            //     this.game.playerTwoS);
        } else if (i == 2) {
            // this.computerPlayer = new ComputerPaddle(20, 60, this.canvas.width - (20 + 20), this.canvas.height / 2 - 60 / 2, 20);
        }
        PongService.init = true;
    }

    restartScores() {
        PongService.init = false;
        PongService.playerScore = 0;
        this.game.playerOneScore = 0;
        PongService.computerScore = 0;
        this.game.playerTwoScore = 0;
    }

    setPlayerTwo(nick:string){
        this.game.playerTwo = nick;
      }
    
    setPlayer(room:string, nick:string) {
        this.game = this.games.get(room)
        if (this.game.playerOne == ""){
            this.game.playerOne = nick;
        }          
        if (this.game.playerTwo == "" && this.game.playerOne != "" && this.game.playerOne != nick){
            this.game.playerTwo = nick;
        }           
    }

    disconectPlayer(room:string, nick:string) {
        this.game = this.games.get(room)
        if (this.game.playerOne == nick){
            this.game.playerOne = "";
        }         
        if (this.game.playerTwo == nick){
            this.game.playerTwo = "";
        }
            
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
