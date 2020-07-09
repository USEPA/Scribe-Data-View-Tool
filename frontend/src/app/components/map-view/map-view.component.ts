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
  ViewChild,
  AfterViewInit
} from '@angular/core';
import {ReplaySubject} from 'rxjs';
import {loadModules} from 'esri-loader';
import {CONFIG_SETTINGS} from '../../config_settings';
import {ScribeDataExplorerService} from '@services/scribe-data-explorer.service';
import {MapSymbolizationProps} from '../../projectInterfaceTypes';
import FeatureLayerType = __esri.FeatureLayer;
// import {MapService} from '@services/map.service';
// import {LoginService} from '@services/login.service';


@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Output() mapFeaturesLoadedEvent = new EventEmitter<number>();

  // The <div> where we will place the map
  @ViewChild('mapViewDiv', {static: true}) private mapViewEl: ElementRef;

  private _zoom = 10;
  private _center: Array<number> = [-122.449445, 37.762852]; // -122.449445, 37.762852
  private _baseMap = 'streets';
  public _loaded = false;
  private _map: __esri.Map = null;
  private _view: __esri.MapView = null;
  private _graphic;
  private _featureLayer;
  private _zoomToPointGraphic;
  private _point;
  private _viewPoint;
  private _mesh;
  private _homeBtn;
  private _initExtent;
  // mapService: MapService;
  private _selectedGeoPoint: any;
  private mapPointsFeatureLayer: FeatureLayerType;
  private mapPointSymbolBreaks: number = CONFIG_SETTINGS.mapPointSymbolBreaks;
  private mapPointSymbolColors = CONFIG_SETTINGS.mapPointSymbolColors;

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

  @Input()
  set selectedGeoPoint(selectedGeoPoint: any) {
    if (selectedGeoPoint) {
      this._selectedGeoPoint = selectedGeoPoint;
      // zoom to and highlight selected point
      try {
        this.zoomToPoint(selectedGeoPoint);
      } catch (error) {
        return;
      }
    }
  }

  get selectedGeoPoint(): any {
    return this._selectedGeoPoint;
  }

  @Input() baseMapId: ReplaySubject<string>;
  @Input() pointData: any[];

  constructor(public scribeDataExplorerService: ScribeDataExplorerService) {
    // ToDo: Add in map service if and when Geoplatform map services need to be pulled into the application
    // this.mapService = new MapService(loginService.access_token);
  }

  async initializeMap() {
    const self = this;
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, SceneView, FeatureLayer, Graphic, Point, Viewpoint, Mesh, Home, BasemapGallery, Expand] = await loadModules([
        'esri/Map',
        'esri/views/SceneView',
        'esri/layers/FeatureLayer',
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/Viewpoint',
        'esri/geometry/Mesh',
        'esri/widgets/Home',
        'esri/widgets/BasemapGallery',
        'esri/widgets/Expand'
      ]);

      // Initialize the graphics and geometry Esri Modules properties for this class
      self._featureLayer = FeatureLayer;
      self._graphic = Graphic;
      self._point = Point;
      self._viewPoint = Viewpoint;
      self._mesh = Mesh;
      self._homeBtn = Home;

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
        popup: {
          dockEnabled: false,
          dockOptions: {
            position: 'bottom-center',
            // Ignore the default sizes that trigger responsive docking
            breakpoint: false
          }
        },
      };
      // create map scene view
      this._view = new SceneView(sceneViewProperties);
      // add ootb map widgets to view
      this._homeBtn = new Home({
        view: this._view
      });
      this._view.ui.add(this._homeBtn, 'top-right');
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
    this._zoomToPointGraphic = null;
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(mapView => {
      // add initial geometries to the scene view
      const pointGraphicsArray = this.addPoints(this.pointData);
      this.add3dPoints(this.pointData);
      this._view.goTo(pointGraphicsArray, {animate: false});
      // The map has been initialized
      this._loaded = this._view.ready;
      // subscribe to map view events
      this._view.on('click', (event) => {
        this._view.hitTest(event).then((response) => {
          this._view.popup.open({
            location: event.mapPoint,
          });
          // Only return features for the feature layer
          const selectedFeature = response.results.filter((result) => {
           return result.graphic.layer === this.mapPointsFeatureLayer;
          })[0].graphic;
          // on map point selected / clicked, select corresponding table rows
          this.scribeDataExplorerService.mapPointSelectedSource.next(selectedFeature.attributes);
        });
      });
    });
  }

  ngAfterViewInit(): void {
    // subscribe to MDL value entered event
    this.scribeDataExplorerService.mdlValueChangedEvent.subscribe((symbolizationProps: MapSymbolizationProps) => {
      if (this._view) {
        // symbolize feature layer based on latest MDL min, max, and threshold values
        let symbologyDefinitions = [];
        if (symbolizationProps) {
          symbologyDefinitions = this.calculateThresholdSymbologyDefinitions(symbolizationProps);
          const lyrRenderer = {
            type: 'simple',
            symbol: {
              type: 'simple-marker',
              size: 7,
            },
            visualVariables: [{
              type: 'color',
              field: 'MDL',
              stops: symbologyDefinitions
            }]
          };
          this._view.map.layers.forEach((lyr: any) => {
            lyr.renderer = lyrRenderer;
          });
        } else {
          this._view.map.layers.forEach((lyr: any) => {
            lyr.renderer = null;
          });
        }
        this.scribeDataExplorerService.mapPointsSymbolizationSource.next(symbologyDefinitions);
        // ToDo: symbolize graphics based on latest renderer symbology
        /*const newGraphics = [];
        this._view.graphics.forEach((graphic: any) => {
          const newGraphic = graphic.clone();
          if (graphic.attributes.hasOwnProperty('Matrix') && graphic.attributes.hasOwnProperty('MDL')) {
            newGraphic.symbol.color = this.getSamplePointColorByMDL(graphic.attributes, symbolizationProps.threshold);
          }
          newGraphics.push(newGraphic);
        });
        this._view.graphics.removeAll();
        this._view.graphics.addMany(newGraphics);*/
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._view && changes.pointData) {
      const newPointData = changes.pointData.currentValue;
      if (newPointData.length !== changes.pointData.previousValue.length) {
        // ***IMPORTANT: Clear Map Graphics and Layers***
        this._view.graphics = null;
        this._view.map.layers = null;
        const pointGraphicsArray = this.addPoints(changes.pointData.currentValue);
        this.add3dPoints(changes.pointData.currentValue);
        this._view.goTo(pointGraphicsArray, {animate: false});
      }
    }
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }

  /*
   Creates client-side graphics and a feature layer from existing lat/long pairs and then adds it to the map
  */
  async addPoints(pointData: any[]) {
    let pointGraphic = null;
    const pointGraphicsArray = [];
    pointData.forEach((pt: any) => {
      if (pt.Latitude && pt.Longitude) {
        const point = {
          type: 'point',
          longitude: pt.Longitude,
          latitude: pt.Latitude
        };
        const symbolColor = null;
        /*if (pt.hasOwnProperty('Matrix') && pt.hasOwnProperty('MDL')) {
          symbolColor = this.getSamplePointColorByMDL(pt);
        }*/
        // Remove fields that have invalid field types for Esri map data
        delete pt.LabResultsAvailable;
        delete pt.Numeric_Tags;
        delete pt.Region_Tag_Prefix;
        const graphicSymbol = {
          type: 'simple-marker',
          color: symbolColor,
          opacity: symbolColor ? 1 : 0,
          size: 7,
        };
        pointGraphic = this._graphic({
          geometry: point,
          symbol: graphicSymbol,
          attributes: pt,
          // popupTemplate:
        });
        pointGraphicsArray.push(pointGraphic);
      }
    });
    if (pointGraphicsArray.length > 0) {
      this._view.graphics.addMany(pointGraphicsArray);
      // Create the feature layer from client-side graphics and add to map
      this.mapPointsFeatureLayer = await this.createFeatureLayerFromGraphics(pointGraphicsArray);
      this._view.map.add(this.mapPointsFeatureLayer);
      this.mapPointsFeatureLayer.when((lyrLoaded) => {
        // get and set the map extent from the feature layer extent
        this.setHomeExtentFromFl(lyrLoaded);
      });
    }
    this.mapFeaturesLoadedEvent.emit(pointGraphicsArray.length);
    return pointGraphicsArray;
  }

  createFeatureLayerFromGraphics(pointGraphicsArray: any): Promise<FeatureLayerType> {
    const lyr = new this._featureLayer({
      geometryType: 'point',
      source: pointGraphicsArray,
      objectIdField: 'ObjectID',
      fields: this.setFeatureLayerFields(this.pointData),
      outFields: ['*'],
      popupTemplate: this.setLayerPopupTemplate(this.pointData),
      renderer: {  // overrides the layer's default renderer
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          opacity: 0,
          outline: {
            width: 0.5,
            color: 'gray'
          }
        },
      },
      spatialReference: {
        wkid: 4326
      }
    });
    return lyr;
  }

  // sets home button extent
  setHomeExtentFromFl(featureLayer) {
    this._view.extent = featureLayer.fullExtent;
    const newViewPoint = new this._viewPoint({
      targetGeometry: this._view.extent,
      scale: this._view.scale
    });
    if (this._homeBtn) {
      this._homeBtn.viewpoint = newViewPoint;
    }
  }

  setLayerPopupTemplate(records: any[]) {
    let popupTemplate;
    const fieldInfos = [];
    Object.keys(records[0]).forEach((key) => {
      if (key === 'Samp_No') {
        fieldInfos.unshift({fieldName: key});
        return;
      }
      fieldInfos.push({fieldName: key});
    });
    popupTemplate = {
      title: 'Sample Point',
      content: [
        {
          type: 'fields',
          fieldInfos
        }
      ],
      alignment: 'bottom-center',
      autoOpenEnabled: false
    };
    return popupTemplate;
  }

  setFeatureLayerFields(records: any[]) {
    const fieldsArray = [];
    fieldsArray.push({
      name: 'ObjectID',
      alias: 'ObjectID',
      type: 'oid'
    });
    Object.keys(records[0]).forEach((key) => {
      let fieldType;
      const jsType = typeof (records[0][key]);
      switch (jsType) {
        case 'string':
          fieldType = 'string';
          break;
        case 'number':
          fieldType = 'double';
          break;
        case 'object':
          fieldType = 'double';
          break;
      }
      fieldsArray.push({name: key, alias: key, type: fieldType});
    });
    return fieldsArray;
  }

  add3dPoints(pointData: any[]) {
    // Creates a graphic from existing lat/long pairs and then adds it to the map
    const pointGraphicsArray = [];
    pointData.forEach((pt: any) => {
      let pointProps = null;
      let pointGeometry = null;
      let meshPointGraphic = null;
      if (pt.Latitude && pt.Longitude && pt.Sample_Depth_To) {
        // add point graphic
        pointProps = {
          type: 'point',
          longitude: pt.Longitude,
          latitude: pt.Latitude,
          z: (pt.Sample_Depth_To * -1 * 10)
        };
        // add 3d point with depth z coordinate
        pointGeometry = this._point(pointProps);
        const symbolColor = null;
        /*if (pt.hasOwnProperty('Matrix') && pt.hasOwnProperty('MDL')) {
          symbolColor = this.getSamplePointColorByMDL(pt);
        }*/
        const meshGeometry = this._mesh.createCylinder(pointGeometry, {
          size: {
            width: 5,
            depth: 5,
            height: (pt.Sample_Depth_To - pt.Sample_Depth) * 10,
          },
          material: {
            color: symbolColor
          }
        });
        // Create a graphic and add it to the view
        meshPointGraphic = this._graphic({
          geometry: meshGeometry,
          symbol: {
            type: 'mesh-3d',
            symbolLayers: [{type: 'fill'}]
          }
        });
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
    }
  }

  zoomToPoint(pointData: any) {
    this._view.graphics.remove(this._zoomToPointGraphic);
    if (pointData && pointData.Latitude && pointData.Longitude) {
      const point = {
        type: 'point',
        longitude: pointData.Longitude,
        latitude: pointData.Latitude
      };
      // highlight symbology
      const highlightSymbol = {
        type: 'simple-marker',
        size: 8,
        outline: {
          color: [21, 244, 238],
          width: 6
        }
      };
      this._zoomToPointGraphic = this._graphic({
        geometry: point,
        symbol: highlightSymbol
      });
      this._view.graphics.add(this._zoomToPointGraphic);
      this._view.zoom = 18;
      this._view.goTo(this._zoomToPointGraphic, {animate: true});
    }
  }

  getSamplePointColorByMDL(graphicProps: any, mdlValue: number = null) {
    let symbolColor = null;
    // set symbol color based on the sample point type and MDL value
    const samplePointType = graphicProps.Matrix.toLowerCase();
    if (graphicProps.MDL > 0 && graphicProps.MDL <= 10) {
      symbolColor = this.mapPointSymbolColors[samplePointType][1];
    }
    return symbolColor;
  }

  calculateThresholdSymbologyDefinitions(mapSymbolizationProps) {
    const symbologyDefinitions = [];
    // get the low and high intensity symbology stop intervals based on the min, max, and threshold values
    let cardinality: number = this.mapPointSymbolBreaks / 2;
    const lowIntensityStep = (mapSymbolizationProps.threshold - mapSymbolizationProps.min) / (cardinality - 1);
    for (let i = 0; i < cardinality; i++) {
      let symbolDefinition;
      const lowIntensityVal = +(mapSymbolizationProps.min + (lowIntensityStep * i)).toFixed(2);
      symbolDefinition = {value: lowIntensityVal, color: this.mapPointSymbolColors.soil[i], label: `<=${lowIntensityVal}`};
      symbologyDefinitions.push(symbolDefinition);
    }
    cardinality = cardinality  + 1;
    const highIntensityStep = (mapSymbolizationProps.max - mapSymbolizationProps.threshold) / (cardinality - 1);
    for (let i = 1; i < cardinality; i++) {
      let symbolDefinition;
      const highIntensityVal = +(mapSymbolizationProps.threshold + (highIntensityStep * i)).toFixed(2);
      symbolDefinition = {value: highIntensityVal, color: this.mapPointSymbolColors.soil[i + 2], label: `<=${highIntensityVal}`};
      symbologyDefinitions.push(symbolDefinition);
    }
    return symbologyDefinitions;
  }
}
