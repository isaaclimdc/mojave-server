$(document).ready(function() {
  $("#newAlbumBtn").click(function(){
    $.post("/api/album/new", function (data, status) {
      location.reload();
    });
  });
});
