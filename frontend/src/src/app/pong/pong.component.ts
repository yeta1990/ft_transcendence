import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.css']
})

export class PongComponent implements AfterViewInit {

    private gameContext: any;
    private canvas: any;
    public static keysPressed: boolean[] = [];
    public static playerScore: number = 0;
    public static computerScore: number = 0;
    private player1: Paddle | null = null;
    private computerPlayer: ComputerPaddle | null = null;
    private ball: Ball | null = null;
    public static init: boolean = false;

    @ViewChild('gameCanvas', { static: true }) gameCanvas?: ElementRef<HTMLCanvasElement>;
    constructor(){}

    ngAfterViewInit() {
        this.initCanvas();
    }
    
    initCanvas() {
        PongComponent.init = false;
        PongComponent.computerScore = 0;
        PongComponent.playerScore = 0;
        this.canvas = this.gameCanvas?.nativeElement;
        this.gameContext = this.canvas?.getContext('2d');

        if (this.gameContext && this.canvas) {
            this.player1 = new Paddle(20, 60, 20, this.canvas.height / 2 - 60 / 2, 10);
            this.mode(1);
            this.ball = new Ball(10, 10, this.canvas.width / 2 - 10 / 2, this.canvas.height / 2 - 10 / 2, 5);
            this.gameContext.font = '30px Orbitron';

            window.addEventListener('keydown', (e) => {
                PongComponent.keysPressed[e.which] = true;
            });

            window.addEventListener('keyup', (e) => {
                PongComponent.keysPressed[e.which] = false;
            });

            window.addEventListener('keyup', (e) => {
                if (e.which === 32) {
                    if (!PongComponent.init) {
                        PongComponent.init = true;
                        requestAnimationFrame(this.gameLoop);
                    }
                }
            });

            window.addEventListener('keyup', (e) => {
                if (e.which === 27 ) {
                    PongComponent.init = false;
                    this.gameContext!.fillStyle = "#57a639";
                    this.gameContext!.fillText("PAUSE", 300, 150);
                }
            });   
        }
        requestAnimationFrame(this.gameLoop);
    }

    mode(i: number) {
        this.restartScores();
        if (i == 1) {
            this.computerPlayer = new ComputerPaddle(20, 60, this.canvas.width - (20 + 20), this.canvas.height / 2 - 60 / 2, 10);
        } else if (i == 2) {
            this.computerPlayer = new ComputerPaddle(20, 60, this.canvas.width - (20 + 20), this.canvas.height / 2 - 60 / 2, 20);
        }
        PongComponent.init = true;
    }

    drawBoardDetails(){

        this.gameContext.strokeStyle = "#fff";
        this.gameContext.lineWidth = 5;
        this.gameContext.strokeRect(10,10,this.canvas.width - 20 ,this.canvas.height - 20);
        
        //draw center lines
        if (this.gameCanvas) {
            const canvas = this.gameCanvas.nativeElement;
            for (var i = 0; i + 30 < canvas.height; i += 30) {
                this.gameContext!.fillStyle = "#fff";
                this.gameContext!.fillRect(canvas.width / 2 - 1, i + 10, 2, 20);
            }
        }
    
        //draw scores and check end game
        this.gameContext!.fillText(PongComponent.playerScore, 280, 50);
        this.gameContext!.fillText(PongComponent.computerScore, 390, 50);
        if (PongComponent.playerScore >= 3) { //POINTS
            this.restartScores();
            this.gameContext!.fillStyle = "#00FF00";
            this.gameContext!.fillText("YOU WON!", 280, 200);
        } else if (PongComponent.computerScore >= 3) { //POINTS
            this.restartScores();
            this.gameContext!.fillStyle = "#FF0000";
            this.gameContext!.fillText("YOU LOOSE!", 260, 200);
        }
    }

    restartScores() {
        PongComponent.init = false;
        PongComponent.playerScore = 0;
        PongComponent.computerScore = 0;
    }

    update() {
        if (this.player1) {
            this.player1.update(this.canvas);
        }
      
        if (this.computerPlayer && this.ball && this.gameCanvas) {
          this.computerPlayer.update(this.ball, this.canvas);
          this.ball.update(this.player1!, this.computerPlayer, this.canvas);
        }
    }
    draw(){
        
        this.gameContext!.fillStyle = "#000";
        this.gameContext!.fillRect(0,0,this.canvas.width, this.canvas.height);   
        this.drawBoardDetails();
        this.player1!.draw(this.gameContext);
        this.computerPlayer!.draw(this.gameContext);
        this.ball!.draw(this.gameContext);
    }

    gameLoop = () => {
        
        if (PongComponent.init) {
            const self = this;
            this.update();
            this.draw();
            requestAnimationFrame(this.gameLoop);
        }
        //requestAnimationFrame(this.gameLoop);
    }
}

class Entity{
    width:number;
    height:number;
    x:number;
    y:number;
    xVel:number = 0;
    yVel:number = 0;
    speed:number;
    constructor(w:number,h:number,x:number,y:number,speed:number){       
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

class Paddle extends Entity{

    //private speed:number = 10;

    constructor(w:number,h:number,x:number,y:number,speed:number){
        super(w,h,x,y,speed);
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

class Ball extends Entity{

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

enum KeyBindings{
  UP = 38,
  DOWN = 40,
  SPACE = 32
}