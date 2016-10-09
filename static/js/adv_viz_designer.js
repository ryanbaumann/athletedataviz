/////////////  Global variables  ////////////

var draw_canvas;
var linestring_src;
var heatpoint_src;
var segment_src;
var VizType = 'heat-point';
var map_style = 'dark-nolabel';
var curStyle;
var map;

var seg_params = {
    'SEG_ID': 'number',
    'ELEV_GAIN': 'number',
    'ACT_TYPE': 'string',
    'ELEV_HIGH': 'number',
    'AVG_GRADE': 'number',
    'NAME': 'string',
    'ELEV_LOW': 'number',
    'TOTAL_ELEV': 'number',
    'DISTANCE': 'number',
    'EFFORT_CNT': 'number',
    'CAT': 'number',
    'DATE_CREAT': 'string',
    'MAX_GRADE': 'number',
    'ATH_CNT': 'number'
}

function addSegLayer(mapid) {
    try {
        mapid.addSource('segment', {
            type: 'vector',
            url: 'mapbox://rsbaumann.ADV_all_segments'
        });
    } catch (err) {
        console.log(err);
    }
    try {
        mapid.addLayer({
            "id": 'segment-0',
            "type": 'line',
            "source": 'segment',
            "source-layer": "adv_all_segments",
            "paint": {
                "line-opacity": parseFloat(document.getElementById("line_opacity").value),
                "line-width": parseFloat(document.getElementById("line_width").value),
                "line-color": {
                    "property": 'dist',
                    "type": 'interval',
                    "stops": calc_stops(seg_breaks, lineColors)
                },
                "line-gap-width": 0
            }
        });
        for (p = 0; p <= seg_breaks; p++) {
            calcLegends(p, 'segment');
        }
        addPopup(mapid, seg_layernames, segpopup);
    } catch (err) {
        console.log(err);
    }

};

function addLayerLinestring(mapid) {
    try {
        mapid.addSource('linestring', {
            type: 'geojson',
            data: heatline_url,
            buffer: 50,
            tolerance: 0.5
        });
    } catch (err) {
        console.log(err);
    }
    try {
        calcLineLayers();
        mapid.addLayer(lineLayers[0]);
        for (var p = 0; p < breaks.length; p++) {
            calcLegends(p, 'heat-lines');
        };
        addPopup(map, linelayernames, linepopup);
    } catch (err) {
        console.log(err);
    }
};

//Add heat points function
function addLayerHeat(mapid) {
    // Mapbox JS Api - import heatmap layer
    try {
        mapid.addSource('heatpoint', {
            type: 'geojson',
            data: heatpoint_url,
            buffer: 50,
            tolerance: 2
        });
    } catch (err) {
        console.log(err);
    }
    try {
        calcHeatLayers()
        mapid.addLayer(layers[0]);
        for (var p = 0; p < breaks.length; p++) {
            calcLegends(p, 'heat-point');
        };
        addPopup(mapid, layernames, heatpopup);
    } catch (err) {
        console.log(err);
    }
};

//Add heat points function
function addLayerElev(mapid) {
    // Mapbox JS Api - import heatmap layer
    try {

        mapid.addSource('elevation-poly', {
            type: 'geojson',
            data: evelpoly_url
        });
    } catch (err) {
        console.log(err);
    }

    try {
        mapid.addLayer({
            "id": 'elevation',
            "source": 'elevation-poly',
            "type": "fill",
            "paint": {
                "fill-extrude-height": {
                    "type": "exponential",
                    "stops": [
                        [0, 0],
                        [2500, 5000]
                    ],
                    "property": "e"
                },
                "fill-color": {
                    "type": "exponential",
                    "stops": [
                        [0, "#6BEBAE"],
                        [2500, "#EC8E5D"]
                    ],
                    "property": "e"
                },
                "fill-opacity": 0.9
            }
        });
    } catch (err) {
        console.log(err);
    }
    addPopup(mapid, elev_layernames, elev_popup);
};


/////  Main Function  ///////
function initVizMap() {
    if (!mapboxgl.supported()) {
        alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    } else {
        try {
            $("#loading").show();
            // API tokens 
            mapboxgl.accessToken = mapboxgl_accessToken;
            map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/dark-v8',
                center: mapboxgl.LngLat.convert(center_point),
                zoom: 4,
                minZoom: 3,
                maxZoom: 22,
                attributionControl: true
            });
            map.addControl(new mapboxgl.Navigation({
                position: 'top-left'
            }));
            map.addControl(new mapboxgl.Geocoder({
                position: 'bottom-left'
            }));
        } catch (err) {
            //Note that the user did not have any data to load
            console.log(err);
            $("#loading").hide();
            $('#DownloadModal').modal("show");
        }
    }

    map.on('style.load', function() {
        addLayerHeat(map);
        addLayerLinestring(map);
        addSegLayer(map);
        addLayerElev(map);
        render();
    });
    map.once('load', function() {
        $("#loading").hide();
    });
}

///////  HELPER FUNCTIONS    /////

function calcLegends(p, id) {
    var item = document.createElement('div');
    var key = document.createElement('span');
    key.className = 'legend-key';
    var value = document.createElement('span');

    if (id == "heat-point") {
        if ($('#legend-points-value-' + p).length > 0) {
            document.getElementById('legend-points-value-' + p).textContent = breaks[p];
            document.getElementById('legend-points-id-' + p).style.backgroundColor = colors[p];
        } else {
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
    } else if (id == "heat-line") {
        if ($('#legend-lines-value-' + p).length > 0) {
            document.getElementById('legend-lines-value-' + p).textContent = lineBreaks[p];
            document.getElementById('legend-lines-id-' + p).style.backgroundColor = lineColors[p];
        } else {
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
    } else if (id == "segment") {
        if ($('#legend-seg-value-' + p).length > 0) {
            document.getElementById('legend-seg-value-' + p).textContent = seg_breaks[p];
            document.getElementById('legend-seg-id-' + p).style.backgroundColor = lineColors[p];
        } else {
            legend = document.getElementById('legend-seg');
            key.id = 'legend-seg-id-' + p;
            key.style.backgroundColor = lineColors[p];
            value.id = 'legend-seg-value-' + p;
            item.appendChild(key);
            item.appendChild(value);
            legend.appendChild(item);
            data = document.getElementById('legend-seg-value-' + p)
            data.textContent = seg_breaks[p];
        }
    }
    else if (id == "elevation") {
        if ($('#legend-elevation-value-' + p).length > 0) {
            document.getElementById('legend-elevation-value-' + p).textContent = seg_breaks[p];
            document.getElementById('legend-elevation-id-' + p).style.backgroundColor = elev_colors[p];
        } else {
            legend = document.getElementById('legend-elevation');
            key.id = 'legend-elevation-id-' + p;
            key.style.backgroundColor = elev_colors[p];
            value.id = 'legend-elevation-value-' + p;
            item.appendChild(key);
            item.appendChild(value);
            legend.appendChild(item);
            data = document.getElementById('legend-elevation-value-' + p)
            data.textContent = elev_stops[p];
        }
    }
}

function switchLayer() {
    layer = document.getElementById("mapStyle").value;
    if (layer != 'dark-nolabel') {
        map.setStyle('mapbox://styles/mapbox/' + layer + '-v9');
    } else {
        map.setStyle('mapbox://styles/mapbox/dark-v8');
    }
    isMapLoaded(map, layer);
    map.on('load', function() {
        addLayerHeat(map);
        addLayerLinestring(map);
        addSegLayer(map);
        addLayerElev(map);
        render();
    });

}

function set_visibility(mapid, id, onoff) {
    if (id == 'heatpoints') {
        if (onoff == 'off') {
            mapid.setLayoutProperty("heatpoints-0", 'visibility', 'none');
        } else if (onoff == 'on') {
            mapid.setLayoutProperty("heatpoints-0", 'visibility', 'visible');
            mouseOver(mapid, layernames);
        }

    } else if (id == 'linestring') {
        if (onoff == 'off') {
            mapid.setLayoutProperty("linestring-0", 'visibility', 'none');
        } else if (onoff == 'on') {
            mapid.setLayoutProperty("linestring-0", 'visibility', 'visible');
            mouseOver(mapid, linelayernames);
        }

    } else if (id == 'segment') {
        if (onoff == 'off') {
            mapid.setLayoutProperty('segment-0', 'visibility', 'none');
        } else if (onoff == 'on') {
            mapid.setLayoutProperty('segment-0', 'visibility', 'visible');
            mouseOver(mapid, seg_layernames);
        }
    } else if (id == 'elevation') {
        if (onoff == 'off') {
            mapid.setLayoutProperty('elevation', 'visibility', 'none');
        } else if (onoff == 'on') {
            mapid.setLayoutProperty('elevation', 'visibility', 'visible');
            mouseOver(mapid, elev_layernames);
        }
    }
};


function render() {
    if (document.getElementById("VizType").value == "heat-point") {
        try {
            set_visibility(map, 'linestring', 'off');
            set_visibility(map, 'segment', 'off');
            set_visibility(map, 'elevation', 'off');
            $('#legend-lines').hide();
            $('#legend-seg').hide();
            $('#legend-elevation').hide();
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
            set_visibility(map, 'segment', 'off');
            set_visibility(map, 'elevation', 'off');
            $('#legend-points').hide();
            $('#legend-seg').hide();
            $('#legend-elevation').hide();
        } catch (err) {
            console.log(err);
        }
        try {
            set_visibility(map, 'linestring', 'on');
            paintLineLayer(map,
                document.getElementById("line_color").value,
                parseFloat($('#line_width').slider('getValue')),
                parseFloat($('#line_opacity').slider('getValue')),
                parseFloat($('#pitch').slider('getValue')),
                'linestring');
            $('#legend-lines').show();
        } catch (err) {
            console.log(err);
        }
    } else if (document.getElementById("VizType").value == "segment") {
        try {
            set_visibility(map, 'heatpoints', 'off');
            set_visibility(map, 'linestring', 'off');
            set_visibility(map, 'elevation', 'off');
            $('#legend-points').hide();
            $('#legend-lines').hide();
            $('#legend-elevation').hide();
        } catch (err) {
            console.log(err);
        }
        try {
            set_visibility(map, 'segment', 'on');
            paintSegLayer(map, 'segment-0',
                document.getElementById("line_color").value,
                parseFloat($('#line_width').slider('getValue')),
                parseFloat($('#line_opacity').slider('getValue')),
                parseFloat($('#pitch').slider('getValue')));
            $('#legend-seg').show();
        } catch (err) {
            console.log(err);
        }
    } else if (document.getElementById("VizType").value == "elevation") {
        try {
            set_visibility(map, 'heatpoints', 'off');
            set_visibility(map, 'linestring', 'off');
            set_visibility(map, 'segment', 'off');
            $('#legend-points').hide();
            $('#legend-lines').hide();
            $('#legend-segment').hide();
        } catch (err) {
            console.log(err);
        }
        try {
            set_visibility(map, 'elevation', 'on');
            paintElevLayer(map, 'elevation', 
                parseFloat($('#pitch').slider('getValue')),
                parseFloat(document.getElementById("fill_opacity").value));
            //$('#legend-elev').show();
        } catch (err) {
            console.log(err);
        }
    }
}

function mouseOver(mapid, layer_list) {
    mapid.off('mousemove'); //Remove any previous mouseover event binds to the map
    mapid.on('mousemove', function(e) {
        minpoint = new Array(e.point['x'] - 5, e.point['y'] - 5)
        maxpoint = new Array(e.point['x'] + 5, e.point['y'] + 5)
        var features = mapid.queryRenderedFeatures([minpoint, maxpoint], { layers: layer_list });
        // Change the cursor style as a UI indicator.
        mapid.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    });
}

function addPopup(mapid, layer_list, popup) {
    mapid.on('click', function(e) {
        minpoint = new Array(e.point['x'] - 5, e.point['y'] - 5)
        maxpoint = new Array(e.point['x'] + 5, e.point['y'] + 5)
        var features = mapid.queryRenderedFeatures([minpoint, maxpoint], { layers: layer_list });

        // Remove the popup if there are no features to display
        if (!features.length) {
            popup.remove();
            return;
        }
        var feature = features[0];
        if (document.getElementById("VizType").value == "heat-point") {
            let watts = Math.round(feature.properties.p * 10) / 10
            let hr = Math.round(feature.properties.h * 10) / 10
            let cad = Math.round(feature.properties.c * 10) / 10

            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup" class="popup"> <h5> Detail: </h5>' +
                    '<ul class="list-group">' +
                    '<li class="list-group-item"> Freq: ' + Math.round(feature.properties.d * 10) / 10 + " visits </li>" +
                    '<li class="list-group-item"> Speed: ' + Math.round(feature.properties.s * 10) / 10 + " mph </li>" +
                    '<li class="list-group-item"> Grade: ' + Math.round(feature.properties.g * 10) / 10 + " % </li>" +
                    '<li class="list-group-item"> Power: ' + (watts = watts || 0) + " watts </li>" +
                    '<li class="list-group-item"> Elevation: ' + Math.round(feature.properties.e * 10) / 10 + " ft </li>" +
                    '<li class="list-group-item"> Heartrate: ' + (hr = hr || 0) + " BPM </li>" +
                    '<li class="list-group-item"> Cadence: ' + (cad = cad || 0) + " RPM </li>" +
                    '</ul> </div>')
                .addTo(mapid);
        } else if (document.getElementById("VizType").value == "heat-line") {
            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup" class="popup"> <h5> Detail: </h5>' +
                    '<ul class="list-group">' +
                    '<li class="list-group-item"> Name: ' + feature.properties.na + " </li>" +
                    '<li class="list-group-item"> Type: ' + feature.properties.ty + " </li>" +
                    '<li class="list-group-item"> ID: ' + feature.properties.id + " </li>" +
                    '</ul> </div>')
                .addTo(mapid);
        } else if (document.getElementById("VizType").value == "segment") {
            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup" class="popup" style="z-index: 10;"> <h5> Detail: </h5>' +
                    '<ul class="list-group">' +
                    '<li class="list-group-item"> Act Type: ' + feature.properties.ACT_TYPE + " </li>" +
                    '<li class="list-group-item"> Distance: ' + feature.properties.DISTANCE + " </li>" +
                    '<li class="list-group-item"> Athlete Count: ' + feature.properties.ATH_CNT + " </li>" +
                    '<li class="list-group-item"> Effort Count: ' + feature.properties.EFFORT_CNT + " </li>" +
                    '<li class="list-group-item"> Total Elev Gain ' + feature.properties.TOTAL_ELEV + " </li>" +
                    '<li class="list-group-item"> Avg Grade: ' + feature.properties.AVG_GRADE + " </li>" +
                    '<li class="list-group-item"> Max Grade: ' + feature.properties.MAX_GRADE + " </li>" +
                    '<li class="list-group-item"> KOM Category: ' + feature.properties.CAT + " </li>" +
                    '</ul> </div>')
                .addTo(mapid);
        } else if (document.getElementById("VizType").value == "elevation") {
            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup" class="popup"> <h5> Detail: </h5>' +
                    '<ul class="list-group">' +
                    '<li class="list-group-item"> Elevation: ' + feature.properties.e + " </li>" +
                    '</ul> </div>')
                .addTo(mapid);
        }
    });
}


//////////////// SLIDERS AND BUTTON ACTIONS ////////////

//on change of VizType, show only menu options linked to selected viztype

function isMapLoaded(mapid, source) {
    $("#loading").show()
        //check if map is loaded every retry_interval seconds and display or hide loading bar
    map.on('data', function(ev) {
        if (ev.dataType === 'tile' && (ev.source.id === 'segment' ||
                ev.source.id === 'heatpoint' ||
                ev.source.id === 'linestring' ||
                ev.source.id === 'elevation')) { $("#loading").hide() };
    });
}

function fit(mapid, geojson_object) {
    //fit gl map to a geojson file bounds - depricated for now!
    console.log(geojson_object)
    try {
        mapid.fitBounds(geojsonExtent(geojson_object));
    } catch (err) {
        //Note that the user did not have any data to load
        console.log(err);
        $("#loading").hide();
        $('#DownloadModal').modal("show");
    }
}

function hideLoading() {
    $("#loading").hide();
}


function getStravaLeaderboard(segid, token) {
    $.getJSON('https://www.strava.com/api/v3/segments/' + segid + '/leaderboard?' +
        'access_token=' + token,
        function(data) {
            console.log(data)
        });

}
