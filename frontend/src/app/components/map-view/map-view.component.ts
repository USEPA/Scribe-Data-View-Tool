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
  private _point;
  private _mesh;
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
  @Input() meshPointData: ProjectSample[];


  constructor(/*public loginService: LoginService*/) {
    // ToDo: Add in map service if and when Geoplatform map services need to be pulled into the application
    // this.mapService = new MapService(loginService.access_token);
  }

  async initializeMap() {
    const self = this;
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, SceneView, GraphicsLayer, Graphic, Point, Mesh, BasemapGallery, Expand] = await loadModules([
        'esri/Map',
        'esri/views/SceneView',
        'esri/layers/GraphicsLayer',
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/geometry/Mesh',
        'esri/widgets/BasemapGallery',
        'esri/widgets/Expand'
      ]);

      // Initialize the graphics and geometry Esri Modules properties for this class
      self._graphicsLayer = GraphicsLayer;
      self._graphic = Graphic;
      self._point = Point;
      self._mesh = Mesh;

      // Configure the BaseMap
      const mapProperties: __esri.MapProperties = {
        basemap: this._baseMap,
        ground: {
          navigationConstraint: {
            type: 'none'
          }
        }
      };
      self._map = new EsriMap(mapProperties);

      // Initialize the MapView
      const mapInstance: __esri.Map = new EsriMap(mapProperties);
      const sceneViewProperties: __esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        map: mapInstance,
        center: this._center,
        zoom: this._zoom
      };
      // create map scene view
      this._view = new SceneView({
        container: this.mapViewEl.nativeElement,
        map: mapInstance,
        viewingMode: 'local',
      });
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
      // add initial geometries to the scene view
      this.add3dMeshPoints(this.meshPointData);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._view) {
      // reload map view graphics
      this._view.graphics = null;
      this.add3dMeshPoints(changes.meshPointData.currentValue);
    }
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }

  add3dMeshPoints(meshPointData: any[]) {
    // Creates a graphic from existing lat/long pairs and then adds it to the map
    const pointGraphicsArray = [];
    meshPointData.forEach( (pt: ProjectSample) => {
      let pointGraphic = null;
      let pointGeometry = null;
      let meshPointGraphic = null;
      if (pt.Lat && pt.Long) {
        // point graphic
        const pointProps = {
          type: 'point',
          longitude: pt.Long,
          latitude: pt.Lat
        };
        pointGeometry = this._point(pointProps);
        const markerSymbol = {
          type: 'simple-marker',
          color: [0, 128, 0],
          width: 2
        };
        pointGraphic = this._graphic({
          // @ts-ignore
          geometry: pointProps,
          symbol: markerSymbol
        });
        if (pointGeometry && (pt.Sample_Depth || pt.Sample_Depth_To)) {
          // Mesh point geometry
          const meshGeometry = this._mesh.createCylinder(pointGeometry, {
            size: {
              width: 2,
              height: pt.Sample_Depth,
              depth: pt.Sample_Depth
            },
            material: {
              color: 'green'
            }
          });
          // Create a graphic and add it to the view
          meshPointGraphic = this._graphic({
            geometry: meshGeometry,
            symbol: {
              type: 'mesh-3d',
              symbolLayers: [ { type: 'fill' } ]
            }
          });
        }
        pointGraphicsArray.push(meshPointGraphic);
      }
    });
    if (pointGraphicsArray.length > 0) {
      /*const graphicsLayer = new this._graphicsLayer({
        graphics: pointGraphicsArray,
        elevationInfo: {
          mode: 'relative-to-ground'
        }
      });
      this._map.add(graphicsLayer);*/
      this._view.graphics.addMany(pointGraphicsArray);
      this._view.goTo(pointGraphicsArray, {animate: false});
    }
    this.mapFeaturesLoadedEvent.emit(pointGraphicsArray.length);
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
