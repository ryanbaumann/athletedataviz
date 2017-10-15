/////////////  Global variables  ////////////

var draw_canvas;
var linestring_src;
var heatpoint_src;
var segment_src;
var VizType = 'heat-point';
var map_style = 'mapbox://styles/mapbox/dark-v9';
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

var buildings_baselayer = {
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 15,
    'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': {
            'type': 'identity',
            'property': 'height'
        },
        'fill-extrusion-base': {
            'type': 'identity',
            'property': 'min_height'
        },
        'fill-extrusion-opacity': .6
    }
};

function addBuildingsLayer(mapid) {
    mapid.addLayer(buildings_baselayer,
        'waterway-label')
}

function calc_stops(breaks, colors) {
    //Given an array of breaks and colors, return a Style JSON stops array
    //breaks and colors must be the same length
    let stops = []
    for (var i = 0; i < breaks.length; i++) {
        stops.push([breaks[i], colors[i]]);
    }
    return stops
}

function addSegLayer(mapid) {

    if (!map.getSource('segment')) {
        mapid.addSource('segment', {
            type: 'vector',
            url: 'mapbox://rsbaumann.ADV_all_segments'
        });
    }

    if (!map.getLayer('segment-0')) {
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
        }, 'waterway-label');

        //mapid.addLayer(buildings_baselayer, 'waterway-label');
        for (p = 0; p < lineColors.length; p++) {
            calcLegends(p, 'segment');
        }

        addPopup(mapid, seg_layernames, segpopup);
    }

};

function addLayerLinestring(mapid) {

    if (!map.getSource('linestring')) {
        mapid.addSource('linestring', {
            type: 'geojson',
            data: heatline_url,
            buffer: 1,
            maxzoom: 12
        });
    }

    calcLineLayers();
    mapid.addLayer(lineLayers[0], 'waterway-label');
    //mapid.addLayer(buildings_baselayer, 'waterway-label');
    for (var p = 0; p < breaks.length; p++) {
        calcLegends(p, 'heat-lines');
    };
    addPopup(map, linelayernames, linepopup);

};

//Add heat points function
function addLayerHeat(mapid) {
    // Mapbox JS Api - import heatmap layer
    if (!map.getSource('heatpoint')) {
        mapid.addSource('heatpoint', {
            type: 'geojson',
            data: heatpoint_url,
            buffer: 1,
            maxzoom: 12
        });
    }

    calcHeatLayers()
    mapid.addLayer(layers[0], 'waterway-label');

    for (var p = 0; p < breaks.length; p++) {
        calcLegends(p, 'heat-point');
    };
    addPopup(mapid, layernames, heatpopup);

};

//Add heat points function
function addLayerElev(mapid) {
    // Mapbox JS Api - import heatmap layer
    try {

        mapid.addSource('elevation', {
            type: 'geojson',
            data: evelpoly_url,
            buffer: 10,
            maxzoom: 12
        });
    } catch (err) {
        console.log(err);
    }

    try {
        mapid.addLayer({
            "id": 'elevation',
            "source": 'elevation',
            "type": "fill-extrusion",
            "paint": {
                "fill-extrusion-height": {
                    "type": "exponential",
                    "stops": [
                        [0, 0],
                        [2500, 5000]
                    ],
                    "property": "e"
                },
                "fill-extrusion-color": {
                    "type": "exponential",
                    "stops": [
                        [0, "#6BEBAE"],
                        [2500, "#EC8E5D"]
                    ],
                    "property": "e"
                },
                "fill-extrusion-opacity": 0.9
            }
        }, 'waterway-label');
        mapid.addLayer(buildings_baselayer, 'waterway-label');
    } catch (err) {
        console.log(err);
    }
    addPopup(mapid, elev_layernames, elev_popup);
};

function initLayers() {
    //Ensure that map is loaded quickly by first rendering the currently selected layer
    let functions = [addLayerHeat, addLayerLinestring,
        addSegLayer, addLayerElev
    ]
    if (document.getElementById("VizType").value == "heat-point") {
        functions[0](map);
        functions.splice(0, 1)
    } else if (document.getElementById("VizType").value == "heat-line") {
        functions[1](map);
        functions.splice(1, 1)
    } else if (document.getElementById("VizType").value == "segment") {
        functions[2](map);
        functions.splice(2, 1)
    } else if (document.getElementById("VizType").value == "elevation") {
        functions[3](map);
        functions.splice(3, 1)
    }
    for (i = 0; i < functions.length; i++) {
        functions[i](map)
    }
    render();
    $("#loading").hide();
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
                style: 'mapbox://styles/mapbox/dark-v9',
                center: mapboxgl.LngLat.convert(center_point),
                zoom: 4,
                minZoom: 2,
                maxZoom: 22,
            });
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            map.addControl(new MapboxGeocoder({ accessToken: mapboxgl.accessToken }), 'top-left');
        } catch (err) {
            //Note that the user did not have any data to load
            console.log(err);
            $("#loading").hide();
            $('#DownloadModal').modal("show");
        }
    }

    map.once('load', function() {
        getBbox();
        initLayers();
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
    } else if (id == "elevation") {
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

function switchLayer(mapid) {
    layer = document.getElementById("mapStyle").value;
    mapid.setStyle(layer);
    mapid.once('style.load', function() {
        initLayers();
        isMapLoaded(map)
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
    isMapLoaded(map);
    if (document.getElementById("VizType").value == "heat-point") {
        setHeatRange();
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
    var onMove = function(e) {
        minpoint = new Array(e.point['x'] - 5, e.point['y'] - 5)
        maxpoint = new Array(e.point['x'] + 5, e.point['y'] + 5)
        var features = mapid.queryRenderedFeatures([minpoint, maxpoint], { layers: layer_list });
        // Change the cursor style as a UI indicator.
        mapid.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    }
    mapid.on('mousemove', _.debounce(onMove, 12));
}

function addPopup(mapid, layer_list, popup) {
    //Hide all existing popups

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
                .setHTML('<div id="popup"> <h4> Detail: </h4>' +
                    '<ul>' +
                    '<li> Freq: ' + Math.round(feature.properties.d * 10) / 10 + " visits </li>" +
                    '<li> Speed: ' + Math.round(feature.properties.s * 10) / 10 + " mph </li>" +
                    '<li> Grade: ' + Math.round(feature.properties.g * 10) / 10 + " % </li>" +
                    '<li> Power: ' + (watts = watts || 0) + " watts </li>" +
                    '<li> Elevation: ' + Math.round(feature.properties.e * 10) / 10 + " ft </li>" +
                    '<li> Heartrate: ' + (hr = hr || 0) + " BPM </li>" +
                    '<li> Cadence: ' + (cad = cad || 0) + " RPM </li>" +
                    '</ul> </div>')
                .addTo(mapid);
        } else if (document.getElementById("VizType").value == "heat-line") {
            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup"> <h4> Detail: </h4>' +
                    '<ul>' +
                    '<li> Name: ' + feature.properties.na + " </li>" +
                    '<li> Type: ' + feature.properties.ty + " </li>" +
                    '<li> ID: ' + feature.properties.id + " </li>" +
                    '</ul> </div>')
                .addTo(mapid);
        } else if (document.getElementById("VizType").value == "segment") {
            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup"> <h4> Detail: </h4>' +
                    '<ul>' +
                    '<li> Act Type: ' + feature.properties.ACT_TYPE + " </li>" +
                    '<li> Distance: ' + feature.properties.DISTANCE + " </li>" +
                    '<li> Athlete Count: ' + feature.properties.ATH_CNT + " </li>" +
                    '<li> Effort Count: ' + feature.properties.EFFORT_CNT + " </li>" +
                    '<li> Total Elev Gain ' + feature.properties.TOTAL_ELEV + " </li>" +
                    '<li> Avg Grade: ' + feature.properties.AVG_GRADE + " </li>" +
                    '<li> Max Grade: ' + feature.properties.MAX_GRADE + " </li>" +
                    '<li> KOM Category: ' + feature.properties.CAT + " </li>" +
                    '</ul> </div>')
                .addTo(mapid);
        } else if (document.getElementById("VizType").value == "elevation") {
            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup"> <h4> Detail: </h4>' +
                    '<ul>' +
                    '<li> Elevation: ' + feature.properties.e + " </li>" +
                    '</ul> </div>')
                .addTo(mapid);
        }
    });
}


//////////////// SLIDERS AND BUTTON ACTIONS ////////////

//on change of VizType, show only menu options linked to selected viztype

function isMapLoaded(mapid) {
    $("#loading").show()
    map.on('render', afterChangeComplete);

    function afterChangeComplete() {
        if (!map.loaded()) {
            return
        } // still not loaded; bail out.

        // now that the map is loaded, it's safe to query the features:
        $("#loading").hide();

        map.off('render', afterChangeComplete); // remove this handler now that we're done.
    }
};

function getBbox() {
    $.getJSON(bbox_url, function(data) {
        fit(map, data)
    });
}

function fit(mapid, geojson_object) {
    //fit gl map to a geojson file bounds - depricated for now!
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