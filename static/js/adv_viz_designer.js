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
//Heat Point gradients

var color_list = [
    ['blue', 'cyan', 'lime', 'yellow', 'red'],
    ['purple', 'pink', 'blue', 'yellow', 'orange'],
    ['green', 'aquamarine', 'blanchedalmond', 'coral', 'red']
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
        "line-color": document.getElementById("line_color").value,
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

var breaks = [3, 6, 9, 12, 16];
var colors = color_list[0];
var layers = [];
var filters = [];

function updateLegend() {
    document.getElementById('legend-param').textContent = $("#heattype option:selected").text();
}

function calcLegends(p) {
    // Build out legends
    var item = document.createElement('div');
    var key = document.createElement('span');
    key.id = 'legend-id-' + p;
    key.className = 'legend-key';
    key.style.backgroundColor = colors[p];
    var value = document.createElement('span');
    value.id = 'legend-value-' + p;
    item.appendChild(key);
    item.appendChild(value);
    legend.appendChild(item);
    document.getElementById('legend-value-' + p).textContent = breaks[p];
}

function calcBreaks(maxval, numbins) {
    //calculate breaks based on a selected bin size and number of bins
    breaks = [];  //empty the breaks array

    var binSize = maxval / numbins;
    for (p = 1; p <= numbins; p++) {
        breaks.push(binSize * p);
    }
    updateLegend();
    for (p = 0; p < layers.length; p++) {
        document.getElementById('legend-value-' + p).textContent = breaks[p];
        document.getElementById('legend-id-' + p).style.backgroundColor = colors[p];
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
            interactive: true,
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

//Load the map canvas
if (!mapboxgl.supported()) {
    //stop and alert user map is not supported
    alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
} else {
    try {
        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/rsbaumann/ciiia74pe00298ulxsin2emmn',
            center: mapboxgl.LngLat.convert(center_point),
            zoom: 4,
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

function getDataLinestring() {
    //load linestring data via AJAX from the web server api
    var r = $.Deferred();
    $.getJSON(heatline_url, function(data) {
        stravaLineGeoJson = data;
        $.ajaxSetup({ cache: true });
        r.resolve();
    });
    return r;
};

//Get heat data function
function getDataHeat() {
    var r = $.Deferred();
    $.getJSON(heatpoint_url, function(data) {
        heatpoint_data = data;
        $.ajaxSetup({ cache: true });
        r.resolve();
    });
    return r;
};

//Add heat points function
function addLayerHeat() {
    // Mapbox JS Api - import heatmap layer
    heatpoint_src = new mapboxgl.GeoJSONSource({
        data: heatpoint_url,
        maxzoom: 20,
        buffer: 1000,
        tolerance: 1
    });
    try {
        map.addSource('heatpoint', heatpoint_src);
    } catch (err) {
        console.log(err);
    }
    try {
        calcHeatFilters(breaks, 's');
        calcHeatLayers(filters, colors);
        map.batch(function(batch) {
            for (var p = 0; p < layers.length; p++) {
                batch.addLayer(layers[p]);
                calcLegends(p);
                //addPopup(map, layers[p]);
                }
        });
    } catch (err) {
        console.log(err);
    }
    //fit();
};

function addLayerLinestring() {
    //Create source for linestring data source
    linestring_src = new mapboxgl.GeoJSONSource({
        data: heatline_url,
        maxzoom: 18,
        buffer: 500,
        tolerance: 1
    });
    try {
        map.addSource('linestring', linestring_src);
    } catch (err) {
        console.log(err);
    }
    try {
        map.addLayer(lineHeatStyle);
    } catch (err) {
        console.log(err);
    }
    set_visibility(map, 'linestring', 'off');
    paintLayer(map,
        document.getElementById("line_color").value,
        parseFloat($('#line_width').slider('getValue')),
        parseFloat($('#line_opacity').slider('getValue')),
        'linestring');
    $("#loading").hide();
};

map.once('load', function() {
    //imgCanvas.init(map); //initialize the image_gl_canvas module based on the created map
    addLayerHeat();
    addLayerLinestring();
    map.addControl(new mapboxgl.Navigation({
        position: 'top-left'
    }));
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    var popup = new mapboxgl.Popup({
        closeButton: false
    });
    //Stop the loading bar when map is fully loaded
});

function fit() {
    //fit gl map to a geojson file bounds
    try {
        map.fitBounds(geojsonExtent(heatpoint_data));
    } catch (err) {
        //Note that the user did not have any data to load
        console.log(err);
        $("#loading").hide();
        $('#DownloadModal').modal("show");
    }
}

//Stop the loading bar when ajax requests complete
$(document).on("ajaxStart", function() {
    $("#loading").show(); 
});
$(document).on("ajaxStop", function() {
    $("#loading").hide(); 
});

function switchLayer() {
    layer = document.getElementById("mapStyle").value;
    if (layer != 'dark-nolabel') {
        map.setStyle('mapbox://styles/mapbox/' + layer + '-v8');
    } else {
        map.setStyle('mapbox://styles/rsbaumann/ciiia74pe00298ulxsin2emmn');
    }
    map.on('style.load', function() {
        //getDataHeat().done(addLayerHeat);
        //getDataLinestring().done(addLayerLinestring);
        linestring_src = new mapboxgl.GeoJSONSource({
            data: heatline_url,
            maxzoom: 20,
            buffer: 1000,
            tolerance: 1
        });
        heatpoint_src = new mapboxgl.GeoJSONSource({
            data: heatpoint_url,
            maxzoom: 20,
            buffer: 1000,
            tolerance: 1
        });
        try {
            map.addSource('linestring', linestring_src);
            map.addSource('heatpoint', heatpoint_src);
        } catch (err) {
            console.log(err);
        }
        try {
            map.addLayer(lineHeatStyle);
            map.batch(function(batch) {
                for (var p = 0; p < layers.length; p++) {
                    batch.addLayer(layers[p]);
                }
            });
        } catch (err) {
            console.log(err);
        }
        render();
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
        if (onoff == 'off') {
            mapid.setLayoutProperty(id, 'visibility', 'none');
        } else if (onoff == 'on') {
            mapid.setLayoutProperty(id, 'visibility', 'visible');
        }
    }
};

function paintLayer(mapid, color, width, opacity, layer) {
    mapid.batch(function(batch) {
        batch.setPaintProperty(layer, 'line-color', color);
        batch.setPaintProperty(layer, 'line-width', width);
        batch.setPaintProperty(layer, 'line-opacity', opacity);
        batch.setPaintProperty(layer, 'line-gap-width', document.getElementById("line_offset").value);
    });
}

function switchMapStyle() {
    $("#loading").show();
    //Check if the mapStyle changed - if so, change it here
    if (document.getElementById("mapStyle").value != map_style) {
        switchLayer();
        map_style = document.getElementById("mapStyle").value;
    }
    $("#loading").hide();
}

function addPopup(mapid, layer) {
    for (var p = 0; p < layers.length; p++) {
        mapid.on('mousemove', function(e) {
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
        mapid.on('mousemove', function(e) {
            mapid.featuresAt(e.point, {
                layer: 'heatpoints-' + p,
                radius: 15
            }, function(err, features) {
                map.getCanvas().style.cursor = (!err && features.length) ? 'pointer' : '';
            });
        });
    }
}

//Update heatpoints properties
function paintCircleLayer(mapid, layer, opacity, radius, blur) {
    //Update the break and filter settings
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
        } catch (err) {
            console.log(err);
        }
        try {
            set_visibility(map, 'heatpoints', 'on');
            paintCircleLayer(map, 'heatpoints',
                parseFloat($('#minOpacity').slider('getValue')),
                parseFloat($('#radius').slider('getValue')),
                parseFloat($('#blur').slider('getValue')));
            $('#legend').show();

        } catch (err) {
            console.log(err);
        }
    } else if (document.getElementById("VizType").value == "heat-line") {
        try {
            set_visibility(map, 'heatpoints', 'off');
        } catch (err) {
            console.log(err);
        }
        try {
            set_visibility(map, 'linestring', 'on');
            paintLayer(map,
                document.getElementById("line_color").value,
                parseFloat($('#line_width').slider('getValue')),
                parseFloat($('#line_opacity').slider('getValue')),
                'linestring');
            $('#legend').hide();
        } catch (err) {
            console.log(err);
        }
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
