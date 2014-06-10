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
});
