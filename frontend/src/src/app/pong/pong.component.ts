import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PongService } from './pong.service';
import { Subject, Subscription, pipe } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { ChatMessage, SocketPayload, GameRoom } from '@shared/types';
import { PaddleComponent }  from './paddle/paddle.component'
import { EntityComponent } from './entity/entity.component'
import { MyProfileService } from '../my-profile/my-profile.service';
import { User } from '../user';

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.css'],
}) 

export class PongComponent implements OnInit, OnDestroy {

    private gameContext: any;
    private canvas: any;
    public static keysPressed: boolean[] = [];
    public static playerScore: number = 0;
    public static computerScore: number = 0;
    private player1: PaddleComponent | null = null;
    public static init: boolean = false;
    pongService:PongService = new PongService();
    public playerOne: boolean = false;
    public playerTwo: boolean = false;
    private subscriptions = new Subscription();
    destroy: Subject<any> = new Subject();
    public game: GameRoom = {} as GameRoom;
    public playerNick:string = "";

    @ViewChild('gameCanvas', { static: true }) gameCanvas?: ElementRef<HTMLCanvasElement>;
    constructor(
        private myProfileService: MyProfileService,
        //private pongService: PongService,
    ){      
 
        this.game.gameMode = 0;
        //console.log("Try join Room: #pongRoom");
        this.pongService.joinUserToRoom("#pongRoom");
        this.subscriptions.add(
        this.pongService
        .getMessage()
        .pipe(takeUntil(this.destroy)) //a trick to finish subscriptions (first part)
        .subscribe((payload: SocketPayload) => {
        if (payload.event === 'gameStatus'){           
            if (this.game.gameMode == 0) {                
                this.game = payload.data;
                this.canvas = this.gameCanvas?.nativeElement;
                this.gameContext = this.canvas?.getContext('2d');
                requestAnimationFrame(this.gameLoop);
                if (this.game.playerOne == this.playerNick){
                    console.log("Player ONE");
                    this.playerOne = true;
                } else if (this.game.playerTwo == this.playerNick){
                    console.log("Player TWO");
                    this.playerTwo = true;
                }                   
            }
            else{
                this.game.ballX = payload.data.ballX;
                this.game.ballY = payload.data.ballY;
            }
        }
        if (payload.event === 'getStatus'){
            this.game = payload.data;
        }

        }));
        window.addEventListener('keydown', (e) => {
            if(this.playerOne || this.playerTwo)
            console.log(this.playerNick + " keydown in " + this.game.room);     
                this.pongService.sendSignal("keydown", this.game.room, e.which);
        });

        window.addEventListener('keyup', (e) => {
            if(this.playerOne|| this.playerTwo)
                this.pongService.sendSignal("keyup", this.game.room, e.which);
        });       
    }

    async ngOnInit() {
        await this.myProfileService.getUserDetails()
        .subscribe((response: User) => { 
          this.playerNick = response.nick;
        });
    }

    // mode(i: number) {
    //     this.restartScores();
    //     if (i == 1) {
    //         this.computerPlayer = new ComputerPaddle(
    //             this.game.playerTwoW,
    //             this.game.playerTwoH,
    //             this.game.playerTwoX,
    //             this.game.playerTwoY,
    //             this.game.playerTwoS);
    //     } else if (i == 2) {
    //         this.computerPlayer = new ComputerPaddle(20, 60, this.canvas.width - (20 + 20), this.canvas.height / 2 - 60 / 2, 20);
    //     }
    //     PongComponent.init = true;
    // }

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
        this.gameContext!.font = '36px Arial';
        this.gameContext!.fillText(this.game.playerOneScore, 175, 50);
        this.gameContext!.fillText(this.game.playerTwoScore, 525, 50);
        if (this.game.playerOneScore >= 3) { //POINTS
            //this.restartScores();
            this.gameContext!.fillStyle = "#00FF00";
            let winner = this.game.playerOne + " WON!"
            this.gameContext!.fillText(winner, 250, 200);
        } else if (this.game.playerTwoScore >= 3) { //POINTS
            //this.restartScores();
            this.gameContext!.fillStyle = "#FF0000";
            let winner;
            if (this.game.playerTwo != "") {
                winner = this.game.playerTwo + " WON!"
            } else{
                winner =  "Computer WON!"
            }          
            this.gameContext!.fillText(winner, 250, 200);
        }
        //draw pause if not finish game
        if (this.game.pause && !this.game.finish) {
            this.gameContext!.fillStyle = "#00FF00";
            this.gameContext!.fillText("PAUSE", 290, 200);
        }
    }


    // update() {
    //     if (this.player1) {
    //         this.player1.update(this.canvas);
    //     }
      
    //     if (this.computerPlayer && this.ball && this.gameCanvas) {
    //       this.computerPlayer.update(this.ball, this.canvas);
    //       this.ball.update(this.player1!, this.computerPlayer, this.canvas);
    //     }
    // }
    draw(){
        
        this.gameContext!.fillStyle = "#000";
        this.gameContext!.fillRect(0,0,this.canvas.width, this.canvas.height);   
        this.drawBoardDetails();
        //player1
        this.gameContext.fillStyle = "#fff";
        this.gameContext.fillRect(
            this.game.playerOneX,
            this.game.playerOneY,
            this.game.playerOneW,
            this.game.playerOneH);
        //player2
        this.gameContext.fillStyle = "#fff";
        this.gameContext.fillRect(
            this.game.playerTwoX,
            this.game.playerTwoY,
            this.game.playerTwoW,
            this.game.playerOneH);
        //ball
        this.gameContext.fillStyle = "#fff";
        this.gameContext.fillRect(
            this.game.ballX,
            this.game.ballY,
            this.game.ballWidth,
            this.game.ballHeight);
        // this.player1!.draw(this.gameContext);
        // this.computerPlayer!.draw(this.gameContext);
        // this.ball!.draw(this.gameContext);
    }

    gameLoop = () => {
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }

    ngOnDestroy() {
		//a trick to finish subscriptions (second part)
		this.destroy.next("");
		this.destroy.complete();

		//this is a soft disconnect, not a real disconnect
  		//when the chat component disappears (bc user has clicked
  		//in other section of the site)
  		//this way we force the server to send the historial of each joined room
  		//in case the component appears again in the client
        //console.log("DISCONECT");
		this.pongService.disconnectClient();
	}
}


enum KeyBindings{
  UP = 38,
  DOWN = 40,
  SPACE = 32,
  ESCAPE = 27,
  W = 87,
  S = 83
}