import { Injectable } from '@nestjs/common';
import { ChatMessage, SocketPayload, GameRoom, ChatUser } from '@shared/types';
import { GameGateway } from 'src/events/game.gateway';
@Injectable()
export class PongService {

    public game: GameRoom;
    public gameGateaway: GameGateway;
    games: Map<string, GameRoom> = new Map<string, GameRoom>;
    public numberOfGames: number = 0;

    private matchMaking: Array<string> = new Array<string>;

    initGame (name: string, gameGateaway: GameGateway, viwer: number, nick:string): GameRoom {
        
        if (this.games.get(name))
            return(this.games.get(name));
        console.log("Init -> " + name);
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
            true,               //pause
            false,              //finish

            //Viwer
            viwer,              //viwer
            "",                 //playerOne
            ""                  //playerTwo
        );
        
        this.games.set(name, this.game);
        this.randomDir(name);
        this.numberOfGames++;

        this.updateGame(gameGateaway, this.game)
        // if (this.numberOfGames == 1){
        //     this.updateGame(gameGateaway)
        // }
        return (this.games.get(name));
    }

    updateGame(gameGateway :GameGateway, game: GameRoom){
        //this.games.forEach(element => {
            //element.gameMode = 1;
            //console.log("Update -> " + element.room);
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
                    //console.log("\t-> " + targetUsers[i].nick + " in " + element.room);
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
        if (g.pause) { return;}
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
    }

    addUserToList(login: string) {
        this.matchMaking.push(login);
        if (this.matchMaking.length >= 2){
            
        }
    }

    disconectPlayer(room:string, nick:string) {
        var g = this.games.get(room)
        if (g.playerOne == nick){
            g.playerOne = "";
        }         
        if (g.playerTwo == nick){
            g.playerTwo = "";
        }
    }
}
