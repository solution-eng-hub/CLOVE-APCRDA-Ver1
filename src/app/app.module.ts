import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';

// import { CesiumDirective } from './cesium.directive';
// import { CubeServiceService } from './services/cube-service.service';

// import { DataService } from './data.service';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,

    // CesiumDirective,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  // providers: [CubeServiceService],
  providers: [],
  bootstrap: [
    AppComponent,
  ],
})
export class AppModule {
}
// src/app/app.module.ts




