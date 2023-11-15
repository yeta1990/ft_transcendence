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
import { AppRoutingModule } from '../app-routing-module/app-routing-module.module';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.css'],
})

export class PongComponent implements OnInit, OnDestroy {

    private gameContext: any;
    private canvas: any;

    public playerOne: boolean = false;
    public playerTwo: boolean = false;
    private subscriptions = new Subscription();
    destroy: Subject<any> = new Subject();
    public game: GameRoom = {} as GameRoom;
    public playerLogin:string = "";
    public online: boolean = false;
    public contected: boolean = false;

    @ViewChild('gameCanvas', { static: true }) gameCanvas?: ElementRef<HTMLCanvasElement>;
    constructor(
        private pongService:PongService,
        private myProfileService: MyProfileService,
        private route: ActivatedRoute
        //private pongService: PongService,
    ){
        //window.location.reload();
        this.online = this.route.snapshot.data['online'];
        console.log("ONLINE-->" + this.online);
        //this.game.gameMode = 0;
        console.log("Try subscribe");
        //this.pongService.joinUserToRoom("#pongRoom");
        this.subscriptions.add(
        this.pongService
        .getMessage()
        .pipe(takeUntil(this.destroy)) //a trick to finish subscriptions (first part)
        .subscribe((payload: SocketPayload) => {
            if (payload.event === 'gameStatus'){ 
                this.game = payload.data;
                this.canvas = this.gameCanvas?.nativeElement;
                this.gameContext = this.canvas?.getContext('2d');
                requestAnimationFrame(this.gameLoop);
                if (this.game.playerOne == this.playerLogin){
                    console.log("Player ONE " + this.playerLogin);
                    this.playerOne = true;
                } else if (this.game.playerTwo == this.playerLogin){
                    console.log("Player TWO");
                    this.playerTwo = true;
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
        if (!this.online && !this.contected) { 
            console.log("Try join Room: #pongRoom");     
            this.pongService.joinUserToRoom("#pongRoom");            
            this.contected = true;
        }
        else if (this.online && !this.contected) {
            console.log("Player: " + this.playerLogin);
            this.pongService.playOnLine(this.playerLogin);
            this.contected = true;
        }        
        window.addEventListener('keydown', (e) => {
            if(this.playerOne || this.playerTwo)
                this.pongService.sendSignal("keydown", this.game.room, e.which);
        });

        window.addEventListener('keyup', (e) => {
            if(this.playerOne || this.playerTwo)
                this.pongService.sendSignal("keyup", this.game.room, e.which);
        });
    }

    async ngOnInit() {
        this.pongService.forceInit();
        await this.myProfileService.getUserDetails()
        .subscribe((response: User) => {
          this.playerLogin = response.login;
        });
        if (this.online && !this.contected) {
            this.pongService.playOnLine(this.playerLogin);
            this.contected = true;
        }
    }

    mode(m: string) {
        if (m == "on-line"){
            console.log(this.playerLogin + " join match making list ");
            this.pongService.playOnLine(this.playerLogin);
        }
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
        this.gameContext!.font = '36px Arial';
        var pOne = this.game.playerOne + " " + this.game.playerOneScore;
        var ptwo: string;
        if (this.game.playerTwo)
            ptwo = this.game.playerTwoScore + " "+ this.game.playerTwo;
        else
            ptwo = this.game.playerTwoScore + " computer";
        var posOne = ((this.canvas.width / 2) - pOne.length) / 2;
        var posTwo = (this.canvas.width / 2) + 20;
        this.gameContext!.fillStyle = "#808080";
        this.gameContext!.fillText(pOne, posOne, 50);
        this.gameContext!.fillText(ptwo, posTwo, 50);
        this.gameContext!.fillStyle = "#FF0000";
        if (this.game.playerOneScore >= 3) { //POINTS
            //this.restartScores();
            this.gameContext!.fillStyle = "#00FF00";
            let winner = this.game.playerOne + " WON!"
            this.gameContext!.fillText(winner, 250, 200);
            var again = "Press ESC for play again";
            var textWidth = this.gameContext!.measureText(again).width;
            this.gameContext!.fillStyle = "#808080";
            this.gameContext!.fillText(again, (this.canvas.width - textWidth) / 2, 250);
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
            var again = "Press ESC for play again";
            var textWidth = this.gameContext!.measureText(again).width;
            this.gameContext!.fillStyle = "#808080";
            this.gameContext!.fillText(again, (this.canvas.width - textWidth) / 2, 250);
        }
        //draw pause if not finish game
        if (this.game.pause && !this.game.finish) {
            this.gameContext!.fillStyle = "#00FF00";
            this.gameContext!.fillText("PAUSE", 290, 200);
            this.gameContext!.fillStyle = "#808080";
            var again = "Press ESC play";
            var textWidth = this.gameContext!.measureText(again).width;
            this.gameContext!.fillText(again, (this.canvas.width - textWidth) / 2, 250);
            var up = "UP: W / ↑"
            var textWidth = this.gameContext!.measureText(up).width;
            const xOne = (this.canvas.width / 2 - textWidth) / 2;
            var down = "DOWN: S / ↓"
            textWidth = this.gameContext!.measureText(down).width;
            const xTwo = (this.canvas.width / 2 - textWidth) / 2 + (this.canvas.width / 2) ;
            this.gameContext!.fillText(up, xOne, this.canvas.height - 50);
            this.gameContext!.fillText(down, xTwo, this.canvas.height - 50);
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
        this.drawRoundedRect(
            this.gameContext,
            this.game.playerOneX,
            this.game.playerOneY,
            this.game.playerOneW,
            this.game.playerOneH,
            5
        );
        this.gameContext.fill();
        //player2
        this.gameContext.fillStyle = "#fff";
        this.drawRoundedRect(
            this.gameContext,
            this.game.playerTwoX,
            this.game.playerTwoY,
            this.game.playerTwoW,
            this.game.playerTwoH,
            5
        );
        this.gameContext.fill();
        //ball
        this.gameContext.fillStyle = "#fff";
        this.drawRoundedRect(
            this.gameContext,
            this.game.ballX,
            this.game.ballY,
            this.game.ballWidth,
            this.game.ballHeight,
            5
        );
        this.gameContext.fill();
    }

    drawRoundedRect(context: any, x: any, y :any, width :any, height :any, cornerRadius :any) {
        context.beginPath();
        context.moveTo(x + cornerRadius, y);
        context.arcTo(x + width, y, x + width, y + height, cornerRadius);
        context.arcTo(x + width, y + height, x, y + height, cornerRadius);
        context.arcTo(x, y + height, x, y, cornerRadius);
        context.arcTo(x, y, x + width, y, cornerRadius);
        context.closePath();
    }

    gameLoop = () => {
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
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
