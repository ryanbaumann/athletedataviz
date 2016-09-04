var line_color_list = [
    ['#00FFFF', '#33FF00', '#FFFF00', "#FF0099", "Red"],
    ['#F52D29', '#E21EB4', '#01970B', '#07A991', '#1911C6'],
    ['#DDD39B', '#E3D88D', '#EEE175', '#F8EB5A', '#FFF447'],
    ['#ABDD9B', '#9EE38D', '#86EE75', '#67F85A', '#50FF47'],
    ['#EE9990', '#E57B73', '#D74E48', '#CA211D', '#C10301']
]

//Global variables for heat-lines
var lineBreaks = ['Ride', 'Run', 'NordicSki', 'Hike', 'Other'];
var lineColors = line_color_list[0];
var lineFilters = [];
var lineLayers = [];
var linelayernames = [];
var linepopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

function calcLineFilters(breaks, param) {
    //calculate line filters to apply
    lineFilters = [];
    for (var p = 0; p < lineBreaks.length - 1; p++) {
        lineFilters.push(['==', param, lineBreaks[p]])
    }
}

function calc_stops(lineBreaks, lineColors) {
    let stops = []
    for (var i = 0; i < lineBreaks.length; i++) {
        stops.push([lineBreaks[i], lineColors[i]]);
    }
    return stops
}

function calcLineLayers() {
    //calculate line layers to create
    lineLayers = [];
    linelayernames = [];
    lineLayers.push({
        id: 'linestring-' + 0,
        type: 'line',
        source: 'linestring',
        paint: {
            "line-opacity": parseFloat(document.getElementById("line_opacity").value),
            "line-width": parseFloat(document.getElementById("line_width").value),
            "line-color": {
                property: 'ty',
                type: 'categorical',
                stops: calc_stops(lineBreaks, lineColors)
            },
            "line-gap-width": 0
        }
    });
    linelayernames.push('linestring-' + 0);
}

function paintLayer(mapid, color, width, opacity, pitch, layer) {
    mapid.setPitch(pitch);
    lineColors = line_color_list[parseFloat(document.getElementById("line_color").value)]
    calcLegends(p, 'heat-line');
    mapid.setPaintProperty(layer + '-' + 0, 'line-color', calc_stops(lineBreaks, lineColors));
    mapid.setPaintProperty(layer + '-' + 0, 'line-width', width);
    mapid.setPaintProperty(layer + '-' + 0, 'line-opacity', opacity);
    mapid.setPaintProperty(layer + '-' + 0, 'line-gap-width',
        parseFloat(document.getElementById("line_offset").value));
}

function getDataLinestring(callback) {
    $.getJSON(heatpoint_url, function(data) {
            stravaHeatGeoJson = JSON.parse(data);
            r.resolve();
        }),
        callback(stravaHeatGeoJson);
};
