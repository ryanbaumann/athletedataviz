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

function calc_stops(breaks, colors) {
    //Given an array of breaks and colors, return a Style JSON stops array
    //breaks and colors must be the same length
    let stops = []
    for (var i = 0; i < breaks.length; i++) {
        stops.push([breaks[i], colors[i]]);
    }
    return stops
}

function calcLineLayers() {
    //calculate line layers to create
    lineLayers = [];
    linelayernames = [];
    lineLayers.push({
        id: 'linestring-0',
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

function paintLineLayer(mapid, color, width, opacity, pitch, layer) {
    mapid.setPitch(pitch);
    lineColors = line_color_list[parseFloat(document.getElementById("line_color").value)];
    for (p = 0; p < lineBreaks.length; p++) {
        calcLegends(p, 'heat-line');
    }
    let color_stops = calc_stops(lineBreaks, lineColors);
    let color_style = {
                property: 'ty',
                type: 'categorical',
                stops: color_stops
            }
    mapid.setPaintProperty("linestring-0", 'line-color', color_style);
    mapid.setPaintProperty("linestring-0", 'line-width', width);
    mapid.setPaintProperty("linestring-0", 'line-opacity', opacity);
    mapid.setPaintProperty("linestring-0", 'line-gap-width',
        parseFloat(document.getElementById("line_offset").value));
}

function getDataLinestring(callback) {
    $.getJSON(heatpoint_url, function(data) {
            stravaHeatGeoJson = JSON.parse(data);
            r.resolve();
        }),
        callback(stravaHeatGeoJson);
};
