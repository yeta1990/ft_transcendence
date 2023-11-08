import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminChatPageComponent } from './admin-chat-page.component';

describe('AdminChatPageComponent', () => {
  let component: AdminChatPageComponent;
  let fixture: ComponentFixture<AdminChatPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminChatPageComponent]
    });
    fixture = TestBed.createComponent(AdminChatPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
