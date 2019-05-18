var range = 0
var numberOfEVs = 0

 //Step 1: initialize communication with the platform
 var platform = new H.service.Platform({
   app_id: 'L8iV5FKJzLT8lR5SuRBo',
   app_code: 'syEDHgpGxOJ9PfumuMT12w',
   useHTTPS: true
 });

 var pixelRatio = window.devicePixelRatio || 1;
 var defaultLayers = platform.createDefaultLayers({
   tileSize: pixelRatio === 1 ? 256 : 512,
   ppi: pixelRatio === 1 ? undefined : 320
 });

 //Step 2: initialize a map  - not specificing a location will give a whole world view.
 var map = new H.Map(document.getElementById('mapContainer'),
   defaultLayers.normal.map, {zoom: 7, center: {lng: -2.25, lat:53.4}, pixelRatio: pixelRatio
 });

 //Step 3: make the map interactive
 // MapEvents enables the event system
 // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
 var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

 var maxStd = Math.max.apply(Math, traffic.map(function(o) { return o.std; }))
 console.log(maxStd)

 // Create the default UI components
 var ui = H.ui.UI.createDefault(map, defaultLayers);
 addClickEventListenerToMap(map)
 addTrafficData(traffic)
 createRoute('53.474967,-2.245431','52.471816,-1.888391')


function addClickEventListenerToMap(map) {


  // add 'tap' listener
  map.addEventListener('tap', function (evt) {
    var coords =  map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
    $(function() {
      $( "#dialog" ).dialog();
    });
  }, false);
}



// function findNearestMarker(coords) {
//  var minDist = 1000,
//    nearest_text = '*None*',
//    markerDist,
//    // get all objects added to the map
//    objects = map.getObjects(),
//    len = map.getObjects().length,
//    i;
//    console.log(len)
//
//  // iterate over objects and calculate distance between them
//  for (i = 0; i < len; i += 1) {
//
//    markerDist = objects[i].getPosition().distance(coords);
//    if (markerDist < minDist) {
//      minDist = markerDist;
//      nearest_text = objects[i].getData();
//    }
//  }
//
//  alert('The nearest marker is: ' + nearest_text);
// }

//find max std on traffic


function addTrafficData(traffic) {
  for (i=0;i<traffic.length;i++){
    var point = traffic[i]
    console.log(point.site_name)
    var gr = point.site_name.split("GPS Ref: ")[1].replace(';','')
    var osgridref = new OsGridRef(gr.substring(0, 6), gr.substring(6, 12));
    var pWGS = CoordTransform.convertOSGB36toWGS84(OsGridRef.osGridToLatLong(osgridref));
    var marker = new H.map.Marker({lat:pWGS._lat, lng:pWGS._lon});

    addCircleToMap(map,{lat:pWGS._lat, lng:pWGS._lon},point.std/maxStd,point.std*10)

    // map.addObject(marker)
}
}

function addCircleToMap(map,position,opacity,radious){
  map.addObject(new H.map.Circle(
    // The central point of the circle
    position,
    // The radius of the circle in meters
    radious,
    {
      style: {
        strokeColor: 'rgba(255, 255, 255, 1)', // Color of the perimeter
        lineWidth: 2,
        fillColor: 'rgba(0, 0, 255, '+ opacity  +')'  // Color of the circle
      }
    }
  ));
}

function createRoute(from,to) {
  // create the icon that's reused for the on the route charging stations
  var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28px" height="36px">' +
        '<path d="M 19 31 C 19 32.7 16.3 34 13 34 C 9.7 34 7 32.7 7 31 C 7 29.3 9.7 28 13 28 C 16.3 28 19' +
        ' 29.3 19 31 Z" fill="#000" fill-opacity=".2"/>' +
        '<path d="M 13 0 C 9.5 0 6.3 1.3 3.8 3.8 C 1.4 7.8 0 9.4 0 12.8 C 0 16.3 1.4 19.5 3.8 21.9 L 13 31 L 22.2' +
        ' 21.9 C 24.6 19.5 25.9 16.3 25.9 12.8 C 25.9 9.4 24.6 6.1 22.1 3.8 C 19.7 1.3 16.5 0 13 0 Z" fill="#fff"/>' +
        '<path d="M 13 2.2 C 6 2.2 2.3 7.2 2.1 12.8 C 2.1 16.1 3.1 18.4 5.2 20.5 L 13 28.2 L 20.8 20.5 C' +
        ' 22.9 18.4 23.8 16.2 23.8 12.8 C 23.6 7.07 20 2.2 13 2.2 Z" fill="#090"/>' +
        '</svg>';
  var options = {
    'size': new mapsjs.math.Size(28, 36),
    'anchor': new mapsjs.math.Point(14, 32),
    'hitArea': new mapsjs.map.HitArea(
        mapsjs.map.HitArea.ShapeType.POLYGON, [0, 16, 0, 7, 8, 0, 18, 0, 26, 7, 26, 16, 18, 34, 8, 34])
  };
  icon = new mapsjs.map.Icon(svg, options);

  // Obtain routing service and create routing request parameters
  var router = platform.getRoutingService(),
      routeRequestParams = {
        mode: 'fastest;car',
        representation: 'display',
        legattributes:'li',
        waypoint0: from,
        waypoint1: to
        };

  // calculate route
  router.calculateRoute(
    routeRequestParams,
    function(response) {
      console.log(response)
      var lineString = new H.geo.LineString(),
          route = response.response.route[0],
          routeShape = route.shape,
          polyline,
          linkids = [];

      // collect link ids for the later matching with the PDE data
      route.leg.forEach(function(leg) {
        leg.link.forEach(function(link) {
          linkids.push(link.linkId.substring(1));
        });
      })

  	// create route poly;line
      routeShape.forEach(function(point) {
        var parts = point.split(',');
        lineString.pushLatLngAlt(parts[0], parts[1]);
      });
      polyline = new H.map.Polyline(lineString, {
        style: {
          lineWidth: 8,
          strokeColor: 'rgba(0, 128, 255, 0.7)'
        },
        arrows: new mapsjs.map.ArrowStyle()
      });

      map.addObject(polyline);
      map.setViewBounds(polyline.getBounds(), true);

      // findStations(linkids, polyline)
    },
    function() {
      alert('Routing request error');
    }
  );

}


//
// trafficFlowData.forEach(function(point) {
//   var gr = point.gpsref.replace(",","")
//   var osgridref = new OsGridRef(gr.substring(0, 6), gr.substring(6, 12));
//   var pWGS = CoordTransform.convertOSGB36toWGS84(OsGridRef.osGridToLatLong(osgridref));
//   var marker = new H.map.Marker({lat:pWGS._lat, lng:pWGS._lon});
//   map.addObject(marker)
// })


  // var obj = $.csv.toObjects(csv)
  // console.log(obj)
// findStations(linkids, polyline);
//
//  function findStations(linkids, polyline) {
//    var service = platform.getPlatformDataService();
//
//    // Create a search request object fir the EVCHARGING_POI layer with the bounding box of the polyline
//    var req = new mapsjs.service.extension.platformData.SearchRequest(service, polyline.getBounds(), [{
//      layerId: 'EVCHARGING_POI',
//      level: 13
//    }]);
//
//    // event listener that matches Platform Data Extension data and routing results
//    req.addEventListener('data', function(ev) {
//      var table = ev.data,
//          row,
//          geometry,
//          i = table.getRowCount();
//
//      while(i--) {
//        row = table.getRow(i);
//        geometry = row.getCell('geometry');
//        if (linkids.indexOf(row.getCell('LINK_ID')) !== -1) {
//          map.addObject(new mapsjs.map.Marker({lat: geometry[0][0], lng: geometry[0][1]}, {icon: icon}));
//        } else {
//          map.addObject(new mapsjs.map.Marker({lat: geometry[0][0], lng: geometry[0][1]}));
//        }
//      }
//    });
//
//    req.send();
//  }
