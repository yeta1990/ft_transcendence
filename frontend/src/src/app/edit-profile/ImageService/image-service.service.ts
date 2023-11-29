import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private apiUrl = environment.apiUrl + '/user/default-images';
  private imageChangedEventSource = new BehaviorSubject<any>('');
  imageChangedEvent$ = this.imageChangedEventSource.asObservable();

  private croppedImageSource = new BehaviorSubject<any>('');
  croppedImage$ = this.croppedImageSource.asObservable();

  private selectedImageSource = new Subject<File>();
  selectedImage$ = this.selectedImageSource.asObservable();

  constructor(
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
    ) {}

  getAvatarImages(): Observable<string[]> {
    return this.httpClient.get<{ images: string[] }>(`${this.apiUrl}`).pipe(
      catchError((error) => {
        console.error('Error fetching avatar images:', error);
        return [];
      }),
      map((response) => response.images || [])
    );
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEventSource.next(event);
  }


  selectImage(image: File): void {
    this.selectedImageSource.next(image);
  }

}
