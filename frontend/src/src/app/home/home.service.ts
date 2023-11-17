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
    //private gameRoom: PongComponent,
    private myProfileService: MyProfileService,
    private route: ActivatedRoute) {}
    
  }
