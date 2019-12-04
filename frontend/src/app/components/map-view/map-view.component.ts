import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ReplaySubject} from 'rxjs';
import { loadModules } from 'esri-loader';
import esri = __esri; // Esri TypeScript Types

// import {MapService} from '@services/map.service';
// import {LoginService} from '@services/login.service';


@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild('mapViewDiv', { static: true }) private mapViewEl: ElementRef;

  private _zoom = 10;
  private _center: Array<number> = [0.1278, 51.5074];
  private _baseMap = 'streets';
  private _loaded = false;
  private _view: esri.MapView = null;
  private _extent;
  // mapService: MapService;

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }
  get center(): Array<number> {
    return this._center;
  }
  @Input()
  set baseMap(baseMap: string) {
    this._baseMap = baseMap;
  }
  get baseMap(): string {
    return this._baseMap;
  }

  @Input() baseMapId: ReplaySubject<string>;

  constructor(/*public loginService: LoginService*/) {
    // ToDo: Add in map service if and when Geoplatform map services need to be pulled into Sadie
    // this.mapService = new MapService(loginService.access_token);
  }

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, EsriMapView] = await loadModules([
        'esri/Map',
        'esri/views/MapView'
      ]);

      // Configure the BaseMap
      const mapProperties: esri.MapProperties = {
        basemap: this._baseMap
      };

      // Initialize the MapView
      const mapInstance: esri.Map = new EsriMap(mapProperties);
      const mapViewProperties: esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom,
        map: mapInstance
      };

      this._view = new EsriMapView(mapViewProperties);
      await this._view.when();
      return this._view;
    } catch (error) {
      console.log('EsriLoader: ', error);
    }
  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(mapView => {
      // The map has been initialized
      this._loaded = this._view.ready;
      this.mapLoadedEvent.emit(true);
    });
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }

}
