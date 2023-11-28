import { Component, Inject, OnInit } from '@angular/core';
import { PongComponent } from '../pong.component';
import { PongService } from '../pong.service';
import { Subject, Subscription, pipe } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { ChatMessage, SocketPayload } from '@shared/types';
import { EntityComponent } from '../entity/entity.component'
import { SocketService } from 'src/app/socket.service';

@Component({
  selector: 'app-paddle',
  templateUrl: './paddle.component.html',
  styleUrls: ['./paddle.component.css']
})

export class PaddleComponent extends EntityComponent {
  move:string = "";
  pongService:PongService={} as PongService;
  private subscriptions = new Subscription();
  destroy: Subject<any> = new Subject();

  constructor(
    @Inject('widthToken') w:number,
    @Inject('highToken') h:number,
    @Inject('xToken') x:number,
    @Inject('yToken') y:number,
    @Inject('speedToken') speed:number,
    pongService:PongService){
      
      super(w,h,x,y,speed);
      this.pongService = pongService;
      this.subscriptions.add(
      this.pongService
      .getMessage()
      .pipe(takeUntil(this.destroy)) //a trick to finish subscriptions (first part)
      .subscribe((payload: SocketPayload) => {
        if (payload.event === 'direction')
          this.y += payload.data * this.speed;
      }));
  }

  ngOnDestroy() {
  //a trick to finish subscriptions (second part)
  this.destroy.next("");
  this.destroy.complete();
  }

  update(canvas: any){
  //     if( PongComponent.keysPressed[KeyBindings.UP] ){
  //         this.pongService.sendSignal("up", "#pongRoom", "pong", this.y, this.height, canvas.height);
  //     }else if(PongComponent.keysPressed[KeyBindings.DOWN]){
  //         this.pongService.sendSignal("down", "pongRoom", "pong", this.y, this.height, canvas.height);
  //     }else{
  //         this.yVel = 0;
  //     }
  // }
}

// enum KeyBindings{
//   UP = 38,
//   DOWN = 40,
//   SPACE = 32,
//   ESCAPE = 27
}
