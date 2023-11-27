import {HTTP_INTERCEPTORS} from '@angular/common/http';
import { ErrorHandler } from '@angular/core';

import { AuthInterceptor } from './auth/auth.interceptor';
import { ErrorInterceptor } from './error-interception/error.interceptor';
import { GlobalErrorHandler } from './error-interception/global-error-handler.service';

export const interceptorProviders = [
]
/*
  {
	provide: ErrorHandler,
	useClass: GlobalErrorHandler,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
    },
  {
	provide: HTTP_INTERCEPTORS,
	useClass: AuthInterceptor,
	multi: true
  }
];
*/
