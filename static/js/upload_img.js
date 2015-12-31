(function() {
    document.getElementById("file_input").onchange = function(){
        var files = document.getElementById("file_input").files;
        var file = files[0];
        if(file == null){
            alert("No file selected.");
        }
        else{
            get_signed_request(file, basepath);
        }
        return false;
    };
})();

function get_signed_request(file, basepath_n){
    console.log(basepath_n+'sign_s3?file_name='+file.name+"&file_type="+file.type+'/');
    $.ajax({
        url : '/sign_s3?file_name='+file.name+"&file_type="+file.type+'/',
        type : "get",
        success : function(data) {
            var response = JSON.parse(data);
            console.log(response)
             upload_file(file, response.signed_request, response.url);
        }
    });
}

function upload_file(file, signed_request, url){

    /*
    $.ajax({
        url : signed_request,
        type : "put",
        headers : {'x-amz-acl' : 'public-read'},
        success : function() {
            document.getElementById("preview").src = url;
            document.getElementById("avatar_url").value = url;
        }
    });
*/
    console.log('putting...')
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", signed_request);
    xhr.setRequestHeader('x-amz-acl', 'public-read');
    xhr.onload = function() {
        if (xhr.status === 200) {
            document.getElementById("preview").src = url;
            document.getElementById("avatar_url").value = url;
        }
    };
    xhr.onerror = function() {
        alert("Could not upload file.");
    };
    xhr.send(file);
}