var elev_color_list = [['blue', 'red'], ['green', 'red'], ['#F38282', '#295261']]
var elev_height = [0, 2000]
var elev_stops = [0, 2000]
//Global variables for heat-lines
var elev_colors = elev_color_list[0];
var elev_layernames = ['elevation'];
var elev_popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});


function paintElevLayer(mapid, layer, pitch, fill_opacity) {
    mapid.setPitch(pitch);
    elev_colors = elev_color_list[parseFloat(document.getElementById("fill_color").value)];
    for (p = 0; p < elev_stops.length; p++) {
        calcLegends(p, 'elevation');
    }
    elev_height[1] = parseFloat(document.getElementById("fill_height").value)
    elev_stops = [0, parseFloat(document.getElementById("fill_color_scale").value)]
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
