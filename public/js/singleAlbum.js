$(document).ready(function() {
  $('input[type=file]').bootstrapFileInput();
  $('.file-inputs').bootstrapFileInput();
  $('.fancybox').fancybox();

  $('#newImageForm').submit(submitNewImg);

  loadAlbum();
});

function submitNewImg(e) {
  e.preventDefault();

  var table = $('.albumTable');
  var albumID = table.attr('id');

  $.ajax({
    url: '/api/album/'+albumID+'/upload',
    type: 'POST',
    data: new FormData(this),
    processData: false,
    contentType: false,
    success: function(data) {
      location.reload();
    },
    error: function(err) {
      console.error("Error:", err.responseText);
    }
  });
}

function loadAlbum() {
  var table = $('.albumTable');
  var albumID = table.attr('id');
  console.log("Loading album:", albumID);

  // Fetch album
  $.ajax({
    url: '/api/album/'+albumID,
    type: 'GET',
    success: function(album) {
      // Load title
      $('#singleAlbumTitle').text(album.title);

      // Load assets
      album.assets.forEach(function (asset) {
        var div = $('<div>');
        div.attr('class', 'col-md-4 albumCell');

        var a = $('<a>');
        a.attr('class', 'fancybox');
        a.attr('rel', 'group');
        a.attr('href', asset.fullURL);

        var img = $('<img>');
        img.attr('src', asset.thumbURL);

        a.append(img);
        div.append(a);
        table.prepend(div);
      });
    },
    error: function(err) {
      console.error("Error:", err.responseText);
    }
  });
}