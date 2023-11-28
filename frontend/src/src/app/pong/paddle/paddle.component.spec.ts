import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaddleComponent } from './paddle.component';

describe('PaddleComponent', () => {
  let component: PaddleComponent;
  let fixture: ComponentFixture<PaddleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PaddleComponent]
    });
    fixture = TestBed.createComponent(PaddleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
