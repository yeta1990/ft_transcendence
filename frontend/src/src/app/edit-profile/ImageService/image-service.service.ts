import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private apiUrl = environment.apiUrl + '/user/default-images';

  constructor(private httpClient: HttpClient) {}

  getAvatarImages(): Observable<string[]> {
    return this.httpClient.get<{ images: string[] }>(`${this.apiUrl}`).pipe(
      catchError((error) => {
        console.error('Error fetching avatar images:', error);
        return [];
      }),
      map((response) => response.images || [])
    );
  }
}