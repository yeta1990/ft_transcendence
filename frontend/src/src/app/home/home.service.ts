import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../user';
import { environment } from '../../environments/environment';
import { PongService } from '../pong/pong.service';
import { PongComponent } from '../pong/pong.component';
import { MyProfileService } from '../my-profile/my-profile.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor(
    private httpClient: HttpClient, 
    private pongService: PongService, 
    private gameRoom: PongComponent,
    private myProfileService: MyProfileService,
    private route: ActivatedRoute) {}
    
    newRoom(){
      this.gameRoom = new PongComponent(this.pongService, this.myProfileService, this.route);
    }

    onLine() {
      this.pongService.onlineBoolean = true;
      this.gameRoom = new PongComponent(this.pongService, this.myProfileService, this.route);
    }
  }
