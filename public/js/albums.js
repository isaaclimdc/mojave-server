// Load current user object from localStorage
window.mojaveUser = JSON.parse(localStorage.getItem('mojaveUser'));
console.log("Logged in as user:", window.mojaveUser);

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

  loadUserAndAlbums();
});

function loadUserAndAlbums() {
  var table = $('.albumsTable');
  var userID = table.attr('id');
  console.log("FETCHING MOJAVE USER WITH ID:", userID);     //TODO: ARRGGGH SO HACKY!!

  // Fetch user
  $.ajax({
    url: '/api/user/'+userID,
    type: 'GET',
    success: function(data) {
      // Put the object into storage
      window.mojaveUser = data;
      localStorage.setItem('mojaveUser', JSON.stringify(window.mojaveUser));

      loadAlbums();
    },
    failure: function(err) {
      throw err;
    }
  });
}

function loadAlbums() {
  var table = $('.albumsTable');
  for (var i = 0; i < window.mojaveUser.albums.length; i++) {
    var albumID = window.mojaveUser.albums[i];

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
        img.attr('src', data.coverURL);

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