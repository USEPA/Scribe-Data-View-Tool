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

import {environment} from '@environments/environment';
import {CONFIG_SETTINGS} from '../../config_settings';
import {MapSymbolizationProps} from '../../projectInterfaceTypes';
import FeatureLayer from 'esri/layers/FeatureLayer';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import SketchViewModel from 'esri/widgets/Sketch/SketchViewModel';
import Map from 'esri/Map';
import esriConfig from 'esri/config';
import urlUtils from 'esri/core/urlUtils';
import Layer from 'esri/layers/Layer';
import Graphic from 'esri/Graphic';
import ViewPoint from 'esri/Viewpoint';
import Point from 'esri/geometry/Point';
import Home from 'esri/widgets/Home';
import Mesh from 'esri/geometry/Mesh';
import SceneView from 'esri/views/SceneView';
import BasemapGallery from 'esri/widgets/BasemapGallery';
import Expand from 'esri/widgets/Expand';
import SimpleRenderer from 'esri/renderers/SimpleRenderer';
import SimpleMarkerSymbol from 'esri/symbols/SimpleMarkerSymbol';
import MeshSymbol3D from 'esri/symbols/MeshSymbol3D';
import MeshMaterial from 'esri/geometry/support/MeshMaterial';
import Color from 'esri/Color';
import {LoginService} from '../../auth/login.service';
import {ScribeDataExplorerService} from '@services/scribe-data-explorer.service';

// import {MapService} from '@services/map.service';


@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() mapDivId = 'mapViewDiv';
  @Output() mapFeaturesLoadedEvent = new EventEmitter<number>();

  // The <div> where we will place the map
  @ViewChild('mapViewDiv', {static: true}) private mapViewEl: ElementRef;

  mapViewLoaded = false;
  private _zoom = 10;
  private _center: Array<number> = [-122.449445, 37.762852]; // -122.449445, 37.762852
  private _baseMap = 'streets';
  private _map: __esri.Map;
  private _view: __esri.SceneView;
  private _zoomToPointGraphic: __esri.Graphic;
  private _homeBtn: __esri.Home;

  // mapService: MapService;
  private mapPointSymbolBreaks: number = CONFIG_SETTINGS.mapPointSymbolBreaks;
  private mapPointSymbolColors = CONFIG_SETTINGS.mapPointSymbolColors;
  mapPointsFeatureLayer: FeatureLayer;
  scribeProjectsFeatureLyr: FeatureLayer;
  mapPointsFeatureLayerHighlight;
  polygonSelectionGraphicsLayer: GraphicsLayer;
  pointSelectionSketchViewModel: SketchViewModel;

  private _selectedGeoPoint: any;

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

  @Input() portalLayerServiceUrls: string[];
  @Input() pointData: any[];

  constructor(public loginService: LoginService, public scribeDataExplorerService: ScribeDataExplorerService) {
    // this.mapService = new MapService(loginService.access_token);
  }

  initializeMap() {
    esriConfig.request.trustedServers.push(environment.agol_trusted_server);
    esriConfig.request.proxyRules.push({
      urlPrefix: environment.agol_proxy_url_prefix,
      proxyUrl: environment.agol_proxy_url
    });

    // Initialize the Esri Modules properties for this map component class

    // Configure the BaseMap
    const mapProperties: __esri.MapProperties = {
      basemap: this._baseMap,
      ground: {
        navigationConstraint: {
          type: 'none'
        }
      }
    };
    this._map = new Map(mapProperties);
    this.mapViewEl.nativeElement.id = this.mapDivId;

    // Initialize the SceneView
    const sceneViewProperties: __esri.SceneViewProperties = {
      container: this.mapViewEl.nativeElement,
      map: this._map,
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

    return this._view.when((loadedView) => {
      // resolve();
      return loadedView;
    }, error => {
      console.log(error);
    });

    // } catch (error) {
    //   console.log('EsriLoader: ', error);
    // }
  }

  ngOnInit() {
    this._zoomToPointGraphic = null;
    document.getElementById('select-by-polygon').style.visibility = 'hidden';

    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(mapView => {
      // add initial geometries to the scene view
      if (this.pointData) {
        const pointGraphicsArray = this.addPoints(this.pointData);
        this.add3dPoints(this.pointData);
        this._view.goTo(pointGraphicsArray, {animate: false});
      }
      // The map has been initialized
      this.mapViewLoaded = this._view.ready;
      // load any portal layers from input prop
      if (this.portalLayerServiceUrls) {
        this.loadPortalLayers(this.portalLayerServiceUrls);
      }

      // subscribe to map view events
      this._view.on('click', (event) => {
        this._view.hitTest(event).then((response) => {
          this._view.popup.open({
            location: event.mapPoint,
          });
          if (response.results.length > 0) {
            let selectedGraphic = response.results[0].graphic;
            if (selectedGraphic.attributes && 'PROJECTID' in selectedGraphic.attributes) {
              // on project centroid point selected / clicked, go to that project
              this.scribeDataExplorerService.projectCentroidsSelectedSource.next([selectedGraphic.attributes]);
            } else {
              // Only return selected map point graphic from the click event results
              selectedGraphic = response.results.filter((result) => {
                return result.graphic.layer === this.mapPointsFeatureLayer;
              })[0].graphic;
              // on map point selected / clicked, select corresponding table rows
              this.scribeDataExplorerService.mapPointSelectedSource.next(selectedGraphic.attributes);
            }
          }
        });
      });
      // create a new sketchviewmodel and set its properties
      // set up the click event for the select by polygon button
      this.setupPointSelectionSketchViewModel();
    });
  }

  ngAfterViewInit(): void {
    // subscribe to clear map selection event to clear highlight and reset row data
    this.scribeDataExplorerService.clearMapSelectionEvent.subscribe((clear) => {
      if (clear) {
        if (this.mapPointsFeatureLayerHighlight) {
          this.mapPointsFeatureLayerHighlight.remove();
        }
        if (this._view) {
          if (this._zoomToPointGraphic) {
            this._view.graphics.remove(this._zoomToPointGraphic);
          }
          this._view.popup.close();
        }
        this.scribeDataExplorerService.mapPointsSelectedSource.next(null);
      }
    });
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
            lyr.outFields = ['*']; // REQUIRED for querying the layer attributes
            lyr.renderer = lyrRenderer;
          });
        } else {
          // reset renderer
          const lyrRenderer = {
            type: 'simple',
            symbol: {
              type: 'simple-marker',
              size: 7,
            }
          };
          this._view.map.layers.forEach((lyr: any) => {
            lyr.outFields = ['*']; // REQUIRED for querying the layer attributes
            lyr.renderer = lyrRenderer;
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
        if (changes.pointData.currentValue) {
          const pointGraphicsArray = this.addPoints(changes.pointData.currentValue);
          this.add3dPoints(changes.pointData.currentValue);
          this._view.goTo(pointGraphicsArray, {animate: false});
        }
      }
    }
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }

  async loadPortalLayers(portalLyrServiceUrls) {
    const portalLayers: __esri.Layer[] = await Promise.all(portalLyrServiceUrls.map(async (portalItemId) => {
      return Layer.fromArcGISServerUrl({
        url: 'https://utility.arcgis.com/usrsvcs/servers/add9432d507146e7abf3351efa097b99/rest/services/R9GIS/R9ScribeData/MapServer'
      } as unknown as __esri.LayerFromArcGISServerUrlParams).then((portalLyr) => {
        portalLyr.load().then((loadedPortalLyr) => {
          // const portalLyrSubLayers = loadedPortalLyr.createServiceSublayers();
          const scribeProjectsSubLyr = portalLyr.sublayers.find((sublayer) => {
            return sublayer.title === 'Scribe Projects';
          });
          if (scribeProjectsSubLyr) {
            scribeProjectsSubLyr.createFeatureLayer().then((featureLayer) => {
              featureLayer.outFields = ['*']; // REQUIRED for querying the layer attributes
              featureLayer.load().then((loadedFeatureLyr) => {
                this.scribeProjectsFeatureLyr = loadedFeatureLyr;
                this._view.map.add(this.scribeProjectsFeatureLyr);
              });
            });
          }
        });
      }).catch((error) => {
        console.log(error);
      });
    }));
    // console.log(this._map.allLayers);
  }

  /*
   Creates client-side graphics and a feature layer from existing lat/long pairs and then adds it to the map
  */
  async addPoints(pointData: any[]) {
    let pointGraphic = null;
    const pointGraphicsArray = [];
    pointData.forEach((pt: any) => {
      if (pt.Latitude && pt.Longitude) {
        const point = new Point({
          longitude: pt.Longitude,
          latitude: pt.Latitude
        });
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
        // @ts-ignore
        pointGraphic = new Graphic({
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

  createFeatureLayerFromGraphics(pointGraphicsArray: any): __esri.FeatureLayer {
    const renderer = new SimpleRenderer({  // overrides the layer's default renderer
      symbol: new SimpleMarkerSymbol({size: 7})
    });
    return new FeatureLayer({
      geometryType: 'point',
      source: pointGraphicsArray,
      objectIdField: 'ObjectID',
      fields: this.setFeatureLayerFields(this.pointData),
      outFields: ['*'], // REQUIRED for querying the layer attributes
      popupTemplate: this.setLayerPopupTemplate(this.pointData),
      renderer,
      spatialReference: {
        wkid: 4326
      }
    });
  }

  // sets home button extent
  setHomeExtentFromFl(featureLayer) {
    this._view.extent = featureLayer.fullExtent;
    const newViewPoint = new ViewPoint({
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
        pointGeometry = new Point(pointProps);
        // const symbolColor = null;
        /*if (pt.hasOwnProperty('Matrix') && pt.hasOwnProperty('MDL')) {
          symbolColor = this.getSamplePointColorByMDL(pt);
        }*/
        const meshGeometry = Mesh.createCylinder(pointGeometry, {
          size: {
            width: 5,
            depth: 5,
            height: (pt.Sample_Depth_To - pt.Sample_Depth) * 10,
          },
          material: new MeshMaterial()
        });
        // Create a graphic and add it to the view
        meshPointGraphic = new Graphic({
          geometry: meshGeometry,
          symbol: new MeshSymbol3D({
            symbolLayers: [{type: 'fill'}]
          })
        });
        pointGraphicsArray.push(meshPointGraphic);
      }
    });
    if (pointGraphicsArray.length > 0) {
      /*const graphicsLayer = new GraphicsLayer({
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
      const point = new Point({
        longitude: pointData.Longitude,
        latitude: pointData.Latitude
      });
      // highlight symbology
      const highlightSymbol = new SimpleMarkerSymbol({
        size: 8,
        outline: {
          color: [21, 244, 238],
          width: 6
        }
      });
      this._zoomToPointGraphic = new Graphic({
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
    const sampleType = mapSymbolizationProps.sampleType;
    // get the low and high intensity symbology stop intervals based on the min, max, and threshold values
    let cardinality: number = this.mapPointSymbolBreaks / 2;
    const lowIntensityStep = (mapSymbolizationProps.threshold - mapSymbolizationProps.min) / (cardinality - 1);
    for (let i = 0; i < cardinality; i++) {
      let symbolDefinition;
      const lowIntensityVal = +(mapSymbolizationProps.min + (lowIntensityStep * i)).toFixed(2);
      symbolDefinition = {
        value: lowIntensityVal,
        color: this.mapPointSymbolColors[sampleType][i],
        label: `<=${lowIntensityVal}`
      };
      symbologyDefinitions.push(symbolDefinition);
    }
    cardinality = cardinality + 1;
    const highIntensityStep = (mapSymbolizationProps.max - mapSymbolizationProps.threshold) / (cardinality - 1);
    for (let i = 1; i < cardinality; i++) {
      let symbolDefinition;
      const highIntensityVal = +(mapSymbolizationProps.threshold + (highIntensityStep * i)).toFixed(2);
      symbolDefinition = {
        value: highIntensityVal,
        color: this.mapPointSymbolColors[sampleType][i + 2],
        label: `<=${highIntensityVal}`
      };
      symbologyDefinitions.push(symbolDefinition);
    }
    return symbologyDefinitions;
  }

  setupPointSelectionSketchViewModel() {
    // define polygon graphics layer used to draw a sketch view model and to query features / map points that intersect it
    this.polygonSelectionGraphicsLayer = new GraphicsLayer();
    this._map.add(this.polygonSelectionGraphicsLayer);
    // create a new sketch view model set with the polygon graphics layer
    this.pointSelectionSketchViewModel = new SketchViewModel({
      view: this._view,
      layer: this.polygonSelectionGraphicsLayer,
      pointSymbol: {
        type: 'simple-marker',
        color: [255, 255, 255, 0],
        size: '2px',
        outline: {
          color: [21, 244, 238],
          width: 6
        }
      }
    });

    // add the select by polygon button to the view and create event listener
    this._view.ui.add('select-by-polygon', 'top-left');
    const selectButton = document.getElementById('select-by-polygon');
    selectButton.addEventListener('click', (event) => {
      this._view.popup.close();
      // enable drawing the polygon
      if (this.pointSelectionSketchViewModel.state !== 'active') {
        this.pointSelectionSketchViewModel.create('polygon');
      } else {
        this.pointSelectionSketchViewModel.cancel();
      }
    });
    selectButton.style.visibility = 'visible';

    this.pointSelectionSketchViewModel.on('create', (event) => {
      if (event.state === 'complete') {
        this.polygonSelectionGraphicsLayer.remove(event.graphic);
        this.selectPointFeatures(event.graphic.geometry);
      }
    });
  }

  selectPointFeatures(geometry) {
    // create a query and set its geometry parameter to the polygon that was drawn on the view
    const query = {
      geometry,
      outFields: ['*'] // REQUIRED for querying the layer attributes
    };
    let queryFeatureLayer = null;
    if (this.mapPointsFeatureLayer) {
      queryFeatureLayer = this.mapPointsFeatureLayer;
    } else if (this.scribeProjectsFeatureLyr) {
      queryFeatureLayer = this.scribeProjectsFeatureLyr;
    }
    if (queryFeatureLayer) {
      // query mapPointsFeatureLayer. Geometry set for the query, so only intersecting geometries are returned
      queryFeatureLayer.queryFeatures(query).then((results) => {
        const graphics = results.features;
        if (graphics.length > 0) {
          // zoom to the extent of the polygon with factor 2
          this._view.goTo(geometry.extent.expand(2)).catch((error) => {
            if (error.name !== 'AbortError') {
              console.error('Error selecting map points: ' + error);
            }
          });
          // remove existing highlighted map point
          if (this._zoomToPointGraphic) {
            this._view.graphics.remove(this._zoomToPointGraphic);
          }
          // highlight the selected features
          this._view.whenLayerView(queryFeatureLayer).then((layerView: __esri.FeatureLayerView) => {
            if (this.mapPointsFeatureLayerHighlight) {
              this.mapPointsFeatureLayerHighlight.remove();
            }
            this.mapPointsFeatureLayerHighlight = layerView.highlight(graphics);
          });
          // get the attributes of map points
          const pointsAttributeData = [];
          graphics.map((feature, i) => {
            pointsAttributeData.push(feature.attributes);
          });
          if (this.mapPointsFeatureLayer) {
            // on map points selected, filter them in corresponding table rows
            this.scribeDataExplorerService.mapPointsSelectedSource.next(pointsAttributeData);
          } else if (this.scribeProjectsFeatureLyr) {
            // on project centroid points selected, go to that project
            this.scribeDataExplorerService.projectCentroidsSelectedSource.next(pointsAttributeData);
          }
        }
      }).catch((error) => {
        console.error('Error selecting map points: ' + error);
      });
    }
  }

}
