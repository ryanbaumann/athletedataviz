// API tokens 
mapboxgl.accessToken = mapboxgl_accessToken;

/////////////  Global variables  ////////////
var draw_canvas;
var linestring_src;
var heatpoint_src;
var segment_src;
var VizType = 'heat-point';
var map_style = 'dark-nolabel';
var curStyle;
var map;

var color_list = [
    ['blue', 'cyan', 'lime', 'yellow', 'red'],
    ['purple', 'pink', 'blue', 'yellow', 'orange'],
    ['green', 'aquamarine', 'blanchedalmond', 'coral', 'red']
]

var line_color_list = [
    ['#00FFFF', '#33FF00', '#FFFF00', "#FF0099", "Red"],
    ['#F52D29', '#E21EB4', '#01970B', '#07A991', '#1911C6'],
    ['#DDD39B', '#E3D88D', '#EEE175', '#F8EB5A', '#FFF447'],
    ['#ABDD9B', '#9EE38D', '#86EE75', '#67F85A', '#50FF47'],
    ['#EE9990', '#E57B73', '#D74E48', '#CA211D', '#C10301']
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

var seg_style = {
    "id": "segment",
    "type": "line",
    "source": 'segment',
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

//Global variables for heat-lines
var lineBreaks = ['Ride', 'Run', 'NordicSki', 'Hike', 'Other'];
var lineColors = line_color_list[0];
var lineFilters = [];
var lineLayers = [];
var linelayernames=[];
var linepopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});
//Global variables for heat-points
var breaks = [3, 6, 9, 12, 16];
var colors = color_list[0];
var layers = [];
var filters = [];
var layernames=[];
var heatpopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});
//Global variables for segments
var seg_breaks = [3, 6, 9, 12, 16];
var seg_layers = [];
var seg_filters = [];
var seg_layernames=[];
var segpopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

/////  Main Function  ///////
function initVizMap() {
    if (!mapboxgl.supported()) {
        alert('Your browser does not support Mapbox GL.  Please try Chrome or Firefox.');
    } else {
        try {
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

function updateHeatLegend() {
    document.getElementById('legend-points-param').textContent = $("#heattype option:selected").text();
}

function updateSegLegend() {
    document.getElementById('legend-seg-param').textContent = $("#segParam option:selected").text();
}

function calcLegends(p, id) {
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
    else if (id == "heat-line") {
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
    else if (id == "segment") {
        if ($('#legend-seg-value-' + p).length > 0) {
            document.getElementById('legend-seg-value-' + p).textContent = seg_breaks[p];
            document.getElementById('legend-seg-id-' + p).style.backgroundColor = lineColors[p];
        }
        else {
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

function calcLineFilters(breaks, param) {
    //calculate line filters to apply
    lineFilters = [];
    for (var p = 0; p < lineBreaks.length - 1; p++) {
        lineFilters.push(['==', param, lineBreaks[p]])
    }
}

function calcLineLayers() {
    //calculate line layers to create
    lineLayers = [];
    linelayernames = [];
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
        linelayernames.push('linestring-' + p);
    }
}

function calcSegBreaks(maxval, numbins) {
    //calculate breaks based on a selected bin size and number of bins
    seg_breaks = [];  //empty the segment breaks array
    var binSize = maxval / numbins;
    for (p = 1; p <= numbins; p++) {
        seg_breaks.push(Math.round(binSize * p *10)/10);
    }
    updateSegLegend();
    for (p = 0; p < seg_layers.length; p++) {
        calcLegends(p, 'segment');
    }
}

function calcSegFilters(breaks, param) {
    //calculate line filters to apply
    seg_filters = [];
    for (var p = 0; p < seg_breaks.length; p++) {
        if (p <= 0) {
            seg_filters.push(['all', ['<', param, seg_breaks[p + 1]]])
        } else if (p < seg_breaks.length - 1) {
            seg_filters.push(['all', ['>=', param, seg_breaks[p]],
                ['<', param, breaks[p + 1]]
            ])
        } else {
            seg_filters.push(['all', ['>=', param, seg_breaks[p]]])
        }
    }
}

function calcSegLayers() {
    //calculate line layers to create
    seg_layers = [];
    seg_layernames = [];
    for (var p = 0; p < seg_filters.length; p++) {
        seg_layers.push({
            id: 'segment-' + p,
            type: 'line',
            source: 'segment',
            paint: {
                "line-opacity": parseFloat(document.getElementById("line_opacity").value),
                "line-width": parseFloat(document.getElementById("line_width").value),
                "line-color": lineColors[p],
                "line-gap-width": 0
            },
            filter: seg_filters[p]
        });
        seg_layernames.push('segment-' + p);
    }
}

function calcBreaks(maxval, numbins) {
    //calculate breaks based on a selected bin size and number of bins
    breaks = [];  //empty the breaks array
    var binSize = maxval / numbins;
    for (p = 1; p <= numbins; p++) {
        breaks.push(Math.round(binSize * p *10)/10);
    }
    updateHeatLegend();
    for (p = 0; p < breaks.length; p++) {
        calcLegends(p, 'heat-point');
    }
}

function calcHeatLayers() {
    //create layers with filters
    layers = [];
    layernames=[];
    layers.push({
        id: 'heatpoints-0',
        type: 'circle',
        source: 'heatpoint',
        paint: {
            "circle-radius": {
                stops: [
                        [12, 1],
                        [14, 2],
                        [16, 4],
                        [18, 8]
                       ]
            },
            "circle-color": {
                property: 's',
                stops: [
                [breaks[0], colors[0]],
                [breaks[1], colors[1]],
                [breaks[2], colors[2]],
                [breaks[3], colors[3]],
                [breaks[4], colors[4]]
            ]
            },
            "circle-opacity": 0.8,
            "circle-blur": 0.5
        }
    });
    layernames.push('heatpoints-0');
}


//Query URL Args parsing for segments layers
function EncodeQueryData(data) {
    var ret = [];
    for (var d in data)
        ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    return ret.join("&");
}

function getURL(mapid, newSegs) {

    var bounds = mapid.getBounds();
    var sw = bounds.getSouthWest().wrap().toArray();
    var ne = bounds.getNorthEast().wrap().toArray();
    var east = ne[0]
    var south = sw[1]
    var west = sw[0]
    var north = ne[1]
    var acttype = document.getElementById("segType").value;
    var start_dist = parseFloat($('#dist_filter').slider('getValue')[0])*1609.34;
    var end_dist = parseFloat($('#dist_filter').slider('getValue')[1])*1609.34;
    var params = {
        'startLat': south,
        'startLong': west,
        'endLat': north,
        'endLong': east,
        'act_type': acttype,
        'start_dist': start_dist,
        'end_dist': end_dist,
        'newSegs' : newSegs
    };
    var queryString = EncodeQueryData(params);
    var targetURL = seg_base_url + queryString;
    return targetURL;
};

//Add heat points function
function addLayerHeat(mapid) {
    // Mapbox JS Api - import heatmap layer
    heatpoint_src = new mapboxgl.GeoJSONSource({
        data: heatpoint_url,
        maxzoom: 22,
        buffer: 1,
        tolerance: 1
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


function addLayerLinestring(mapid) {
    linestring_src = new mapboxgl.GeoJSONSource({
        data: heatline_url,
        maxzoom: 22,
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
        for (var p = 0; p < lineLayers.length; p++) {
            mapid.addLayer(lineLayers[p]);
            calcLegends(p, 'heat-lines');
        };
        addPopup(map, linelayernames, linepopup);
    } catch (err) {
        console.log(err);
    }
};

function addSegLayer(mapid, seg_url) {
        if (mapid.getSource('segment')) {
            try {
                segment_src.setData(seg_url);
                render();
            } catch (err) {
                console.log(err);
            }
        }
        else {
            try {
                isMapLoaded(mapid, 300);
                segment_src = new mapboxgl.GeoJSONSource({
                    data: seg_url,
                    maxzoom: 22,
                    buffer: 1,
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

function paintLayer(mapid, color, width, opacity, pitch, layer) {
    lineColors = line_color_list[parseFloat(document.getElementById("line_color").value)]
    mapid.setPitch(pitch);
    for (var p = 0; p < lineLayers.length; p++) {
        calcLegends(p, 'heat-line');
        mapid.setPaintProperty(layer + '-' + p, 'line-color', lineColors[p]);
        mapid.setPaintProperty(layer + '-' + p, 'line-width', width);
        mapid.setPaintProperty(layer + '-' + p, 'line-opacity', opacity);
        mapid.setPaintProperty(layer + '-' + p, 'line-gap-width', 
            parseFloat(document.getElementById("line_offset").value));
    };
}

function paintSegLayer(mapid, layer, color, width, opacity, pitch) {
    lineColors = line_color_list[parseFloat(document.getElementById("line_color").value)]
    mapid.setPitch(pitch);
    calcSegBreaks(parseFloat($('#segScale').slider('getValue')), lineColors.length);
    calcSegFilters(seg_breaks, document.getElementById('segParam').value);
    for (var p = 0; p < seg_layers.length; p++) {
        mapid.setFilter(layer + '-' + p, seg_filters[p]);
        mapid.setPaintProperty(layer + '-' + p, 'line-color', lineColors[p]);
        mapid.setPaintProperty(layer + '-' + p, 'line-width', width);
        mapid.setPaintProperty(layer + '-' + p, 'line-opacity', opacity);
        mapid.setPaintProperty(layer + '-' + p, 'line-gap-width', 
            parseFloat(document.getElementById("line_offset").value));
    };
}


//Update heatpoints properties
function paintCircleLayer(mapid, layer, opacity, radius, blur, pitch) {
    //Update the break and filter settings
    mapid.setPitch(pitch);
    colors = color_list[parseFloat(document.getElementById('heat_color').value)];
    calcBreaks(parseFloat($('#scale').slider('getValue')), colors.length);
    circle_color_property = document.getElementById('heattype').value
    radius_values=[radius*1, radius*2, radius*4, radius*6, radius*8]
    circle_radius_style = { "base": radius,
                              "stops": [
                                [12, radius_values[0]],
                                [14, radius_values[1]],
                                [16, radius_values[2]],
                                [18, radius_values[3]],
                                [20, radius_values[3]]
                               ]
                        };
    circle_color_style = { "property": circle_color_property,
                        "stops": [
                            [breaks[0], colors[0]],
                            [breaks[1], colors[1]],
                            [breaks[2], colors[2]],
                            [breaks[3], colors[3]],
                            [breaks[4], colors[4]]
                            ]
                        };
    mapid.setPaintProperty(layer + '-' + 0, 'circle-radius', circle_radius_style);
    mapid.setPaintProperty(layer + '-' + 0, 'circle-color', circle_color_style);
    mapid.setPaintProperty(layer + '-' + 0, 'circle-blur', blur);
    mapid.setPaintProperty(layer + '-' + 0, 'circle-opacity', opacity);

}

function render() {
    //isMapLoaded(map, 0.5);
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
                paintSegLayer(map, 'segment',
                    document.getElementById("line_color").value,
                    parseFloat($('#line_width').slider('getValue')),
                    parseFloat($('#line_opacity').slider('getValue')),
                    parseFloat($('#pitch').slider('getValue')));
                $('#legend-seg').show();
            }
            else {
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
        minpoint = new Array(e.point['x']-10, e.point['y']-10)
        maxpoint = new Array(e.point['x']+10, e.point['y']+10)
        var features = mapid.queryRenderedFeatures([minpoint, maxpoint], { layers : layer_list});
        // Change the cursor style as a UI indicator.
         mapid.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    });
}

function addPopup(mapid, layer_list, popup) {
    mapid.on('click', function(e) {
        minpoint = new Array(e.point['x']-10, e.point['y']-10)
        maxpoint = new Array(e.point['x']+10, e.point['y']+10)
        var features = mapid.queryRenderedFeatures([minpoint, maxpoint], { layers : layer_list});
        // Remove the popup if there are no features to display
        if (!features.length) {
            popup.remove();
            return;
        }
        var feature = features[0];
        if (document.getElementById("VizType").value == "heat-point") {
            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup" class="popup"> <h5> Detail: </h5>' +
                    '<ul class="list-group">' +
                    '<li class="list-group-item"> Freq: ' + Math.round(feature.properties.d *10)/10 + " visits </li>" +
                    '<li class="list-group-item"> Speed: ' + Math.round(feature.properties.s*10)/10 + " mph </li>" +
                    '<li class="list-group-item"> Grade: ' + Math.round(feature.properties.g*10)/10 + " % </li>" +
                    '</ul> </div>')
            .addTo(mapid);
        }
        else if (document.getElementById("VizType").value == "heat-line") {
            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup" class="popup"> <h5> Detail: </h5>' +
                    '<ul class="list-group">' +
                    '<li class="list-group-item"> Name: ' + feature.properties.na + " </li>" +
                    '<li class="list-group-item"> Type: ' + feature.properties.ty + " </li>" +
                    '<li class="list-group-item"> ID: ' + feature.properties.id + " </li>" +
                    '</ul> </div>')
            .addTo(mapid);
        }
        else if (document.getElementById("VizType").value == "segment") {
            popup.setLngLat(e.lngLat)
                .setHTML('<div id="popup" class="popup" style="z-index: 10;"> <h5> Detail: </h5>' +
                    '<ul class="list-group">' +
                    '<li class="list-group-item"> Name: ' + feature.properties.name + " </li>" +
                    '<li class="list-group-item"> Type: ' + feature.properties.type + " </li>" +
                    '<li class="list-group-item"> Dist: ' + Math.round(feature.properties.dist*10)/10 + " (mi) </li>" +
                    '<li class="list-group-item"> Elev: ' + Math.round(feature.properties.elev*10)/10 + " (ft) </li>" +
                    '</ul> </div>')
            .addTo(mapid);
        }
    });
}


//////////////// SLIDERS AND BUTTON ACTIONS ////////////

//on change of VizType, show only menu options linked to selected viztype
$( document ).ready(function() {
    $('#VizType').change(function() {
        var selector = '#VizType_hide_' + $(this).val();
        if (document.getElementById("VizType").value == "segment"){
            $('#VizType_hide_heat-line').collapse('show');
            $(selector).collapse('show');
            $('#VizType_hide_heat-point').collapse('hide');
        }
        else if (document.getElementById("VizType").value == "heat-line"){
            $(selector).collapse('show');
            $('#VizType_hide_heat-point').collapse('hide');
            $('#VizType_hide_segment').collapse('hide');
        }
        else {
            $(selector).collapse('show');
            $('#VizType_hide_heat-line').collapse('hide');
            $('#VizType_hide_segment').collapse('hide');
        }
    });

    $('#updateSeg').on('click touch tap', function(event) {
        isMapLoaded(map, 300, 'url');
        addSegLayer(map, getURL(map, 'True'));
        render();
    });

    $('#segType').change(function(event) {
        addSegLayer(map, getURL(map, 'False'));
        render();
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
    $('#dist_filter').slider({
        formatter: function(value) {
            return 'Value: ' + value;
        }
    });
    $('#dist_filter').slider().on('slideStop', function(ev) {
        $('#dist_filter').slider('setValue', ev.value);
        addSegLayer(map, getURL(map, 'False'));
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
    $('#segScale').slider({
        formatter: function(value) {
            return 'Value: ' + value;
        }
    });
    $('#segScale').slider().on('slideStop', function(ev) {
        $('#segScale').slider('setValue', ev.value);
        render();
    });
    $('#scale').slider({
        formatter: function(value) {
            return 'Value: ' + value;
        }
    });
    $('#scale').slider().on('slideStop', function(ev) {
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


    $('#heat_color').change(render);
    $('#VizType').change(render);
    $('#mapStyle').change(switchLayer);
    $('#heattype').change(render);
    $('#segParam').change(render);
    $('#heat_color').change(render);
    $('#line_color').change(render);
    $('#snap').on('click touch tap', generateMap);

});

function isMapLoaded(mapid, interval, segUrl) {
    //check if map is loaded every retry_interval seconds and display or hide loading bar
    var timer = setInterval(isLoaded, interval);
    function isLoaded() {
        if (mapid.loaded() && segUrl === undefined) {
            $("#loading").hide();
            clearInterval(timer);
        }
        else if (segUrl != undefined) {
            $("#loading").show();
            if (mapid.loaded()) {
                $("#loading").show();
                mapid.once('render', function() {
                    $("#loading").hide();
                    clearInterval(timer);
                })
            }
        }
        else {
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

function getDataLinestring(callback) {
    $.getJSON( heatpoint_url , function(data) {
        stravaHeatGeoJson = JSON.parse(data); 
        r.resolve();
    }),
    callback(stravaHeatGeoJson);
};

function getStravaLeaderboard(segid, token) {
    $.getJSON('https://www.strava.com/api/v3/segments/' + segid + '/leaderboard?' +
        'access_token=' + token, function (data) {
             console.log(data)
         });
    
}
