import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToasterService } from './toaster.service';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastData } from '@shared/types';
import { ToastValues } from '@shared/const'

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html',
  styleUrls: ['./toaster.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('hidden', style({
        opacity: 0,
        display: 'none'
      })),
      state('visible', style({
        opacity: 1,
        display: 'block'
      })),
      transition('visible => hidden', animate('0.5s')),
    ])
  ]
})

//Here the logic is:
// - Create a subscription for each event that arrives.
// - That subscription will be active for 3 seconds
// - At that time it will disappear.
// - Each message has an "id" assigned to it
// - With that id you can assign a timer to that message and also manually close the event.
export class ToasterComponent implements OnInit, OnDestroy {
  toastValues = ToastValues;
  private ngUnsubscribe = new Subject<void>(); // Subject para controlar la desubscripción
  private hideToastSubjects: { [key: number]: Subject<void> } = {}; // Objeto para almacenar los Subjects de ocultación de cada toast
  toasts: ToastData[] = []; 
  private toastCounter = 0; 

  constructor(private toasterService: ToasterService) {}

  ngOnInit() {
    this.toasterService.toaster.subscribe((toastData) => {
      const toastId = this.toastCounter++; // Unique id for 

	  toastData.id = toastId;
	  toastData.status = true;

      // Si el toast ya existe, cancelamos el temporizador anterior
      if (this.hideToastSubjects[toastId]) {
        this.hideToastSubjects[toastId].next();
        this.hideToastSubjects[toastId].complete();
      }

      // Creamos un nuevo temporizador para el toast actual
      this.hideToastSubjects[toastId] = new Subject<void>();

      this.toasts.push(toastData);

      // Suscribimos el tiempo de ocultación del toast actual
      timer(3000)
        .pipe(takeUntil(this.hideToastSubjects[toastId]))
        .subscribe(() => {
          this.hideToast(toastId);
        });

      // Agregamos el toast a la lista

    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

    // Cancelar todos los temporizadores y limpiar el objeto hideToastSubjects
    Object.keys(this.hideToastSubjects).forEach((key) => {
      this.hideToastSubjects[parseInt(key)].next();
      this.hideToastSubjects[parseInt(key)].complete();
    });
    this.hideToastSubjects = {};
  }

  hideToast(toastId: number) {
    const index = this.toasts.findIndex((toast) => toastId === toast.id);
	this.toasts[index].status = false;
    if (index !== -1) {
    	setTimeout(() => {
			this.toasts.splice(index, 1); // Eliminar el toast actual de la lista
    	}, 1000)
    }
  }
}

