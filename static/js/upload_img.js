
function get_signed_request(file){
    var datapath = '/sign_s3?file_name='+file.name+'&file_type='+file.type
    var xhr = new XMLHttpRequest();
    xhr.open("GET", datapath);
    xhr.onreadystatechange = function(){
        if(xhr.readyState === 4){
            if(xhr.status === 200){
                var response = JSON.parse(xhr.responseText);
                upload_file(file, response.signed_request, response.url);
            }
            else{
                alert("Could not get signed URL.");
            }
        }
    };
    xhr.send();
}

//update links
function updateLinks(url) {
    var fb_share = 'https://www.facebook.com/sharer/sharer.php?u=' + 
                encodeURIComponent(url);
    var pin_share = 'https://pinterest.com/pin/create/button/?url=url=www.athletedataviz.com&media=' + 
                encodeURIComponent(url) +
                '&description=' + encodeURIComponent('Check out my AthleteDataViz!');
    var twit_share = 'https://twitter.com/home?status=' +
                encodeURIComponent('Check out my AthleteDataViz! ' + url);
    var google_share = 'https://plus.google.com/share?url=' + encodeURIComponent(url);
    $("#share_fb").attr('href', fb_share);
    $("#share_pin").attr('href', pin_share);
    $("#share_twit").attr('href', twit_share);
    $("#share_gplus").attr('href', google_share);
}

function upload_file(file, signed_request, url){
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", signed_request);
    xhr.setRequestHeader('x-amz-acl', 'public-read');
    xhr.onload = function() {
        if (xhr.status === 200) {
            updateLinks(url);
            //$("#download_viz").attr('href', url)//.attr('download', file.name);
            $("#img_share_url").click(function() {
                copyToClipboard(url)
            });
            $("#order_viz").click(function() {
                copyToClipboard(url)
            });
            $("#order_viz").attr('href', 'https://athletedataviz.com/collections/frontpage?url='+encodeURIComponent(url))
            //show new icons, activate download and share buttons, reactivate save design btn
            $('#social').show();
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('snap').classList.remove('disabled');
            document.getElementById('download_viz').classList.remove('disabled');
            document.getElementById('img_share_url').classList.remove('disabled');
            //document.getElementById('order_viz').classList.remove('disabled');
        }
    };
    xhr.onerror = function() {
        alert("Could not upload file.");
    };
    xhr.send(file);
}