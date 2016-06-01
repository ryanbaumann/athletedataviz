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
var linelayernames=[];
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

function getDataLinestring(callback) {
    $.getJSON( heatpoint_url , function(data) {
        stravaHeatGeoJson = JSON.parse(data); 
        r.resolve();
    }),
    callback(stravaHeatGeoJson);
};