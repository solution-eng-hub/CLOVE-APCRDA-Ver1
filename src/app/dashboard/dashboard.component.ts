import { Component, OnInit, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { Viewer, ProviderViewModel, Cesium3DTileset, OpenStreetMapImageryProvider, buildModuleUrl, GeoJsonDataSource } from 'cesium';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';

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
import { ApiFetchService, JsonFetchService } from '../services/api-fetch.service';



@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent {
    isLooder: boolean = true
    viewer: Cesium.Viewer | undefined;
    tileset: Cesium.Cesium3DTileset | undefined;;
    private camera: Cesium.Camera | undefined;
    scene: Cesium.Scene | undefined;
    private globe: Cesium.Globe | undefined;
    private ellipsoid: Cesium.Ellipsoid | undefined;
    geodesic: Cesium.EllipsoidGeodesic | undefined;

    lst_projects: any[] = [];
    groupedProjects: any[] = [];


    constructor(private apiFetchService: ApiFetchService, private jsonFetchService: JsonFetchService, private sanitizer: DomSanitizer) {
        this.safeBimUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.selectedModel);
        this.safeCctvUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.cctvUrl);
    }

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
    folders: any[] = [];


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
    loadedAgcTilesets = new Map();

    safeBimUrl: SafeResourceUrl;
    safeCctvUrl: SafeResourceUrl;
    selectedModel: string = 'https://autode.sk/46mcB9j';
    cctvUrl: string = 'https://autode.sk/';
    modalContent: SafeHtml | string = '';
    selectedModelVideo: string = "Amaravati_demo"
    images: string[] = [
        'repos/tab_images/Amaravati Infra.webp',
        'repos/tab_images/DMPRoads.webp',
        'repos/sectors.png',

    ];
    activeIndex = 0;

    dataVill = {
        "ortho": ["Nowluru", "Abbarajupalem", "Ainavolu", "Anantavaram", "Borupalem", "Dondapadu", "Kondamarajupalem", "Krishnayyapalem", "Kuragallu", "Lingayapalem", "Malkapuram", "Mandadam", "Mangalagiri", "Nekkallu", "Nidamarru", "Penumaka", "Pichikalapalem", "Rayapudi", "Sakhamuru", "Tadepalli", "Tulluru", "Uddandarayanipalem", "Undavalli", "Velagapudi", "Venkatapalem", "Nelapadu"],
        "dem": ["Mangalagiri"],
        // "model": ["road", "happyNest",],
        "geo": ["Capital City Layers", 'Amaravati Infra', "Lands", 'PlanningBoundary', 'Forests', 'Planning Boundaries', 'Transportation', 'DMPRoads'],
        "agc": ["Base",'Roads', 'Plots','Buildings' ,'3D Tiles_APSFL', '3D Tiles_Towers', '3D Tiles_Buildings', 'GO-T1', 'Assembley', 'Group_D', 'HighCourt', 'NGOS', 'Towers', 'new Towers', 'planningamaravati_buildings', 'sec', 'zone_utils', "Amaravathi_Buildings", "Existing_Buildings", 'Amaravati_Trunk_Roads', 'Internal_Roads'],

    };


    assetId = 3711747; // Your asset ID
    customToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NzAwZDc2OC1jMjVkLTQwMzItYjE0MS0zNGI0YWRjOTcwOTEiLCJpZCI6MzM5NDE4LCJpYXQiOjE3NTc3MzI0NzF9.Q5-BBvrgsmTjHrYqfKj1E_gugLFCZCLuxPev6_uJdaE'; // The other token


    ngOnInit(): void {


        document.addEventListener('contextmenu', event => event.preventDefault())

        const dropdownContainer = document.getElementById('multi_dropdown-container');
        if (dropdownContainer) {
            const dropdown = new CustomDropdown(dropdownContainer);
        }

        $('#multi_dropdown-container .dropdown-item').on('click', function () {
            // Get the selected value from the data attribute
            var selectedValue = $(this).data('value');

            console.log('Selected:', selectedValue);
        });

    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.proj_setup();
        }, 2000);
        // this.toggleBasemapList()

        this.populateVillageTabs(this.dataVill);
        this.searchFunction();
        this.MainFunctionDataLoading();
        this.initializeOffcanvas();

    }

    async proj_setup(): Promise<void> {
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
        this.Get_all_projects_List();
        this.isLooder = false;
        $('.mainDashboardContainer').css({ 'display': 'block', 'opacity': '1' });
        this.tilesetClickToOpenRightCanvas();
        this.showHideEachFeatures();
        // this.loadKmlFile();
        // this.addOSMBuildings(this.viewer);
        this.load_geojson_data(this.viewer);
    }


     private load_geojson_data(vwr : Cesium.Viewer): void {

        // Load the GeoJSON file (local or remote)
        GeoJsonDataSource.load('./repos/Zone_Bound.geojson', {
            clampToGround: true
        }).then((dataSource) => {
            vwr.dataSources.add(dataSource);
            vwr.zoomTo(dataSource);
        }).catch((error) => {
            console.error('Error loading GeoJSON:', error);
        });

  }


    // dynamic_load_models_from_db() {
    //     this.Get_all_projects_List();
    // }

    async addOSMBuildings(vwr: Cesium.Viewer) {
        const osmBuildings = await Cesium.Cesium3DTileset.fromIonAssetId(96188);
        vwr.scene.primitives.add(osmBuildings);

        // Optional: Zoom to the buildings
        vwr.zoomTo(osmBuildings);
    }



    Get_all_projects_List() {
        console.log("Get_all_projects_List Get_all_projects_List Get_all_projects_List")
        this.apiFetchService.get_list_projs1().subscribe({
            next: (response: any) => {
                console.log('Data received:', response[0]);
                this.lst_projects = response[0].data;
                this.groupedProjects = this.groupByProjectName(this.lst_projects);
                // console.log('Data groupedProjectsgroupedProjects:', this.groupedProjects);
            },
            error: (err: any) => {
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
        // console.log(data, "datadatadata")
        Object.entries(data).forEach(([key, villages]) => {
            const tabContainer = document.getElementById(`pills-${key}`);
            if (!tabContainer) return; // Skip if tab not found

            tabContainer.innerHTML = ''; // Clear previous content
            if (Array.isArray(villages)) {
                villages.forEach((village: string) => {
                    // console.log(`"${key}-${village}"`)
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

        $(document).on('change', '#pills-agc .inputVallagesCheck', async (event: JQuery.ChangeEvent) => {
            const allChecked: boolean = $('#pills-agc .inputVallagesCheck:checked').length === $('#pills-agc .inputVallagesCheck').length;
            $('#selectAllVill').prop('checked', allChecked);
            this.Load_AGC_models()
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
                    // console.log('geo all tab clicked', isChecked)
                    break;
                case 'pills-agc':
                    this.Load_AGC_models();
                    // console.log('agc all tab clicked', isChecked)
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
        console.log('showHideEachFeatures showHideEachFeatures')
        const $panel: JQuery<HTMLElement> = $('#slidePanel');
        const $buttons: JQuery<HTMLElement> = $('#buttonWrapper');
        const $content: JQuery<HTMLElement> = $('#panelContent');
        $('.eachFretureBtns').on('click', function (this: HTMLElement): void {
            console.log('ooooo', $(this).attr('id'));
            // console.log('Feature button clicked');
            if ($(this).hasClass('active')) {
                $panel.addClass('active');
                $buttons.addClass('raised');
                $('.selecetions_4r_basemap').addClass('raised');
                $('#offcanvasRightFeatures').addClass('raised')
            }

            if ($(this).attr('id') == 'pills-agc-tab'){
                $('#multi_dropdown-container').css('display', 'block');
            }else{
                $('#multi_dropdown-container').css('display', 'none');
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

        // console.log(allVillages)
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


            // console.log(`Loading orthophoto folder: ${folderName}`);

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
                    // console.log(`Terrain for ${villageName} is already loaded.`);
                    this.viewer!.terrainProvider = this.DEMloadedLayers.get(villageName);
                    this.terrainEnabled = true;
                    this.viewer!.scene.globe.depthTestAgainstTerrain = true;
                }
            } else {
                // Remove terrain if it was previously loaded
                if (this.DEMloadedLayers.has(villageName)) {
                    this.DEMloadedLayers.delete(villageName);
                    // console.log(`Terrain for ${villageName} has been removed.`);
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
        // console.log(`Loading terrain for ${villageName}, enable: ${enable}`);

        if (!this.viewer) {
            console.error('Viewer is not initialized');
            return;
        }



        // Check if terrain is already loaded
        if (this.DEMloadedLayers.has(villageName)) {
            // console.log(`Terrain for ${villageName} is already loaded.`);
            this.viewer.terrainProvider = this.DEMloadedLayers.get(villageName);
            this.terrainEnabled = true;
            this.viewer.scene.globe.depthTestAgainstTerrain = true;
            return;
        }

        // Proceed with loading terrain if not already loaded
        if (enable && villageName) {
            try {
                // console.log(`Loading custom terrain for ${villageName} with asset ID: ${this.assetId}`);
                const resource = await Cesium.IonResource.fromAssetId(this.assetId, {
                    accessToken: this.customToken
                });
                // console.log('Terrain resource loaded successfully:', resource);
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
            this.groupedProjects.push({ "Project": ech_prop[0].project_name, "prj_id": ech_prop[0].prj_id, "Subproject": sub_prj_repos })
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

        // console.log(this.groupedProjects, "projectss mast....", this.lst_projects)

        let happyNest = ["B1", "B2", "BLOCK-A", "BLOCK-B", "BLOCK-C", "BLOCK-D", "BLOCK-E", "BLOCK-F", "BLOCK-G", "BLOCK-H", "BLOCK-I", "BLOCK-J", "BLOCK-K", "BLOCK-L"]
        allVillages.forEach((villageName: string) => {
            const isChecked: boolean = checkedVillages.includes(villageName);

            // if (isChecked) {
            //     // Load or show the layer
            //     // console.log(villageName);


            //     if (villageName == 'happyNest') {
            //         console.log('ergh')
            //         happyNest.forEach((eachBlock) => {
            //             let block = 'happyNest/' + eachBlock
            //             this.loadModelTilesetFolder(block, eachBlock, villageName)
            //         });
            //         this.buttonsVisible = true;
            //     } else {
            //         this.loadModelTilesetFolder(villageName, "NA", villageName)
            //     }

            // } else {
            //     // Hide the layer if it exists
            //     if (this.loadedModelTilesets.has(villageName)) {
            //         const tileset = this.loadedModelTilesets.get(villageName);
            //         if (tileset) {
            //             tileset.show = false;

            //             this.viewer!.imageryLayers.remove(tileset, true); // remove the layer and destroy it
            //             this.loadedModelTilesets.delete(villageName);
            //         }
            //     }
            // }


            if (isChecked) {
                if (villageName === 'happyNest') {
                    // console.log('ergh');
                    happyNest.forEach((eachBlock) => {
                        let block = `happyNest/${eachBlock}`;
                        this.loadModelTilesetFolder(block, eachBlock, villageName);
                    });
                    this.buttonsVisible = true;
                } else {
                    this.loadModelTilesetFolder(villageName, "NA", villageName);
                }
            } else {
                // Hide or remove the tileset(s)
                if (villageName === 'happyNest') {
                    // Special handling for happyNest blocks
                    happyNest.forEach((eachBlock) => {
                        let block = `happyNest/${eachBlock}`;
                        if (this.loadedModelTilesets.has(block)) {
                            const tileset = this.loadedModelTilesets.get(block);
                            if (tileset) {
                                tileset.show = false;

                                this.viewer!.imageryLayers.remove(tileset, true); // remove the layer and destroy it
                                this.loadedModelTilesets.delete(villageName);
                            }
                        }
                    });
                } else {
                    if (this.loadedModelTilesets.has(villageName)) {
                        const tileset = this.loadedModelTilesets.get(villageName);
                        if (tileset) {
                            tileset.show = false;

                            this.viewer!.imageryLayers.remove(tileset, true); // remove the layer and destroy it
                            this.loadedModelTilesets.delete(villageName);
                        }
                    }
                }
            }

        });

    }

    onBlockButtonClick(HvrFeatureName: string) {

        // console.log(this, "----", HvrFeatureName)

        this.setupBuildingHover(HvrFeatureName);
    }


    private setupBuildingHover(HvrFeatureName: String): void {
        let lastFeature: Cesium.Cesium3DTileFeature | null = null;

        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer!.scene.canvas);



        handler.setInputAction((movement: any) => {
            const pickedFeature = this.viewer!.scene.pick(movement.endPosition);

            // const pickedObject = this.viewer.scene.pick(click.position);

            if (Cesium.defined(pickedFeature) && pickedFeature instanceof Cesium.Cesium3DTileFeature) {

                const propertyIds = pickedFeature.getPropertyIds();

                // console.log(pickedFeature, "--------", propertyIds)

                // Reset previous building color
                if (lastFeature && (!pickedFeature || pickedFeature !== lastFeature)) {
                    lastFeature.color = Cesium.Color.WHITE;
                    lastFeature = null;
                }

                if (HvrFeatureName == "Project") {

                }
                else if (HvrFeatureName == "Building") {

                }
                else {
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
        // console.log(modelName, "-----", ModelNamee, "-------- Block Name", BlockNamee)

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
        $('#selectAllVill').prop('disabled', true);
        const inputJson = await fetch('./repos/geojson_map.json');

        const data: { [key: string]: string[] } = await inputJson.json();

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
                // alert(`No geojson dat found for this "${layer}"`);
                continue;
            }

            for (const element of datafolder) {
                // console.log("  Handling element:", element);
                const geoJsonUrl = `./repos/JSON_data/${layer}/${element}`;

                if (this.loadedJsonLayers.has(element)) {
                    const existingDataSource = this.loadedJsonLayers.get(element);
                    if (existingDataSource) {
                        existingDataSource.show = true;
                        // Already loaded, so show and skip loading again
                        continue;
                    }
                }


                try {

                    const response = await fetch(geoJsonUrl);
                    const geoJson = await response.json();

                    const defaultColor = geoJson.color || '#eaf182ff';


                    const dataSource = await Cesium.GeoJsonDataSource.load(geoJson);
                    const fillColor = Cesium.Color.fromCssColorString(defaultColor).withAlpha(0.2);
                    // console.log(geoJsonUrl, defaultColor,fillColor)
                    dataSource.entities.values.forEach(entity => {
                        if (entity.polygon) {
                            entity.polygon.material = new Cesium.ColorMaterialProperty(fillColor);
                            // entity.polygon.outline = true;

                            entity.polygon.outlineColor = new Cesium.ConstantProperty(fillColor.withAlpha(0.6));

                            // Optional: outline width (default is 1)
                            entity.polygon.outlineWidth = new Cesium.ConstantProperty(1);
                        }
                    });

                    await this.viewer!.dataSources.add(dataSource);
                    await this.viewer!.zoomTo(dataSource.entities);
                    this.loadedJsonLayers.set(element, dataSource);

                } catch (error) {
                    console.error(`Error loading GeoJSON for ${element} from ${geoJsonUrl}:`, error);
                }

            }
        }
        $('#selectAllVill').prop('disabled', false);
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

    openModal(type: string) {
        this.safeBimUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.selectedModel);
        this.safeCctvUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.cctvUrl);
        this.modalContent = type;
        // Show modal
        const modalElement = document.getElementById('full_port_folio_pop');
        const modal = new bootstrap.Modal(modalElement!);
        modal.show();
    }


    selectImage(index: number) {
        this.activeIndex = index;

        const carouselEl = document.getElementById('carouselImagesShow');
        if (carouselEl) {
            let carousel = bootstrap.Carousel.getInstance(carouselEl);
            if (!carousel) {
                carousel = new bootstrap.Carousel(carouselEl, {
                    interval: false,
                    ride: false
                });
            }
            carouselEl.addEventListener('slid.bs.carousel', (event: any) => {
                this.activeIndex = event.to;
            });
        }
    }

    ChangeSlide(btn: string) {
        if (btn === 'next') {
            if (this.images.length === 0) return;
            this.activeIndex = (this.activeIndex + 1) % this.images.length;
            this.moveToSlide(this.activeIndex);
        } else if (btn === 'prev') {
            if (this.images.length === 0) return;
            this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
            this.moveToSlide(this.activeIndex);
        }
    }

    moveToSlide(index: number) {
        const carouselEl = document.getElementById('carouselImagesShow');
        if (carouselEl) {
            const carousel = bootstrap.Carousel.getInstance(carouselEl);
            if (carousel) {
                carousel.to(index);
            }
        }
    }


    // tilesetClickToOpenRightCanvas() {
    //     const handler = new Cesium.ScreenSpaceEventHandler(this.viewer!.scene.canvas);

    //     handler.setInputAction((movement: any) => {
    //         const pickedObject = this.viewer!.scene.pick(movement.position);

    //         if (Cesium.defined(pickedObject)) {
    //             // Check if the picked object is a Cesium3DTileset
    //             if (pickedObject.primitive instanceof Cesium.Cesium3DTileset) {
    //                 const tileset = pickedObject.primitive as Cesium.Cesium3DTileset;
    //                 console.log('Clicked Tileset:', tileset);
    //                 if (this.roffcanvasRightFertures) {
    //                     this.roffcanvasRightFertures.show();
    //                 }
    //             }
    //         }
    //     }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    // }

    tilesetClickToOpenRightCanvas() {
        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer!.scene.canvas);
        let lastFeature: Cesium.Cesium3DTileFeature | null = null;
        handler.setInputAction((movement: any) => {
            const pickedObject = this.viewer!.scene.pick(movement.position);

            if (Cesium.defined(pickedObject)) {
                // Check if the picked object is a Cesium3DTileset
                if (pickedObject.primitive instanceof Cesium.Cesium3DTileset) {
                    const tileset = pickedObject.primitive as Cesium.Cesium3DTileset;
                    console.log('Clicked Tileset:', tileset);
                    // if (this.roffcanvasRightFertures) {
                    //     this.roffcanvasRightFertures.show();
                    // }
                    if (this.roffcanvasRightFertures) {
                        // this.roffcanvasRightFertures.toggle();
                        this.roffcanvasRightFertures.show()
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


        handler.setInputAction((movement: any) => {
            const pickedFeature = this.viewer!.scene.pick(movement.endPosition);
            // if (Cesium.defined(pickedFeature)) {
            // if (pickedFeature.primitive instanceof Cesium.Cesium3DTileset) {
            const tileset = pickedFeature.primitive as Cesium.Cesium3DTileset;
            if (lastFeature && (!pickedFeature || pickedFeature !== lastFeature)) {
                lastFeature.color = Cesium.Color.WHITE; // reset back to original (adjust if needed)
                lastFeature = null;
            }

            // Highlight current building
            if (pickedFeature instanceof Cesium.Cesium3DTileFeature) {
                pickedFeature.color = Cesium.Color.YELLOW.withAlpha(0.8); // highlight
                lastFeature = pickedFeature;
            }
            // }
            // }



        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }


    //////// Load Amaravthi Capital Models

    Load_AGC_models() {

        const checkedLayers: string[] = $('#pills-agc .inputVallagesCheck:checked')
            .map(function () {
                return $(this).data('village') as string;
            })
            .get();

        const allLayers: string[] = $('#pills-agc .inputVallagesCheck')
            .map(function () {
                return $(this).data('village') as string;
            })
            .get();
        // allLayers.forEach((ech_AGC_data: string) => {
        //     const isChecked: boolean = checkedLayers.includes(ech_AGC_data);

        //     // console.log(checkedLayers, "is checkedddddd", isChecked)
        //     let url_of_mdl = '/AGC/' + ech_AGC_data;

        //     if (isChecked) {
        //         // Load or show the layer
        //         // console.log(ech_AGC_data, "ech_AGC_dataech_AGC_dataech_AGC_data", checkedLayers);


        //         const result = this.jsonFetchService.get_fetch_dirs(url_of_mdl);
        //         result.observable.subscribe({
        //             next: (folderNames) => {
        //                 folderNames.forEach((folderName) => {
        //                     const fullPath = `${result.baseDir}${url_of_mdl}/${folderName}`;
        //                     this.loaddynamicModelTilesetFolder(fullPath, ech_AGC_data, folderName);
        //                 });
        //             },
        //             error: (err) => {
        //                 console.error('Error fetching folders:', err);
        //             }
        //         });
        //     } else {

        //         const result = this.jsonFetchService.get_fetch_dirs(url_of_mdl);
        //         result.observable.subscribe({
        //             next: (folderNames) => {
        //                 folderNames.forEach((folderName) => {
        //                     if (this.loadedAgcTilesets.has(folderName)) {
        //                         const tileset = this.loadedAgcTilesets.get(folderName);
        //                         if (tileset) {
        //                             this.viewer!.scene.primitives.remove(tileset); // Remove from viewer
        //                             this.loadedAgcTilesets.delete(folderName); // Remove from map
        //                             console.log(`Removed tileset: ${folderName}`);
        //                         }
        //                     }
        //                 });
        //             },
        //             error: (err) => {
        //                 console.error('Error fetching folders:', err);
        //             }
        //         });



        //     }


        // })

        allLayers.forEach((ech_AGC_data: string) => {
            const isChecked: boolean = checkedLayers.includes(ech_AGC_data);
            const urlOfMdl: string = `/AGC/${ech_AGC_data}`;

            // Create a shared handler for fetch errors
            const handleFetchError = (err: any) => {
                console.error(`Error fetching folders for ${ech_AGC_data}:`, err);
            };

            if (isChecked) {
                // Load tilesets for checked ech_AGC_data
                const result = this.jsonFetchService.get_fetch_dirs(urlOfMdl);
                result.observable.subscribe({
                    next: (folderNames: string[]) => {
                        folderNames.forEach((folderName: string) => {
                            const fullPath = `${result.baseDir}${urlOfMdl}/${folderName}`;
                            console.log(ech_AGC_data)
                            this.loaddynamicModelTilesetFolder(fullPath, ech_AGC_data, folderName)

                        });
                    },
                    error: handleFetchError
                });
            } else {
                // Remove tilesets for unchecked villages
                const result = this.jsonFetchService.get_fetch_dirs(urlOfMdl);
                result.observable.subscribe({
                    next: (folderNames: string[]) => {
                        folderNames.forEach((folderName: string) => {
                            let tileUniqueId = ech_AGC_data + "-" + folderName
                            if (this.loadedAgcTilesets.has(tileUniqueId)) {
                                const tileset = this.loadedAgcTilesets.get(tileUniqueId);
                                if (tileset && this.viewer?.scene.primitives.contains(tileset)) {
                                    this.viewer.scene.primitives.remove(tileset);
                                    this.loadedAgcTilesets.delete(tileUniqueId);
                                }
                            }
                        });
                    },
                    error: handleFetchError
                });
            }
        });

    }


    async loaddynamicModelTilesetFolder(mdl_path: string, modelName: string, BldgName: string): Promise<void> {
        let tileUniqueId = modelName + "-" + BldgName;
        if (this.loadedAgcTilesets.has(tileUniqueId)) {
            const existingTileset = this.loadedAgcTilesets.get(tileUniqueId);
            if (existingTileset) {
                existingTileset.show = true;
                // this.viewer!.zoomTo(existingTileset); // Optional: Uncomment if needed
                return;
            }
        }

        const tilesetUrl = `${mdl_path}/tileset.json`;
        console.log('Loading tileset from:', tilesetUrl); // Debug log

        try {
            const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl);
            this.loadedAgcTilesets.set(tileUniqueId, tileset);
            this.viewer!.scene.primitives.add(tileset);
            tileset.show = true;
            (tileset as any).BldgName = BldgName;
            this.viewer!.zoomTo(tileset);

            if (modelName === "Assembley") {
                const boundingSphere = tileset.boundingSphere;
                console.log(boundingSphere, "boundingSphereboundingSphereboundingSphere")
                const pitch = Cesium.Math.toRadians(-30);
                const range = boundingSphere.radius * 4.0;
                let heading = 0;
                const totalRotation = Cesium.Math.TWO_PI / 2;
                const rotationSpeed = Cesium.Math.toRadians(8);
                let rotatedAngle = 0;

                // Compute center of the tileset
                const center = boundingSphere.center;

                // Helper to compute offset position
                const getCameraOffset = (heading: number) => {
                    const spherical = new Cesium.Spherical(range, heading, pitch);
                    return Cesium.Cartesian3.add(
                        center,
                        Cesium.Cartesian3.fromSpherical(spherical),
                        new Cesium.Cartesian3()
                    );
                };

                // Start orbit animation
                const rotateCamera = () => {
                    if (rotatedAngle < totalRotation) {
                        heading += rotationSpeed;
                        rotatedAngle += rotationSpeed;

                        const cameraPosition = getCameraOffset(heading);
                        this.viewer!.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, range));

                        requestAnimationFrame(rotateCamera);
                    } else {
                        // Release the camera after one full rotation
                        this.viewer!.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
                    }
                };

                // First fly to model
                this.viewer!.camera.flyToBoundingSphere(boundingSphere, {
                    duration: 2.5,
                    offset: new Cesium.HeadingPitchRange(0, pitch, range),
                    complete: () => {
                        rotateCamera(); // Start rotation
                    }
                });
            }
        } catch (error) {
            console.error(`Failed to load tileset at ${tilesetUrl}:`, error);
            // Optionally, notify the user or handle the error gracefully
        }
    }

    async loadKmlFile(kmlUrl: string = './repos/Secretariat KML/Secretariat 1.kmz', kmlName: string = 'Secretariat 1', kmlUniqueId?: string): Promise<Cesium.KmlDataSource> {
        if (!this.viewer) {
            throw new Error('Viewer is not initialized');
        }

        console.log('Loading KML from URL:', kmlUrl); // Debug log

        try {
            const kmlDataSource = await Cesium.KmlDataSource.load(kmlUrl, {
                camera: this.viewer.scene.camera,
                canvas: this.viewer.scene.canvas
            });

            // Add to viewer data sources
            await this.viewer.dataSources.add(kmlDataSource);
            kmlDataSource.show = true;

            // Safely attach kmlName to the data source
            (kmlDataSource as any).kmlName = kmlName; // Consider defining a custom interface instead



            // Zoom to the KML data source
            await this.viewer.zoomTo(kmlDataSource);

            return kmlDataSource;
        } catch (error) {
            console.error(`Failed to load KML file from ${kmlUrl}:`, error);
            throw new Error(`Failed to load KML file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // async loadKmlFile() {
    //     let kmlUrl = './repos/Secretariat KML/Secretariat 1.kmz';
    //     console.log('Loading KML from URL:', kmlUrl); // Debug log
    //     try {
    //         const kmlDataSource = await Cesium.KmlDataSource.load(kmlUrl, {
    //             camera: this.viewer!.scene.camera,
    //             canvas: this.viewer!.scene.canvas
    //         });
    //         // this.loadedKmlDataSources.set(kmlUniqueId, kmlDataSource);
    //         this.viewer!.dataSources.add(kmlDataSource);
    //         kmlDataSource.show = true;
    //         (kmlDataSource as any).kmlName = 'Secretariat 1';
    //         await this.viewer!.zoomTo(kmlDataSource);
    //         return kmlDataSource;
    //     } catch (error) {
    //         console.error(`Failed to load KML file from ${kmlUrl}:`, error);
    //         throw error;
    //     }
    // }



}




class CustomDropdown {
    private container: HTMLElement;
    private header: HTMLElement;
    private text: HTMLSpanElement;
    private arrow: HTMLSpanElement;
    private list: HTMLElement;
    private items: NodeListOf<HTMLElement>;
    private isMultiSelect: boolean;
    private selectedValues: string[];

    constructor(container: HTMLElement) {
        this.container = container;
        this.header = container.querySelector('.multi_dropdown-header')!;
        this.text = container.querySelector('.dropdown-text')!;
        this.arrow = container.querySelector('.dropdown-arrow')!;
        this.list = container.querySelector('.dropdown-list')!;
        this.items = container.querySelectorAll('.dropdown-item');
        this.isMultiSelect = container.dataset['multiSelect'] === 'true';
        this.selectedValues = [];

        console.log("Dropdown initialized. Multi-select:", this.isMultiSelect);

        this.initialize();
    }

    private initialize(): void {
        this.header.addEventListener('click', () => this.toggleList());
        this.items.forEach(item => {
            item.addEventListener('click', () => this.handleItemClick(item));
        });
        document.addEventListener('click', (e: MouseEvent) => {
            if (!this.container.contains(e.target as Node)) {
                this.list.classList.remove('show');
                this.arrow.classList.remove('open');
            }
        });
    }

    private toggleList(): void {
        this.list.classList.toggle('show');
        this.arrow.classList.toggle('open');
    }

    private handleItemClick(item: HTMLElement): void {
        const value = item.dataset['value']!;
        if (this.isMultiSelect) {
            // Multi-select logic
            if (this.selectedValues.includes(value)) {
                this.selectedValues = this.selectedValues.filter(v => v !== value);
                item.classList.remove('selected');
            } else {
                this.selectedValues.push(value);
                item.classList.add('selected');
            }
        } else {
            // Single-select logic
            this.selectedValues = [value];
            this.items.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            this.list.classList.remove('show');
            this.arrow.classList.remove('open');
        }
        this.updateHeader();
    }

    private updateHeader(): void {
        if (this.selectedValues.length === 0) {
            this.text.textContent = 'Select an option';
        } else {
            this.text.textContent = this.selectedValues.join(', ');
        }
    }

    public setMultiSelect(isMultiSelect: boolean): void {
        this.isMultiSelect = isMultiSelect;
        this.container.dataset['multiSelect'] = isMultiSelect.toString();
        if (!this.isMultiSelect && this.selectedValues.length > 1) {
            this.selectedValues = this.selectedValues.slice(0, 1);
            this.items.forEach(item => {
                if (!this.selectedValues.includes(item.dataset['value']!)) {
                    item.classList.remove('selected');
                }
            });
        }
        this.updateHeader();
    }

 
}