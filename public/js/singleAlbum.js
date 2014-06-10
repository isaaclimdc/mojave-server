$(document).ready(function() {
  $('input[type=file]').bootstrapFileInput();
  $('.file-inputs').bootstrapFileInput();
  $('.fancybox').fancybox();
  // $(".fancybox")
  //   .attr('rel', 'gallery')
  //   .fancybox({
  //       padding    : 0,
  //       margin     : 20,
  //       nextEffect : 'fade',
  //       prevEffect : 'none',
  //       autoCenter : false,
  //       afterLoad  : function () {
  //           $.extend(this, {
  //               aspectRatio : false,
  //               type    : 'html',
  //               width   : '100%',
  //               height  : '100%',
  //               content : '<div class="fancybox-image" style="background-image:url(' + this.href + '); background-size: cover; background-position:50% 50%;background-repeat:no-repeat;height:100%;width:100%;" /></div>'
  //           });
  //       }
  //   });

  loadAlbum();

  $('#newImageForm').submit(submitNewImg);
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
  $.get('/api/album/'+albumID, function(album, status) {
    // Load title
    $('#singleAlbumTitle').text(album.title);

    // Load assets
    for (var i = 0; i < album.assets.length; i++) {
      var assetID = album.assets[i];

      // Get thumbnails and full images URL
      $.get('/api/album/'+albumID+'/'+assetID, function(signedURLs, status) {

        var div = $('<div>');
        div.attr('class', 'col-md-4 albumCell');

        var href = $('<a>');
        href.attr('class', 'fancybox');
        href.attr('rel', 'group');
        href.attr('href', signedURLs.full);

        var img = $('<img>');
        img.attr('src', signedURLs.thumb);

        href.append(img);
        div.append(href);
        table.append(div);
      });
    }
  });
}