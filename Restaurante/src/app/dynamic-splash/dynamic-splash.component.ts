import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dynamic-splash',
  templateUrl: './dynamic-splash.component.html',
  styleUrls: ['./dynamic-splash.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DynamicSplashComponent implements OnInit {
  showSplash = true;
  loadingProgress = 0;
  loadingInterval: any;

  constructor() { }

  ngOnInit() {
    this.hideSplashScreen();
    this.simulateLoading();
  }

  simulateLoading() {
    this.loadingInterval = setInterval(() => {
      if (this.loadingProgress < 100) {
        this.loadingProgress += 5;
      } else {
        clearInterval(this.loadingInterval);
      }
    }, 150);
  }

  hideSplashScreen() {
    setTimeout(() => {
      this.showSplash = false;
    }, 4500); 
  }
}
