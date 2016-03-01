// API tokens 
mapboxgl.accessToken = mapboxgl_accessToken;

/////////////  Global variables  ////////////
var draw_canvas;
//var heatpoint_data;
//var stravaLineGeoJson;
var linestring_src;
var heatpoint_src;
var VizType = 'heat-point';
var map_style = 'dark-nolabel';
var curStyle;
var map;
//Heat Point gradients

var color_list = [
    ['blue', 'cyan', 'lime', 'yellow', 'red'],
    ['purple', 'pink', 'blue', 'yellow', 'orange'],
    ['green', 'aquamarine', 'blanchedalmond', 'coral', 'red']
]

var line_color_list = [
    ['#00FFFF', '#33FF00', '#FFFF00', "#FF0099", "Red"],
    ['#ff0000', '#ff751a', '#6699ff', '#ff66ff', '#ffff66'],
    ['#ffff00', '#808000', '#ffff99', '#808000', '#ffffe6'],
    ['#00ff00', '#008000', '#80ff80', '#00cc66', '#339933']
]

var lineHeatStyle = {
    "id": "linestring",
    "type": "line",
    "source": "linestring",
    "layout": {
        "line-join": "round"
    },
    "paint": {
        "line-opacity": parseFloat(document.getElementById("line_opacity").value),
        "line-width": parseFloat(document.getElementById("line_width").value),
        "line-color": parseFloat(document.getElementById("line_color").value),
        "line-gap-width": 0
    }
};

var heatpoint_style = {
    "id": "heatpoints",
    "type": "circle",
    "source": 'heatpoint',
    "layout": {},
    "paint": {
        "circle-color": document.getElementById("heat_color").value,
        "circle-opacity": 0.8,
        "circle-radius": 2,
        "circle-blur": 0.5
    }
};

//Global variables for heat-lines
var lineBreaks = ['Ride', 'Run', 'Nordic Ski', 'Hike', 'Other'];
var lineColors = line_color_list[0];
var lineFilters = [];
var lineLayers = [];
//Global variables for heat-points
var breaks = [3, 6, 9, 12, 16];
var colors = color_list[0];
var layers = [];
var filters = [];

/////  Main Function  ///////
function initVizMap() {
    if (!mapboxgl.supported()) {
        //stop and alert user map is not supported
        alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    } else {
        try {
            $('#legend-lines').hide();
            map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/rsbaumann/ciiia74pe00298ulxsin2emmn',
                center: mapboxgl.LngLat.convert(center_point),
                zoom: 2,
                minZoom: 1,
                maxZoom: 20,
                attributionControl: true
            });
        } catch (err) {
            //Note that the user did not have any data to load
            console.log(err);
            $("#loading").hide();
            $('#DownloadModal').modal("show");
        }
    }

    map.once('style.load', function() {
        addLayerHeat(map);
        addLayerLinestring(map);
        render();
        map.addControl(new mapboxgl.Navigation({
            position: 'top-left'
        }));
        //map.dragRotate.disable();
        //map.touchZoomRotate.disableRotation();
    });

    map.on('load', function() {
        $("#loading").hide();
    });
}

///////  HELPER FUNCTIONS    /////

function updateHeatLegend() {
    document.getElementById('legend-points-param').textContent = $("#heattype option:selected").text();
}

function calcLegends(p, id) {
    // Build out legends
    var item = document.createElement('div');
    var key = document.createElement('span');
    key.className = 'legend-key';
    var value = document.createElement('span');

    if (id == "heat-point") {
        if ($('#legend-points-value-' + p).length > 0) {
            document.getElementById('legend-points-value-' + p).textContent = breaks[p];
            document.getElementById('legend-points-id-' + p).style.backgroundColor = colors[p];
        }
        else {
            legend = document.getElementById('legend-points');      
            key.id = 'legend-points-id-' + p;
            key.style.backgroundColor = colors[p];
            value.id = 'legend-points-value-' + p;
            item.appendChild(key);
            item.appendChild(value);
            legend.appendChild(item);
            data = document.getElementById('legend-points-value-' + p)
            data.textContent = breaks[p];
        }
    }
    else {
        if ($('#legend-lines-value-' + p).length > 0) {
            document.getElementById('legend-lines-value-' + p).textContent = lineBreaks[p];
            document.getElementById('legend-lines-id-' + p).style.backgroundColor = lineColors[p];
        }
        else {
            legend = document.getElementById('legend-lines');
            key.id = 'legend-lines-id-' + p;
            key.style.backgroundColor = lineColors[p];
            value.id = 'legend-lines-value-' + p;
            item.appendChild(key);
            item.appendChild(value);
            legend.appendChild(item);
            data = document.getElementById('legend-lines-value-' + p)
            data.textContent = lineBreaks[p];
        }
    }
}

function calcLineFilters(breaks, param) {
    //calculate line filters to apply
    lineFilters = [];
    for (var p = 0; p < lineBreaks.length - 1; p++) {
        lineFilters.push(['==', param, lineBreaks[p]])
    }
}

function isMapLoaded(mapid, interval) {
    //check if map is loaded every retry_interval seconds and display or hide loading bar
    var stop = 0
    var timer = setInterval(function() {
        console.log(mapid.loaded())
        if (mapid.loaded() === false) {
            console.log('map not yet loaded')
            $("#loading").show();
        }
        else {
            console.log('map loaded')
            $("#loading").hide();
            stop = 1
        }
    }, interval);
    if (stop==1) {
        clearInterval(interval);
    }

}

function calcLineLayers() {
    //calculate line layers to create
    lineLayers = [];
    for (var p = 0; p < lineFilters.length; p++) {
        lineLayers.push({
            id: 'linestring-' + p,
            type: 'line',
            source: 'linestring',
            paint: {
                "line-opacity": parseFloat(document.getElementById("line_opacity").value),
                "line-width": parseFloat(document.getElementById("line_width").value),
                "line-color": lineColors[p],
                "line-gap-width": 0
            },
            filter: lineFilters[p]
        });
    }
}

function calcBreaks(maxval, numbins) {
    //calculate breaks based on a selected bin size and number of bins
    breaks = [];  //empty the breaks array
    var binSize = maxval / numbins;
    for (p = 1; p <= numbins; p++) {
        breaks.push(binSize * p);
    }
    updateHeatLegend();
    for (p = 0; p < layers.length; p++) {
        calcLegends(p, 'heat-point')
    }
}

function calcHeatFilters(breaks, param) {
    //calculate filters to apply to sheet (first run only)
    filters = [];
    for (var p = 0; p < breaks.length; p++) {
        if (p <= 0) {
            filters.push(['all', ['<', param, breaks[p + 1]]])
        } else if (p < breaks.length - 1) {
            filters.push(['all', ['>=', param, breaks[p]],
                ['<', param, breaks[p + 1]]
            ])
        } else {
            filters.push(['all', ['>=', param, breaks[p]]])
        }
    }
}

function calcHeatLayers(filters, colors) {
    //create layers with filters
    layers = [];
    for (var p = 0; p < breaks.length; p++) {
        layers.push({
            id: 'heatpoints-' + p,
            type: 'circle',
            source: 'heatpoint',
            paint: {
                "circle-color": colors[p],
                "circle-opacity": 0.8,
                "circle-radius": 2,
                "circle-blur": 0.5
            },
            filter: filters[p]
        });
    }
}

//Add heat points function
function addLayerHeat(mapid) {
    // Mapbox JS Api - import heatmap layer
    $("#loading").show();
    heatpoint_src = new mapboxgl.GeoJSONSource({
        data: heatpoint_url,
        maxzoom: 18,
        buffer: 1,
        tolerance: 1
    });
    try {
        mapid.addSource('heatpoint', heatpoint_src);
    } catch (err) {
        console.log(err);
    }
    try {
        calcHeatFilters(breaks, 's');
        calcHeatLayers(filters, colors);
        mapid.batch(function(batch) {
            for (var p = 0; p < layers.length; p++) {
                batch.addLayer(layers[p]);
                calcLegends(p, 'heat-point');
                //addPopup(map, layers[p]);
                }
        });
    } catch (err) {
        console.log(err);
    }
    //fit();
};

function addLayerLinestring(mapid) {
    //Create source for linestring data source
    $("#loading").show();
    linestring_src = new mapboxgl.GeoJSONSource({
        data: heatline_url,
        maxzoom: 18,
        buffer: 1,
        tolerance: 1
    });
    try {
        mapid.addSource('linestring', linestring_src);
    } catch (err) {
        console.log(err);
    }
    try {
        calcLineFilters(lineBreaks, 'ty');
        calcLineLayers();
        mapid.batch(function(batch) {
            for (var p = 0; p < lineLayers.length; p++) {
                batch.addLayer(lineLayers[p]);
                calcLegends(p, 'heat-lines');
            }
        });
    } catch (err) {
        console.log(err);
    }
};

function fit() {
    //fit gl map to a geojson file bounds - depricated for now!
    try {
        map.fitBounds(geojsonExtent(heatpoint_data));
    } catch (err) {
        //Note that the user did not have any data to load
        console.log(err);
        $("#loading").hide();
        $('#DownloadModal').modal("show");
    }
}

function switchLayer() {
    layer = document.getElementById("mapStyle").value;
    
    if (layer != 'dark-nolabel') {
        map.setStyle('mapbox://styles/mapbox/' + layer + '-v8');
    } else {
        map.setStyle('mapbox://styles/rsbaumann/ciiia74pe00298ulxsin2emmn');
    }
    map.once('style.load', function() {
        addLayerHeat(map);
        addLayerLinestring(map);
        render();
        $("#loading").hide();
    });
}

function set_visibility(mapid, id, onoff) {
    if (id == 'heatpoints') {
        mapid.batch(function(batch) {
            for (var p = 0; p < layers.length; p++) {
                if (onoff == 'off') {
                    batch.setLayoutProperty("heatpoints" + "-" + p, 'visibility', 'none');
                } else if (onoff == 'on') {
                    batch.setLayoutProperty("heatpoints" + "-" + p, 'visibility', 'visible');
                }
            }
        });
    } else {
        mapid.batch(function(batch) {
            for (var p = 0; p < lineLayers.length; p++) {
                if (onoff == 'off') {
                    batch.setLayoutProperty("linestring" + "-" + p, 'visibility', 'none');
                } else if (onoff == 'on') {
                    batch.setLayoutProperty("linestring" + "-" + p, 'visibility', 'visible');
                }
            }
        });
    }
};

function paintLayer(mapid, color, width, opacity, pitch, layer) {
    lineColors = line_color_list[parseFloat(document.getElementById("line_color").value)]
    map.setPitch(pitch);
    mapid.batch(function(batch) {
        for (var p = 0; p < lineLayers.length; p++) {
            calcLegends(p, 'heat-line');
            batch.setPaintProperty(layer + '-' + p, 'line-color', lineColors[p]);
            batch.setPaintProperty(layer + '-' + p, 'line-width', width);
            batch.setPaintProperty(layer + '-' + p, 'line-opacity', opacity);
            batch.setPaintProperty(layer + '-' + p, 'line-gap-width', 
                parseFloat(document.getElementById("line_offset").value));
        }
    });
}

function switchMapStyle() {
    //Check if the mapStyle changed - if so, change it here
    if (document.getElementById("mapStyle").value != map_style) {
        switchLayer();
        map_style = document.getElementById("mapStyle").value;
    }
}


//Update heatpoints properties
function paintCircleLayer(mapid, layer, opacity, radius, blur, pitch) {
    //Update the break and filter settings
    map.setPitch(pitch);
    colors = color_list[parseFloat(document.getElementById('heat_color').value)];
    calcBreaks(parseFloat($('#scale').slider('getValue')), colors.length);
    calcHeatFilters(breaks, document.getElementById('heattype').value);
    //apply settings to each layer
    mapid.batch(function(batch) {
        for (var p = 0; p < layers.length; p++) {
            batch.setFilter(layer + '-' + p, filters[p]);
            batch.setPaintProperty(layer + '-' + p, 'circle-opacity', opacity);
            batch.setPaintProperty(layer + '-' + p, 'circle-radius', radius);
            batch.setPaintProperty(layer + '-' + p, 'circle-blur', blur);
            batch.setPaintProperty(layer + '-' + p, 'circle-color', colors[p]);
        }
    });
}

function render() {
    if (document.getElementById("VizType").value == "heat-point") {
        try {
            set_visibility(map, 'linestring', 'off');
            $('#legend-lines').hide();
        } catch (err) {
            console.log(err);
        }
        try {
            set_visibility(map, 'heatpoints', 'on');
            paintCircleLayer(map, 'heatpoints',
                parseFloat($('#minOpacity').slider('getValue')),
                parseFloat($('#radius').slider('getValue')),
                parseFloat($('#blur').slider('getValue')),
                parseFloat($('#pitch').slider('getValue')));
            $('#legend-points').show();

        } catch (err) {
            console.log(err);
        }
    } else if (document.getElementById("VizType").value == "heat-line") {
        try {
            set_visibility(map, 'heatpoints', 'off');
            $('#legend-points').hide();
        } catch (err) {
            console.log(err);
        }
        try {
            set_visibility(map, 'linestring', 'on');
            paintLayer(map,
                document.getElementById("line_color").value,
                parseFloat($('#line_width').slider('getValue')),
                parseFloat($('#line_opacity').slider('getValue')),
                parseFloat($('#pitch').slider('getValue')),
                'linestring');
            $('#legend-lines').show();
        } catch (err) {
            console.log(err);
        }
    }
}

function addPopup(mapid, layer) {
    for (var p = 0; p < layers.length; p++) {
        mapid.on('click', function(e) {
            mapid.featuresAt(e.point, {
                layer: 'heatpoints-' + p,
                radius: 15,
                includeGeometry: true
            }, function(err, features) {
                if (err || !features.length)
                    return;
                var feature = features[0];
                new mapboxgl.Popup()
                    .setLngLat(feature.geometry.coordinates)
                    .setHTML('<h5> Coords: ' + Math.round(feature.geometry.coordinates[1] * 1000) / 1000 + "," +
                        Math.round(feature.geometry.coordinates[0] * 1000) / 1000 + '</h5>' +
                        '<ul class="list-group">' +
                        '<li class="list-group-item"> Freq: ' + feature.properties.d + " visits </li>" +
                        '<li class="list-group-item"> Speed: ' + feature.properties.s + " mph </li>" +
                        '<li class="list-group-item"> Grade: ' + feature.properties.g + " % </li>" +
                        '</ul>')
                    .addTo(map);
            });
        });
        mapid.on('click', function(e) {
            mapid.featuresAt(e.point, {
                layer: 'heatpoints-' + p,
                radius: 15
            }, function(err, features) {
                map.getCanvas().style.cursor = (!err && features.length) ? 'pointer' : '';
            });
        });
    }
}


//////////////// SLIDERS AND BUTTON ACTIONS ////////////

//on change of VizType, show only menu options linked to selected viztype
$('#VizType').change(function() {
    var selector = '#VizType_hide_' + $(this).val();
    //hide all elements
    $('#VizType_hide_heat-line').collapse('hide');
    $('#VizType_hide_heat-point').collapse('hide');
    //show only element connected to selected option
    $(selector).collapse('show');
});

$('#pitch').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#pitch').slider().on('slide', function(ev) {
    $('#pitch').slider('setValue', ev.value);
    render();
});
$('#line_width').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#line_width').slider().on('slide', function(ev) {
    $('#line_width').slider('setValue', ev.value);
    render();
});
$('#line_opacity').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#line_opacity').slider().on('slide', function(ev) {
    $('#line_opacity').slider('setValue', ev.value);
    render();
});
$('#line_offset').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#line_offset').slider().on('slide', function(ev) {
    $('#line_offset').slider('setValue', ev.value);
    render();
});
$('#blur').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#blur').slider().on('slide', function(ev) {
    $('#blur').slider('setValue', ev.value);
    render();
});
$('#radius').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#radius').slider().on('slide', function(ev) {
    $('#radius').slider('setValue', ev.value);
    render();
});
$('#scale').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#scale').slider().on('slide', function(ev) {
    $('#scale').slider('setValue', ev.value);
    render();
});
$('#minOpacity').slider({
    formatter: function(value) {
        return 'Value: ' + value;
    }
});
$('#minOpacity').slider().on('slide', function(ev) {
    $('#minOpacity').slider('setValue', ev.value);
    render();
});
$('#Refresh').on('click touch tap', switchMapStyle);
$('#Refresh').on('click touch tap', render);
$('#heat_color').change(render);
$('#VizType').change(render);
$('#mapStyle').change(switchMapStyle);
$('#heattype').change(render);
$('#heat_color').change(render);
$('#line_color').change(render);
$('#snap').on('click touch tap', generateMap);
