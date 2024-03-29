import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject, HostListener } from '@angular/core';
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
import { ModalService } from '../modal/modal.service';

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
    public powers:string="";
    public pOne:any;
    public pTwo:any;
	private modalClosedSubscription: Subscription = {} as Subscription;
    public innerWidth: any;
    private coef:number = 1;
    buttonStates: boolean[] = [false, false, false, false, false, false];
    
	@Input()
	friends: boolean = false;
    
    @ViewChild('gameCanvas', { static: true }) gameCanvas?: ElementRef<HTMLCanvasElement>;
    constructor(
        private pongService:PongService,
        private myProfileService: MyProfileService,
        private route: ActivatedRoute,
        public chatService: ChatService,
		private modalService: ModalService,
        //private pongService: PongService,
    ){
        //window.location.reload();
        this.online = this.route.snapshot.data['online'];
        this.online = this.pongService.onlineBoolean;

		this.myProfileService.getUserDetails()
       		.subscribe((response: User) => {
          		this.playerLogin = response.login;
        });

        requestAnimationFrame(this.gameLoop);
		if (this.playerLogin == undefined || this.playerLogin.length == 0){
       		this.myProfileService.getUserDetails()
       			.subscribe((response: User) => {
       			this.playerLogin = response.login;
       	});
		
		}else{
			this.setGamePlayer()	
		}

        this.subscriptions.add(
        this.pongService
        .getMessage()
        .pipe(takeUntil(this.destroy)) //a trick to finish subscriptions (first part)
        .subscribe((payload: SocketPayload) => {
            if (payload.event === 'gameStatus'){ 
                this.coef = this.innerWidth / 1400
                payload.data.canvasWidth = 700 * this.coef;
                payload.data.canvasheight = 400 * this.coef;
				this.pongService.setGame(payload.data)
                this.chatService.setCurrentRoom(payload.data.room);
        		this.canvas = this.gameCanvas?.nativeElement;
        		this.gameContext = this.canvas?.getContext('2d');
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
                    this.coef = this.innerWidth / 1400
                    payload.data.canvasWidth = 700 * this.coef;
                    payload.data.canvasheight = 400 * this.coef;
					this.pongService.setGame(payload.data)
					this.setGamePlayer();
					if (payload.data.allowedPowers = true){
                    	this.updatePowers();
                    }
                    this.msg = "Best of (9)";
                    if (payload.data.finish){
                        this.msg = "Game has finished";
                    }
				}
            }               
        }));
        if (!this.online && !this.contected) { 
//            this.pongService.joinUserToRoom("#pongRoom");
            this.msg = "First choose a game mode or simply chat..."            
            this.contected = true;
        }
    }
    @HostListener('window:resize', ['$event'])
    onResize(event:any) {
        this.innerWidth = window.innerWidth;
        var g = this.pongService.getGame();
        this.coef = this.innerWidth / 1400;
        g.canvasWidth = 700 * this.coef;
        g.canvasheight = 400 * this.coef;
        this.canvas = this.gameCanvas?.nativeElement;
        this.gameContext = this.canvas?.getContext('2d');
    }
    getWidth(){
		return 700 * this.coef
    }

    getHeight() {
		return 400 * this.coef
    }

	getGame(): GameRoom {
		return this.pongService.getGame()	
	}

	setGamePlayer(): void {
    	if (this.pongService.getGame().playerOne == this.playerLogin){
           this.playerOne = true;
            
		} else if (this.pongService.getGame().playerTwo == this.playerLogin){
            this.playerTwo = true;
            
        }
        if(this.pongService.getGame().powersAllow){
            this.pOne = this.pongService.getGame().playerOnePowers;
            this.pTwo = this.pongService.getGame().playerTwoPowers;
        }
            
	}

    updatePowers(): void{
    	if (this.pOne && this.pTwo){
        	this.buttonStates[0] = this.isPowerUsed(this.pOne[0]);
        	this.buttonStates[1] = this.isPowerUsed(this.pOne[1]);
        	this.buttonStates[2] = this.isPowerUsed(this.pOne[2]);

        	this.buttonStates[3] = this.isPowerUsed(this.pTwo[0]);
        	this.buttonStates[4] = this.isPowerUsed(this.pTwo[1]);
        	this.buttonStates[5] = this.isPowerUsed(this.pTwo[2]);
        }
    }
    isPowerUsed(power:string):boolean{
        if (power == "InestableBall") {
            return this.pongService.getGame().inestableBallUse;
        }
        else if(power =="BiggerPaddle"){
            return this.pongService.getGame().biggerPaddleUse;
        }
        else if(power =="SmallerPaddle"){
            return this.pongService.getGame().smallerPaddleUse;
        }
        else if(power =="FasterPaddle"){
            return this.pongService.getGame().fasterPaddleUse;
        }
        else if(power =="SlowerPaddle"){
            return this.pongService.getGame().slowerPaddleUse;
        }
        else if(power =="ReverseMove"){
            return this.pongService.getGame().reverseMoveUse;
        }
        return false;
    }
 
    visibleCanvas(): boolean {
		return 	!this.getCurrentRoom().includes('#pongRoom_')
    }

	getCurrentRoom(): string {
		return this.chatService.getCurrentRoom()
	}
  
    async ngOnInit() {
        this.innerWidth = window.innerWidth;
        if (!this.pongService.getEventSubscribed()){
        	this.pongService.setEventSubscribed(true)
        	window.addEventListener('keydown', (e) => {

				if (!this.playerOne || !this.playerTwo){
					this.setGamePlayer()
				}

        	    if(!this.modalService.isModalOpen() && (this.playerOne || this.playerTwo)){
                    const player = this.playerOne ? 0 : 3;
                    // const index = e.which - 49;
                    // this.buttonStates[player + index] = true;
        	        this.pongService.sendSignal("keydown", this.pongService.getGame().room, e.which);
				}
        	});

        	window.addEventListener('keyup', (e) => {
				if (!this.playerOne && !this.playerTwo){
					this.setGamePlayer()	
				}
        	    if(!this.modalService.isModalOpen() && (this.playerOne || this.playerTwo)){
        	        this.pongService.sendSignal("keyup", this.pongService.getGame().room, e.which);
					}
        	});
        }
        this.canvas = this.gameCanvas?.nativeElement;
        this.gameContext = this.canvas?.getContext('2d');

        this.pongService.forceInit();
//        requestAnimationFrame(this.gameLoop);
        // if (this.online && !this.contected) {
        //     this.pongService.playOnLine(this.playerLogin);
        //     this.contected = true;
        // }

    }

    mode(m: string) {
        if (m == "on-line"){
            this.pongService.playOnLine(m,  this.playerLogin);
			this.waitForMatchAnswerModal()
            this.waitingList = "Waiting for other player";
        }
        else if (m == "plus"){
            this.pongService.playOnLine(m, this.playerLogin);
			this.waitForMatchAnswerModalPlus()
            this.waitingList = "Waiting for other player";
        }
        else{
        	if (this.chatService.getCurrentRoom() != "#pongService_" + this.playerLogin) this.pongService.joinUserToRoom("#pongRoom");
        }
    }

	waitForMatchAnswerModal(){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
			if (confirm){
				this.chatService.leaveMatchMakingList()
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template16', "");
	}

	waitForMatchAnswerModalPlus(){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
			if (confirm){
				this.chatService.leaveMatchMakingListPlus()
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template17', "");
	}

    drawBoardDetails(){

        this.gameContext.strokeStyle = "#fff";
        this.gameContext.lineWidth = 5 * this.coef;
        this.gameContext.strokeRect(10 * this.coef,10 * this.coef,this.canvas.width - 20 * this.coef,this.canvas.height - 20 * this.coef);

        //draw center lines
        if (this.gameCanvas) {
            const canvas = this.gameCanvas.nativeElement;
            for (var i = 0; i + 30 < canvas.height; i += 30) {
                this.gameContext!.fillStyle = "#fff";
                this.gameContext!.fillRect(canvas.width / 2 - 1, i + 10, 2, 20);
            }
        }
        //draw scores and check end game
        var fontSize = 36 * this.coef;
        this.gameContext!.font = fontSize + 'px Arial';
        var pOne = this.chatService.getNickEquivalence(this.pongService.getGame().playerOne) + " " + this.pongService.getGame().playerOneScore;
        var ptwo: string;
        if (this.pongService.getGame().playerTwo)
            ptwo = this.pongService.getGame().playerTwoScore + " "+ this.chatService.getNickEquivalence(this.pongService.getGame().playerTwo);
        else
            ptwo = this.pongService.getGame().playerTwoScore + " computer";
        var posOne = (((this.canvas.width / 2) - pOne.length) / 2 ) - (5 * this.coef);
        var posTwo = (this.canvas.width / 2) + 20 * this.coef;
        this.gameContext!.fillStyle = "#808080";
        this.gameContext!.fillText(pOne, posOne, 50 * this.coef);
        this.gameContext!.fillText(ptwo, posTwo, 50 * this.coef);
        this.gameContext!.fillStyle = "#d1434f";
        if (this.pongService.getGame().playerOneScore >= 5) { //POINTS
            //this.restartScores();
            this.gameContext!.fillStyle = "##d4da5b";
            let winner = this.chatService.getNickEquivalence(this.pongService.getGame().playerOne) + " WON!"
            this.gameContext!.fillText(winner, 250 * this.coef, 200 * this.coef);
            var again = "Press ESC for play again";
            var textWidth = this.gameContext!.measureText(again).width;
            this.gameContext!.fillStyle = "#808080";
            this.gameContext!.fillText(again, (this.canvas.width - textWidth) / 2, 250 * this.coef);
        } else if (this.pongService.getGame().playerTwoScore >= 5) { //POINTS
            //this.restartScores();
            this.gameContext!.fillStyle = "#d1434f";
            let winner;
            if (this.pongService.getGame().playerTwo != "") {
                winner = this.chatService.getNickEquivalence(this.pongService.getGame().playerTwo) + " WON!"
            } else{
                winner =  "Computer WON!"
            }
            this.gameContext!.fillText(winner, 250 * this.coef, 200 * this.coef);
            var again = "Press ESC for play again";
            var textWidth = this.gameContext!.measureText(again).width;
            this.gameContext!.fillStyle = "#808080";
            this.gameContext!.fillText(again, (this.canvas.width - textWidth) / 2, 250 * this.coef);
        }
        //draw pause if not finish game
        if (this.pongService.getGame().pause && !this.pongService.getGame().finish) {
            this.gameContext!.fillStyle = "#d4da5b";
            this.gameContext!.fillText("PAUSE", 290 * this.coef, 200 * this.coef);
            this.gameContext!.fillStyle = "#808080";
            var again = "Press ESC play";
            var textWidth = this.gameContext!.measureText(again).width;

            this.gameContext!.fillText(again, (this.canvas.width - textWidth) / 2, 250 * this.coef);
            var up = "UP: W / ↑"
            var textWidth = this.gameContext!.measureText(up).width;
            const xOne = (this.canvas.width / 2 - textWidth) / 2;
            var down = "DOWN: S / ↓"
            textWidth = this.gameContext!.measureText(down).width;
            const xTwo = (this.canvas.width / 2 - textWidth) / 2 + (this.canvas.width / 2) ;
            this.gameContext!.fillText(up, xOne, this.canvas.height - 50 * this.coef);
            this.gameContext!.fillText(down, xTwo, this.canvas.height - 50 * this.coef);
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

        if (!this.pongService.getGame()) return 
        this.gameContext!.fillStyle = "#000";
        this.gameContext!.fillRect(0,0,this.canvas.width, this.canvas.height);
        this.drawBoardDetails();
        //player1
        this.gameContext.fillStyle = "#fff";
        this.drawRoundedRect(
            this.gameContext,
            this.pongService.getGame().playerOneX * this.coef,
            this.pongService.getGame().playerOneY * this.coef,
            this.pongService.getGame().playerOneW * this.coef,
            this.pongService.getGame().playerOneH * this.coef,
            5 * this.coef
        );
        this.gameContext.fill();
        //player2
        this.gameContext.fillStyle = "#fff";
        this.drawRoundedRect(
            this.gameContext,
            this.pongService.getGame().playerTwoX * this.coef,
            this.pongService.getGame().playerTwoY * this.coef,
            this.pongService.getGame().playerTwoW * this.coef,
            this.pongService.getGame().playerTwoH * this.coef,
            5 * this.coef
        );
        this.gameContext.fill();
        //ball
        this.gameContext.fillStyle = "#fff";
        this.drawRoundedRect(
            this.gameContext,
            this.pongService.getGame().ballX * this.coef,
            this.pongService.getGame().ballY * this.coef,
            this.pongService.getGame().ballWidth * this.coef,
            this.pongService.getGame().ballHeight * this.coef,
            5 * this.coef
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

    handleButtonClick(index: number): void {
        // Lógica para manejar el clic del botón si es necesario
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
