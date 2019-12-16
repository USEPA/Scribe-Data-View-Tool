import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ReplaySubject} from 'rxjs';
import {ProjectSample} from '@services/sadie-projects.service'; // Esri TypeScript Types
import { loadModules } from 'esri-loader';

// import {MapService} from '@services/map.service';
// import {LoginService} from '@services/login.service';


@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit, OnChanges, OnDestroy {
  @Output() mapFeaturesLoadedEvent = new EventEmitter<number>();

  // The <div> where we will place the map
  @ViewChild('mapViewDiv', { static: true }) private mapViewEl: ElementRef;

  private _zoom = 10;
  private _center: Array<number> = [0.1278, 51.5074];
  private _baseMap = 'streets';
  private _loaded = false;
  private _map: __esri.Map = null;
  private _view: __esri.MapView = null;
  private _extent;
  private _graphic;
  private _graphicsLayer;
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
  @Input() pointData: ProjectSample[];


  constructor(/*public loginService: LoginService*/) {
    // ToDo: Add in map service if and when Geoplatform map services need to be pulled into Sadie
    // this.mapService = new MapService(loginService.access_token);
  }

  async initializeMap() {
    const self = this;
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, EsriMapView, GraphicsLayer, Graphic, BasemapGallery, Expand] = await loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/layers/GraphicsLayer',
        'esri/Graphic',
        'esri/widgets/BasemapGallery',
        'esri/widgets/Expand'
      ]);

      // Initialize the other Esri Modules for this class
      self._graphic = Graphic;
      self._graphicsLayer = GraphicsLayer;

      // Configure the BaseMap
      const mapProperties: __esri.MapProperties = {
        basemap: this._baseMap
      };
      self._map = new EsriMap(mapProperties);

      // Initialize the MapView
      const mapInstance: __esri.Map = new EsriMap(mapProperties);
      const mapViewProperties: __esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom,
        map: mapInstance
      };
      // create map view
      this._view = new EsriMapView(mapViewProperties);
      // add ootb map widgets to view
      const basemapGalleryWidget = new BasemapGallery({
        view: this._view
      });
      const baseMapExpand = new Expand({
       expandIconClass: 'esri-icon-basemap',
       view: this._view,
       content: basemapGalleryWidget
      });
      this._view.ui.add(baseMapExpand, 'top-right');

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
      // add initial geometries to the map view
      this.addPoints(this.pointData);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._view) {
      // reload map view graphics
      this._view.graphics = null;
      this.addPoints(changes.pointData.currentValue);
    }
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }

  addPoints(pointData: any[]) {
    // Creates a graphic from existing lat/long pairs and then adds it to the map
    let pointGraphic = null;
    const pointGraphicsArray = [];
    pointData.forEach( (pt: ProjectSample) => {
      if (pt.Lat && pt.Long) {
        const point = {
          type: 'point',
          longitude: pt.Long,
          latitude: pt.Lat
        };
        // point symbology
        const markerSymbol = {
          type: 'simple-marker',
          color: [0, 128, 0],
          width: 2
        };
        pointGraphic = this._graphic({
          // @ts-ignore
          geometry: point,
          symbol: markerSymbol
        });
        pointGraphicsArray.push(pointGraphic);
      }
    });
    if (pointGraphicsArray.length > 0) {
      /*const graphicsLayer = new this._graphicsLayer({
        graphics: pointGraphicsArray
      });*/
      this._view.graphics.addMany(pointGraphicsArray);
      this._view.goTo(pointGraphicsArray);
    }
    this.mapFeaturesLoadedEvent.emit(pointGraphicsArray.length);
  }

}
