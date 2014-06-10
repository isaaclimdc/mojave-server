$(document).ready(function() {
  $('#newAlbumBtn').click(function(){
    $.post('/api/album/new', { title: 'My Album' }, function (data, status) {
      location.reload();
    });
  });
});
