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
import {ReplaySubject, Subject} from 'rxjs';


import {environment} from '@environments/environment';
import {CONFIG_SETTINGS} from '../../config_settings';
import {LoginService} from '../../auth/login.service';
import {ScribeDataExplorerService} from '@services/scribe-data-explorer.service';
import SceneView from '@arcgis/core/views/SceneView';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import histogram from '@arcgis/core/smartMapping/statistics/histogram';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import MeshMaterial from '@arcgis/core/geometry/support/MeshMaterial';
import Expand from '@arcgis/core/widgets/Expand';
import MeshSymbol3D from '@arcgis/core/symbols/MeshSymbol3D';
import ColorSlider from '@arcgis/core/widgets/smartMapping/ColorSlider';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import Home from '@arcgis/core/widgets/Home';
import Map from '@arcgis/core/Map';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import esriConfig from '@arcgis/core/config';
import Mesh from '@arcgis/core/geometry/Mesh';
import ViewPoint from '@arcgis/core/Viewpoint';
import Layer from '@arcgis/core/layers/Layer';
import {createContinuousRenderer} from '@arcgis/core/smartMapping/renderers/color';
import Fullscreen from '@arcgis/core/widgets/Fullscreen';
import FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView';
import MapProperties = __esri.MapProperties;
import LayerFromArcGISServerUrlParams = __esri.LayerFromArcGISServerUrlParams;
import Handle = __esri.Handle;
import {isEqual} from 'lodash';
import FillSymbol3DLayerProperties = __esri.FillSymbol3DLayerProperties;
import Color from '@arcgis/core/Color';
import ObjectSymbol3DLayer from '@arcgis/core/symbols/ObjectSymbol3DLayer';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D';
import SymbolProperties = __esri.SymbolProperties;
import colorCreateContinuousRendererParams = __esri.colorCreateContinuousRendererParams;
import {fromPromise} from "rxjs/internal-compatibility";
import {map, switchMap, tap} from "rxjs/operators";
import SimpleRendererProperties = __esri.SimpleRendererProperties;
import VisualVariableProperties = __esri.VisualVariableProperties;

// import {MapService} from '@services/map.service';


@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit, OnChanges, OnDestroy {
  // @Input() mapDivId = 'mapViewDiv';
  @Output() mapFeaturesLoadedEvent = new EventEmitter<number>();

  @Input() selectedFeatures: any[];
  @Output() selectedFeaturesChange: EventEmitter<any[]> = new EventEmitter<any[]>();

  @Input() analyte: string;
  @Input() portalLayerServiceUrls: string[];
  @Input() pointData: any[];

  @Input()
  set baseMap(baseMap: string) {
    this._baseMap = baseMap;
  }

  get baseMap(): string {
    return this._baseMap;
  }

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }

  get center(): Array<number> {
    return this._center;
  }

  // The <div> where we will place the map
  @ViewChild('mapViewDiv', {static: true}) private mapViewEl: ElementRef;

  mapViewLoaded = false;
  private _zoom = 10;
  private _center: Array<number> = [-122.449445, 37.762852]; // -122.449445, 37.762852
  private _baseMap = 'dark-gray-vector';
  private _map: Map;
  private _view: SceneView;
  private _zoomToPointGraphic: Graphic;
  private _homeBtn: Home;
  private highlight: Handle;
  private highlight3d: Handle;

  // mapService: MapService;
  private mapPointSymbolBreaks: number = CONFIG_SETTINGS.mapPointSymbolBreaks;
  private mapPointSymbolColors = CONFIG_SETTINGS.mapPointSymbolColors;
  mapPointsFeatureLayer: FeatureLayer;
  scribeProjectsFeatureLyr: FeatureLayer;
  mapPointsFeatureLayerHighlight;
  polygonSelectionGraphicsLayer: GraphicsLayer;
  pointSelectionSketchViewModel: SketchViewModel;


  base3DRRenderer = new SimpleRenderer({
    symbol: {
      type: 'point-3d',
      symbolLayers: [{
        type: 'object',
        resource: {primitive: 'cylinder'},
        material: {color: 'white'}
      }]
    } as SymbolProperties,
    visualVariables: [
      {
        type: 'size',
        field: 'height',
        axis: 'height',
      } as VisualVariableProperties,
      {
        type: 'size',
        field: 'width',
        axis: 'width',
      },
      {
        type: 'size',
        field: 'depth',
        axis: 'depth',
      }
    ]
  } as SimpleRendererProperties);

  basePointRender = new SimpleRenderer({
    symbol: {
      type: 'simple-marker',
      color: 'white',
      size: '8px',  // pixels
    } as SymbolProperties
  });

  private _pointDataSubject: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);


  // @Input()
  // set selectedGeoPoint(selectedGeoPoint: any) {
  //   if (selectedGeoPoint) {
  //     this._selectedGeoPoint = selectedGeoPoint;
  //     // zoom to and highlight selected point
  //     try {
  //       this.zoomToPoint(selectedGeoPoint);
  //     } catch (error) {
  //       return;
  //     }
  //   }
  // }

  // get selectedGeoPoint(): any {
  //   return this._selectedGeoPoint;
  // }


  private layer3d: FeatureLayer;
  private colorSlider: ColorSlider;
  public hideColorSlider = true;

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
    const mapProperties: MapProperties = {
      basemap: this._baseMap,
      ground: {
        navigationConstraint: {
          type: 'none'
        }
      }
    };
    this._map = new Map(mapProperties);
    // this.mapViewEl.nativeElement.id = this.mapDivId;

    // create map scene view
    this._view = new SceneView({
      container: this.mapViewEl.nativeElement,
      map: this._map,
      // center: this._center,
      zoom: 4,
      popup: {
        autoOpenEnabled: false
      },
      viewingMode: 'local',
      camera: {
        tilt: 0
      }
      // popup: {
      //   dockEnabled: false,
      //   dockOptions: {
      //     position: 'bottom-center',
      //     // Ignore the default sizes that trigger responsive docking
      //     breakpoint: false
      //   }
      // },
    });
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

    const fullscreen = new Fullscreen({
      view: this._view
    });
    this._view.ui.add(fullscreen, 'top-right');

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
    fromPromise(this.initializeMap()).pipe(
      tap(() => {
        // The map has been initialized
        this.mapViewLoaded = this._view.ready;
        // load any portal layers from input prop
        if (this.portalLayerServiceUrls) {
          this.loadPortalLayers(this.portalLayerServiceUrls);
        }

        this.setupHitTest();
        // create a new sketchviewmodel and set its properties
        // set up the click event for the select by polygon button
        this.setupPointSelectionSketchViewModel();
      }),
      switchMap(() => this._pointDataSubject),
      tap(pointData => {
        // ***IMPORTANT: Clear Map Graphics and Layers***
        this._view.graphics.removeAll();
        this._view.map.removeAll();
        const pointsLayer = this.addPoints(pointData) as FeatureLayer;
        // this.setRenderer(pointGraphicsArray);
        this.layer3d = this.add3dPoints(pointData);
        this.layer3d.queryFeatureCount({where: '1=1'}).then(r => console.log(r));
        this.setRenderer([
          {layer: this.layer3d, baseRenderer: this.base3DRRenderer},
          {layer: pointsLayer, baseRenderer: this.basePointRender}
        ]);
        pointsLayer.queryExtent({where: '1=1'}).then(e => {
          this._view.goTo(e.extent, {animate: false});
        });
      })
    ).subscribe();

    // add initial geometries to the scene view
    if (this.pointData) {
      this._pointDataSubject.next(this.pointData);
    }

  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._view) {

      if (changes.pointData || (changes.analyte && changes.analyte.currentValue !== changes.analyte.previousValue)) {

        if (changes.pointData && changes.pointData.currentValue) {
          this._pointDataSubject.next(changes.pointData.currentValue);
          // const pointGraphicsArray = this.addPoints(changes.pointData.currentValue);
          // this.layer3d = this.add3dPoints(changes.pointData.currentValue);
          // this._view.goTo(pointGraphicsArray, {animate: false});
        }
        // this.setRenderer(this.layer3d);
      }
      // if (changes.analyte && changes.analyte.currentValue !== changes.analyte.previousValue) {
      //   this.setRenderer(this.layer3d);
      // }
      if (changes.selectedFeatures && changes.selectedFeatures.currentValue !== changes.selectedFeatures.previousValue) {
        this.highlightSelectedFeature(changes.selectedFeatures.currentValue);
      }

    }
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }

  highlightSelectedFeature(selectedFeatures) {
    if (this.mapPointsFeatureLayerHighlight) {
      this.mapPointsFeatureLayerHighlight.remove();
    }
    if (this._zoomToPointGraphic) {
      this._view.graphics.remove(this._zoomToPointGraphic);
    }
    if (selectedFeatures) {
      this.zoomToPoint(selectedFeatures);
    }
  }

  setupHitTest() {
    // subscribe to map view events
    this._view.on('click', (event) => {
      this._view.hitTest(event).then((response) => {
        // this._view.popup.open({
        //   location: event.mapPoint,
        // });
        if (response.results.length > 0) {
          if (response.results[0].type === 'graphic') {
            this.selectedFeaturesChange.emit([response.results[0].graphic.attributes.Samp_No]);
          }
          // if (selectedGraphic.attributes && 'PROJECTID' in selectedGraphic.attributes) {
          //   // on project centroid point selected / clicked, go to that project
          //
          //   this.scribeDataExplorerService.projectCentroidsSelectedSource.next([selectedGraphic.attributes]);
          // } else {
          //   // Only return selected map point graphic from the click event results
          //   // selectedGraphic = response.results.filter((result) => {
          //   //   return result.graphic.layer === this.mapPointsFeatureLayer;
          //   // })[0].graphic;
          //   // on map point selected / clicked, select corresponding table rows
          //   this.scribeDataExplorerService.mapPointSelectedSource.next(selectedGraphic.attributes);
          // }
        }
      });
    });
  }

  async loadPortalLayers(portalLyrServiceUrls) {
    const portalLayers: Layer[] = await Promise.all(portalLyrServiceUrls.map(async (portalItemId) => {
      return Layer.fromArcGISServerUrl({
        url: 'https://utility.arcgis.com/usrsvcs/servers/add9432d507146e7abf3351efa097b99/rest/services/R9GIS/R9ScribeData/MapServer'
      } as unknown as LayerFromArcGISServerUrlParams).then((portalLyr) => {
        portalLyr.load().then((loadedPortalLyr) => {
          // const portalLyrSubLayers = loadedPortalLyr.createServiceSublayers();
          // @ts-ignore
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
  addPoints(pointData: any[]) {
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
          color: null,
          size: 7,
        };
        // @ts-ignore
        pointGraphic = new Graphic({
          geometry: point,
          symbol: graphicSymbol as SimpleMarkerSymbol,
          attributes: pt,
          // popupTemplate:
        });
        pointGraphicsArray.push(pointGraphic);
      }
    });
    if (pointGraphicsArray.length > 0) {
      // this._view.graphics.addMany(pointGraphicsArray);
      // Create the feature layer from client-side graphics and add to map... why here at all?
      const mapPointsFeatureLayer = this.createFeatureLayerFromGraphics(pointGraphicsArray, 'point', null, this.basePointRender);
      this._view.map.add(mapPointsFeatureLayer);
      return mapPointsFeatureLayer;
      // this.mapPointsFeatureLayer.when((lyrLoaded) => {
      // get and set the map extent from the feature layer extent
      // this.setHomeExtentFromFl(lyrLoaded);
      // });
    }
    this.mapFeaturesLoadedEvent.emit(pointGraphicsArray.length);
    return pointGraphicsArray;
  }

  createFeatureLayerFromGraphics(pointGraphicsArray: any, geometryType: 'polygon' | 'polyline' | 'point' | 'multipoint' | 'multipatch' | 'mesh' = 'point',
                                 elevationInfo = null, renderer: SimpleRenderer = new SimpleRenderer()): FeatureLayer {
    // const _symbol = {
    //   type: 'point-3d',
    //   symbolLayers: [{
    //     type: 'object',
    //     resource: {primitive: 'cylinder'},
    //     material: {color: 'white'}
    //   }]
    // } as SymbolProperties;
    // const visualVariables = [{
    //   type: 'size',
    //   field: 'height',
    //   axis: 'height',
    // },
    //   {
    //     type: 'size',
    //     field: 'width',
    //     axis: 'width',
    //   },
    //   {
    //     type: 'size',
    //     field: 'depth',
    //     axis: 'depth',
    //   }];
    // const renderer = new SimpleRenderer({  // overrides the layer's default renderer
    //   symbol,
    //   visualVariables: this.visualVariables
    // });
    return new FeatureLayer({
      geometryType,
      source: pointGraphicsArray,
      objectIdField: 'ObjectID',
      fields: this.setFeatureLayerFields(this.pointData),
      outFields: ['*'], // REQUIRED for querying the layer attributes
      // popupTemplate: this.setLayerPopupTemplate(this.pointData),
      renderer,
      spatialReference: {
        wkid: 4326
      },
      elevationInfo
    });
  }

  // sets home button extent
  setHomeExtentFromFl(featureLayer) {
    // this._view.extent = featureLayer.fullExtent;
    const newViewPoint = new ViewPoint({
      targetGeometry: featureLayer.fullExtent,
      scale: this._view.scale
    });
    if (this._homeBtn) {
      this._homeBtn.viewpoint = newViewPoint;
    }
  }

  // setLayerPopupTemplate(records: any[]) {
  //   let popupTemplate;
  //   const fieldInfos = [];
  //   Object.keys(records[0]).forEach((key) => {
  //     if (key === 'Samp_No') {
  //       fieldInfos.unshift({fieldName: key});
  //       return;
  //     }
  //     fieldInfos.push({fieldName: key});
  //   });
  //   popupTemplate = {
  //     title: 'Sample Point',
  //     content: [
  //       {
  //         type: 'fields',
  //         fieldInfos
  //       }
  //     ],
  //     alignment: 'bottom-center',
  //     autoOpenEnabled: false
  //   };
  //   return popupTemplate;
  // }

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
      const pointGeometry = null;
      const meshPointGraphic = null;
      if (pt.Latitude && pt.Longitude && pt.Samp_Depth_To) {
        pt.height = (pt.Samp_Depth_To - pt.Samp_Depth) * 10 + 0.01;
        pt.width = 10;
        pt.depth = 10;
        // add point graphic
        // const pointProps = {
        //   longitude: pt.Longitude,
        //   latitude: pt.Latitude,
        //   z: (pt.Samp_Depth_To * -1 * 10)
        // };
        // add 3d point with depth z coordinate
        // geometry = new Point(pointProps);
        // const symbolColor = null;
        /*if (pt.hasOwnProperty('Matrix') && pt.hasOwnProperty('MDL')) {
          symbolColor = this.getSamplePointColorByMDL(pt);
        }*/
        // const meshGeometry = Mesh.createCylinder(pointGeometry, {
        //   size: {
        //     width: 10,
        //     depth: 10,
        //     height: (pt.Samp_Depth_To - pt.Samp_Depth) * 10 + 0.1,
        //   },
        //   material: new MeshMaterial()
        // });
        const geometry = {
          type: 'point',
          longitude: pt.Longitude,
          latitude: pt.Latitude,
          z: (pt.Samp_Depth_To * -1 * 10)
        } as Point;
        // const symbol = {
        //   type: 'point-3d',
        //   symbolLayers: [{
        //     type: 'object',
        //     width: 10,
        //     depth: 10,
        //     height: (pt.Samp_Depth_To - pt.Samp_Depth) * 10 + 0.1,
        //     material: {color: 'grey'}
        //   }]
        // } as SymbolProperties;
        // Create a graphic and add it to the view
        delete pt.LabResultsAvailable;
        delete pt.Numeric_Tags;
        delete pt.Region_Tag_Prefix;
        const pointGraphic = new Graphic({
          geometry,
          attributes: pt
        });
        // meshPointGraphic = new Graphic({
        //   geometry: meshGeometry,
        //   symbol: new MeshSymbol3D({
        //     symbolLayers: [{
        //       type: 'fill'
        //     } as FillSymbol3DLayerProperties]
        //   }),
        //   attributes: pt
        // });
        pointGraphicsArray.push(pointGraphic);
      }
    });
    if (pointGraphicsArray.length > 0) {
      // const graphicsLayer = new GraphicsLayer({
      //   graphics: pointGraphicsArray,
      //   elevationInfo: {
      //     mode: 'relative-to-ground'
      //   }
      // });
      // this._view.map.add(graphicsLayer);
      // this._view.graphics.addMany(pointGraphicsArray);

      const newLayer = this.createFeatureLayerFromGraphics(
        pointGraphicsArray,
        'point',
        {
          mode: 'relative-to-ground'
        },
        this.base3DRRenderer
      );
      this._view.map.add(newLayer);
      // this._view.goTo(pointGraphicsArray);
      return newLayer;
    }
  }

  zoomToPoint(sampNos: string[]) {
    // this._view.graphics.removeAll();
    // const selectedPoints = sampNos.map(y => {
    //   const pointData = this.pointData.find(x => x.Samp_No === y);
    //   if (pointData && pointData.Latitude && pointData.Longitude) {
    //     const point = new Point({
    //       longitude: pointData.Longitude,
    //       latitude: pointData.Latitude
    //     });
    //     // highlight symbology
    //     const highlightSymbol = new SimpleMarkerSymbol({
    //       size: 8,
    //       outline: {
    //         color: [21, 244, 238],
    //         width: 6
    //       }
    //     });
    //     const g = new Graphic({
    //       geometry: point,g
    //       symbol: highlightSymbol
    //     });
    //     this._view.graphics.add(g);
    //     return g;
    //   }
    // });
    // this._view.zoom = 18;
    // this._view.goTo(selectedPoints, {animate: true});
    // if 3d layer exists highlight it
    if (this.layer3d) {
      this._view.whenLayerView(this.layer3d).then((layerView) => {
        const query = this.layer3d.createQuery();
        query.where = `Samp_no IN ('${sampNos.join('\',\'')}')`;
        this.layer3d.queryFeatures(query).then((result) => {
          if (this.highlight3d) {
            this.highlight3d.remove();
          }
          this.highlight3d = layerView.highlight(result.features);
          this._view.goTo(result.features, {animate: true});
        });
      });
    }
    // highlight point layer and zoom
    this._view.whenLayerView(this.mapPointsFeatureLayer).then((layerView) => {
      const query = this.mapPointsFeatureLayer.createQuery();
      query.where = `Samp_no IN ('${sampNos.join('\',\'')}')`;
      this.mapPointsFeatureLayer.queryFeatures(query).then((result) => {
        if (this.highlight) {
          this.highlight.remove();
        }
        this.highlight = layerView.highlight(result.features);
        this._view.goTo(result.features, {animate: true});
      });
    });

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
      // this._view.popup.close();
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
    const queryFeatureLayer = this.layer3d;
    // if (this.mapPointsFeatureLayer) {
    //   queryFeatureLayer = this.mapPointsFeatureLayer;
    // } else if (this.scribeProjectsFeatureLyr) {
    //   queryFeatureLayer = this.scribeProjectsFeatureLyr;
    // }
    if (queryFeatureLayer) {
      // query mapPointsFeatureLayer. Geometry set for the query, so only intersecting geometries are returned
      queryFeatureLayer.queryFeatures(query).then((results) => {
        const graphics = results.features;
        if (graphics.length > 0) {
          // zoom to the extent of the polygon with factor 2
          // this._view.goTo(geometry.extent.expand(2))
          // remove existing highlighted map point
          if (this._zoomToPointGraphic) {
            this._view.graphics.remove(this._zoomToPointGraphic);
          }
          // highlight the selected features
          this._view.whenLayerView(queryFeatureLayer).then((layerView: FeatureLayerView) => {
            if (this.mapPointsFeatureLayerHighlight) {
              this.mapPointsFeatureLayerHighlight.remove();
            }
            this.mapPointsFeatureLayerHighlight = layerView.highlight(graphics);
          });
          // get the attributes of map points
          this.selectedFeaturesChange.emit([...new Set(graphics.map((feature, i) => feature.attributes.Samp_No))]);
          // if (this.mapPointsFeatureLayer) {
          //   // on map points selected, filter them in corresponding table rows
          //   this.scribeDataExplorerService.mapPointsSelectedSource.next(pointsAttributeData);
          // } else if (this.scribeProjectsFeatureLyr) {
          //   // on project centroid points selected, go to that project
          //   this.scribeDataExplorerService.projectCentroidsSelectedSource.next(pointsAttributeData);
          // }
        }
      }).catch((error) => {
        console.error('Error selecting map points: ' + error);
      });
    }
  }

  private changeEventHandler = (layers) => () => {
    layers.forEach(layer => {
      const renderer = layer.layer.renderer.clone();
      const visualVariables = [];
      // just changing the stops for the color variable does not appear to work in sceneview
      renderer.visualVariables.reverse().forEach(v => {
        const variable = v.clone();
        if (variable.type === 'color') {
          variable.stops = this.colorSlider.stops;
        }
        visualVariables.push(variable);
      });
      // const colorVariableIndex = renderer.visualVariables.findIndex(v => v.type === 'color');
      // const colorVariable = renderer.visualVariables[colorVariableIndex].clone();
      // colorVariable.stops = this.colorSlider.stops;
      // renderer.visualVariables[colorVariableIndex] = colorVariable;
      renderer.visualVariables = visualVariables;
      layer.layer.set('renderer', renderer);
    });
  }

  private setRenderer(layers: {layer: FeatureLayer, baseRenderer: SimpleRendererProperties}[]) {
    // configure parameters for the color renderer generator
    // the layer must be specified along with a field name
    // or arcade expression. The view and other properties determine
    // the appropriate default color scheme.
    if (this.colorSlider) {
      this.colorSlider.destroy();
    }

    if (this.analyte) {
      const colorParams = {
        layer: layers[1].layer,
        field: 'Result',
        view: this._view,
        theme: 'above',
        // outlineOptimizationEnabled: true
        // symbolType: '3d-volumetric-uniform'
      } as colorCreateContinuousRendererParams;

      // Generate a continuous color renderer based on the
      // statistics of the data in the provided layer
      // and field normalized by the normalizationField.
      //
      // This resolves to an object containing several helpful
      // properties, including color scheme, statistics,
      // the renderer and visual variable

      let rendererResult;
      let renderer;

      createContinuousRenderer(colorParams)
        .then(response => {
          rendererResult = response;
          // set the renderer to the layer and add it to the map
          layers.forEach(layer => {
            renderer = response.renderer.clone();
            renderer.classBreakInfos[0].symbol = layer.baseRenderer.symbol;
            renderer.visualVariables = renderer.visualVariables.concat(layer.baseRenderer.visualVariables);
            layer.layer.renderer = renderer;
          });
          if (!this._map.layers.includes(layers[0].layer)) {
            this._map.add(layers[0].layer);
          }

          // generate a histogram for use in the slider. Input the layer
          // and field or arcade expression to generate it.

          return histogram({
            layer: layers[1].layer,
            field: 'Result',
            valueExpression: colorParams.valueExpression,
            view: this._view,
            numBins: 70
          });
        })
        .then((histogramResult) => {
          // Construct a color slider from the result of both
          // smart mapping renderer and histogram methods
          this.colorSlider = ColorSlider.fromRendererResult(
            rendererResult,
            histogramResult
          );
          this.colorSlider.container = document.createElement('div');
          this.colorSlider.primaryHandleEnabled = true;
          // Round labels to 1 decimal place
          this.colorSlider.labelFormatFunction = (value, type) => {
            return value.toFixed(3);
          };
          // styles the standard deviation lines to be shorter
          // than the average line
          this.colorSlider.histogramConfig.dataLineCreatedFunction = (
            lineElement,
            labelElement,
            index
          ) => {
            if (index != null) {
              lineElement.setAttribute('x2', '66%');
              const sign = index === 0 ? '-' : '+';
              labelElement.innerHTML = sign + 'σ';
            }
          };
          this.colorSlider.viewModel.precision = 3;
          this._view.ui.add(this.colorSlider, 'bottom-right');

          // when the user slides the handle(s), update the renderer
          // with the updated color visual variable object


          // @ts-ignore
          this.colorSlider.on(['thumb-change', 'thumb-drag', 'min-change', 'max-change'],
            this.changeEventHandler(layers)
          );
        })
        .catch((error) => {
          console.log('there was an error: ', error);
        });
    }
  }

}
