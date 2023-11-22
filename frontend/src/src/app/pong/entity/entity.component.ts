import { Component, Inject } from '@angular/core';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.css']
})

export class EntityComponent {
  
  width:number;
    height:number;
    x:number;
    y:number;
    xVel:number = 0;
    yVel:number = 0;
    speed:number;
    constructor(
      @Inject('widthToken') w:number,
      @Inject('highToken') h:number,
      @Inject('xToken') x:number,
      @Inject('yToken') y:number,
      @Inject('speedToken') speed:number){       
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
