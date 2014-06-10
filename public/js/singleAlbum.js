// Load current user object from localStorage
window.mojaveUser = JSON.parse(localStorage.getItem('mojaveUser'));

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
  $.ajax({
    url: '/api/album/'+albumID,
    type: 'GET',
    success: function(album) {
      // Load title
      $('#singleAlbumTitle').text(album.title);

      // Load assets
      for (var i = 0; i < album.assets.length; i++) {
        var assetID = album.assets[i];

        $.ajax({
          url: '/api/album/'+albumID+'/'+assetID,
          type: 'GET',
          success: function(signedURLs) {
            var div = $('<div>');
            div.attr('class', 'col-md-4 albumCell');

            var a = $('<a>');
            a.attr('class', 'fancybox');
            a.attr('rel', 'group');
            a.attr('href', signedURLs.full);

            var img = $('<img>');
            img.attr('src', signedURLs.thumb);

            a.append(img);
            div.append(a);
            table.append(div);
          },
          failure: function(err) {
            throw err;
          }
        });
      }
    },
    failure: function(err) {
      throw err;
    }
  });
}