$(document).ready(function() {
  loadAlbum();
});

function loadAlbum() {
  var table = $('.albumTable');
  var albumID = table.attr('id');
  console.log("ALBUM ID IS", albumID);

  // Fetch album
  $.get('/api/album/'+albumID, function (album, status) {
    // Load title
    $('#singleAlbumTitle').text(album.title);

    // Load assets
    console.log(album.assetThumbs);
    for (var i = 0; i < album.assets.length; i++) {
      var thumbURL = album.assetThumbs[i];
      console.log("Loading asset with URL", thumbURL);

      // <div class="">
      //   <img src="http://lorempixel.com/200/200/">
      // </div>

      var div = $('<div>');
      div.attr('class', 'col-md-4 albumCell');
      var img = $('<img>');
      img.attr('src', thumbURL);
      div.append(img);

      table.append(div);
    }
  });
}