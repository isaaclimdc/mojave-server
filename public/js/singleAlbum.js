$(document).ready(function() {
  $('input[type=file]').bootstrapFileInput();
  $('.file-inputs').bootstrapFileInput();

  loadAlbum();

  $('#newImageForm').submit(submitNewImg);
});

function submitNewImg(e) {
  e.preventDefault();

  var table = $('.albumTable');
  var albumID = table.attr('id');

  console.log("SUBMITTING IMAGE!!!");
  $.ajax({
    url: '/api/album/'+albumID+'/upload',
    type: 'POST',
    data: new FormData(this),
    processData: false,
    contentType: false,
    success: function(data) {
      location.reload();
    },
    failure: function(err) {
      throw err;
    }
  });
}

function loadAlbum() {
  var table = $('.albumTable');
  var albumID = table.attr('id');
  console.log("ALBUM ID:", albumID);

  // Fetch album
  $.get('/api/album/'+albumID, function(album, status) {
    // Load title
    $('#singleAlbumTitle').text(album.title);

    // Load assets
    for (var i = 0; i < album.assets.length; i++) {
      var assetID = album.assets[i];
      var thumbURL = album.assetThumbs[i];

      $.get('/api/album/'+albumID+'/'+assetID, function(signedURL, status) {

      // <div class="">
      //   <img src="http://lorempixel.com/200/200/">
      // </div>

        var div = $('<div>');
        div.attr('class', 'col-md-4 albumCell');
        var img = $('<img>');
        img.attr('src', signedURL);
        div.append(img);

        table.append(div);
      });
    }
  });
}