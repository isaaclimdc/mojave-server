$(document).ready(function() {
  $('#newAlbumSaveBtn').click(function() {
    var albumTitle = $('#albumTitle').val();
    console.log(albumTitle);

    $.ajax({
      url: '/api/album/new',
      type: 'POST',
      data: { title: albumTitle },
      success: function(data) {
        location.reload();
      },
      failure: function(err) {
        throw err;
      }
    });
  });

  loadAlbums();
});

function loadAlbums() {
  var table = $('.albumsTable');
  var userID = table.attr('id');
  console.log("Logged in as user:", userID);     //TODO: ARRGGGH SO HACKY!!

  // Fetch user
  $.ajax({
    url: '/api/user/'+userID,
    type: 'GET',
    success: function(user) {
      loadAlbumsForUser(user);
    },
    failure: function(err) {
      throw err;
    }
  });
}

function loadAlbumsForUser(user) {
  var table = $('.albumsTable');
  for (var i = 0; i < user.albums.length; i++) {
    var albumID = user.albums[i];

    // Fetch album cover
    $.ajax({
      url: '/api/album/'+albumID+'/cover',
      type: 'GET',
      success: function(data) {
        var a = $('<a>');
        a.attr('href', '/albums/'+data.albumID);

        var div = $('<div>');
        div.attr('class', 'col-md-4 albumCell');

        var img = $('<img>');
        var coverURL = data.coverURL;
        if (coverURL == null) coverURL = 'img/phAlbumCover.png';
        img.attr('src', coverURL);

        div.append(img);
        a.append(div);
        table.append(a);
      },
      failure: function(err) {
        throw err;
      }
    });
  }
}