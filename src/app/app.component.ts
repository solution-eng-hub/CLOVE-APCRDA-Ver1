import { Component, AfterViewInit, OnInit, Renderer2 } from '@angular/core';
import * as L from 'leaflet';
import { DataService } from './data.service'; // Replace 'your-data-service-path' with the actual path
import * as $ from 'jquery';
import { Modal } from 'bootstrap';
import 'leaflet-search';
import { Router } from '@angular/router';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {

    constructor(private router: Router) { }
    viewerOpened = false;

    onViewerOpened():void{
      this.viewerOpened = true;
    }
    ngOnInit(): void {
   
    }
    // navigateToViewer(fileName: string): void {
    //     window.open(`/viewer?fileName=${encodeURIComponent(fileName)}`, '_blank');
    // }
    
    public ngAfterViewInit(): void {
        
    }

}





















// const epsgSelector = new Epsg_code_selector();

// console.log(epsgSelector);
