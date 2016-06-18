/////////////  Global variables  ////////////

var draw_canvas;
var linestring_src;
var heatpoint_src;
var segment_src;
var VizType = 'heat-point';
var map_style = 'dark-nolabel';
var curStyle;
var map;

function addSegLayer(mapid, seg_url) {
    if (mapid.getSource('segment')) {
        try {
            segment_src.setData(seg_url);
            render();
        } catch (err) {
            console.log(err);
        }
    } else {
        try {
            isMapLoaded(mapid, 300);
            segment_src = new mapboxgl.GeoJSONSource({
                data: seg_url,
                maxzoom: 22,
                buffer: 10,
                tolerance: 1
            });
            mapid.addSource('segment', segment_src);
        } catch (err) {
            console.log(err);
        }
        try {
            calcSegFilters(seg_breaks, 'dist');
            calcSegLayers(seg_filters, lineColors);
            for (var p = 0; p < seg_layers.length; p++) {
                mapid.addLayer(seg_layers[p]);
                calcLegends(p, 'segment');
            };
            addPopup(mapid, seg_layernames, segpopup);
            render();
        } catch (err) {
            console.log(err);
        }
    }
};

function addLayerLinestring(mapid) {
    linestring_src = new mapboxgl.GeoJSONSource({
        data: heatline_url,
        maxzoom: 22,
        buffer: 0,
        buffer: 10,
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
        for (var p = 0; p < lineLayers.length; p++) {
            mapid.addLayer(lineLayers[p]);
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
    heatpoint_src = new mapboxgl.GeoJSONSource({
        data: heatpoint_url,
        maxzoom: 22,
        buffer: 10,
        tolerance: 10
    });
    try {
        mapid.addSource('heatpoint', heatpoint_src);
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


/////  Main Function  ///////
function initVizMap() {
    if (!mapboxgl.supported()) {
        alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    } else {
        try {
            // API tokens 
            mapboxgl.accessToken = mapboxgl_accessToken;
            $('#legend-lines').hide();
            map = new mapboxgl.Map({
                container: 'map',
                /*rsbaumann/ciiia74pe00298ulxsin2emmn*/
                style: 'mapbox://styles/mapbox/dark-v8',
                center: mapboxgl.LngLat.convert(center_point),
                zoom: 4,
                minZoom: 3,
                maxZoom: 20,
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
        addSegLayer(map, getURL(map, 'False'));
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
}

function switchLayer() {
    layer = document.getElementById("mapStyle").value;
    isMapLoaded(map, 300);
    if (layer != 'dark-nolabel') {
        map.setStyle('mapbox://styles/mapbox/' + layer + '-v9');
    } else {
        map.setStyle('mapbox://styles/mapbox/dark-v8');
    }
    map.on('load', function() {
        addLayerHeat(map);
        addLayerLinestring(map);
        addSegLayer(map, getURL(map, 'False'));
        render();
    });

}

function set_visibility(mapid, id, onoff) {
    if (id == 'heatpoints') {
        for (var p = 0; p < layers.length; p++) {
            if (onoff == 'off') {
                mapid.setLayoutProperty("heatpoints" + "-" + p, 'visibility', 'none');
            } else if (onoff == 'on') {
                mapid.setLayoutProperty("heatpoints" + "-" + p, 'visibility', 'visible');
                mouseOver(mapid, layernames);
            }
        };
    } else if (id == 'linestring') {
        for (var p = 0; p < lineLayers.length; p++) {
            if (onoff == 'off') {
                mapid.setLayoutProperty("linestring" + "-" + p, 'visibility', 'none');
            } else if (onoff == 'on') {
                mapid.setLayoutProperty("linestring" + "-" + p, 'visibility', 'visible');
                mouseOver(mapid, linelayernames);
            }
        };
    } else if (id == 'segment') {
        for (var p = 0; p < seg_layers.length; p++) {
            if (onoff == 'off') {
                mapid.setLayoutProperty('segment' + "-" + p, 'visibility', 'none');
            } else if (onoff == 'on') {
                mapid.setLayoutProperty('segment' + "-" + p, 'visibility', 'visible');
                mouseOver(mapid, seg_layernames);
            }
        }
    }
};


function render() {
    if (document.getElementById("VizType").value == "heat-point") {
        try {
            set_visibility(map, 'linestring', 'off');
            if (map.getSource('segment')) {
                set_visibility(map, 'segment', 'off');
            }
            $('#legend-lines').hide();
            $('#legend-seg').hide();
            map.off('dragend')
                .off('zoomend');
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
            if (map.getSource('segment')) {
                set_visibility(map, 'segment', 'off');
            }
            $('#legend-points').hide();
            $('#legend-seg').hide();
            map.off('dragend')
                .off('zoomend');
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
    } else if (document.getElementById("VizType").value == "segment") {
        try {
            set_visibility(map, 'heatpoints', 'off');
            set_visibility(map, 'linestring', 'off');
            $('#legend-points').hide();
            $('#legend-lines').hide();
            map.off('dragend')
                .off('zoomend');
            map.on('dragend', function() {
                    addSegLayer(map, getURL(map, 'False'));
                })
                .on('zoomend', function() {
                    addSegLayer(map, getURL(map, 'False'));
                });
        } catch (err) {
            console.log(err);
        }
        try {
            if (map.getSource('segment')) {
                set_visibility(map, 'segment', 'on');
                addSegLayer(map, getURL(map, 'False'));
                paintSegLayer(map, 'segment',
                    document.getElementById("line_color").value,
                    parseFloat($('#line_width').slider('getValue')),
                    parseFloat($('#line_opacity').slider('getValue')),
                    parseFloat($('#pitch').slider('getValue')));
                $('#legend-seg').show();
            } else {
                addSegLayer(map, getURL(map, 'False'));
            }
        } catch (err) {
            console.log(err);
        }
    }
}

function mouseOver(mapid, layer_list) {
    mapid.off('mousemove'); //Remove any previous mouseover event binds to the map
    mapid.on('mousemove', function(e) {
        minpoint = new Array(e.point['x'] - 10, e.point['y'] - 10)
        maxpoint = new Array(e.point['x'] + 10, e.point['y'] + 10)
        var features = mapid.queryRenderedFeatures([minpoint, maxpoint], { layers: layer_list });
        // Change the cursor style as a UI indicator.
        mapid.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    });
}

function addPopup(mapid, layer_list, popup) {
    mapid.on('click', function(e) {
        minpoint = new Array(e.point['x'] - 10, e.point['y'] - 10)
        maxpoint = new Array(e.point['x'] + 10, e.point['y'] + 10)
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
                    '<li class="list-group-item"> Name: ' + feature.properties.name + " </li>" +
                    '<li class="list-group-item"> Type: ' + feature.properties.type + " </li>" +
                    '<li class="list-group-item"> Dist: ' + Math.round(feature.properties.dist * 10) / 10 + " (mi) </li>" +
                    '<li class="list-group-item"> Elev: ' + Math.round(feature.properties.elev * 10) / 10 + " (ft) </li>" +
                    '</ul> </div>')
                .addTo(mapid);
        }
    });
}


//////////////// SLIDERS AND BUTTON ACTIONS ////////////

//on change of VizType, show only menu options linked to selected viztype

function isMapLoaded(mapid, interval, segUrl) {
    //check if map is loaded every retry_interval seconds and display or hide loading bar
    var timer = setInterval(isLoaded, interval);

    function isLoaded() {
        if (mapid.loaded() && segUrl === undefined) {
            $("#loading").hide();
            clearInterval(timer);
        } else if (segUrl != undefined) {
            $("#loading").show();
            if (mapid.loaded()) {
                $("#loading").show();
                mapid.once('render', function() {
                    $("#loading").hide();
                    clearInterval(timer);
                })
            }
        } else {
            $("#loading").show();
        };
    }
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
