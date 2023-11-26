import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ChatMessage, SocketPayload, GameRoom, ChatUser } from '@shared/types';
import { waitSeg } from '@shared/functions'
import { GameGateway } from 'src/events/game.gateway';
import { BaseGateway } from 'src/events/base.gateway';
import { ChatGateway } from 'src/events/chat.gateway';
import {ChatService} from '../chat/chat.service'
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { log } from 'console';
import { Game } from './game.entity'
@Injectable()
export class PongService {

    public game: GameRoom;
    //public gameGateaway: GameGateway;
    //public baseGateway: BaseGateway;
    
    games: Map<string, GameRoom> = new Map<string, GameRoom>;
    public numberOfGames: number = 0;
    public interval: any = 0;
    private matchMaking: Array<string> = new Array<string>;
	private matchProposals: Map<string, string> = new Map()
	private matchReplay: Map<string, string> = new Map()
    private matchMakingPlus: Array<string> = new Array<string>;

    constructor(
    	@Inject(forwardRef(() => ChatGateway))
    	private gameGateaway: ChatGateway,
		@Inject(forwardRef(() => ChatService))
    	private chatService: ChatService) {
        setInterval(()=>{
            //this.updateBall(element.room)
            this.games.forEach(element => {
                this.updateBall(element.room)  
                if (element.playerTwo == "") {
                    this.updateComputer(element);
                }              
                this.move(element);
                const targetUsers: Array<ChatUser> = this.gameGateaway
                	.getActiveUsersInRoom(element.room);
                for (let i = 0; i < targetUsers.length; i++){
                    //console.log("\t-> " + targetUsers[i].login + " in " + game.room);
                    this.gameGateaway.server.to(targetUsers[i].client_id).emit('getStatus', element);
                } 
            });
                        
        },1000/64)
    }
  

    initGame (name: string, gameGateaway: ChatGateway, viwer: number, nick:string, allowedPowers:boolean): GameRoom {
        
        if (this.games.get(name))
            return(this.games.get(name));
//        console.log("Init -> " + name);
//        this.gameGateaway = gameGateaway;
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
	        10,                 //playerOneW
	        60,                 //playerOneH
            10,                 //playerOneS 10
            0,                  //playerOneVel

	        //PaddleTwoComponent
	        700 - (20 + 10),    //playerTwoX    //this.canvas.width - (20 + 20),
	        400 /2 - 60 / 2,    //playerTwoY    //this.canvas.height / 2 - 60 / 2,
	        10,                 //playerTwoW
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
            true,               //pause
            false,              //finish

            //Viwer
            viwer,              //viwer
            "",                 //playerOne
            "",                 //playerTwo
			0,                  //intarval
            false,              //inestableball;
            false,              //reverseMoveOne;
            false,              //reverseMoveTwo;
            [],                 //playerOnePowers;
            [],                 //playerTwoPowers;
            allowedPowers,      //powersAllow;
        );
        
        this.games.set(name, this.game);
        this.randomPowers(this.games.get(name));
        this.randomDir(name);
        this.numberOfGames++;

        //this.updateGame(gameGateaway, this.games.get(name))
        // if (this.numberOfGames == 1){
        //     this.updateGame(gameGateaway)
        // }
        return (this.games.get(name));
    }


	async rejectReplayProposal(game: string){
		const g = this.games.get(game)
		this.cancelMatchProposal(g.playerOne)
		this.cancelMatchProposal(g.playerTwo)
		await this.chatService.deleteRoom(game)
		await this.gameGateaway.destroyEmptyRooms(game)

		if (!this.games.get(game)) return;
       	this.chatService.setUserStatusIsActive(this.games.get(game).playerTwo)
        this.chatService.setUserStatusIsActive(this.games.get(game).playerOne)
		this.games.delete(game)
	}


    saveMatchReplayProposal(senderLogin: string, targetLogin: string){
		this.matchReplay.set(senderLogin, targetLogin)
		this.matchReplay.set(targetLogin, senderLogin)
    }

	saveMatchProposal(senderLogin: string, targetLogin: string){
		this.matchProposals.set(senderLogin, targetLogin)	
		this.matchProposals.set(targetLogin, senderLogin)	
	}

	deleteMatchProposal(player1: string){
		const player2 = this.matchProposals.get(player1)	
		this.matchProposals.delete(player1)
		if (player2 != undefined){
			this.matchProposals.delete(player2)
		}
	}

	hasAnotherProposal(login: string, targetLogin: string){
		if (this.matchProposals.get(targetLogin) == undefined){
			return false;	
		}
		else if (this.matchProposals.get(targetLogin) == login){
			return false;
		}
		return true;
	}

	isAValidProposal(player1: string, player2: string)
	{
		return this.matchProposals.get(player1) == player2 || this.matchProposals.get(player2) == player1
	}

	cancelMatchProposal(player1: string){
		const player2 = this.matchProposals.get(player1)
		this.gameGateaway.sendCancelMatchProposal(player1, player2)
		this.deleteMatchProposal(player1)
	}

    updateGame(gameGateway :ChatGateway, game: GameRoom){
        //this.games.forEach(element => {
            //element.gameMode = 1;
            //console.log("Update -> " + game.room);
            game.gameMode = 1;
            setInterval(()=>{
                //this.updateBall(element.room)
                this.updateBall(game.room)  
                if (game.playerTwo == "") {
                    this.updateComputer(game);
                }              
                this.move(game);
                const targetUsers: Array<ChatUser> = gameGateway
	            .getActiveUsersInRoom(game.room);
	            for (let i = 0; i < targetUsers.length; i++){
                    //console.log("\t-> " + targetUsers[i].login + " in " + game.room);
		            gameGateway.server.to(targetUsers[i].client_id).emit('getStatus', game);
	            }            
            },1000/64)
        //})
    }

    getStatus(room: string){
        return (this.games.get(room));
    }

    randomDir(room: string) {
        var g = this.games.get(room);
        var randomDirection = Math.floor(Math.random() * 2) + 1; 
        if(randomDirection % 2){
            g.ballXVel = 1;
        }else{
            g.ballXVel = -1;
        }
        g.ballYVel = 1;
    }

    updateBall(room:string){
        var g = this.games.get(room);
        if (!g) {return; }
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
    async checkScores(g: GameRoom){
        if (g.playerOneScore >= 5 || g.playerTwoScore >= 5){
        	console.log("check scores")
            g.pause = true;
            g.finish = true;
            this.chatService.setUserStatusIsActive(g.playerOne)
            this.chatService.setUserStatusIsActive(g.playerTwo)
			await this.chatService.saveGameResult(g)
			if (g.playerTwo != "")this.gameGateaway.sendReplay(g.playerOne, g.playerTwo)
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
    }

    move(g: GameRoom){
        g.playerOneY += g.playerOneVel * g.playerOneS;
        if(g.playerOneY <= 20 || (g.playerOneY + g.playerOneH >= g.canvasheight - 20)) {
            g.playerOneVel = 0;
         }//else if (g.playerOneY + g.playerOneH >= g.canvasheight - 20){
        //     g.playerOneVel = 0;
        // }
        if (g.playerTwo != ""){
            g.playerTwoY += g.playerTwoVel * g.playerTwoS;
            if(g.playerTwoY <= 20 || (g.playerTwoY + g.playerTwoH >= g.canvasheight - 20)) {
                g.playerTwoVel = 0;
            }//else if (g.playerTwoY + g.playerTwoH >= g.canvasheight - 20){
            //     g.playerTwoVel = 0;
            // }
        }           
    }

    keyStatus(room: string, key: number, nick:string){
        var g = this.games.get(room);
        if (!g) return;
        if ((nick == g.playerOne) || (nick == g.playerTwo)){
//        	console.log(g)
            if(key == 27){
                if (g.pause == true){
                    if(g.finish){
                        this.restartPowers(g);
                        this.restartScores(g);                      
                    }
                    g.pause = false;
					if (g.playerTwo != ''){
						this.chatService.setUserStatusIsPlaying(g.playerOne)
						this.chatService.setUserStatusIsPlaying(g.playerTwo)
					}
                }
                else {                    
                    g.pause = true
                }
                return;
            }
        }
        if (g.pause) { return;}
        if (nick == g.playerOne) {
            if(g.reverseMoveOne){
                if (key == 87 || key == 38) {
                    key = 83;
                } else if (key == 83 || key == 40) {
                    key = 87;
                }
            }
            if ((key === 87 && (g.playerOneY > 20)) || (key === 38 && (g.playerOneY > 20))){ //w
                g.playerOneVel = -1;
            } else if ((key === 83 && (g.playerOneY + g.playerOneH < g.canvasheight - 20))
                || (key === 40 && (g.playerOneY + g.playerOneH < g.canvasheight - 20))) {//s
                g.playerOneVel = 1;
            } else {
                g.playerOneVel = 0;
            }
            if (key === 49 && g.powersAllow){ //1
                var power = g.playerOnePowers[0];
                this.throwPower(power, nick, g);
            }else if (key === 50 && g.powersAllow){ //2
                var power = g.playerOnePowers[1];
                this.throwPower(power, nick, g);
            }else if (key === 51 && g.powersAllow){ //3
                var power = g.playerOnePowers[2];
                this.throwPower(power, nick, g);
            }
        }
        if (nick == g.playerTwo){
            if(g.reverseMoveTwo){
                if (key == 87 || key == 38) {
                    key = 83;
                } else if (key == 83 || key == 40) {
                    key = 87;
                }
            }
            if (key === 87 && (g.playerTwoY > 20)){ //w
                g.playerTwoVel = -1;
            } else if ( key === 83 && (g.playerTwoY + g.playerTwoH < g.canvasheight - 20)) {//s
                g.playerTwoVel = 1;
            } else {
                g.playerTwoVel = 0;
            }
            if (key === 49 && g.powersAllow){ //1
                var power = g.playerTwoPowers[0];
                this.throwPower(power, nick, g);
            }else if (key === 50 && g.powersAllow){ //2
                var power = g.playerTwoPowers[1];
                this.throwPower(power, nick, g);
            }else if (key === 51 && g.powersAllow){ //3
                var power = g.playerTwoPowers[2];
                this.throwPower(power, nick, g);
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
		if (g.gameMode != 0){

		}
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
    }

    async addUserToList(login: string) {
        if (this.matchMaking.includes(login)) { return; }
        this.matchMaking.push(login);
        console.log("Waiting list: " + this.matchMaking);
        if (this.matchMaking.length >= 2){
            this.disconectPlayer("#pongRoom_" + this.matchMaking[0], this.matchMaking[0]);
            this.disconectPlayer("#pongRoom_" + this.matchMaking[1], this.matchMaking[1]);
            const room: string = "#pongRoom_" + this.matchMaking[0] + "+" + this.matchMaking[1];
            const idsPlayerOne: Array<string> = this.gameGateaway.getClientSocketIdsFromLogin(this.matchMaking[0]);
            const idsPlayerTwo: Array<string> = this.gameGateaway.getClientSocketIdsFromLogin(this.matchMaking[1]);
            
			this.gameGateaway.sendCancelOnline(this.matchMaking[0], this.matchMaking[1])
            for (let element of idsPlayerOne) {
                await this.gameGateaway.joinRoutineGame(element, this.matchMaking[0], room, "", "join", false)
            }
            
        	console.log("Waiting list (2): " + this.matchMaking);
            for (let element of idsPlayerTwo) {
                await this.gameGateaway.joinRoutineGame(element, this.matchMaking[1], room, "", "join", false)
            }
            this.chatService.setUserStatusIsPlaying(this.matchMaking[0])
            this.chatService.setUserStatusIsPlaying(this.matchMaking[1])
            //Remove both 
            this.matchMaking.shift();
            this.matchMaking.shift();
        }
    }

    async addUserToListPlus(login: string) {
        if (this.matchMakingPlus.includes(login)) { return; }
        this.matchMakingPlus.push(login);
        console.log("Waiting list Plus: " + this.matchMakingPlus);
        if (this.matchMakingPlus.length >= 2){
            this.disconectPlayer("#pongRoom_" + this.matchMakingPlus[0], this.matchMakingPlus[0]);
            this.disconectPlayer("#pongRoom_" + this.matchMakingPlus[1], this.matchMakingPlus[1]);
            const room: string = "#pongRoom_" + this.matchMakingPlus[0] + "+" + this.matchMakingPlus[1];
            const idsPlayerOne: Array<string> = this.gameGateaway.getClientSocketIdsFromLogin(this.matchMakingPlus[0]);
            const idsPlayerTwo: Array<string> = this.gameGateaway.getClientSocketIdsFromLogin(this.matchMakingPlus[1]);
            
			this.gameGateaway.sendCancelOnline(this.matchMakingPlus[0], this.matchMakingPlus[1])
            for (let element of idsPlayerOne) {
                await this.gameGateaway.joinRoutineGame(element, this.matchMakingPlus[0], room, "", "join", true)
            }
            
            for (let element of idsPlayerTwo) {
                await this.gameGateaway.joinRoutineGame(element, this.matchMakingPlus[1], room, "", "join", true)
            }
            this.chatService.setUserStatusIsPlaying(this.matchMakingPlus[0])
            this.chatService.setUserStatusIsPlaying(this.matchMakingPlus[1])
            //Remove both 
            this.matchMakingPlus.shift();
            this.matchMakingPlus.shift();
        }
    }
	removeUserFromMatchMakingList(login: string){
		this.matchMaking = this.matchMaking.filter(l => login != login)	
	}

	removeUserFromMatchMakingListPlus(login: string){
		this.matchMakingPlus = this.matchMakingPlus.filter(l => login != login)	
	}

    async challengeGame(loginPlayerOne: string, loginPlayerTwo: string, allowedPowers:boolean) {
        this.disconectPlayer("#pongRoom_" + loginPlayerOne, loginPlayerOne);
        this.disconectPlayer("#pongRoom_" + loginPlayerTwo, loginPlayerTwo);
		this.removeUserFromMatchMakingList(loginPlayerOne)
		this.removeUserFromMatchMakingList(loginPlayerTwo)
        const room: string = "#pongRoom_" + loginPlayerOne + "+" + loginPlayerTwo;
        const idsPlayerOne: Array<string> = this.gameGateaway.getClientSocketIdsFromLogin(loginPlayerOne);
        const idsPlayerTwo: Array<string> = this.gameGateaway.getClientSocketIdsFromLogin(loginPlayerTwo);
            

        for (let element of idsPlayerOne) {
            await this.gameGateaway.joinRoutineGame(element, loginPlayerOne, room, "", "join", allowedPowers)
        }
            
        for (let element of idsPlayerTwo) {
            await this.gameGateaway.joinRoutineGame(element, loginPlayerTwo, room, "", "join", allowedPowers)
        }
        this.chatService.setUserStatusIsPlaying(loginPlayerOne)
        this.chatService.setUserStatusIsPlaying(loginPlayerTwo)

    }
    

    disconectPlayer(room:string, login:string) {
        var g = this.games.get(room)
        if (!g) return;
        if (!g.playerOne || !g.playerTwo) {return;}
       if (g.playerOne == login){
           g.playerOne = "";
       }         
       if (g.playerTwo == login){
           g.playerTwo = "";
       }
        console.log("disconnect player: " + room)
        this.gameGateaway.removeUserFromRoom(room, login) 
        if (g.playerOne == "" && g.playerTwo == "") {
            this.games.delete(room);
        }

//        clearInterval(g.interval);
    }

    //POWERS

    throwPower(power:string, login:string, g:GameRoom){

        if (power == "InestableBall") {
           this.inestableBall(g); 
        }
        else if(power =="BiggerPaddle"){
            this.biggerPaddle(login, g);
        }
        else if(power =="SmallerPaddle"){
            this.smallerPaddle(login, g);
        }
        else if(power =="FasterPaddle"){
            this.fasterPaddle(login, g);
        }
        else if(power =="SlowerPaddle"){
            this.fasterPaddle(login, g);
        }
        else if(power =="ReverseMove"){
            this.reverseMove(login, g);
        }
    }
    restartPowers(g: GameRoom) {
        console.log("RESET");
        g.ballSpeed = 5;
        g.playerOneH = 60;
        g.playerTwoH = 60;
        g.playerOneS = 10;
        g.playerTwoS = 10;
        g.playerOneY = 400 /2 - 60 / 2;
        g.playerTwoY = 400 /2 - 60 / 2,
        g.inestableBall = false;
        g.reverseMoveOne = false;
        g.reverseMoveTwo = false;
        this.randomPowers(g);
    }

    randomPowers(g: GameRoom) {
        var powers: Array<string> = ["InestableBall", "BiggerPaddle", "SmallerPaddle", "FasterPaddle", "SlowerPaddle", "ReverseMove"];
        var p: string = "";
        g.playerOnePowers = [];
        g.playerTwoPowers = [];
        var index: number;
        //1st
        index = Math.floor(Math.random() * powers.length);
        p = powers[index]
        g.playerOnePowers.push(p);
        powers.splice(index, 1);
        //2nd
        index = Math.floor(Math.random() * powers.length);
        p = powers[index]
        g.playerOnePowers.push(p);
        powers.splice(index, 1);
        //3rd
        index = Math.floor(Math.random() * powers.length);
        p = powers[index]
        g.playerOnePowers.push(p);
        powers.splice(index, 1);
        //
        g.playerTwoPowers = powers;
        console.log("POWERS");
        console.log(g.playerOnePowers);
        console.log(g.playerTwoPowers);
    }
    shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
      }
    async inestableBall(g: GameRoom) {
        if(g.inestableBall) {return;}
        g.inestableBall = true;
        const speeds :Array<number> = [5, 2, 7, 10, 15];
        g.ballSpeed = speeds[Math.floor(Math.random() * speeds.length)];
        const waitSeg = (seg: number) => new Promise(resolve => setTimeout(resolve, seg * 1000));

        let count = 0;
        while (count < 60) { //seconds
          count++;
          await waitSeg(1);
      
          if (count % 10 === 0) {
            g.ballSpeed = speeds[Math.floor(Math.random() * speeds.length)];
            console.log("change speed " + g.ballSpeed);
          }
        }
        g.inestableBall = false;
        g.ballSpeed = 5;   
    }

    async biggerPaddle(login: string, g:GameRoom){
        const waitSeg = (seg: number) => new Promise(resolve => setTimeout(resolve, seg * 1000));
        if (login == g.playerOne) {
            g.playerOneH = 100;
        }
        else if (login == g.playerTwo) {
            g.playerTwoH = 100;
        }
        let count = 0;
        while (count < 30) { // seconds
            count++;
            await waitSeg(1);
        }
        if (login == g.playerOne) {
            g.playerOneH = 60;
        }
        else if (login == g.playerTwo) {
            g.playerTwoH = 60;
        }
    }

    async smallerPaddle(login: string, g:GameRoom){
        const waitSeg = (seg: number) => new Promise(resolve => setTimeout(resolve, seg * 1000));
        if (login == g.playerOne) {
            g.playerTwoH = 30;
        }
        else if (login == g.playerTwo) {
            g.playerOneH = 30;
        }
        let count = 0;
        while (count < 30) { // seconds
            count++;
            await waitSeg(1);
        }
        if (login == g.playerOne) {
            g.playerTwoH = 60;
        }
        else if (login == g.playerTwo) {
            g.playerOneH = 60;
        }
    }

    async slowerPaddle(login: string, g:GameRoom){
        const waitSeg = (seg: number) => new Promise(resolve => setTimeout(resolve, seg * 1000));
        if (login == g.playerOne) {
            g.playerTwoS = 5;
        }
        else if (login == g.playerTwo) {
            g.playerOneS = 5;
        }
        let count = 0;
        while (count < 30) { // seconds
            count++;
            await waitSeg(1);
        }
        if (login == g.playerOne) {
            g.playerTwoS = 10;
        }
        else if (login == g.playerTwo) {
            g.playerOneS = 10;
        }
    }

    async fasterPaddle(login: string, g:GameRoom){
        const waitSeg = (seg: number) => new Promise(resolve => setTimeout(resolve, seg * 1000));
        if (login == g.playerOne) {
            g.playerOneS = 20;
        }
        else if (login == g.playerTwo) {
            g.playerTwoS = 20;
        }
        let count = 0;
        while (count < 30) { // seconds
            count++;
            await waitSeg(1);
        }
        if (login == g.playerOne) {
            g.playerOneS = 10;
        }
        else if (login == g.playerTwo) {
            g.playerTwoS = 10;
        }
    }

    async reverseMove(login: string, g:GameRoom) {
        if(g.reverseMoveOne || g.reverseMoveTwo) {return;}
        const waitSeg = (seg: number) => new Promise(resolve => setTimeout(resolve, seg * 1000));
        if (login == g.playerOne) {
            g.reverseMoveTwo = true;
        }
        else if (login == g.playerTwo) {
            g.reverseMoveOne = true;
        }
        let count = 0;
        while (count < 15) { // seconds
            count++;
            await waitSeg(1);
        }
        g.reverseMoveOne = false;
        g.reverseMoveTwo = false;
    }

	gamesWhereUserWasPlaying(login: string): Array<string>{
		if (!login) return
		let games: Array<string> = [];
		for (let [key, value] of this.games){
			if(value.playerOne === login || value.playerTwo === login){
				games.push(key);
			}
		}
		return games;
	}

	pauseGame(gameName: string) {
		let game = this.games.get(gameName)
		if (!game) return;
		game.pause = true;
		this.games.set(gameName, game)
	}

	async waitForPlayerReconnect(login: string): Promise<void>{
		let games: Array<string> = this.gamesWhereUserWasPlaying(login)
		if (games.length == 0) return;

		//delete games finished
      	for (let game of games){
			if (this.games.get(game).finish == true){
					await this.chatService.deleteRoom(game)
					await this.gameGateaway.destroyEmptyRooms(game)
					this.games.delete(game)
					games = games.filter(g => g != game)
			}
      	}

        //pause games
      	for (let game of games){
			this.pauseGame(game)
      	}

      	let theOtherPlayers: Set<string> = new Set()
      	for (let game of games){
			if (this.games.get(game).playerOne == login){
				theOtherPlayers.add(this.games.get(game).playerTwo)
			}else{
				theOtherPlayers.add(this.games.get(game).playerOne)
			}
      	}
		this.gameGateaway.sendOtherPlayerPart(Array.from(theOtherPlayers), login)
		//send event to the other player to show a modal

		for (let i = 0; i < 10; i++){
			for (let game of games){
				//check whether the other player is active or not
       			const activeUsers: Array<ChatUser> = this.gameGateaway
        	   		.getActiveUsersInRoom(game);
        	   	const activeLogins: Array<string> = activeUsers.map(u => u.login)

//				console.log(activeLogins)
				if (!activeLogins.includes(this.games.get(game).playerOne) && 
				!activeLogins.includes(this.games.get(game).playerTwo)){
					await this.chatService.deleteRoom(game)
					await this.gameGateaway.destroyEmptyRooms(game)
					this.games.delete(game)
					games = games.filter(g => g != game)
					theOtherPlayers.delete(game)

				}else if(activeLogins.includes(login)){
					//send signal to two players to reactivate 
					//if other player != ""
					this.gameGateaway.sendOtherPlayerCameBack(Array.from(theOtherPlayers), login)
            		this.chatService.setUserStatusIsPlaying(login)
					//send signal to user to go to the left room??? join...
					return ;
				}
        	}
			await waitSeg(1)
        }

		for (let game of games){
			let endGame = this.games.get(game)
			if (!endGame) return;
			if (endGame.playerOne == login){
				endGame.playerOneScore = 0
				endGame.playerTwoScore = 5
			} else {
				endGame.playerOneScore = 5
				endGame.playerTwoScore = 0
			}
			endGame.finish = true;
			this.chatService.saveGameResult(endGame)
        	//end game, save results

        	//delete room
			await this.chatService.deleteRoom(game)
			await this.gameGateaway.destroyEmptyRooms(game)

			if (this.games.get(game).playerOne == login){
            	this.chatService.setUserStatusIsActive(this.games.get(game).playerTwo)
            } else {
            	this.chatService.setUserStatusIsActive(this.games.get(game).playerOne)
            }
			this.games.delete(game)
		}
	}
}
