import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppModule } from '../app.module';
import { IonicModule } from '@ionic/angular';
import { SplashComponent } from './splash/splash.component';

@NgModule({
  declarations: [
    SplashComponent,

  ],
  imports: [
    CommonModule,
    IonicModule,
    
  ],
  exports: [
    SplashComponent,
  ]
})
export class ComponentsModule { }
