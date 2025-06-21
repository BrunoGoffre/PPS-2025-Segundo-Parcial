import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dynamic-splash',
  templateUrl: './dynamic-splash.component.html',
  styleUrls: ['./dynamic-splash.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DynamicSplashComponent  implements OnInit {
  showSplash = true;

  constructor() { }

  ngOnInit() {
   this.hideSplashScreen();
  }

  hideSplashScreen() {
      setTimeout(() => {
      this.showSplash = false;
    }, 4000); 
  }
}
