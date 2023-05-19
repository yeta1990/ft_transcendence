import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.css']
})

export class PongComponent implements OnInit {

    //private gameCanvas;
    private gameContext: any;
    public static keysPressed: boolean[] = [];
    public static playerScore: number = 0;
    public static computerScore: number = 0;
    private player1: Paddle | null = null;
    private computerPlayer: ComputerPaddle | null = null;
    private ball: Ball | null = null;

    @ViewChild('gameCanvas', { static: true }) gameCanvas?: ElementRef<HTMLCanvasElement>;

    ngOnInit() {
    this.initCanvas();
    }
    initCanvas() {
        if (this.gameCanvas) {
            //console.log(this.gameCanvas);
            const canvas = this.gameCanvas.nativeElement;
            this.gameContext = canvas.getContext('2d');
            console.log(canvas.height)
            if (this.gameContext) {
                console.log("CANVAS: " + canvas.height)
                this.player1 = new Paddle(20, 60, 20, canvas.height / 2 - 60 / 2);
                console.log("PLAYER: " + this.player1);
                this.computerPlayer = new ComputerPaddle(20, 60, canvas.width - (20 + 20), canvas.height / 2 - 60 / 2);
                this.ball = new Ball(10, 10, canvas.width / 2 - 10 / 2, canvas.height / 2 - 10 / 2);
                this.gameContext.font = '30px Orbitron';

                window.addEventListener('keydown', (e) => {
                    PongComponent.keysPressed[e.which] = true;
                });

                window.addEventListener('keyup', (e) => {
                    PongComponent.keysPressed[e.which] = false;
                });
            }
        }
    }

/*
Asegúrate de haber importado las clases Ball, Paddle y ComputerPaddle desde sus respectivos archivos. Además, ten en cuenta que he corregido el problema de inicialización del contexto gameContext y he utilizado funciones flecha (=>) para los eventos de teclado con el fin de mantener el contexto correcto dentro de los manejadores de eventos.

Recuerda también que deberás crear los archivos correspondientes para las clases Ball, Paddle y ComputerPaddle, y asegurarte de que estén importados correctamente en el componente PongComponent.

        }
    // Ahora puedes usar la variable 'context' para dibujar en el canvas
    }
    constructor(){
    this.gameContext!.font = "30px Orbitron";
      
    window.addEventListener("keydown",function(e){
         PongComponent.keysPressed[e.which] = true;
    });
      
    window.addEventListener("keyup",function(e){
        PongComponent.keysPressed[e.which] = false;
    });
      
      var paddleWidth:number = 20, paddleHeight:number = 60, ballSize:number = 10, wallOffset:number = 20;
    if (this.gameCanvas) { 
        this.player1 = new Paddle(paddleWidth,paddleHeight,wallOffset,this.gameCanvas.height / 2 - paddleHeight / 2); 
        this.computerPlayer = new ComputerPaddle(paddleWidth,paddleHeight,this.gameCanvas!.width - (wallOffset + paddleWidth) ,this.gameCanvas!.height / 2 - paddleHeight / 2);
        this.ball = new Ball(ballSize,ballSize,this.gameCanvas!.width / 2 - ballSize / 2, this.gameCanvas!.height / 2 - ballSize / 2);  
    }
}*/

    drawBoardDetails(){

        console.log(this.gameCanvas);
        if (this.gameCanvas) {
            const canvas = this.gameCanvas.nativeElement;
            //const context = canvas.getContext('2d');
            this.gameContext!.strokeRect(10,10,canvas.width - 20 , canvas.height - 20);
        }
        //draw court outline
        this.gameContext!.strokeStyle = "#fff";
        this.gameContext!.lineWidth = 5;
        //this.gameContext!.strokeRect(10,10,canvas.width - 20 ,this.gameCanvas!.height - 20);
        
        //draw center lines
        if (this.gameCanvas) {
            const canvas = this.gameCanvas.nativeElement;
            for (var i = 0; i + 30 < canvas.height; i += 30) {
                this.gameContext!.fillStyle = "#fff";
                this.gameContext!.fillRect(canvas.width / 2 - 10, i + 10, 15, 20);
            }
        }
    
  //draw scores
  //this.gameContext!.fillText(PongComponent.playerScore, 280, 50);
  //this.gameContext!.fillText(PongComponent.computerScore, 390, 50);
  
    }/*
    update(){
    this.player1!.update(this.gameCanvas);
    this.computerPlayer!.update(this.ball!,this.gameCanvas);
    this.ball!.update(this.player1!,this.computerPlayer!,this.gameCanvas);
    }
    */
    update() {
        if (this.player1) {
          this.player1.update(this.gameCanvas?.nativeElement);
        }
      
        if (this.computerPlayer && this.ball && this.gameCanvas) {
          this.computerPlayer.update(this.ball, this.gameCanvas.nativeElement);
          this.ball.update(this.player1!, this.computerPlayer, this.gameCanvas.nativeElement);
        }
      }
    draw(){
        if (this.gameCanvas) {
            const canvas = this.gameCanvas.nativeElement;
            this.gameContext!.fillStyle = "#000";
            this.gameContext!.fillRect(0,0,canvas.width, canvas.height);
        }     
        this.drawBoardDetails();
        this.player1!.draw(this.gameContext);
        this.computerPlayer!.draw(this.gameContext);
        this.ball!.draw(this.gameContext);
    }
    gameLoop(){
        game.update();
        game.draw();
        requestAnimationFrame(game.gameLoop);
    }
}

class Entity{
    width:number;
    height:number;
    x:number;
    y:number;
    xVel:number = 0;
    yVel:number = 0;
    constructor(w:number,h:number,x:number,y:number){       
        this.width = w;
        this.height = h;
        this.x = x;
        this.y = y;
    }
    draw(context: any){
        context.fillStyle = "#fff";
        context.fillRect(this.x,this.y,this.width,this.height);
    }
}

class Paddle extends Entity{

    private speed:number = 10;

    constructor(w:number,h:number,x:number,y:number){
        super(w,h,x,y);
    }

    update(canvas: any){
        if( PongComponent.keysPressed[KeyBindings.UP] ){
            this.yVel = -1;
            if(this.y <= 20){
              this.yVel = 0
         }
        }else if(PongComponent.keysPressed[KeyBindings.DOWN]){
            this.yVel = 1;
            if(this.y + this.height >= canvas.height - 20){
            this.yVel = 0;
            }
        }else{
            this.yVel = 0;
        }

        this.y += this.yVel * this.speed;

    }
}

class ComputerPaddle extends Entity{

    private speed:number = 10;

    constructor(w:number,h:number,x:number,y:number){
        super(w,h,x,y);        
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

    }
}

class Ball extends Entity{

    private speed:number = 5;

    constructor(w:number,h:number,x:number,y:number){
        super(w,h,x,y);
        var randomDirection = Math.floor(Math.random() * 2) + 1; 
        if(randomDirection % 2){
            this.xVel = 1;
        }else{
            this.xVel = -1;
        }
        this.yVel = 1;
    }

    update(player:Paddle,computer:ComputerPaddle,canvas: any){
 
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
            PongComponent.computerScore += 1;
        }
    //check right canvas bounds
        if(this.x + this.width >= canvas.width){
            this.x = canvas.width / 2 - this.width / 2;
            PongComponent.playerScore += 1;
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

var game = new PongComponent();
requestAnimationFrame(game.gameLoop);

enum KeyBindings{
  UP = 38,
  DOWN = 40
}

/*enum KeyBindings{
    UP = 38,
    DOWN = 40
}

class Game{
    private gameCanvas;
    private gameContext;
    public static keysPressed: boolean[] = [];
    public static playerScore: number = 0;
    public static computerScore: number = 0;
    private player1: Paddle;
    private computerPlayer: ComputerPaddle;
    private ball: Ball;
    constructor(){
        this.gameCanvas = document.getElementById("game-canvas");
        this.gameContext = this.gameCanvas.getContext("2d");
        this.gameContext.font = "30px Orbitron";
        
        window.addEventListener("keydown",function(e){
           Game.keysPressed[e.which] = true;
        });
        
        window.addEventListener("keyup",function(e){
            Game.keysPressed[e.which] = false;
        });
        
        var paddleWidth:number = 20, paddleHeight:number = 60, ballSize:number = 10, wallOffset:number = 20;
        
        this.player1 = new Paddle(paddleWidth,paddleHeight,wallOffset,this.gameCanvas.height / 2 - paddleHeight / 2); 
        this.computerPlayer = new ComputerPaddle(paddleWidth,paddleHeight,this.gameCanvas.width - (wallOffset + paddleWidth) ,this.gameCanvas.height / 2 - paddleHeight / 2);
        this.ball = new Ball(ballSize,ballSize,this.gameCanvas.width / 2 - ballSize / 2, this.gameCanvas.height / 2 - ballSize / 2);    
        
    }
    drawBoardDetails(){
        
        //draw court outline
        this.gameContext.strokeStyle = "#fff";
        this.gameContext.lineWidth = 5;
        this.gameContext.strokeRect(10,10,this.gameCanvas.width - 20 ,this.gameCanvas.height - 20);
        
        //draw center lines
        for (var i = 0; i + 30 < this.gameCanvas.height; i += 30) {
            this.gameContext.fillStyle = "#fff";
            this.gameContext.fillRect(this.gameCanvas.width / 2 - 10, i + 10, 15, 20);
        }
        
        //draw scores
        this.gameContext.fillText(Game.playerScore, 280, 50);
        this.gameContext.fillText(Game.computerScore, 390, 50);
        
    }
    update(){
        this.player1.update(this.gameCanvas);
        this.computerPlayer.update(this.ball,this.gameCanvas);
        this.ball.update(this.player1,this.computerPlayer,this.gameCanvas);
    }
    draw(){
        this.gameContext.fillStyle = "#000";
        this.gameContext.fillRect(0,0,this.gameCanvas.width,this.gameCanvas.height);
              
        this.drawBoardDetails();
        this.player1.draw(this.gameContext);
        this.computerPlayer.draw(this.gameContext);
        this.ball.draw(this.gameContext);
    }
    gameLoop(){
        game.update();
        game.draw();
        requestAnimationFrame(game.gameLoop);
    }
}

class Entity{
    width:number;
    height:number;
    x:number;
    y:number;
    xVel:number = 0;
    yVel:number = 0;
    constructor(w:number,h:number,x:number,y:number){       
        this.width = w;
        this.height = h;
        this.x = x;
        this.y = y;
    }
    draw(context){
        context.fillStyle = "#fff";
        context.fillRect(this.x,this.y,this.width,this.height);
    }
}

class Paddle extends Entity{
    
    private speed:number = 10;
    
    constructor(w:number,h:number,x:number,y:number){
        super(w,h,x,y);
    }
    
    update(canvas){
     if( Game.keysPressed[KeyBindings.UP] ){
        this.yVel = -1;
        if(this.y <= 20){
            this.yVel = 0
        }
     }else if(Game.keysPressed[KeyBindings.DOWN]){
         this.yVel = 1;
         if(this.y + this.height >= canvas.height - 20){
             this.yVel = 0;
         }
     }else{
         this.yVel = 0;
     }
     
     this.y += this.yVel * this.speed;
     
    }
}

class ComputerPaddle extends Entity{
    
    private speed:number = 10;
    
    constructor(w:number,h:number,x:number,y:number){
        super(w,h,x,y);        
    }
    
    update(ball:Ball, canvas){ 
       
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

    }
    
}

class Ball extends Entity{
    
    private speed:number = 5;
    
    constructor(w:number,h:number,x:number,y:number){
        super(w,h,x,y);
        var randomDirection = Math.floor(Math.random() * 2) + 1; 
        if(randomDirection % 2){
            this.xVel = 1;
        }else{
            this.xVel = -1;
        }
        this.yVel = 1;
    }
    
    update(player:Paddle,computer:ComputerPaddle,canvas){
       
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
            Game.computerScore += 1;
        }
        
        //check right canvas bounds
        if(this.x + this.width >= canvas.width){
            this.x = canvas.width / 2 - this.width / 2;
            Game.playerScore += 1;
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

var game = new Game();
requestAnimationFrame(game.gameLoop);
*/