/**
 * Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
 * images to fit into a certain area.
 */
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {

    var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return {
        width: srcWidth * ratio,
        height: srcHeight * ratio
    };
}

// Helper functions
function toPixels(length) {
    'use strict';
    var unit = 'in';
    var conversionFactor = 96;
    if (unit == 'mm') {
        conversionFactor /= 25.4;
    }
    return conversionFactor * length + 'px';
}
// High-res map rendering
function generateMap() {

    //Disable buttons until objects are loaded
    $('#social').hide();
    $('#loading_social').show();
    document.getElementById('snap').classList.add('disabled');
    document.getElementById('download_viz').classList.add('disabled');
    document.getElementById('img_share_url').classList.add('disabled');
    //document.getElementById('order_viz').classList.add('disabled');
    $("#loading").show();
    //Get the current map style
    var style = map.getStyle();
    for (var key in style.sources) {
        if (key === "hillshade") {
            delete style.sources[key].encoding;
            delete style.sources[key].bounds;
            delete style.sources[key].tiles;
        }
    }
    //Set image quality
    var width = 10;
    var height = 8;
    var dpi = 350;
    var format = 'png';
    var unit = 'in';
    //get current map settings to recreate in backcanvas for image
    var zoom = map.getZoom();
    var center = map.getCenter();
    var bearing = map.getBearing();
    var pitch = map.getPitch();
    //function to create the map
    createPrintMap(width, height, dpi, format, unit, zoom, center,
        bearing, pitch, style);
}

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}


function createPrintMap(width, height, dpi, format, unit, zoom, center,
    bearing, pitch, style) {

    // Calculate pixel ratio
    var actualPixelRatio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
        get: function() {
            return dpi / 96
        }
    });

    // Create map container
    var hidden = document.createElement('div');
    hidden.className = 'hidden-map';
    hidden.style.position = 'absolute';
    document.body.appendChild(hidden);
    var container = document.createElement('div');
    container.id = 'hidden-map';
    container.style.width = toPixels(width);
    container.style.height = toPixels(height);
    hidden.appendChild(container);
    //remove any existing image elements
    snapshot.innerHTML = '';
    var img = document.createElement('img');
    //Show loading image
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (w > 640) {
        w = 640;
        h = 480;
    } else {
        w = w * 0.8;
        h = h * 0.8;
    }
    img.width = 250;
    img.height = 200;
    img.src = "/static/img/loading.gif";
    snapshot.appendChild(img);
    $("#snapshot_img").addClass("center-block");
    //hide the loading bar, and begin creating the image in the background
    $("#loading").hide();


    // Create backcanvas map for high-rez image
    var renderMap = new mapboxgl.Map({
        container: container,
        center: center,
        zoom: zoom,
        style: style,
        bearing: bearing,
        pitch: pitch,
        interactive: false,
        attributionControl: true,
        preserveDrawingBuffer: true,
        fadeDuration: 0
    });

    renderMap.on('load', function createImage() {
        try {
            var canvas = renderMap.getCanvas();
            var targetDims = calculateAspectRatioFit(canvas.width, canvas.height, w, h);
            img.width = targetDims['width'];
            img.height = targetDims['height'];
            img.href = img.src;
            img.id = 'snapshot_img';
            img.class = "img-responsive center-block";
            mergeImages([{
                        src: canvas.toDataURL("image/jpeg", 0.93),
                        x: 0,
                        y: 0
                    },
                    {
                        src: '/static/img/api_logo_pwrdBy_strava_horiz_gray.png',
                        x: 0,
                        y: canvas.height - 63
                    },
                    {
                        src: '/static/img/OSM-mapbox-attribution.png',
                        x: canvas.width - 275,
                        y: canvas.height - 25
                    },
                    {
                        src: '/static/img/mapbox-logo.png',
                        x: 5,
                        y: canvas.height - 100
                    }
                ], {
                    format: "image/jpeg"
                })
                .then(function(b64) {
                    snapshot.innerHTML = '';
                    snapshot.appendChild(img);
                    $("#snapshot_img").addClass("img-responsive center-block");
                    img.src = b64;

                    //Upload image to the server
                    randNum = Math.floor(Math.random() * (1000000 - 100 + 1)) + 100;
                    filename = "ADV_" + ath_name + "_" + randNum + ".jpg";
                    var blob = dataURItoBlob(b64);
                    var file = new File([blob], filename, { type: "image/jpeg" });
                    get_signed_request(file, blob);
                });

        } catch (err) {
            console.log(err);
            window.alert("Please try a different browser - Chrome, Firefox, and Opera are supported for design ordering and sharing!");
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('snap').classList.remove('disabled');
        }
        renderMap.remove();
        hidden.parentNode.removeChild(hidden);
        Object.defineProperty(window, 'devicePixelRatio', {
            get: function() {
                return actualPixelRatio
            }
        });
    });

}