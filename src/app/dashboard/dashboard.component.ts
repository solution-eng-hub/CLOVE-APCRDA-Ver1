import { Component, OnInit, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { Viewer, ProviderViewModel, Cesium3DTileset, OpenStreetMapImageryProvider, buildModuleUrl } from 'cesium';

// import { Cesium3DTileset } from 'cesium/Source/Scene/Cesium3DTileset';
import * as Cesium from 'cesium';
import * as bootstrap from 'bootstrap';
//import * as proj4 from 'proj4';
import * as proj4x from 'proj4';
let proj4 = (proj4x as any).default;
import { MapboxImageryProvider } from "cesium";
import * as turf from '@turf/turf';
import * as $ from 'jquery';
import * as THREE from 'three';
import { EventDispatcher } from 'three';
import { environment } from 'src/environments/environment';
import { Offcanvas } from 'bootstrap';
interface FileListResponse {
    files: string[];
}

// /// /// DB Fetch from Service API
import { ApiFetchService } from '../services/api-fetch.service';



@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent {
    viewer: Cesium.Viewer | undefined;
    tileset: Cesium.Cesium3DTileset | undefined;;
    private camera: Cesium.Camera | undefined;
    scene: Cesium.Scene | undefined;
    private globe: Cesium.Globe | undefined;
    private ellipsoid: Cesium.Ellipsoid | undefined;
    geodesic: Cesium.EllipsoidGeodesic | undefined;

    lst_projects: any[] = [];
    groupedProjects: any[] = [];


    constructor(private apiFetchService: ApiFetchService) {}

    selectedAction: string = "None"; // Initialize selectedAction

    ast_highlighted_obj: any; // Adjust the type as needed
    fea_highlighted_obj: any; // Adjust the type as needed
    originalStyle: any;
    feaoriginalStyle: any;
    apiKey = environment.authentication_api.Apikey;
    private data_GUID: HTMLElement | null = null;

    button1: HTMLButtonElement | null = null;
    button2: HTMLButtonElement | null = null;
    button3: HTMLButtonElement | null = null;
    button4: HTMLButtonElement | null = null;
    button5: HTMLButtonElement | null = null;

    buttonsVisible: boolean = false; 
    ModelHoverFeatures: string[] = ['Project', 'Building', 'Floor'];

    points: Cesium.PointPrimitiveCollection | undefined;
    polylines: Cesium.PolylineCollection | undefined;
    distanceLabel: Cesium.Entity | undefined;
    verticalLabel: Cesium.Entity | undefined;
    horizontalLabel: Cesium.Entity | undefined;
    polygonEntity: Cesium.Entity | undefined;
    label = {
        font: '24px monospace',
        showBackground: true,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, 0),
        fillColor: Cesium.Color.ORANGERED,
        text: ''
    };
    point1: Cesium.PointPrimitive | undefined;
    point2: Cesium.PointPrimitive | undefined;
    point3: Cesium.PointPrimitive | undefined;
    point1GeoPosition: any;
    point2GeoPosition: any;
    LINEPOINTCOLOR: Cesium.Color = Cesium.Color.RED;
    polyline1: Cesium.Polyline | undefined;
    polyline2: Cesium.Polyline | undefined;
    arr_tmp_pnt: Cesium.PointPrimitiveCollection | undefined;
    tmp_pnt: Cesium.PointPrimitive | undefined;
    arr_tmppolyline: Cesium.PolylineCollection | undefined;
    tmp_polyline: Cesium.Polyline | undefined;
    private roffcanvasRightFertures: Offcanvas | undefined;
    handler: Cesium.ScreenSpaceEventHandler | undefined;

    selectedValue: any = 1;
    clippingPlanesCollection: any;
    boundingBoxEntity: any;

    combinedBoundingSphere: any;
    centerCircleEntity: any;
    tilesets: { tileset: Cesium.Cesium3DTileset }[] = [];

    loadedModelTilesets = new Map();
    ortholoadedLayers = new Map();
    loadedJsonLayers = new Map<string, Cesium.GeoJsonDataSource>();
    terrainEnabled = false;
    defaultTerrain: any

    dataVill = {
        "ortho": ["Kuragallu", "Krishnayyapalem", "Mangalagiri", "Nidamarru", "Nowluru"],
        "dem": ["Mangalagiri"],
        "model": ["road", "happyNest"],
        "geo": ["Capital City Layers", 'Amaravati Infra', "Lands", 'PlanningBoundary', 'Forests', 'Planning Boundaries', 'Transportation', 'DMPRoads']
    };


    assetId = 3711747; // Your asset ID
    customToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NzAwZDc2OC1jMjVkLTQwMzItYjE0MS0zNGI0YWRjOTcwOTEiLCJpZCI6MzM5NDE4LCJpYXQiOjE3NTc3MzI0NzF9.Q5-BBvrgsmTjHrYqfKj1E_gugLFCZCLuxPev6_uJdaE'; // The other token


    ngOnInit(): void {
        this.proj_setup();

        document.addEventListener('contextmenu', event => event.preventDefault())
    }

    ngAfterViewInit(): void {
        // this.toggleBasemapList()
        this.showHideEachFeatures()
        this.populateVillageTabs(this.dataVill);
        this.searchFunction();
        this.MainFunctionDataLoading();
        this.initializeOffcanvas();
        this.tilesetClickToOpenRightCanvas();
    }

    private proj_setup(): void {
        // Set Cesium base URL to the assets directory
        (window as any).CESIUM_BASE_URL = '/assets/cesium';
        // Cesium.Ion.defaultAccessToken = environment.mapbox.accessToken
        // Set your Cesium Ion access token
        Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MWZkMGQ5NC0wZjQzLTRhMzUtYmU5Mi1mNDZiMDFmMTgzNjIiLCJpZCI6NjAzLCJpYXQiOjE2NzgxODE3NDd9.Dy85aHzYZ4V4ZpIMuayjJ82kaXXcl75vWPx4ahjxH94";

        // Create Cesium viewer
        this.viewer = new Cesium.Viewer('IFC_Vwr', {

            timeline: false,
            animation: false,
            vrButton: false,
            geocoder: false,
            baseLayerPicker: false,
            sceneModePicker: false,
            infoBox: false,
            selectionIndicator: false,
            homeButton: false,
            navigationHelpButton: false,
            scene3DOnly: false,
            fullscreenButton: false,
            shouldAnimate: true,
            // terrainExaggeration: 1.02,

            imageryProviderViewModels: [
                new Cesium.ProviderViewModel({
                    name: 'OpenStreetMap',
                    iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
                    tooltip: 'OpenStreetMap (OSM)',
                    creationFunction: function () {
                        return new Cesium.OpenStreetMapImageryProvider({
                            url: 'https://a.tile.openstreetmap.org/'
                        });
                    }
                })
            ],

            selectedImageryProviderViewModel: undefined // Ensure default imagery provider is not pre-selected
        });

        this.defaultTerrain = this.viewer!.terrainProvider;
        this.camera = this.viewer.camera;
        this.scene = this.viewer.scene;
        this.globe = this.scene.globe;
        this.ellipsoid = Cesium.Ellipsoid.WGS84;
        this.geodesic = new Cesium.EllipsoidGeodesic();
        this.points = this.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        this.polylines = this.scene.primitives.add(new Cesium.PolylineCollection());
        this.arr_tmp_pnt = this.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        this.arr_tmppolyline = this.scene.primitives.add(new Cesium.PolylineCollection());

        this.handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas)
        // Enable depth test against terrain
        if (this.viewer.scene && this.viewer.scene.globe) {
            this.viewer.scene.globe.depthTestAgainstTerrain = false;
        }

        const creditContainer = this.viewer.cesiumWidget.creditContainer;
        if (creditContainer && creditContainer.parentNode) {
            creditContainer.parentNode.removeChild(creditContainer);
        }

        // this.dynamicTilesetLoaderFromDb(this.viewer);
        this.dynamic_load_models_from_db();
    }


    dynamic_load_models_from_db()
    {
        this.Get_all_projects_List();
    }


    Get_all_projects_List() {
        console.log("Get_all_projects_List Get_all_projects_List Get_all_projects_List")
        this.apiFetchService.get_list_projs().subscribe({
            next: (response:any) => {
                console.log('Data received:', response);
                this.lst_projects = response;
                this.groupedProjects = this.groupByProjectName(response.data);
            },
            error: (err:any) => {
                console.error('Error fetching data:', err);
            }
        });
    }




    // updateCombinedBoundingSphere() {
    //     this.combinedBoundingSphere = Cesium.BoundingSphere.fromBoundingSpheres(
    //         this.tilesets.map((item: any) => item.tileset.boundingSphere)
    //     );
    // }
    // dynamicTilesetLoaderFromDb(viewer: Viewer): void {
    //     Cesium.createWorldTerrainAsync().then((worldTerrain: Cesium.CesiumTerrainProvider) => {
    //         const utmProjection = '+proj=utm +zone=44 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
    //         const utmCoordinates = [214740.52436519694, 1925644.8313872416];
    //         const wgs84Coordinates = proj4(utmProjection, '+proj=longlat +datum=WGS84 +no_defs', utmCoordinates);
    //         const tilesetUrlArr = ['../../assets/L04/tileset.json'];
    //         tilesetUrlArr.forEach((tilesetUrl, index) => {

    //             Cesium.Cesium3DTileset.fromUrl(tilesetUrl).then((tileset: Cesium.Cesium3DTileset) => {
    //                 tileset.asset["unqid"] = 3

    //                 this.tilesets.push({ tileset })
    //                 viewer.scene.primitives.add(tileset);

    //                 if (this.tilesets.length === tilesetUrlArr.length) {
    //                     this.updateCombinedBoundingSphere();
    //                     console.log(this.combinedBoundingSphere)
    //                     viewer.zoomTo(tileset)
    //                 }
    //             }).catch((error: any) => {
    //                 console.error(`Failed to load tileset from '${tilesetUrl}':`, error);
    //             });
    //         })
    //     }).catch((error: any) => {
    //         console.error('Error loading world terrain:', error);
    //     });
    // }

    // switchImageryProvider(newImageryProvider: any) {
    //     // Clear existing imagery layers
    //     this.viewer!.imageryLayers.removeAll();
    //     // Add the new imagery provider as the base layer
    //     this.viewer!.imageryLayers.addImageryProvider(newImageryProvider);
    // }

    // changeBasemap(basemapType: any): void {
    //         // const basemapType: string = (event.target as HTMLInputElement).value;

    //         // Check if viewer and imageryLayers are defined
    //         if (!this.viewer || !this.viewer.imageryLayers) {
    //             console.error("Viewer or imageryLayers is not defined.");
    //             return;
    //         }

    //         // Update the basemap based on the selected type
    //         this.viewer.imageryLayers.removeAll();



    //         switch (basemapType) {
    //             case "GOOGLE-ROADS":

    //                 var googleSatelliteProvider = new Cesium.UrlTemplateImageryProvider({
    //                     url: 'https://mt1.google.com/vt/&x={x}&y={y}&z={z}', // 'lyrs=s' specifies satellite imagery
    //                     credit: 'Google Maps'
    //                 });

    //                 this.switchImageryProvider(googleSatelliteProvider)
    //                 break;

    //             case "GOOGLE-SATELLITE":

    //                 var googleSatelliteProvider = new Cesium.UrlTemplateImageryProvider({
    //                     url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // 'lyrs=s' specifies satellite imagery
    //                     credit: 'Google Maps Satellite'
    //                 });
    //                 this.switchImageryProvider(googleSatelliteProvider)

    //                 break;

    //             case "MAPBOX":
    //                 //// Create Mapbox imagery provider
    //                 var mapboxAccessToken = 'pk.eyJ1Ijoia3Jpc3RpbmhlbnJ5IiwiYSI6ImNqMWdxMjd5aDAwM28zM2xtaGV2azYwcjYifQ.NTJiOqcnhP-_3etf4aZYmQ';
    //                 var mapboxImageryProvider = new Cesium.MapboxImageryProvider({
    //                     mapId: 'mapbox.satellite', // You can use other Mapbox map styles as well
    //                     accessToken: mapboxAccessToken
    //                 });
    //                 this.switchImageryProvider(mapboxImageryProvider)

    //                 break;
    //             // case "OPENSTREET":
    //             // 	switchImageryProvider(Cesium.createOpenStreetMapImageryProvider({url : 'https://a.tile.openstreetmap.org/'}))
    //             // 	break;
    //             //case "PHOTOREALESTIC":
    //             //	var ionImageryProvider = new Cesium.IonImageryProvider({ assetId: 2275207 });
    //             //	switchImageryProvider(ionImageryProvider)
    //             //	break;
    //             case 'OPENSTREET':
    //                 this.viewer.imageryLayers.addImageryProvider(
    //                     new Cesium.OpenStreetMapImageryProvider({})
    //                 );
    //                 break;
    //             default:
    //                 console.log("BaseMap is not in the List", basemapType);
    //         }
    //     }

    // toggleBasemapList(): void {
    //     const $selectedIcon = $('#selectedIcon');
    //     const $extraIcons = $('#extraIcons');

    //     if ($selectedIcon.length === 0 || $extraIcons.length === 0) {
    //         console.error('Required DOM elements not found');
    //         return;
    //     }

    //     // Toggle the extra icons menu
    //     $selectedIcon.on('click', () => {
    //         $extraIcons.toggleClass('expanded');
    //     });

    //     // Add click listener to icons using event delegation (handles dynamic elements)
    //     $extraIcons.on('click', '.ggl_map_layer_icos', (event) => {
    //         console.log('iconclick');
    //         const $icon = $(event.currentTarget);

    //         const $selectedImg = $selectedIcon.find('img');
    //         const selectedTitle = $selectedIcon.attr('title');
    //         const selectedLayer = $selectedIcon.attr('data-layer');
    //         const selectedSrc = $selectedImg.attr('src');
    //         const selectedAlt = $selectedImg.attr('alt');

    //         if (!$selectedImg.length || !selectedTitle || !selectedLayer || !selectedSrc || !selectedAlt) {
    //             console.error('Selected icon data is incomplete');
    //             return;
    //         }

    //         // Get clicked icon data
    //         const $clickedImg = $icon.find('img');
    //         const clickedTitle = $icon.attr('title');
    //         const clickedLayer = $icon.attr('data-layer');
    //         const clickedSrc = $clickedImg.attr('src');
    //         const clickedAlt = $clickedImg.attr('alt');

    //         if (!$clickedImg.length || !clickedTitle || !clickedLayer || !clickedSrc || !clickedAlt) {
    //             console.error('Clicked icon data is incomplete');
    //             return;
    //         }

    //         // Call changeBasemap with the clicked layer (uncomment and adjust if needed)
    //         this.changeBasemap(clickedLayer);
    //         console.log('Selected basemap:', clickedLayer);

    //         // Swap values
    //         $selectedImg.attr('src', clickedSrc).attr('alt', clickedAlt);
    //         $selectedIcon.attr('title', clickedTitle).attr('data-layer', clickedLayer);

    //         // Create new icon for the one that was selected
    //         const $newIcon = $('<div>', {
    //             class: 'ggl_map_layer_icos',
    //             title: selectedTitle,
    //             'data-layer': selectedLayer
    //         }).append($('<img>', { src: selectedSrc, alt: selectedAlt }));

    //         // Replace the clicked icon with the new one (delegation ensures new icon is clickable)
    //         $icon.replaceWith($newIcon);

    //         // Close menu
    //         $extraIcons.removeClass('expanded');
    //     });
    // }



    // ----------------



    populateVillageTabs(data: any) {
        Object.entries(data).forEach(([key, villages]) => {
            const tabContainer = document.getElementById(`pills-${key}`);
            if (!tabContainer) return; // Skip if tab not found

            tabContainer.innerHTML = ''; // Clear previous content
            if (Array.isArray(villages)) {
                villages.forEach((village: string) => {
                    const labelHTML = `
                    <label class="eachVill" for="${key}-${village}">
                        <div class="checkbox-wrapper-15 villCheck">
                            <input class="inp-cbx inputVallagesCheck" data-village="${village}" id="${key}-${village}" type="checkbox" style="display: none;" />
                            <label class="cbx" for="${key}-${village}">
                                <span>
                                    <svg width="12px" height="9px" viewBox="0 0 12 9">
                                        <polyline points="1 5 4 8 11 1"></polyline>
                                    </svg>
                                </span>
                            </label>
                        </div>
                        <img src="repos/tab_images/${village}.webp" alt="">
                        <span class="villLabel" title="${village}">${village}</span>
                    </label>
                    `;
                    tabContainer.insertAdjacentHTML('beforeend', labelHTML);
                });
            }

        });
    }
    searchFunction(): void {
        $('#searchVillages').on('input', function (this: HTMLInputElement): void {
            const query: string = ($(this).val() as string)?.toLowerCase() ?? '';

            $('#panelContent .eachVill').each(function (this: HTMLElement): void {
                const villageName: string = ($(this).find('.villLabel').text() as string)?.toLowerCase() ?? '';

                if (villageName.includes(query)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });
    }

    MainFunctionDataLoading() {
        $(document).on('change', '#pills-ortho .inputVallagesCheck', () => {
            const allChecked: boolean =
                $('#pills-ortho .inputVallagesCheck:checked').length === $('#pills-ortho .inputVallagesCheck').length;
            $('#selectAllVill').prop('checked', allChecked);
            this.checkSelectedOrthoVillagesToLoad();
        });;

        $(document).on('change', '#pills-dem .inputVallagesCheck', () => {
            let allChecked = $('#pills-dem .inputVallagesCheck:checked').length === $('#pills-dem .inputVallagesCheck').length;
            $('#selectAllVill').prop('checked', allChecked);
            this.checkSelectedDEMvillagesToLoad()
        });
        $(document).on('change', '#pills-model .inputVallagesCheck', async (event: JQuery.ChangeEvent) => {
            const allChecked: boolean = $('#pills-model .inputVallagesCheck:checked').length === $('#pills-model .inputVallagesCheck').length;
            $('#selectAllVill').prop('checked', allChecked);
            this.checkSelectedModelsToLoad()
        });

        $(document).on('change', '#pills-geo .inputVallagesCheck', async (event: JQuery.ChangeEvent) => {
            const allChecked: boolean = $('#pills-geo .inputVallagesCheck:checked').length === $('#pills-geo .inputVallagesCheck').length;
            $('#selectAllVill').prop('checked', allChecked);
            this.loadGeoJsonData()
        });




        $('#selectAllVill').on('change', (event) => {
            const $checkbox = $(event.target as HTMLInputElement);
            const isChecked = $checkbox.is(':checked');

            // Get active tab pane and its ID once
            const $activeTabPane = $('#pills-tabContent .tab-pane.active.show');
            const tabId = $activeTabPane.attr('id');

            // Toggle all checkboxes inside that tab
            $activeTabPane.find('.eachVill .inputVallagesCheck')
                .prop('checked', isChecked);

            // Handle tab-specific logic
            switch (tabId) {
                case 'pills-ortho':
                    this.checkSelectedOrthoVillagesToLoad();
                    break;
                case 'pills-dem':
                    this.checkSelectedDEMvillagesToLoad();
                    break;
                case 'pills-model':
                    this.checkSelectedModelsToLoad();
                    break;
                case 'pills-geo':
                    this.loadGeoJsonData();
                    console.log('geo all tab clicked', isChecked)
                    break;
                default:
                    console.log('Unknown tab:', tabId);
            }
        });

        $('.nav-pills .nav-item button').on('click', function () {
            const $clickedButton = $(this);
            const clickTarget = $clickedButton.attr('data-bs-target');
            let clickPill = null;
            if (clickTarget) {
                clickPill = clickTarget.startsWith('#') ? clickTarget.substring(1) : clickTarget;
                const allChecked: boolean = $(`#${clickPill} .inputVallagesCheck:checked`).length === $(`#${clickPill} .inputVallagesCheck`).length;
                $('#selectAllVill').prop('checked', allChecked);
            }
        });



    }
    showHideEachFeatures(): void {
        const $panel: JQuery<HTMLElement> = $('#slidePanel');
        const $buttons: JQuery<HTMLElement> = $('#buttonWrapper');
        const $content: JQuery<HTMLElement> = $('#panelContent');

        $('.eachFretureBtns').on('click', function (this: HTMLElement): void {
            console.log('Feature button clicked');
            if ($(this).hasClass('active')) {
                $panel.addClass('active');
                $buttons.addClass('raised');
                $('.selecetions_4r_basemap').addClass('raised');
                $('#offcanvasRightFeatures').addClass('raised')
            }
        });

        $('#closeBtn').on('click', (): void => {
            $panel.removeClass('active');
            $buttons.removeClass('raised');
            $('.selecetions_4r_basemap').removeClass('raised');
            $('#offcanvasRightFeatures').removeClass('raised')
        });

        // Drag scroll functionality
        let isDragging: boolean = false;
        let startX: number = 0;
        let scrollLeft: number = 0;

        $content.on('mousedown', (e: JQuery.MouseDownEvent<HTMLElement>): void => {
            // Prevent any default behavior and propagation for checkboxes
            if ($(e.target).is('input[type="checkbox"]') || $(e.target).parents('input[type="checkbox"]').length) {
                e.preventDefault();
                e.stopPropagation();
            }
            isDragging = true;
            $content.addClass('dragging');
            startX = e.pageX;
            scrollLeft = $content.scrollLeft() ?? 0; // Handle null case
        });

        $(document).on('mouseup', (): void => {
            isDragging = false;
            $content.removeClass('dragging');
        });

        $(document).on('mousemove', (e: JQuery.MouseMoveEvent<Document, undefined, Document, Document>): void => {
            if (!isDragging) return;
            e.preventDefault();
            const x: number = e.pageX;
            const walk: number = (x - startX) * -1.5; // scroll direction & speed
            $content.scrollLeft(scrollLeft + walk);
        });

        // Prevent checkbox interaction during dragging
        $content.find('input[type="checkbox"]').on('mousedown click', (e: JQuery.TriggeredEvent<HTMLElement>): void => {
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }


    //--------------------------------------------------------------------------------------------------------------------------------------
    // aurtho loading --------------start ----------------
    loaded_ortho_vill: string[] = [];
    checkSelectedOrthoVillagesToLoad(): void {
        this.uncheckCheckedVillagesInDemTab();
        // Get all checked village names
        const checkedVillages: string[] = $('#pills-ortho .inputVallagesCheck:checked').map(function (this: HTMLElement) {
            return $(this).data('village') as string;
        }).get();

        // Get all village names (checked + unchecked)
        const allVillages: string[] = $('#pills-ortho .inputVallagesCheck').map(function (this: HTMLElement) {
            return $(this).data('village') as string;
        }).get();

        console.log(allVillages)
        // Loop through all villages
        this.loaded_ortho_vill = []
        allVillages.forEach((villageName: string) => {
            const isChecked: boolean = checkedVillages.includes(villageName);

            if (isChecked) {
                // Load or show the layer
                this.loaded_ortho_vill.push(villageName);
                this.loadOrthoTileset(villageName);
            } else {
                // Hide the layer if it exists
                if (this.ortholoadedLayers.has(villageName)) {
                    const layer = this.ortholoadedLayers.get(villageName);
                    // layer.show = false; // Hide the layer
                    this.viewer!.imageryLayers.remove(layer, true); // remove the layer and destroy it
                    this.ortholoadedLayers.delete(villageName);
                }
            }
        });
    }

    async loadOrthoTileset(folderName: string): Promise<void> {
        if (this.terrainEnabled) {
            // If terrain was enabled earlier, disable or revert to default
            // this.viewer!.terrainProvider = Cesium.createWorldTerrain();
            this.terrainEnabled = false;
        }

        const tilemapURL = `/repos/ortho_tiles_data/${folderName}/tilemapresource.xml`;

        try {
            // Check if tilemapresource.xml exists via HEAD
            const headResp = await fetch(tilemapURL, { method: 'HEAD' });
            if (!headResp.ok) {
                console.warn(`No data found for "${folderName}" (tilemapresource.xml missing or inaccessible)`);
                return;
            }

            // Fetch bounds data (your custom method; should return a Cesium.Rectangle or similar)
            const bounds = await this.fetchCombinedBoundingBox(this.loaded_ortho_vill);
            if (!bounds) {
                console.warn(`Could not fetch bounding box for "${folderName}"`);
                return;
            }

            // If already loaded as layer, just make visible & zoom
            if (this.ortholoadedLayers.has(folderName)) {
                const existingLayer = this.ortholoadedLayers.get(folderName)!;
                existingLayer.show = true;
                // Always zoom to the bounds of the current layer
                this.zoomToBounds(bounds);
                return;
            }


            console.log(`Loading orthophoto folder: ${folderName}`);

            // Use the Cesium factory method for TMS providers (which also reads metadata from the XML)
            const imageryProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(
                `/repos/ortho_tiles_data/${folderName}/`,
                {
                    fileExtension: 'png',
                    minimumLevel: 11,
                    maximumLevel: 22,
                    tilingScheme: new Cesium.WebMercatorTilingScheme(),
                    // Optionally: pass rectangle (bounds) to limit the domain
                    rectangle: bounds
                }
            );

            // Add the imagery layer
            const imageryLayer = this.viewer!.imageryLayers.addImageryProvider(imageryProvider);
            this.ortholoadedLayers.set(folderName, imageryLayer);

            // After layer is ready, zoom to its bounds
            this.zoomToBounds(bounds);

        } catch (error) {
            console.error(`Failed to load tileset for "${folderName}":`, error);
        }
    }
    async fetchTilesetBoundingBox(folderName: string, expansionFactor: number = 3): Promise<Cesium.Rectangle | null> {
        const tilemapURL: string = `/repos/ortho_tiles_data/${folderName}/tilemapresource.xml`;

        try {
            const response: Response = await fetch(tilemapURL);
            if (!response.ok) {
                console.warn(`No tilemapresource.xml found for "${folderName}"`);
                return null;
            }

            const text: string = await response.text();
            const parser: DOMParser = new DOMParser();
            const xmlDoc: Document = parser.parseFromString(text, "application/xml");
            const bbox: Element | null = xmlDoc.querySelector("BoundingBox");
            if (!bbox) {
                console.warn(`No BoundingBox element found in tilemapresource.xml for "${folderName}"`);
                return null;
            }

            const minx: number = parseFloat(bbox.getAttribute("minx")!);
            const miny: number = parseFloat(bbox.getAttribute("miny")!);
            const maxx: number = parseFloat(bbox.getAttribute("maxx")!);
            const maxy: number = parseFloat(bbox.getAttribute("maxy")!);

            if ([minx, miny, maxx, maxy].some(isNaN)) {
                console.warn(`Invalid bounding box values in tilemapresource.xml for "${folderName}"`);
                return null;
            }

            // Calculate the center of the rectangle
            const centerLon: number = (minx + maxx) / 2;
            const centerLat: number = (miny + maxy) / 2;

            // Calculate the half-width and half-height
            const halfWidth: number = (maxx - minx) / 2;
            const halfHeight: number = (maxy - miny) / 2;

            // Apply the expansion factor
            const expandedHalfWidth: number = halfWidth * expansionFactor;
            const expandedHalfHeight: number = halfHeight * expansionFactor;

            // Create the expanded rectangle
            const expandedRectangle: Cesium.Rectangle = Cesium.Rectangle.fromDegrees(
                centerLon - expandedHalfWidth,
                centerLat - expandedHalfHeight,
                centerLon + expandedHalfWidth,
                centerLat + expandedHalfHeight
            );

            return expandedRectangle;

        } catch (error) {
            console.error(`Error fetching/parsing tilemapresource.xml for "${folderName}":`, error);
            return null;
        }
    }


    async fetchCombinedBoundingBox(folderNames: string[]): Promise<Cesium.Rectangle | null> {
        const rects: Cesium.Rectangle[] = [];

        for (const name of folderNames) {
            const r = await this.fetchTilesetBoundingBox(name);
            if (r) {
                rects.push(r);
            }
        }

        if (rects.length === 0) {
            return null;
        }

        // Start with the first rectangle
        let combined = rects[0];

        for (let i = 1; i < rects.length; i++) {
            combined = Cesium.Rectangle.union(combined, rects[i]);
        }

        return combined;
    }
    zoomToBounds(rectangle: any) {
        if (!rectangle) return;

        this.viewer!.camera.flyTo({
            destination: rectangle,
            duration: 2.0, // seconds for smooth fly
            maximumHeight: 10000, // optional: controls how far up the camera goes
        });
    }
    // aurtho loading --------------End ----------------
    //--------------------------------------------------------------------------------------------------------------------------------------
    // DEM loading --------------start ----------------

    checkSelectedDEMvillagesToLoad(): void {
        this.uncheckCheckedVillagesInOrthoTab();

        // Get all checked village names
        const checkedVillages: string[] = $('#pills-dem .inputVallagesCheck:checked').map(function (this: HTMLElement) {
            return $(this).data('village') as string;
        }).get();

        // Get all village names (checked + unchecked)
        const allVillages: string[] = $('#pills-dem .inputVallagesCheck').map(function (this: HTMLElement) {
            return $(this).data('village') as string;
        }).get();

        // Loop through all villages
        // allVillages.forEach((villageName: string) => {
        //     const isChecked: boolean = checkedVillages.includes(villageName);

        //     if (isChecked) {
        //         this.custom_terrian_load(villageName, isChecked);
        //     } else {
        //         console.log("defaultTerrain", this.defaultTerrain);
        //         this.viewer!.terrainProvider = this.defaultTerrain;
        //         this.terrainEnabled = false;
        //     }
        // });

        allVillages.forEach((villageName: string) => {
            const isChecked: boolean = checkedVillages.includes(villageName);

            if (isChecked) {
                // Load custom terrain if not already loaded
                if (!this.DEMloadedLayers.has(villageName)) {
                    this.custom_terrian_load(villageName, true);
                } else {
                    console.log(`Terrain for ${villageName} is already loaded.`);
                    this.viewer!.terrainProvider = this.DEMloadedLayers.get(villageName);
                    this.terrainEnabled = true;
                    this.viewer!.scene.globe.depthTestAgainstTerrain = true;
                }
            } else {
                // Remove terrain if it was previously loaded
                if (this.DEMloadedLayers.has(villageName)) {
                    this.DEMloadedLayers.delete(villageName);
                    console.log(`Terrain for ${villageName} has been removed.`);
                }
                // Set to default terrain
                this.viewer!.terrainProvider = this.defaultTerrain;
                this.terrainEnabled = false;
                this.viewer!.scene.globe.depthTestAgainstTerrain = false;
            }
        });

    }
    DEMloadedLayers = new Map();
    async custom_terrian_load(villageName: string, enable: boolean): Promise<void> {
        console.log(`Loading terrain for ${villageName}, enable: ${enable}`);

        if (!this.viewer) {
            console.error('Viewer is not initialized');
            return;
        }



        // Check if terrain is already loaded
        if (this.DEMloadedLayers.has(villageName)) {
            console.log(`Terrain for ${villageName} is already loaded.`);
            this.viewer.terrainProvider = this.DEMloadedLayers.get(villageName);
            this.terrainEnabled = true;
            this.viewer.scene.globe.depthTestAgainstTerrain = true;
            return;
        }

        // Proceed with loading terrain if not already loaded
        if (enable && villageName) {
            try {
                console.log(`Loading custom terrain for ${villageName} with asset ID: ${this.assetId}`);
                const resource = await Cesium.IonResource.fromAssetId(this.assetId, {
                    accessToken: this.customToken
                });
                console.log('Terrain resource loaded successfully:', resource);
                const terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(resource, {
                    requestWaterMask: true,
                    requestVertexNormals: true,
                });
                this.viewer.terrainProvider = terrainProvider;
                this.terrainEnabled = true;
                this.viewer.scene.globe.depthTestAgainstTerrain = true;

                // Add to DEMloadedLayers
                this.DEMloadedLayers.set(villageName, terrainProvider);

                // Fly to the village's location
                const lon = 80.55764164843129;
                const lat = 16.416002921875812;
                const destination = Cesium.Cartesian3.fromDegrees(lon, lat, 1000);

                this.viewer.camera.flyTo({
                    destination: destination,
                    orientation: {
                        heading: Cesium.Math.toRadians(0.0),
                        pitch: Cesium.Math.toRadians(-35.0),
                        roll: 0.0
                    },
                    duration: 2.0
                });
            } catch (error) {
                console.error(`Failed to load terrain for ${villageName}:`, error);
                this.viewer.terrainProvider = this.defaultTerrain;
                this.terrainEnabled = false;
                this.viewer.scene.globe.depthTestAgainstTerrain = false;
            }
        } else {
            this.viewer.terrainProvider = this.defaultTerrain;
            this.terrainEnabled = false;
            this.viewer.scene.globe.depthTestAgainstTerrain = false;
        }
    }

    // DEM loading --------------End ----------------

    //--------------------------------------------------------------------------------------------------------------------------------------
    // Models loading start ------------------------------


    groupByProjectName(data: any[]): any[] {
        const result = new Map<string, any[]>();

        for (const item of data) {
            // Clean and format the project name
            
            const rawName = item.project_name?.trim();
            //const formattedName = rawName.replace(/\s+/g, ''); // Remove all spaces (e.g., "Happy Nest" -> "HappyNest")

            if (!result.has(rawName)) {
                result.set(rawName, []);
            }

            result.get(rawName)!.push(item);
        }

        result.forEach(ech_prop => {
            let sub_prj_repos = ech_prop.length > 1 ? ech_prop : [];
            this.groupedProjects.push({  "Project": ech_prop[0].project_name, "prj_id": ech_prop[0].prj_id,  "Subproject": sub_prj_repos })
        });
        
        return this.groupedProjects;
    }




    checkSelectedModelsToLoad() {
        // Get all checked village names
        const checkedVillages: string[] = $('#pills-model .inputVallagesCheck:checked').map(function () {
            return $(this).data('village') as string;
        }).get();

        // Get all village names (checked + unchecked)
        const allVillages: string[] = $('#pills-model .inputVallagesCheck').map(function () {
            return $(this).data('village') as string;
        }).get();

        console.log(this.groupedProjects, "projectss mast....", this.lst_projects)

        let happyNest = ["B1", "B2", "BLOCK-A", "BLOCK-B", "BLOCK-C", "BLOCK-D", "BLOCK-E", "BLOCK-F", "BLOCK-G", "BLOCK-H", "BLOCK-I", "BLOCK-J", "BLOCK-K", "BLOCK-L"]
        allVillages.forEach((villageName: string) => {
            const isChecked: boolean = checkedVillages.includes(villageName);

            if (isChecked) {
                // Load or show the layer
                // console.log(villageName);
          

                if (villageName == 'happyNest') {
                    console.log('ergh')
                    happyNest.forEach((eachBlock) => {
                        let block = 'happyNest/' + eachBlock
                        this.loadModelTilesetFolder(block, eachBlock, villageName)
                    });
                    this.buttonsVisible = true;
                } else {
                    this.loadModelTilesetFolder(villageName, "NA", villageName)
                }

            } else {
                // Hide the layer if it exists
                if (this.loadedModelTilesets.has(villageName)) {
                    const tileset = this.loadedModelTilesets.get(villageName);
                    if (tileset) {
                        tileset.show = false;

                        this.viewer!.imageryLayers.remove(tileset, true); // remove the layer and destroy it
                        this.loadedModelTilesets.delete(villageName);
                    }
                }
            }
        });

    }

    onBlockButtonClick(HvrFeatureName: string) {
            
        console.log(this, "----", HvrFeatureName)

        this.setupBuildingHover(HvrFeatureName);
    }


    private setupBuildingHover(HvrFeatureName : String): void {
        let lastFeature: Cesium.Cesium3DTileFeature | null = null;

        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer!.scene.canvas);

      

        handler.setInputAction((movement: any) => {
            const pickedFeature = this.viewer!.scene.pick(movement.endPosition);

            // const pickedObject = this.viewer.scene.pick(click.position);
 
            if (Cesium.defined(pickedFeature) && pickedFeature instanceof Cesium.Cesium3DTileFeature) {

            const propertyIds = pickedFeature.getPropertyIds();

            console.log(pickedFeature, "--------", propertyIds)

            // Reset previous building color
            if (lastFeature && (!pickedFeature || pickedFeature !== lastFeature)) {
                lastFeature.color = Cesium.Color.WHITE;
                lastFeature = null;
            }
            
            if(HvrFeatureName == "Project")
            {

            }
            else if(HvrFeatureName == "Building")
            {

            }
            else{
                 // Highlight current building
                if (pickedFeature instanceof Cesium.Cesium3DTileFeature) {
                    pickedFeature.color = Cesium.Color.YELLOW.withAlpha(0.8); // highlight
                    lastFeature = pickedFeature;
                }
             
            }
        }

            

        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }


    async loadModelTilesetFolder(modelName: any, BlockNamee: string, ModelNamee: string): Promise<void> {
        console.log(modelName, "-----", ModelNamee, "-------- Block Name", BlockNamee)

        if (this.loadedModelTilesets.has(modelName)) {
            const existingTileset = this.loadedModelTilesets.get(modelName);
            if (existingTileset) {
                existingTileset.show = true;
                this.viewer!.zoomTo(existingTileset); // Show the existing tileset
                return;
            }
        }
        const tilesetUrl = `./repos/models/${modelName}/tileset.json`;
        const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl);
        
        this.loadedModelTilesets.set(modelName, tileset);
        this.viewer!.scene.primitives.add(tileset);
        tileset.show = true;
        (tileset as any).ModelName = ModelNamee;
        (tileset as any).BlockName = BlockNamee;
        this.viewer!.zoomTo(tileset);

    }
    // Models loading End ------------------------------

    //--------------------------------------------------------------------------------------------------------------------------------------

    // Geo Json Loading Start--------------------------------

    async loadGeoJsonData() {
        const data: { [key: string]: string[] } = {
            "Capital City Layers": ["AGCBoundary_-_AGCBoundary", "Amaravati_Trunk_Road_Network_-_Amaravati_Trunk_Road_Network", "Capital_Planning_Boundary_-_Capital_Planning_Boundary", "Land_for_Monetization_-_Land_for_Monetization", "Land_Mortagaged_to_Hudco_-_Land_Mortagaged_to_Hudco", "Land_Under_R5_Zone_-_Land_Under_R5_Zone", "Survey_Parcels_-_Survey_Parcels"],
            "Amaravati Infra": ["Flood_Mitigation_-_Flood_Mitigation", "Flood_Pumping_Stations_-_Flood_Pumping_Stations"],
            "Lands": ["Available_Lands_-_Available_Lands", "Land_Allotments_-_Land_Allotments", "LA_-_LA"],
            "PlanningBoundary": ["AGCPlanningBoundary_-_AGCPlanningBoundary", "AmaravatiPlanningBoundary_-_AmaravatiPlanningBoundary", "Block_-_Block", "Colony_-_Colony", "LPSZones_-_LPSZones", "Sector_-_Sector", "SeedCapitalBoundary_-_SeedCapitalBoundary", "SurveyParcelBoundaries_-_SurveyParcelBoundaries", "ThemeCities_-_ThemeCities", "Township_-_Township", "VillageBoundary_-_VillageBoundary"],
            "Forests": ["CRDAForests_-_CRDAForests", "Forestsoutside_CRDA_-_Forestsoutside_CRDA", "Forest_CC_-_Forest_CC"],
            "Planning Boundaries": ["APCRDADistricts_-_APCRDADistricts", "APCRDAMandals_-_APCRDAMandals", "APCRDAPlanning_Boundary_-_APCRDAPlanning_Boundary", "APCRDAPlanning_Zones_-_APCRDAPlanning_Zones", "APCRDAULB_-_APCRDAULB", "APCRDAVillages_-_APCRDAVillages", "APCRDAZDPZones_-_APCRDAZDPZones"],
            "Transportation": ["APCRDA_GAS_-_APCRDA_GAS", "APCRDA_HT_LINES_-_APCRDA_HT_LINES", "DraftBKVHighway_-_DraftBKVHighway", "DraftORR_-_DraftORR", "IRR_-_IRR"]
        };

        const checkedLayers: string[] = $('#pills-geo .inputVallagesCheck:checked')
            .map(function () {
                return $(this).data('village') as string;
            })
            .get();

        const allLayers: string[] = $('#pills-geo .inputVallagesCheck')
            .map(function () {
                return $(this).data('village') as string;
            })
            .get();

        // 1. Handle unchecked layers → hide or remove
        for (const eachLayer of allLayers) {
            if (!checkedLayers.includes(eachLayer)) {
                const datafolder = data[eachLayer as keyof typeof data];
                if (!datafolder) {
                    continue;
                }
                for (const element of datafolder) {
                    if (this.loadedJsonLayers.has(element)) {
                        const existingDataSource = this.loadedJsonLayers.get(element);
                        if (existingDataSource) {
                            // Hide it using the show property
                            existingDataSource.show = false;
                            // Optionally: remove completely:
                            this.viewer!.dataSources.remove(existingDataSource, true);
                            this.loadedJsonLayers.delete(element);
                        }
                    }
                }
            }
        }

        // 2. Handle checked layers → show or load
        for (const layer of checkedLayers) {
            const datafolder = data[layer as keyof typeof data];
            // console.log("Layer:", layer, "→ Files:", datafolder);

            if (!datafolder) {
                alert(`No geojson dat found for this "${layer}"`);
                continue;
            }

            for (const element of datafolder) {
                console.log("  Handling element:", element);
                const geoJsonUrl = `/repos/JSON/${layer}/${element}.geojson`;

                if (this.loadedJsonLayers.has(element)) {
                    const existingDataSource = this.loadedJsonLayers.get(element);
                    if (existingDataSource) {
                        existingDataSource.show = true;
                        // Already loaded, so show and skip loading again
                        continue;
                    }
                }

                // Not loaded yet — load it now
                try {
                    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl);
                    dataSource.name = element;
                    await this.viewer!.dataSources.add(dataSource);
                    this.viewer!.zoomTo(dataSource.entities);
                    this.loadedJsonLayers.set(element, dataSource);
                } catch (error) {
                    console.error(`Error loading GeoJSON for ${element} from ${geoJsonUrl}:`, error);
                }
            }
        }
    }


    // Geo Json Loading End--------------------------------
    //--------------------------------------------------------------------------------------------------------------------------------------


    uncheckCheckedVillagesInDemTab(): void {
        $('#pills-dem .inputVallagesCheck:checked').each(function (): void {
            (this as HTMLInputElement).checked = false;
        });
        this.viewer!.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        this.terrainEnabled = false;
        this.viewer!.scene.globe.depthTestAgainstTerrain = false;
        this.DEMloadedLayers.clear();
    }

    uncheckCheckedVillagesInOrthoTab(): void {
        $('#pills-ortho .inputVallagesCheck:checked').each(function (): void {
            (this as HTMLInputElement).checked = false;
        });
        // Remove existing layers
        for (const [village, layer] of this.ortholoadedLayers) {
            this.viewer!.imageryLayers.remove(layer, true);
        }
        this.ortholoadedLayers.clear();
    }





    private initializeOffcanvas(): void {
        const roffcanvasRightFerturesElement = document.getElementById('offcanvasRightFeatures');
        if (roffcanvasRightFerturesElement) {
            this.roffcanvasRightFertures = new Offcanvas(roffcanvasRightFerturesElement);

            roffcanvasRightFerturesElement.addEventListener('shown.bs.offcanvas', () => {
                console.log('Offcanvas is shown');
            });

            roffcanvasRightFerturesElement.addEventListener('hidden.bs.offcanvas', () => {
                console.log('Offcanvas is hidden');
            });
        }
    }

    // toggleOffcanvas(): void {
    //     // if (this.roffcanvasRightFertures) {
    //     //     this.roffcanvasRightFertures.toggle();
    //     // }
    //     if (this.roffcanvasRightFertures) {
    //         this.roffcanvasRightFertures.show();
    //     }
    // }




    tilesetClickToOpenRightCanvas() {
        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer!.scene.canvas);

        handler.setInputAction((movement: any) => {
            const pickedObject = this.viewer!.scene.pick(movement.position);

            if (Cesium.defined(pickedObject)) {
                // Check if the picked object is a Cesium3DTileset
                if (pickedObject.primitive instanceof Cesium.Cesium3DTileset) {
                    const tileset = pickedObject.primitive as Cesium.Cesium3DTileset;
                    console.log('Clicked Tileset:', tileset);
                    if (this.roffcanvasRightFertures) {
                        this.roffcanvasRightFertures.show();
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }





}