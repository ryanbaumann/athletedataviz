// API tokens 
mapboxgl.accessToken = mapboxgl_accessToken;

/////////////  Global variables  ////////////
var draw_canvas;
var heatpoint_data;
var stravaLineGeoJson;
var linestring_src;
var VizType = 'heat-point';
var map_style = 'dark-nolabel';

var lineHeatStyle = {
    "id": "linestring",
    "type": "line",
    "source": "linestring",
    "interactive": true,
    "paint": {
        "line-opacity": parseFloat(document.getElementById("line_opacity").value),
        "line-width": parseFloat(document.getElementById("line_width").value),
        "line-color": document.getElementById("line_color").value
    }
};

var heatpoint_style = {
        "id": "heatpoints",
        "type": "circle",
        "source": 'heatpoint',
        "interactive": true,
        "layout": {},
        "paint": {
            "circle-color": document.getElementById("heat_color").value,
            "circle-opacity" : 1,
            "circle-radius" : 1,
            "circle-blur" : 1
        }
};
var breaks = [0, 15];
var colors = ['#00FF00', '#FF0000'];

var layers = [{
                    "id": "heatpoints-" + colors[0],
                    "type": "circle",
                    "source": 'heatpoint',
                    "paint": {
                        "circle-color": colors[0],
                        "circle-opacity" : 0.9,
                        "circle-radius" : 5,
                        "circle-blur" : 1
                    },
                    "filter": ['all', ['>=', 's', breaks[0]], ['<', 's', breaks[1]]]
                },
                {
                    "id": "heatpoints-" + colors[1],
                    "type": "circle",
                    "source": 'heatpoint',
                    "paint": {
                        "circle-color": colors[1],
                        "circle-opacity" : 0.9,
                        "circle-radius" : 5,
                        "circle-blur" : 1
                    },
                    "filter": ['all', ['>=', 's', breaks[1]]]
                }
            ];

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
    }
    catch (err) {
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
        r.resolve();
    });
    return r;
};

//Get heat data function
function getDataHeat() {
    var r = $.Deferred();
    $.getJSON(heatpoint_url, function(data) {
        heatpoint_data = data;
        r.resolve();
    });
    return r;
};

//Add heat points function
function addLayerHeat() {
    // Mapbox JS Api - import heatmap layer
    heatpoint_src = new mapboxgl.GeoJSONSource({
        data: heatpoint_data,
        maxzoom: 20,
        buffer: 2
    });
    try {
        map.addSource('heatpoint', heatpoint_src);
    } catch (err) {
            console.log(err);
    }
    try{
        map.addLayer(heatpoint_style);
    } catch (err) {
        console.log(err);
    }
    addPopup(map, 'heatpoints');
    fit();
    $("#loading").hide();
};

function addLayerLinestring() {
    //Create source for linestring data source
    linestring_src = new mapboxgl.GeoJSONSource({
        data: stravaLineGeoJson,
        maxzoom: 20,
        buffer: 2
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
    addPopup(map, 'heatpoints');
};

map.once('load', function() {
    getDataHeat().done(addLayerHeat);
    getDataLinestring().done(addLayerLinestring);
    map.addControl(new mapboxgl.Navigation({position: 'top-left'}));
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    //Stop the loading bar when map is fully loaded
});

function fit() {
    //fit gl map to a geojson file bounds
    map.fitBounds(geojsonExtent(heatpoint_data));
}

//Stop the loading bar when ajax requests complete
$(document).one("ajaxStop", function() {
    //$("#loading").hide(); 
});

function switchLayer() {
    layer = document.getElementById("mapStyle").value;
    if (layer != 'dark-nolabel') {
        map.setStyle('mapbox://styles/mapbox/' + layer + '-v8');
    } else {
        map.setStyle('mapbox://styles/rsbaumann/ciiia74pe00298ulxsin2emmn');
    }
    map.on('style.load', function() {
        linestring_src = new mapboxgl.GeoJSONSource({
            data: stravaLineGeoJson,
            maxzoom: 20
        });
        heatpoint_src = new mapboxgl.GeoJSONSource({
            data: heatpoint_data,
            maxzoom: 20
        });
        try {
            map.addSource('linestring', linestring_src);
            map.addSource('heatpoint', heatpoint_src);
        } catch (err) {
            console.log(err);
        }
        try {
            map.addLayer(lineHeatStyle);
            map.addLayer(heatpoint_style);
        } catch (err) {
            console.log(err);
        }
        render();
    });
};

function set_visibility(mapid, id, onoff) {
    var visibility = mapid.getLayoutProperty(id, 'visibility');
    if (onoff == 'off') {
        mapid.setLayoutProperty(id, 'visibility', 'none');
    } else if (onoff == 'on') {
        mapid.setLayoutProperty(id, 'visibility', 'visible');
    }
};

function paintLayer(mapid, color, width, opacity, layer) {
    mapid.setPaintProperty(layer, 'line-color', color);
    mapid.setPaintProperty(layer, 'line-width', width);
    mapid.setPaintProperty(layer, 'line-opacity', opacity);
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
    mapid.on('click', function (e) {
    mapid.featuresAt(e.point, 
                    {layer: 'heatpoints', 
                    radius: 15, 
                    includeGeometry: true
    }, function (err, features) {
        if (err || !features.length)
            return;
        var feature = features[0];
        new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML('<h5> Coords: ' + Math.round(feature.geometry.coordinates[1]*1000)/1000 + "," +
                                       Math.round(feature.geometry.coordinates[0]*1000)/1000 + '</h5>' +
                     '<ul class="list-group">' +
                     '<li class="list-group-item"> Freq: ' + feature.properties.d + " visits </li>" +
                     '<li class="list-group-item"> Speed: ' + feature.properties.s + " mph </li>" +
                     '<li class="list-group-item"> Grade: ' + feature.properties.g + " % </li>" +
                     '</ul>')
            .addTo(map);
        });
    });
    map.on('mousemove', function (e) {
    map.featuresAt(e.point, {layer: 'heatpoints', radius: 15}, function (err, features) {
        map.getCanvas().style.cursor = (!err && features.length) ? 'pointer' : '';
    });
});
}

//Update heatpoints properties
function paintCircleLayer(mapid, layer, opacity, radius, blur) {
        mapid.setPaintProperty(layer, 'circle-opacity', opacity);
        mapid.setPaintProperty(layer, 'circle-radius', radius);
        mapid.setPaintProperty(layer, 'circle-blur', blur);
        mapid.setPaintProperty(layer, 'circle-color', document.getElementById("heat_color").value);
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

            //addPopup(map, 'heatpoints');
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

//Heat Point gradients
var heatColors1 = {
    0.1: 'blue',
    0.6: 'cyan',
    0.7: 'lime',
    0.8: 'yellow',
    1.0: 'red'
};
var heatColors2 = {
    0.1: 'purple',
    0.6: 'pink',
    0.7: 'blue',
    0.8: 'yellow',
    1.0: 'orange'
};
var heatColors3 = {
    0.1: 'green',
    0.6: 'aquamarine',
    0.7: 'blanchedalmond',
    0.8: 'coral',
    1.0: 'red'
};
