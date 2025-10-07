import { Component, OnInit, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { Viewer, ProviderViewModel, Cesium3DTileset, OpenStreetMapImageryProvider, buildModuleUrl } from 'cesium';
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

    GlblJsonData: any
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
    DEMloadedLayers = new Map();
    drpDownSelZone: any = ''
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


    // dataVill = {
    //     "ortho": ["Nowluru", "Abbarajupalem", "Ainavolu", "Anantavaram", "Borupalem", "Dondapadu", "Kondamarajupalem", "Krishnayyapalem", "Kuragallu", "Lingayapalem", "Malkapuram", "Mandadam", "Mangalagiri", "Nekkallu", "Nidamarru", "Penumaka", "Pichikalapalem", "Rayapudi", "Sakhamuru", "Tadepalli", "Tulluru", "Uddandarayanipalem", "Undavalli", "Velagapudi", "Venkatapalem", "Nelapadu"],
    //     "dem": ["Mangalagiri"],
    //     "model": ["road", "happyNest"],
    //     "geo": ["Capital City Layers", 'Amaravati Infra', "Lands", 'PlanningBoundary', 'Forests', 'Planning Boundaries', 'Transportation', 'DMPRoads'],
    //     "agc": ["Base", '3D Tiles_APSFL', '3D Tiles_Towers', '3D Tiles_Buildings', 'GO-T1', 'Assembley', 'Group_D', 'HighCourt', 'NGOS', 'Towers', 'new Towers', 'planningamaravati_buildings', 'sec', 'zone_utils']
    // };

    dataVill = {
        ortho: ["Nowluru", "Abbarajupalem", "Ainavolu", "Anantavaram", "Borupalem", "Dondapadu", "Kondamarajupalem", "Krishnayyapalem", "Kuragallu", "Lingayapalem", "Malkapuram", "Mandadam", "Mangalagiri", "Nekkallu", "Nidamarru", "Penumaka", "Pichikalapalem", "Rayapudi", "Sakhamuru", "Tadepalli", "Tulluru", "Uddandarayanipalem", "Undavalli", "Velagapudi", "Venkatapalem", "Nelapadu"],
        dem: ['abbarajupalem', 'Ainavolu', 'Anantavaram', 'Borupalem', 'Dondapadu', 'Kondamarajupalem', 'Krishnayyapalem', 'Kuragallu', 'Lingayapalem', 'Malkapuram', 'Mangalagiri', 'Nekkallu', 'Nelapadu', 'Nidamarru', 'Penumaka', 'Pichikalapalem', 'Sakhamuru', 'Tadepalli', 'Undavalli', 'Velagapudi', 'Venkatapalem'],
        // model: ["road", "happyNest"],
        geo: ["Capital City Layers", "Amaravati Infra", "Lands", "PlanningBoundary", "Forests", "Planning Boundaries", "Transportation", "DMPRoads"],
        model: {
            AGC: ["Base", "3D Tiles_APSFL", "3D Tiles_Towers", 'Towers', 'Internal_utilities'],
            Zone1B: ['3D Tiles_Buildings', 'GO-T1', 'Assembley', 'Group_D'],
            Zone2A: ['HighCourt', 'NGOS', 'Towers'],
            Zone2B: ['new Towers', 'planningamaravati_buildings'],
            Zone3A: ['Secretariat']
        }
    };
    Zones = ["Zone - 1A", "Zone - 1B", "Zone - 2A", "Zone - 2B", "Zone - 3A", "Zone - 3B", "Zone - 4", "Zone - 5A", "Zone - 5C", "Zone - 5B", "Zone - 5D", "Zone - 6", "Zone - 7", "Zone - 9", "Zone - 9", "AZone - 10", "Zone - 12", "Zone - 12A"]


    async ngOnInit(): Promise<void> {

        document.addEventListener('contextmenu', event => event.preventDefault())


        const inputJson = await fetch('./repos/GlobalDataJson.json');

        this.GlblJsonData = await inputJson.json();
        // console.log(this.GlblJsonData)

    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.proj_setup();
            this.populateVillageTabs();
            this.searchFunction();
            this.MainFunctionDataLoading();
            this.initializeOffcanvas();
        }, 2000);
        // this.toggleBasemapList()




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
        // await Cesium.createWorldTerrainAsync();
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


    async load_geojson_data(vwr: Cesium.Viewer): Promise<void> {

        const defaultColor = '#000000';
        const dataSource = await Cesium.GeoJsonDataSource.load('./repos/Zone_Bound.geojson');
        const fillColor = Cesium.Color.fromCssColorString(defaultColor).withAlpha(0);

        dataSource.entities.values.forEach(entity => {
            if (entity.polygon) {
                // Set polygon fill and outline
                entity.polygon.material = new Cesium.ColorMaterialProperty(fillColor);

                const borderClr = Cesium.Color.fromCssColorString('#00f000').withAlpha(1);
                entity.polygon.outlineColor = new Cesium.ConstantProperty(borderClr);
                entity.polygon.outlineWidth = new Cesium.ConstantProperty(1);

                // 🔍 Add a label on top of the polygon
                let center: Cesium.Cartesian3 | undefined;
                if (entity.polygon.hierarchy) {
                    const hierarchyValue = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
                    if (hierarchyValue && Array.isArray(hierarchyValue.positions) && hierarchyValue.positions.length > 0) {
                        center = Cesium.BoundingSphere.fromPoints(hierarchyValue.positions).center;

                        const cartographic = Cesium.Cartographic.fromCartesian(center);
                        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
                        const latitude = Cesium.Math.toDegrees(cartographic.latitude);

                        (entity as any).position = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);

                        (entity as any).label = new Cesium.LabelGraphics({
                            text: (entity as any).properties.ZoneName ?? 'Unnamed Zone',
                            font: '16px sans-serif',
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY // ensures it's always visible
                        });
                    }
                }
            }
        });

        await this.viewer!.dataSources.add(dataSource);
        await this.viewer!.zoomTo(dataSource.entities);


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
        // console.log("Get_all_projects_List Get_all_projects_List Get_all_projects_List")
        this.apiFetchService.get_list_projs().subscribe({
            next: (response: any) => {
                console.log('Data received:', response.data);
                this.lst_projects = response.data;
                this.groupedProjects = this.groupByProjectName(this.lst_projects);
                // console.log('Data groupedProjectsgroupedProjects:', this.groupedProjects);
            },
            error: (err: any) => {
                console.error('Error fetching data:', err);
            }
        });
    }


    populateVillageTabs() {
        if (!this.GlblJsonData) {
            console.error('Invalid data provided to populateVillageTabs:');
            return;
        }

        // Helper function to generate village label HTML
        const generateVillageLabel = (key: string, village: string, path: string, count: number, uuid: number, imgPath: string): string => `
                    <label class="eachVill" for="${key}-${village}">
                        <div class="checkbox-wrapper-15 villCheck">
                            <input class="inp-cbx inputVallagesCheck" data-path="${path}" data-count="${count}"  data-uuid="${uuid}" data-village="${village}" id="${key}-${village}" type="checkbox" style="display: none;" />
                            <label class="cbx" for="${key}-${village}">
                                <span>
                                    <svg width="12px" height="9px" viewBox="0 0 12 9">
                                        <polyline points="1 5 4 8 11 1"></polyline>
                                    </svg>
                                </span>
                            </label>
                        </div>
                        <img src="${imgPath}" alt="${village}">
                        <span class="villLabel" title="${village}">${village}</span>
                    </label>
                `;


        Object.entries(this.GlblJsonData!).forEach(([key, DataRaw]) => {
            const tabContainer = document.getElementById(`pills-${key}`);
            if (!tabContainer) {
                console.warn(`Tab container not found for key: ${key}`);
                return;
            }
            tabContainer.innerHTML = '';
            if (key !== 'model' && Array.isArray(DataRaw)) {
                DataRaw.forEach(element => {
                    // console.log(key, element, '------------------>')
                    let imgPath = `repos/tab_images/${element.name}.webp`
                    tabContainer.insertAdjacentHTML('beforeend', generateVillageLabel(key, element.name, element.path, element.count, element.uuid, imgPath));
                });
            }
            else if (key == 'model' && DataRaw) {
                $('#multi_dropdown-container .dropdown-list').html('')
                // Object.entries(DataRaw!).forEach(([subKey, dataSub]) => {
                // console.log(subKey, dataSub, 'DataRaw', typeof (dataSub))

                // console.log('if', dataSub.count, dataSub.name)
                Object.entries(DataRaw!).forEach(([subKeySub, Sub_data]) => {
                    const echCntnrDiv = document.createElement('div');
                    echCntnrDiv.className = 'eachCntnrDiv';
                    echCntnrDiv.dataset['key'] = subKeySub;
                    $('#multi_dropdown-container .dropdown-list').append(`<li class="dropdown-item ${subKeySub == 'Others' ? 'selected' : ''}" data-value="${subKeySub}">${subKeySub}</li>`)
                    // <li class="dropdown-item" data-value="Zone1A">Zone - 1A</li>
                    // console.log(Sub_data.folders)
                    if (Sub_data.folders) {
                        Sub_data.folders.forEach((element: any) => {
                            // console.log(element)
                            let imgPath = `${element.path}/1.webp`
                            echCntnrDiv.insertAdjacentHTML('beforeend', generateVillageLabel(subKeySub, element.name, element.path, element.count, element.uuid, imgPath));
                        });
                        //  echCntnrDiv.insertAdjacentHTML('beforeend', generateVillageLabel(subKey, Sub_data.name, Sub_data.path));
                    }
                    tabContainer.appendChild(echCntnrDiv);
                })
                //     // console.log(element.name)
                //     echCntnrDiv.insertAdjacentHTML('beforeend', generateVillageLabel(subKey, element.name, element.path));
                // });

                // });
            }

            // Clear previous content

            // if (Array.isArray(villages)) {
            //     // Handle flat array of villages
            //     villages.forEach((village: string) => {
            //         if (typeof village !== 'string') {
            //             console.warn(`Invalid village name in array for key ${key}:`, village);
            //             return;
            //         }
            //         tabContainer.insertAdjacentHTML('beforeend', generateVillageLabel(key, village));
            //     });
            // }
        })


        // Handle dropdown-based display logic
        const selectedDropdownValue = $('#multi_dropdown-container .dropdown-item.selected').data('value');
        if (selectedDropdownValue) {
            let self = this
            $('.eachCntnrDiv').each(function () {
                const container = $(this);
                const containerKey = container.data('key');
                if (containerKey === selectedDropdownValue) {
                    container.css('display', 'block');
                    console.log(containerKey, 'containerKeycontainerKey')
                    self.drpDownSelZone = containerKey

                    container.find('.villCheck .inputVallagesCheck').each(function () {
                        if ($(this).data('village') !== 'Buildings') {
                            $(this).prop('checked', true);
                        }
                    });
                } else {
                    container.css('display', 'none');
                }

            });
        } else {
            console.warn('No selected dropdown value found.');
            $('.eachCntnrDiv').css('display', 'none'); // Hide all by default if no selection
        }
        const dropdownContainer = document.getElementById('multi_dropdown-container');
        if (dropdownContainer) {
            const dropdown = new CustomDropdown(dropdownContainer);
        }

        this.Load_AGC_models()

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

        $(document).on('change', '#pills-gis .inputVallagesCheck', async (event: JQuery.ChangeEvent) => {
            const allChecked: boolean = $('#pills-gis .inputVallagesCheck:checked').length === $('#pills-gis .inputVallagesCheck').length;
            $('#selectAllVill').prop('checked', allChecked);
            this.loadGeoJsonData()
        });


        $(document).on('change', '#pills-model .inputVallagesCheck', async (event: JQuery.ChangeEvent) => {
            const selectedDropdownValue = $('#multi_dropdown-container .dropdown-item.selected').data('value');
            if (selectedDropdownValue) {
                // Check if all checkboxes in the selected container are checked
                const containerSelector = `.eachCntnrDiv[data-key="${selectedDropdownValue}"] .eachVill .inputVallagesCheck`;
                // console.log($(containerSelector).length, $(`${containerSelector}:checked`).length)
                const allChecked: boolean = $(`${containerSelector}:checked`).length === $(containerSelector).length;
                $('#selectAllVill').prop('checked', allChecked);
                this.Load_AGC_models();
            }
        });

        $('#selectAllVill').on('change', (event) => {
            const $checkbox = $(event.target as HTMLInputElement);
            const isChecked = $checkbox.is(':checked');

            // Get active tab pane and its ID once
            const $activeTabPane = $('#pills-tabContent .tab-pane.active.show');
            const tabId = $activeTabPane.attr('id');

            // Toggle all checkboxes inside that tab


            // Handle tab-specific logic
            switch (tabId) {
                case 'pills-ortho':
                    $activeTabPane.find('.eachVill .inputVallagesCheck').prop('checked', isChecked);
                    this.checkSelectedOrthoVillagesToLoad();

                    break;
                case 'pills-dem':
                    $activeTabPane.find('.eachVill .inputVallagesCheck').prop('checked', isChecked);
                    this.checkSelectedDEMvillagesToLoad();
                    break;

                case 'pills-gis':
                    $activeTabPane.find('.eachVill .inputVallagesCheck').prop('checked', isChecked);
                    this.loadGeoJsonData();
                    // console.log('geo all tab clicked', isChecked)
                    break;
                case 'pills-model':
                    const selectedDropdownValue = $('#multi_dropdown-container .dropdown-item.selected').data('value');
                    if (selectedDropdownValue) {
                        $('.eachCntnrDiv').each(function () {
                            const container = $(this);
                            const containerKey = container.data('key');
                            if (containerKey === selectedDropdownValue) {
                                $(`.eachCntnrDiv[data-key="${containerKey}"] .eachVill .inputVallagesCheck`).prop('checked', isChecked);
                                // console.log(container);
                            } else {
                                // $(`.eachCntnrDiv[data-key="${containerKey}"] .eachVill .inputVallagesCheck`).prop('checked', false);
                            }
                        });
                    }
                    this.Load_AGC_models();
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

        let self = this
        $('#multi_dropdown-container .dropdown-item').on('click', function () {
            // Get the selected value from the data attribute
            var selectedValue = $(this).data('value');

            if (selectedValue) {

                $('.eachCntnrDiv').each(function () {
                    const container = $(this);
                    const containerKey = container.data('key');
                    if (containerKey === selectedValue) {
                        container.css('display', 'block');
                        self.drpDownSelZone = containerKey
                    } else {
                        container.css('display', 'none');
                    }


                });
            } else {
                console.warn('No selected dropdown value found.');
                $('.eachCntnrDiv').css('display', 'none'); // Hide all by default if no selection
            }
            const selectedDropdownValue = $('#multi_dropdown-container .dropdown-item.selected').data('value');
            if (selectedDropdownValue) {
                // Check if all checkboxes in the selected container are checked
                const containerSelector = `.eachCntnrDiv[data-key="${selectedDropdownValue}"] .eachVill .inputVallagesCheck`;
                // console.log($(containerSelector).length, $(`${containerSelector}:checked`).length)
                const allChecked: boolean = $(`${containerSelector}:checked`).length === $(containerSelector).length;
                $('#selectAllVill').prop('checked', allChecked);
            }
        });

    }
    showHideEachFeatures(): void {
        // console.log('showHideEachFeatures showHideEachFeatures')
        const $panel: JQuery<HTMLElement> = $('#slidePanel');
        const $buttons: JQuery<HTMLElement> = $('#buttonWrapper');
        const $content: JQuery<HTMLElement> = $('#panelContent');
        $('.eachFretureBtns').on('click', function (this: HTMLElement): void {
            // console.log('ooooo')
            // console.log('Feature button clicked');
            if ($(this).hasClass('active')) {
                $panel.addClass('active');
                $buttons.addClass('raised');
                $('.selecetions_4r_basemap').addClass('raised');
                $('#offcanvasRightFeatures').addClass('raised')
            }
            if ($(this).attr('id') == 'pills-model-tab') {
                $('#multi_dropdown-container').css('display', 'block');
            } else {
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


        // Handle mouse drag scrolling
        $content.on('mousedown', (e: JQuery.MouseDownEvent<HTMLElement>): void => {
            if ($(e.target).is('input[type="checkbox"]') || $(e.target).closest('input[type="checkbox"]').length) {
                return;
            }

            e.preventDefault();
            isDragging = true;
            $content.addClass('dragging');
            startX = e.pageX;
            scrollLeft = $content.scrollLeft() ?? 0;
        });

        $(document).on('mouseup', (): void => {
            isDragging = false;
            $content.removeClass('dragging');
        });

        $(document).on('mousemove', (e: JQuery.MouseMoveEvent<Document>): void => {
            if (!isDragging) return;
            e.preventDefault();
            const x: number = e.pageX;
            const walk: number = (x - startX) * 1.5;
            $content.scrollLeft(scrollLeft - walk);
        });

        // Handle mouse wheel scrolling with fixed distance and smooth animation
        let isScrolling: boolean = false;
        $content.on('wheel', (e: any): void => {
            e.preventDefault();

            if (isScrolling) return; // Prevent stacking scroll events

            isScrolling = true;
            const delta: number = e.originalEvent.deltaY; // Scroll wheel delta (positive = down/right, negative = up/left)
            const scrollSpeedFactor: number = 5; // Adjust this to control scroll sensitivity (higher = faster)
            const scrollAmount: number = delta * scrollSpeedFactor; // Scroll distance proportional to wheel speed
            const currentScroll: number = $content.scrollLeft() ?? 0;
            const targetScroll: number = currentScroll + scrollAmount;

            $content.animate(
                {
                    scrollLeft: targetScroll
                },
                {
                    duration: 800, // Shorter duration for smoother, more responsive scrolling
                    easing: 'swing', // Smooth easing for natural feel
                    complete: () => {
                        isScrolling = false; // Allow next scroll event
                    }
                }
            );
        });
        // Prevent checkbox interaction during dragging
        $content.find('input[type="checkbox"]').on('click', (e: JQuery.ClickEvent<HTMLElement>): void => {
            if ($content.hasClass('dragging')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Prevent panel from closing when clicking inside content
        $content.on('click', (e: JQuery.ClickEvent<HTMLElement>): void => {
            e.stopPropagation();
        });


        // $content.on('mousedown', (e: JQuery.MouseDownEvent<HTMLElement>): void => {
        //     // Prevent any default behavior and propagation for checkboxes
        //     if ($(e.target).is('input[type="checkbox"]') || $(e.target).parents('input[type="checkbox"]').length) {
        //         e.preventDefault();
        //         e.stopPropagation();
        //     }
        //     isDragging = true;
        //     $content.addClass('dragging');
        //     startX = e.pageX;
        //     scrollLeft = $content.scrollLeft() ?? 0; // Handle null case
        // });

        // $(document).on('mouseup', (): void => {
        //     isDragging = false;
        //     $content.removeClass('dragging');
        // });

        // $(document).on('mousemove', (e: JQuery.MouseMoveEvent<Document, undefined, Document, Document>): void => {
        //     if (!isDragging) return;
        //     e.preventDefault();
        //     const x: number = e.pageX;
        //     const walk: number = (x - startX) * -1.5; // scroll direction & speed
        //     $content.scrollLeft(scrollLeft + walk);
        // });

        // // Prevent checkbox interaction during dragging
        // $content.find('input[type="checkbox"]').on('mousedown click', (e: JQuery.TriggeredEvent<HTMLElement>): void => {
        //     if (isDragging) {
        //         e.preventDefault();
        //         e.stopPropagation();
        //     }
        // });
    }


    //--------------------------------------------------------------------------------------------------------------------------------------
    // aurtho loading --------------start ----------------
    loaded_ortho_vill: string[] = [];
    checkSelectedOrthoVillagesToLoad(): void {
        this.uncheckCheckedVillagesInDemTab();
        const checkedVillages = $('#pills-ortho .inputVallagesCheck:checked').map(function (this: HTMLElement) {
            return {
                village: $(this).data('village') as string,
                path: $(this).data('path') as string
            };
        }).get();
        const uncheckedVill: string[] = $('#pills-ortho .inputVallagesCheck:not(:checked)').map(function () {
            return $(this).data('village') as string;
        }).get();
        const self = this;
        this.loaded_ortho_vill = []
        checkedVillages.forEach((villageObj: { village: string; path: string }) => {
            self.loaded_ortho_vill.push(villageObj.village);
            // console.log(villageObj.village, villageObj.path)
            self.loadOrthoTileset(villageObj.village, villageObj.path);
        });
        uncheckedVill.forEach((unchecked: string) => {
            if (this.ortholoadedLayers.has(unchecked)) {
                const layer = this.ortholoadedLayers.get(unchecked);
                this.viewer!.imageryLayers.remove(layer, true);
                this.ortholoadedLayers.delete(unchecked);
            }
        })
    }

    async loadOrthoTileset(folderName: string, path: string): Promise<void> {
        if (this.terrainEnabled) {
            // If terrain was enabled earlier, disable or revert to default
            // this.viewer!.terrainProvider = Cesium.createWorldTerrain();
            this.terrainEnabled = false;
        }

        const tilemapURL = `${path}/tilemapresource.xml`;

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


        const checkedVillages = $('#pills-dem .inputVallagesCheck:checked').map(function (this: HTMLElement) {
            return {
                village: $(this).data('village') as string,
                path: $(this).data('path') as string
            };
        }).get();
        // Get all village names (checked + unchecked)
        const uncheckedVill: string[] = $('#pills-dem .inputVallagesCheck:not(:checked)').map(function (this: HTMLElement) {
            return $(this).data('village') as string;
        }).get();

        checkedVillages.forEach((villageObj: { village: string; path: string }) => {
            this.loadDemData(villageObj.village, villageObj.path);
        });
        uncheckedVill.forEach((unchecked: string) => {
            if (this.DEMloadedLayers.has(unchecked)) {
                const tileset = this.DEMloadedLayers.get(unchecked);
                if (tileset) {
                    tileset.show = false;

                    this.viewer!.imageryLayers.remove(tileset, true);
                    this.DEMloadedLayers.delete(unchecked);
                }
            }
        })

    }

    async loadDemData(villageName: string, path: string): Promise<void> {
        try {
            // Check if tileset already exists
            if (this.DEMloadedLayers.has(villageName)) {
                const existingTileset = this.DEMloadedLayers.get(villageName);
                if (existingTileset) {
                    existingTileset.show = true;
                    await this.viewer!.zoomTo(existingTileset);
                    return;
                }
            }

            // Load new tileset
            const tilesetUrl = `${path.trim()}/model.json`;
            // console.log(path, tilesetUrl)
            const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl, {
                // Optional: Add tileset options here if needed
            } as any);

            // Set a fixed z-value (e.g., 0) for the tileset
            const targetZ = -10; // Adjust this to your desired rounded z-value
            const boundingSphere = tileset.boundingSphere;

            // Check if boundingSphere and center are valid
            if (!boundingSphere || !boundingSphere.center) {
                throw new Error(`Invalid bounding sphere for ${villageName}`);
            }

            const center = boundingSphere.center;

            // Convert Cartesian coordinates to Cartographic (radians)
            const cartographic = Cesium.Cartographic.fromCartesian(center);
            if (!cartographic) {
                throw new Error(`Failed to convert Cartesian to Cartographic for ${villageName}`);
            }

            // Convert radians to degrees for longitude and latitude
            const longitude = Cesium.Math.toDegrees(cartographic.longitude);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude);

            // Create a translation to move the tileset to the target z-value
            const surfacePosition = Cesium.Cartesian3.fromDegrees(
                longitude,
                latitude,
                targetZ
            );

            // Compute the translation vector
            const translation = Cesium.Cartesian3.subtract(surfacePosition, center, new Cesium.Cartesian3());
            const transform = Cesium.Matrix4.fromTranslation(translation);

            // Apply the transformation to the tileset
            tileset.modelMatrix = transform;

            // Store and add the tileset to the scene
            this.DEMloadedLayers.set(villageName, tileset);
            this.viewer!.scene.primitives.add(tileset);
            tileset.show = true;
            await this.viewer!.zoomTo(tileset);
        } catch (error) {
            console.error(`Error loading DEM data for ${villageName}:`, error);
            throw error;
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
                // if (lastFeature && (!pickedFeature || pickedFeature !== lastFeature)) {
                //     lastFeature.color = Cesium.Color.WHITE;
                //     lastFeature = null;
                // }

                if (HvrFeatureName == "Project") {

                }
                else if (HvrFeatureName == "Building") {

                }
                else {
                    // Highlight current building
                    if (pickedFeature instanceof Cesium.Cesium3DTileFeature) {
                        // pickedFeature.color = Cesium.Color.YELLOW.withAlpha(0.8); // highlight
                        // lastFeature = pickedFeature;
                        
                    }

                }
            }



        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }



    async loadGeoJsonData() {

        $('#selectAllVill').prop('disabled', true);
        const inputJson = await fetch('./repos/geojson_map.json');

        const data: { [key: string]: string[] } = await inputJson.json();

        // const checkedLayers = $('#pills-gis .inputVallagesCheck:checked')
        //     .map(function () {
        //         return $(this).data('village') as string;
        //     })
        //     .get();


        const checkedLayers = $('#pills-gis .inputVallagesCheck:checked').map(function () {
            return {
                village: $(this).data('village'),
                path: $(this).data('path')
            };
        }).toArray();

        const UncheckedLayers: string[] = $('#pills-gis .inputVallagesCheck:not(:checked)')
            .map(function () {
                return $(this).data('village') as string;
            })
            .get();


        for (const eachLayer of UncheckedLayers) {
            // console.log(eachLayer)
            const filteredData = this.GlblJsonData['gis'].filter((item: any) => item.name === eachLayer);
            const key_ele = eachLayer + filteredData[0].count
            // console.log(key_ele)
            if (this.loadedJsonLayers.has(key_ele)) {
                const existingDataSource = this.loadedJsonLayers.get(key_ele);
                if (existingDataSource) {
                    // Hide it using the show property
                    existingDataSource.show = false;
                    // Optionally: remove completely:
                    this.viewer!.dataSources.remove(existingDataSource, true);
                    this.loadedJsonLayers.delete(key_ele);
                }
            }
        }


        for (const layer of checkedLayers) {
            // console.log(layer);

            // Ensure layer has valid data
            if (!layer?.village || !layer?.path) {
                console.warn(`Invalid layer data: ${JSON.stringify(layer)}`);
                continue; // Skip invalid layers
            }

            // Filter GIS data for the village
            const filteredData = this.GlblJsonData['gis'].filter((item: any) => item.name === layer.village);

            // Check if filtered data exists
            if (!filteredData?.length) {
                console.warn(`No GIS data found for village: ${layer.village}`);
                continue;
            }


            // Process each GeoJSON file
            for (const element of filteredData[0].geojson_files) {
                // Create a unique key for the layer
                // const key_ele = `${layer.village}_${element.file_name}`;
                const key_ele = layer.village + filteredData[0].count

                // Check if layer is already loaded
                if (this.loadedJsonLayers.has(key_ele)) {
                    const existingDataSource = this.loadedJsonLayers.get(key_ele);
                    if (existingDataSource) {
                        existingDataSource.show = true;
                        // console.log(`Layer ${key_ele} already loaded, setting visibility to true`);
                        continue; // Skip loading already loaded layer
                    }
                }
                const geoJsonUrl = `${element.file_path}`;
                try {

                    const response = await fetch(geoJsonUrl);

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const geoJson = await response.json();

                    // Set default color with fallback
                    const defaultColor = geoJson.color || '#eaf182ff';

                    // Load GeoJSON data into Cesium
                    const dataSource = await Cesium.GeoJsonDataSource.load(geoJson);
                    const fillColor = Cesium.Color.fromCssColorString(defaultColor).withAlpha(0.2);

                    // Style each entity in the data source
                    dataSource.entities.values.forEach(entity => {
                        if (entity.polygon) {
                            entity.polygon.material = new Cesium.ColorMaterialProperty(fillColor);
                            entity.polygon.outlineColor = new Cesium.ConstantProperty(fillColor.withAlpha(0.6));
                            entity.polygon.outlineWidth = new Cesium.ConstantProperty(1);
                        }
                    });

                    // Add and zoom to the data source
                    await this.viewer!.dataSources.add(dataSource);
                    await this.viewer!.zoomTo(dataSource.entities);

                    // Store the loaded layer
                    this.loadedJsonLayers.set(key_ele, dataSource);

                } catch (error) {
                    console.error(`Error loading GeoJSON for ${element.file_name} from ${geoJsonUrl}:`, error);
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
                // console.log('Offcanvas is shown');
            });

            roffcanvasRightFerturesElement.addEventListener('hidden.bs.offcanvas', () => {
                // console.log('Offcanvas is hidden');
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


    tilesetClickToOpenRightCanvas() {
        const handler = new Cesium.ScreenSpaceEventHandler(this.viewer!.scene.canvas);
        let lastFeature: Cesium.Cesium3DTileFeature | null = null;
        // handler.setInputAction((movement: any) => {
        //     const pickedObject = this.viewer!.scene.pick(movement.position);

        //     if (Cesium.defined(pickedObject)) {
        //         // Check if the picked object is a Cesium3DTileset
        //         if (pickedObject.primitive instanceof Cesium.Cesium3DTileset) {
        //             const tileset = pickedObject.primitive as Cesium.Cesium3DTileset;

        //             const buildingName = (tileset as any).BldgName || tileset.asset?.BldgName || tileset.properties?.BldgName;
        //             const Vuuid = (tileset as any).uuid || tileset.asset?.uuid || tileset.properties?.uuid;

        //             if (Vuuid) {
        //                 // console.log('Building Name:', buildingName);
        //                 const matchingProject = this.lst_projects.find(project => project.uuid === Vuuid);
        //                 console.log(matchingProject, "matchingProjectmatchingProjectmatchingProjectmatchingProject")
        //                 if (matchingProject) {
        //                     if (this.roffcanvasRightFertures) {
        //                         if(matchingProject.url.length > 0)
        //                         {
        //                             this.roffcanvasRightFertures.show();
        //                             $("#dyn_bim_vwr").attr("href", matchingProject.url);
        //                         }
        //                     }
        //                 } else {
        //                     if (this.roffcanvasRightFertures) {
        //                         this.roffcanvasRightFertures.hide()
        //                     }
        //                 }
        //             }

        //         }
        //     }
        // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


        let lastPickedPosition: Cesium.Cartesian3 | null = null;
        let last_clked_obj: any = null

        const updateTooltipPosition = (
            viewer: Cesium.Viewer,
            cartesian: Cesium.Cartesian3,
            projectData: { [key: string]: any }
        ) => {
            const canvasPosition = new Cesium.Cartesian2();
            const success = Cesium.SceneTransforms.worldToWindowCoordinates(
                viewer.scene,
                cartesian,
                canvasPosition
            );

            if (success) {
                let tooltip = document.getElementById('cesium-tooltip') as HTMLElement | null;

                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = 'cesium-tooltip';

                    // Inline CSS styles
                    tooltip.style.position = 'absolute';
                    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    tooltip.style.color = '#fff';
                    tooltip.style.padding = '10px';
                    tooltip.style.borderRadius = '5px';
                    tooltip.style.fontSize = '13px';
                    tooltip.style.pointerEvents = 'none';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.whiteSpace = 'pre-line';
                    tooltip.style.maxWidth = '400px';
                    document.body.appendChild(tooltip);
                }

                // Format key (e.g., contractor_id → Contractor Id)
                const formatKey = (key: string): string =>
                    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                // Build HTML table from projectData
                let html = `<div><strong>Project Details:</strong><br/><br/>`;
                html += `<table style="width: 100%; border-collapse: collapse;">`;

                for (const key in projectData) {
                    if (!key.toLowerCase().includes('id')) {
                        if (projectData.hasOwnProperty(key)) {
                            const value = projectData[key] ?? '—';
                            html += `
                            <tr>
                                <td style="border: 1px solid #999; padding: 4px; font-weight: bold; background-color: #222;">${formatKey(key)}</td>
                                <td style="border: 1px solid #999; padding: 4px; background-color: #333;">${value}</td>
                            </tr>`;
                        }
                    }

                }

                html += `</table></div>`;

                tooltip.innerHTML = html;

                const tooltipHeight = tooltip.offsetHeight || 20;
                const tooltipWidth = tooltip.offsetWidth || 150;

                tooltip.style.left = `${canvasPosition.x - tooltipWidth / 2}px`;
                tooltip.style.top = `${canvasPosition.y - tooltipHeight - 10}px`;
                tooltip.style.display = 'block';
            }
        };







        // Handle left-click to pick an object
        handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
            const pickedObject = this.viewer!.scene.pick(movement.position);
            this.roffcanvasRightFertures!.hide();

            if (Cesium.defined(pickedObject)) {
                last_clked_obj = pickedObject;
                console.log(pickedObject, "pickedObjectpickedObject")
                if (pickedObject.primitive instanceof Cesium.Cesium3DTileset) {

                    const cartesian = this.viewer!.scene.pickPosition(movement.position);
                    const tileset = pickedObject.primitive as Cesium.Cesium3DTileset;
                    const buildingName = (tileset as any).BldgName || tileset.asset?.BldgName || tileset.properties?.BldgName;
                    const Vuuid = (tileset as any).uuid || tileset.asset?.uuid || tileset.properties?.uuid;
                    // if (Vuuid) {
                    //     // console.log('Building Name:', buildingName);
                    //     const matchingProject = this.lst_projects.find(project => project.uuid === Vuuid);
                    //     console.log(matchingProject, "matchingProjectmatchingProjectmatchingProjectmatchingProject")
                    //     if (matchingProject) {
                    //         if (this.roffcanvasRightFertures) {

                    //             if (Cesium.defined(cartesian)) {
                    //                 lastPickedPosition = cartesian;

                    //                 updateTooltipPosition(this.viewer!, cartesian, matchingProject);
                    //             }

                    //             if (matchingProject.url.length > 0) {
                    //                 this.roffcanvasRightFertures.show();
                    //                 $("#dyn_bim_vwr").attr("href", matchingProject.url);
                    //             }
                    //             else {
                    //                 this.roffcanvasRightFertures.hide();

                    //             }
                    //         }
                    //     }
                    //     else {
                    //         if (this.roffcanvasRightFertures) {
                    //             this.roffcanvasRightFertures.hide()
                    //         }
                    //     }



                    // }
                }
                else {
                    // Hide tooltip and clear stored position
                    const tooltip = document.getElementById('cesium-tooltip');
                    if (tooltip) {
                        tooltip.style.display = 'none';
                    }
                    lastPickedPosition = null;
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Update tooltip position when the camera moves (e.g., during panning)
        // this.viewer!.scene.camera.moveEnd.addEventListener(() => {
        //     if (lastPickedPosition) {
        //         updateTooltipPosition(this.viewer!, lastPickedPosition);
        //     }
        // });

        // Optional: Update tooltip in real-time during mouse movement
        // handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
        //     if (lastPickedPosition) {
        //         updateTooltipPosition(this.viewer!, lastPickedPosition);
        //     }
        // }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((movement: any) => {
            const pickedObject = this.viewer!.scene.pick(movement.endPosition);

            if (Cesium.defined(pickedObject)) {

                if (last_clked_obj != pickedObject) {
                    const tooltip = document.getElementById('cesium-tooltip');
                    if (tooltip) {
                        tooltip.style.display = 'none';
                    }
                    lastPickedPosition = null;
                }


                // Check if the picked object is a Cesium3DTileset
                if (pickedObject.primitive instanceof Cesium.Cesium3DTileset) {
                    const tileset = pickedObject.primitive as Cesium.Cesium3DTileset;
                    // console.log('Clicked Tileset:', tileset,pickedObject.getProperty('BldgName'));

                    if (lastFeature && (!pickedObject || pickedObject !== lastFeature)) {
                        lastFeature.color = Cesium.Color.WHITE; // reset back to original (adjust if needed)
                        lastFeature = null;
                    }

                    const buildingName = (tileset as any).BldgName || tileset.asset?.BldgName || tileset.properties?.BldgName;
                    const Vuuid = (tileset as any).uuid || tileset.asset?.uuid || tileset.properties?.uuid;
                    if (Vuuid) {

                        const matchingProject = this.lst_projects.find(project => project.uuid === Vuuid);
                        if (matchingProject) {

                            // Highlight current building
                            if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
                                pickedObject.color = Cesium.Color.YELLOW.withAlpha(0.8); // highlight
                                lastFeature = pickedObject;
                            }
                        }
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    }

    //////// Load Amaravthi Capital Models

    Load_AGC_models() {

        const checkedLayers = $('#pills-model .inputVallagesCheck:checked').map(function () {
            return {
                Layer: $(this).data('village'),
                path: $(this).data('path'),
                count: $(this).data('count'),
                uuid: $(this).data('uuid')
            };
        }).toArray();

        const UncheckedLayers: string[] = $('#pills-model .inputVallagesCheck:not(:checked)')
            .map(function () {
                return $(this).data('village') as string;
            })
            .get();






        checkedLayers.forEach((LayerObj: { Layer: string; path: string; count: any, uuid: number }) => {
            console.log(LayerObj.Layer, LayerObj.path, "----------->", LayerObj.count)
            if (LayerObj.count > 0) {
                let data = this.GlblJsonData['model'][this.drpDownSelZone]
                let selected_sub_models = Object.values(data.folders).find((zone: any) => zone.name === LayerObj.Layer);
                if (selected_sub_models && typeof selected_sub_models === 'object' && 'count' in selected_sub_models) {
                    let sub_data = (selected_sub_models as any)
                    if (sub_data.count > 0) {
                        sub_data.sub_folders.forEach(async (element: any) => {
                            this.loaddynamicModelTilesetFolder(element.path, element.name, element.uuid)
                        });
                    }
                }
                // console.log(LayerObj.Layer, LayerObj.path)
            } else {
                this.loaddynamicModelTilesetFolder(LayerObj.path, LayerObj.Layer, LayerObj.uuid)
            }

            // self.loaded_ortho_vill.push(villageObj.village);
            // console.log(villageObj.village, villageObj.path)
            // self.loadOrthoTileset(villageObj.village, villageObj.path);
        });



        // let data = this.GlblJsonData['model'][this.drpDownSelZone];

        // Object.values(data.folders).forEach((zone: any) => {
        //     // if (zone.name !== this.drpDownSelZone) {
        //     UncheckedLayers.forEach((unchecked: string) => {
        //         if (zone.count > 0 && unchecked == zone.name) {
        //             zone.sub_folders.forEach((element: any) => {
        //                 if (this.loadedModelTilesets.has(element.name)) {
        //                     const tileset = this.loadedModelTilesets.get(element.name);
        //                     if (tileset && this.viewer?.scene.primitives.contains(tileset)) {
        //                         this.viewer.scene.primitives.remove(tileset);
        //                         this.loadedModelTilesets.delete(element.name);
        //                     }
        //                 }
        //             });
        //         } else if (unchecked == zone.name) {
        //             // console.log(zone.name, unchecked, zone)
        //             if (this.loadedModelTilesets.has(unchecked)) {
        //                 const tileset = this.loadedModelTilesets.get(unchecked);
        //                 if (tileset && this.viewer?.scene.primitives.contains(tileset)) {
        //                     this.viewer.scene.primitives.remove(tileset);
        //                     this.loadedModelTilesets.delete(unchecked);
        //                 }
        //             }
        //         }

        //     })
        // });

        const data = this.GlblJsonData['model'][this.drpDownSelZone];

        Object.values(data.folders).forEach((zone: any) => {
            if (UncheckedLayers.includes(zone.name)) {
                if (zone.count > 0) {
                    // Handle sub-folders
                    zone.sub_folders.forEach((element: any) => {
                        this.removeTileset(element.name);
                    });
                } else {
                    // Handle zone directly
                    this.removeTileset(zone.name);
                }
            }
        });
    }

    removeTileset(name: string): void {
        if (this.loadedModelTilesets.has(name)) {
            const tileset = this.loadedModelTilesets.get(name);
            if (tileset && this.viewer?.scene.primitives.contains(tileset)) {
                this.viewer.scene.primitives.remove(tileset);
                this.loadedModelTilesets.delete(name);
            }
        }


        // let selected_sub_models = Object.values(data).filter((zone:any) => zone.folders.name === unchecked);
        // console.log(selected_sub_models, 'ppppppppp')
        // if (this.ortholoadedLayers.has(unchecked)) {
        //     const layer = this.ortholoadedLayers.get(unchecked);
        //     this.viewer!.imageryLayers.remove(layer, true);
        //     this.ortholoadedLayers.delete(unchecked);
        // }


        // allLayers.forEach((ech_AGC_data: string) => {
        //     const isChecked: boolean = checkedLayers.includes(ech_AGC_data);
        //     const urlOfMdl: string = `/AGC/${ech_AGC_data}`;

        //     // Create a shared handler for fetch errors
        //     const handleFetchError = (err: any) => {
        //         console.error(`Error fetching folders for ${ech_AGC_data}:`, err);
        //     };

        //     if (isChecked) {
        //         // Load tilesets for checked ech_AGC_data
        //         const result = this.jsonFetchService.get_fetch_dirs(urlOfMdl);
        //         result.observable.subscribe({
        //             next: (folderNames: string[]) => {
        //                 folderNames.forEach((folderName: string) => {
        //                     const fullPath = `${result.baseDir}${urlOfMdl}/${folderName}`;
        //                     // console.log(ech_AGC_data)
        //                     this.loaddynamicModelTilesetFolder(fullPath, ech_AGC_data, folderName)

        //                 });
        //             },
        //             error: handleFetchError
        //         });
        //     } else {
        //         // Remove tilesets for unchecked villages
        //         const result = this.jsonFetchService.get_fetch_dirs(urlOfMdl);
        //         result.observable.subscribe({
        //             next: (folderNames: string[]) => {
        //                 folderNames.forEach((folderName: string) => {
        //                     let tileUniqueId = ech_AGC_data + "-" + folderName
        //                     console.log(tileUniqueId, this.loadedModelTilesets.has(tileUniqueId))
        //                     if (this.loadedModelTilesets.has(tileUniqueId)) {
        //                         const tileset = this.loadedModelTilesets.get(tileUniqueId);
        //                         if (tileset && this.viewer?.scene.primitives.contains(tileset)) {
        //                             this.viewer.scene.primitives.remove(tileset);
        //                             this.loadedModelTilesets.delete(tileUniqueId);
        //                         }
        //                     }
        //                 });
        //             },
        //             error: handleFetchError
        //         });
        //     }
        // });

    }


    async loaddynamicModelTilesetFolder(mdl_path: string, modelName: string, uuid: number): Promise<void> {
        let tileUniqueId = modelName;
        if (this.loadedModelTilesets.has(tileUniqueId)) {
            const existingTileset = this.loadedModelTilesets.get(tileUniqueId);
            if (existingTileset) {
                existingTileset.show = true;
                // this.viewer!.zoomTo(existingTileset); // Optional: Uncomment if needed
                return;
            }
        }
        // console.log(mdl_path, 'mdl_pathmdl_path')
        const tilesetUrl = `${mdl_path}/tileset.json`;
        // console.log('Loading tileset from:', tilesetUrl); // Debug log

        try {
            const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl);
            this.loadedModelTilesets.set(tileUniqueId, tileset);
            // console.log(tileUniqueId, 'tileUniqueId', this.loadedModelTilesets.has(tileUniqueId))

            this.viewer!.scene.primitives.add(tileset);
            tileset.show = true;
            (tileset as any).BldgName = modelName;
            (tileset as any).uuid = uuid;
            this.viewer!.zoomTo(tileset);

            if (modelName === "Assembley") {
                const boundingSphere = tileset.boundingSphere;
                // console.log(boundingSphere, "boundingSphereboundingSphereboundingSphere")
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

        // console.log('Loading KML from URL:', kmlUrl); // Debug log

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



    activeButtonId: string | null = null;
    toggleActive(id: string) {
        this.activeButtonId = this.activeButtonId === id ? null : id; // Toggle active state
    }

    ProjectsButton1Click(id: string) {
        console.log(id);
        this.removeAll();
        this.toggleActive(id);
        // Note: Intentionally NOT calling removeAll() here? If it should, add: this.removeAll();

        this.handleOthersSelection((checkbox) => {
            if (checkbox.data('village') !== 'Buildings') {
                checkbox.prop('checked', true);
            }
        });

        this.Load_AGC_models();
    }

    HandBOfficeButton1Click(id: string) {
        console.log(id);
        this.toggleActive(id);
        this.removeAll();

        this.handleOthersSelection((checkbox) => {
            const village = checkbox.data('village');
            if (village !== 'Buildings' && village !== 'Trunks') {
                checkbox.prop('checked', true);
            } else {
                checkbox.prop('checked', false);
            }
        });

        this.Load_AGC_models();
    }

    TrunkButton1Click(id: string) {
        console.log(id);
        this.toggleActive(id);
        this.removeAll();

        this.handleOthersSelection((checkbox) => {
            if (checkbox.data('village') === 'Trunks') {  // Fixed: Use === for strict equality
                checkbox.prop('checked', true);
            } else {
                checkbox.prop('checked', false);
            }
        });

        this.Load_AGC_models();
    }

    LpsButton1Click(id: string) {
        console.log(id);
        this.toggleActive(id);
        this.removeAll();
        let self = this
        const $dropdownItems = $('#multi_dropdown-container .dropdown-item');

        $dropdownItems.each(function () {
            const $item = $(this);
            const dataAttrs = $item.data('value');

            $dropdownItems.removeClass('selected');
            $item.addClass('selected');
            if (dataAttrs) {
                $('.eachCntnrDiv').each(function () {
                    const container = $(this);
                    const containerKey = container.data('key');
                    // console.log(containerKey,dataAttrs )
                    if (containerKey !== 'Others' && containerKey == dataAttrs) {
                        self.drpDownSelZone = containerKey
                        console.log(containerKey)
                        container.find('.villCheck .inputVallagesCheck').each(function () {

                            $(this).prop('checked', true);

                        });
                        self.Load_AGC_models()
                    } else {
                        container.find('.villCheck .inputVallagesCheck').each(function () {

                            $(this).prop('checked', false);

                        });
                    }

                });
                //
            }

            //
        });


    }

    // New helper method: Extracts the common "Others" dropdown + container logic
    private handleOthersSelection(checkboxCallback: (checkbox: JQuery<HTMLElement>) => void) {
        const $dropdownItems = $('#multi_dropdown-container .dropdown-item');
        $dropdownItems.removeClass('selected');
        $dropdownItems.filter('[data-value="Others"]').addClass('selected');

        // Removed unnecessary if ($dropdownItems) check—it's always a valid jQuery object

        $('.eachCntnrDiv').each((_, elem) => {  // Arrow function avoids 'self' pattern
            const container = $(elem);
            const containerKey = container.data('key');
            if (containerKey === 'Others') {
                container.css('display', 'block');
                console.log(containerKey, 'containerKeycontainerKey');
                this.drpDownSelZone = containerKey;
                container.find('.villCheck .inputVallagesCheck').each((_, checkboxElem) => {
                    const checkbox = $(checkboxElem);
                    checkboxCallback(checkbox);
                });
            } else {
                container.css('display', 'none');
            }
        });
    }

    removeAll() {
        if (!this.loadedModelTilesets || this.loadedModelTilesets.size === 0) {
            return;  // Early exit if nothing to remove
        }

        this.loadedModelTilesets.forEach((tileset, name) => {
            this.viewer!.scene.primitives.remove(tileset);
        });

        this.loadedModelTilesets.clear();
    }

    HandBBuildingsButton1Click(id: string) {
        console.log(id);
        this.toggleActive(id);
    }

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