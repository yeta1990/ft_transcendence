import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject } from '@angular/core';
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
import { ChatService } from '../chat/chat.service';
import { ModalService } from '../modal/modal.service'

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

    public playerLogin:string = "";
    public online: boolean = false;
    public contected: boolean = false;
    public msg:string="";
    public waitingList="";
	private modalClosedSubscription: Subscription = {} as Subscription;

    @ViewChild('gameCanvas', { static: true }) gameCanvas?: ElementRef<HTMLCanvasElement>;
    constructor(
        private pongService:PongService,
        private myProfileService: MyProfileService,
        private route: ActivatedRoute,
        private chatService: ChatService,
		private modalService: ModalService,
        //private pongService: PongService,
    ){
        //window.location.reload();
        this.online = this.route.snapshot.data['online'];
        this.online = this.pongService.onlineBoolean;
        //console.log("ONLINE-->" + this.online);
        //this.pongService.getGame().gameMode = 0;
        console.log("Try subscribe");
        //this.pongService.joinUserToRoom("#pongRoom");

		this.myProfileService.getUserDetails()
       		.subscribe((response: User) => {
          		this.playerLogin = response.login;
        });

        this.subscriptions.add(
        this.pongService
        .getMessage()
        .pipe(takeUntil(this.destroy)) //a trick to finish subscriptions (first part)
        .subscribe((payload: SocketPayload) => {
            if (payload.event === 'gameStatus'){ 
				this.pongService.setGame(payload.data)
                this.chatService.setCurrentRoom(payload.data.room);
        		this.canvas = this.gameCanvas?.nativeElement;
        		this.gameContext = this.canvas?.getContext('2d');
//        		this.canvas.hidden = true;
                this.msg = "Best of (9)"
                this.waitingList = "";
                requestAnimationFrame(this.gameLoop);

				if (this.playerLogin == undefined || this.playerLogin.length == 0){
        			this.myProfileService.getUserDetails()
        				.subscribe((response: User) => {
          					this.playerLogin = response.login;
        			});
				
				}else{
					this.setGamePlayer()	
				}

            }
            if (payload.event === 'getStatus'){
				if(this.chatService.getCurrentRoom() == payload.data.room){
					this.pongService.setGame(payload.data)
					this.setGamePlayer()
                    this.msg = "Best of (9)";
                    if (payload.data.finish){
                        this.msg = "Game has finish";
                    }
				}
            }               
        }));
        if (!this.online && !this.contected) { 
            this.pongService.joinUserToRoom("#pongRoom");
            this.msg = "Connecting to room..."            
            this.contected = true;
        }
    }

	getGame(): GameRoom {
		return this.pongService.getGame()	
	}

	setGamePlayer(): void {
    	if (this.pongService.getGame().playerOne == this.playerLogin){
//       		console.log("Player ONE " + this.playerLogin);
           this.playerOne = true;
		} else if (this.pongService.getGame().playerTwo == this.playerLogin){
//            console.log("Player TWO");
            this.playerTwo = true;
        }
	}
 
    visibleCanvas(): boolean {
		return 	!this.getCurrentRoom().includes('#pongRoom_')
    }

	getCurrentRoom(): string {
		return this.chatService.getCurrentRoom()
	}

    async ngOnInit() {
        if (!this.pongService.getEventSubscribed()){
        	this.pongService.setEventSubscribed(true)
        	window.addEventListener('keydown', (e) => {
				if (!this.playerOne || !this.playerTwo){
					this.setGamePlayer()
				}

        	    if(this.playerOne || this.playerTwo){

        	       this.pongService.sendSignal("keydown", this.pongService.getGame().room, e.which);
				}
        	});

        	window.addEventListener('keyup', (e) => {
				if (!this.playerOne && !this.playerTwo){
					this.setGamePlayer()	
				}
        	    if(this.playerOne || this.playerTwo){
        	        this.pongService.sendSignal("keyup", this.pongService.getGame().room, e.which);
					}
        	});
        }
        this.pongService.forceInit();
        if (this.online && !this.contected) {
            this.pongService.playOnLine(this.playerLogin);
            this.contected = true;
        }
    }

    mode(m: string) {
        if (m == "on-line"){
            console.log(this.playerLogin + " join match making list ");
            this.pongService.playOnLine(this.playerLogin);
			this.waitForMatchAnswerModal()
            this.waitingList = "Waiting for other player";
        }
        else{
        	console.log("joining")
        	if (this.chatService.getCurrentRoom() != "#pongService_" + this.playerLogin) this.pongService.joinUserToRoom("#pongRoom");
        }
    }

	waitForMatchAnswerModal(){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
			this.chatService.leaveMatchMakingList()
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template16', "");
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
        var pOne = this.pongService.getGame().playerOne + " " + this.pongService.getGame().playerOneScore;
        var ptwo: string;
        if (this.pongService.getGame().playerTwo)
            ptwo = this.pongService.getGame().playerTwoScore + " "+ this.pongService.getGame().playerTwo;
        else
            ptwo = this.pongService.getGame().playerTwoScore + " computer";
        var posOne = ((this.canvas.width / 2) - pOne.length) / 2;
        var posTwo = (this.canvas.width / 2) + 20;
        this.gameContext!.fillStyle = "#808080";
        this.gameContext!.fillText(pOne, posOne, 50);
        this.gameContext!.fillText(ptwo, posTwo, 50);
        this.gameContext!.fillStyle = "#FF0000";
        if (this.pongService.getGame().playerOneScore >= 5) { //POINTS
            //this.restartScores();
            this.gameContext!.fillStyle = "#00FF00";
            let winner = this.pongService.getGame().playerOne + " WON!"
            this.gameContext!.fillText(winner, 250, 200);
            var again = "Press ESC for play again";
            var textWidth = this.gameContext!.measureText(again).width;
            this.gameContext!.fillStyle = "#808080";
            this.gameContext!.fillText(again, (this.canvas.width - textWidth) / 2, 250);
        } else if (this.pongService.getGame().playerTwoScore >= 5) { //POINTS
            //this.restartScores();
            this.gameContext!.fillStyle = "#FF0000";
            let winner;
            if (this.pongService.getGame().playerTwo != "") {
                winner = this.pongService.getGame().playerTwo + " WON!"
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
        if (this.pongService.getGame().pause && !this.pongService.getGame().finish) {
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
            this.pongService.getGame().playerOneX,
            this.pongService.getGame().playerOneY,
            this.pongService.getGame().playerOneW,
            this.pongService.getGame().playerOneH,
            5
        );
        this.gameContext.fill();
        //player2
        this.gameContext.fillStyle = "#fff";
        this.drawRoundedRect(
            this.gameContext,
            this.pongService.getGame().playerTwoX,
            this.pongService.getGame().playerTwoY,
            this.pongService.getGame().playerTwoW,
            this.pongService.getGame().playerTwoH,
            5
        );
        this.gameContext.fill();
        //ball
        this.gameContext.fillStyle = "#fff";
        this.drawRoundedRect(
            this.gameContext,
            this.pongService.getGame().ballX,
            this.pongService.getGame().ballY,
            this.pongService.getGame().ballWidth,
            this.pongService.getGame().ballHeight,
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
		console.log("destroy")
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
