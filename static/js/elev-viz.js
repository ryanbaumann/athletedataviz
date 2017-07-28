var elev_color_list = [
    chroma.scale('Spectral').mode('lab').colors(5),
    chroma.scale('RdBu').mode('lab').colors(5),
    chroma.scale('RdYlGn').mode('lab').colors(5)
]

var elev_height = [0, 2000]
var elev_stops = [0, 2000]
//Global variables for heat-lines
var elev_colors = elev_color_list[0];
var elev_layernames = ['elevation'];
var elev_popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

function updateElevLegend() {
    document.getElementById('legend-elev-param').textContent = $("#segParam option:selected").text();
}

function calcElevBreaks(maxval, numbins) {
    //calculate breaks based on a selected bin size and number of bins
    elev_stops = []; //empty the breaks array
    var binSize = maxval / numbins;

    for (p = 1; p <= numbins; p++) {
        elev_stops.push(Math.round(binSize * p * 10) / 10);
    }

    updateElevLegend();

    for (p = 0; p < elev_stops.length; p++) {
        calcLegends(p, 'elevation');
    }
}

function paintElevLayer(mapid, layer, pitch, fill_opacity) {
    mapid.setPitch(pitch);
    elev_colors = elev_color_list[parseFloat(document.getElementById("fill_color").value)];
    

    elev_height[1] = parseFloat(document.getElementById("fill_height").value)
    elev_stops = calcElevBreaks(parseFloat(document.getElementById("fill_color_scale").value), 5)
    let color_stops = calc_stops(elev_stops, elev_colors);
    let height_stops = calc_stops(elev_stops, elev_height);
    let fill_color_style = {
                property: 'e',
                type: 'exponential',
                stops: color_stops
            }
    let fill_extrude_height_style = {
                property: 'e',
                type: 'exponential',
                stops: height_stops
            }

    mapid.setPaintProperty(layer, 'fill-extrusion-color', fill_color_style);
    mapid.setPaintProperty(layer, 'fill-extrusion-height', fill_extrude_height_style);
    mapid.setPaintProperty(layer, 'fill-extrusion-opacity', fill_opacity);
}
