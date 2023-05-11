import { Injectable, ErrorHandler } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor() {}

  handleError(error: Error | HttpErrorResponse) {
    console.log('Ere tonto');
  }
}

