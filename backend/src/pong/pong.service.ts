import { Injectable } from '@nestjs/common';
import { ChatMessage, SocketPayload, GameRoom } from '@shared/types';
@Injectable()
export class PongService {

    private gameContext: any;
    private canvas: any;
    private gameCanvas: any;
    public static keysPressed: boolean[] = [];
    public static playerScore: number = 0;
    public static computerScore: number = 0;
    private player1: PaddleComponent | null = null;
    private computerPlayer: ComputerPaddle | null = null;
    private ball: Ball | null = null;
    public static init: boolean = false;
    //pongService:PongService = new PongService();
    public playerOne: boolean = false;
    //private subscriptions = new Subscription();
    //destroy: Subject<any> = new Subject();
    public game: GameRoom;
    games: Map<string, GameRoom> = new Map<string, GameRoom>;

    initGame (name: string): GameRoom {
        
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
            10,                 //playerOneS

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
	        700 - (20 + 20),    //ballX         //this.canvas.width / 2 - 10 / 2,
        	400 /2 - 60 / 2,    //ballY         //this.canvas.height / 2 - 10 / 2,

	        //Scores
	        0,                  //playerOneScore
	        0,                  //playerTwoScore

            //Mode
            0,                  //gameMode
        );
        this.games.set(name, this.game);
        return (this.games.get(name));
    }

    // initCanvas() {
    //     this.gameCanvas = {
    //         width: this.game.canvasWidth,
    //         height: this.game.canvasheight
    //     }
    //     if (this.playerOne)
    //         console.log("You are Player 1");
    //     else
    //         console.log("You are NOT Player 1");
    //     //this.pongService.joinUserToRoom("#pongRoom");
    //     PongService.init = false;
    //     PongService.computerScore = 0;
    //     PongService.playerScore = 0;
    //     this.canvas = this.gameCanvas?.nativeElement;
    //     this.gameContext = this.canvas?.getContext('2d');

    //     if (this.gameContext && this.canvas) {
    //         this.player1 = new PaddleComponent(
    //             this.game.playerOneW, 
    //             this.game.playerOneH,
    //             this.game.playerOneX, 
    //             this.game.playerOneY, 
    //             this.game.playerOneS);
    //         this.mode(1);
    //         this.ball = new Ball(
    //             this.game.ballWidth,
    //             this.game.ballHeight, 
    //             this.game.ballX,
    //             this.game.ballY,
    //             this.game.ballSpeed);
    //         this.gameContext.font = '30px Orbitron';

    //         window.addEventListener('keydown', (e) => {
    //             PongService.keysPressed[e.which] = true;
    //         });

    //         window.addEventListener('keyup', (e) => {
    //             PongService.keysPressed[e.which] = false;
    //         });

    //         window.addEventListener('keyup', (e) => {
    //             if (e.which === 32) {
    //                 if (!PongService.init) {
    //                     PongService.init = true;
    //                     requestAnimationFrame(this.gameLoop);
    //                 }
    //             }
    //         });

    //         window.addEventListener('keyup', (e) => {
    //             if (e.which === 27 ) {
    //                 PongService.init = false;
    //                 this.gameContext!.fillStyle = "#57a639";
    //                 this.gameContext!.fillText("PAUSE", 300, 150);
    //             }
    //         });   
    //     }
    //     requestAnimationFrame(this.gameLoop);       
    // }

    mode(i: number) {
        this.restartScores();
        if (i == 1) {
            this.computerPlayer = new ComputerPaddle(
                this.game.playerTwoW,
                this.game.playerTwoH,
                this.game.playerTwoX,
                this.game.playerTwoY,
                this.game.playerTwoS);
        } else if (i == 2) {
            this.computerPlayer = new ComputerPaddle(20, 60, this.canvas.width - (20 + 20), this.canvas.height / 2 - 60 / 2, 20);
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

    update() {
        if (this.player1) {
            //this.player1.update(this.canvas);
        }
      
        if (this.computerPlayer && this.ball && this.gameCanvas) {
          this.computerPlayer.update(this.ball, this.canvas);
          this.ball.update(this.player1!, this.computerPlayer, this.canvas);
        }
    }

    gameLoop = () => {
        
        if (PongService.init) {
            const self = this;
            this.update();
            //this.draw();
            requestAnimationFrame(this.gameLoop);
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

class ComputerPaddle extends EntityComponent{

    //private speed:number = 10;
    //private speed:number = 20; // never loose

    constructor(w:number,h:number,x:number,y:number,speed:number){
        super(w,h,x,y,speed);        
    }

    update(ball:Ball, canvas: any){ 
 
        //chase ball
        if(ball.y < this.y && ball.xVel == 1){
             this.yVel = -1; 
      
            if(this.y <= 20){
            this.yVel = 0;
            }
        }
        else if(ball.y > this.y + this.height && ball.xVel == 1){
            this.yVel = 1;
            
            if(this.y + this.height >= canvas.height - 20){
                this.yVel = 0;
            }
        }
        else{
            this.yVel = 0;
        }  
 
        this.y += this.yVel * this.speed;
        //this.y += this.yVel * speed;
    }
}

class Ball extends EntityComponent{

    //private speed:number = 5;

    constructor(w:number,h:number,x:number,y:number,speed:number){
        super(w,h,x,y,speed);
        var randomDirection = Math.floor(Math.random() * 2) + 1; 
        if(randomDirection % 2){
            this.xVel = 1;
        }else{
            this.xVel = -1;
        }
        this.yVel = 1;
    }

    update(player:PaddleComponent,computer:ComputerPaddle,canvas: any){
 
    //check top canvas bounds
        if(this.y <= 10){
          this.yVel = 1;
        }
    //check bottom canvas bounds
        if(this.y + this.height >= canvas.height - 10){
        this.yVel = -1;
        }
    //check left canvas bounds
        if(this.x <= 0){  
            this.x = canvas.width / 2 - this.width / 2;
            PongService.computerScore += 1;
        }
    //check right canvas bounds
        if(this.x + this.width >= canvas.width){
            this.x = canvas.width / 2 - this.width / 2;
            PongService.playerScore += 1;
        }
    //check player collision
        if(this.x <= player.x + player.width){
            if(this.y >= player.y && this.y + this.height <= player.y + player.height){
            this.xVel = 1;
            }
        }
    //check computer collision
        if(this.x + this.width >= computer.x){
            if(this.y >= computer.y && this.y + this.height <= computer.y + computer.height){
                this.xVel = -1;
            }
        }
    this.x += this.xVel * this.speed;
    this.y += this.yVel * this.speed;
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
