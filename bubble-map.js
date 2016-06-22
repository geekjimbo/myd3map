// This is a Chiasm component that implements a bubble map.
// Based on chiasm-leaflet.
function BubbleMap() {

  // TODO move these to config.
  var latitudeColumn = "latitude";
  var longitudeColumn = "longitude";
    

  // Extend chiasm-leaflet using composition (not inheritence).
  var my = ChiasmLeaflet();
  // my.map is the Leaflet instance.

  my.when("data", function (data){
    my.cleanData = data.filter(function (d){
      var lat = d[latitudeColumn];
      var lng = d[longitudeColumn];
      if(isNaN(+lat) || isNaN(+lng)){
        console.log("Bad data - lat = " + lat + " lng = " + lng);
        return false;
      }
      return true;
    });
  });

  my.addPublicProperties({

    // This is the data column that maps to bubble size.
    // "r" stands for radius.
    rColumn: Model.None,

    colorColumn: Model.None,

    // The circle radius used if rColumn is not specified.
    rDefault: 3,

    // The range of the radius scale if rColumn is specified.
    rMin: 0,
    rMax: 10,
  });

  var rScale = d3.scale.sqrt();
  var colorScale = d3.scale.category10();

  // Add a semi-transparent white layer to fade the
  // black & white base map to the background.
  var canvasTiles = L.tileLayer.canvas();
  canvasTiles.drawTile = function(canvas, tilePoint, zoom) {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgba(255, 255, 250, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  canvasTiles.addTo(my.map);

  // Generate a function or constant for circle radius,
  // depending on whether or not rColumn is defined.
  my.when(["datasetForScaleDomain", "rColumn", "rDefault", "rMin", "rMax"],
      function (dataset, rColumn, rDefault, rMin, rMax){
    var data = dataset.data;

    if(rColumn === Model.None){
      my.r = function (){ return rDefault};
    } else {
      rScale
        .domain(d3.extent(data, function (d){ return d[rColumn]; }))
        .range([rMin, rMax]);
      my.r = function (d){ return rScale(d[rColumn]); };
    }
  });

  my.when(["datasetForScaleDomain", "colorColumn"],
      function (dataset, colorColumn){

    var data = dataset.data;

    if(colorColumn === Model.None){
      my.color = "red";
    } else {
      my.color = function (d){ return colorScale(d[colorColumn]); };
    }
  });

  var oldMarkers = [];
  my.when(["cleanData", "r", "color"], _.throttle(function (data, r, color){

    // TODO make this more efficient.
    // Use D3 data joins?
    oldMarkers.forEach(function (marker){
      my.map.removeLayer(marker);
    });

    oldMarkers = data.map(function (d){
     
      var lat = d[latitudeColumn];
      var lng = d[longitudeColumn];

      var markerCenter = L.latLng(lat, lng);
      var circleMarker = L.circleMarker(markerCenter, {

        color: color(d),
        weight: 1,
        clickable: false
      });

      circleMarker.setRadius(r(d));

      circleMarker.addTo(my.map);

      return circleMarker;
    });
  }, 100));

  return my;
}
