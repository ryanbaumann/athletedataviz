//Global variables for segments
var seg_breaks = [3, 6, 9, 12, 16];
var seg_layers = [];
var seg_filters = [];
var seg_layernames=[];
var segpopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

function updateSegLegend() {
    document.getElementById('legend-seg-param').textContent = $("#segParam option:selected").text();
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