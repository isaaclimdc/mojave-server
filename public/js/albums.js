$(document).ready(function() {
  $('#newAlbumSaveBtn').click(createNewAlbum);

  loadUserData();
});

function loadUserData() {
  var table = $('.albumsTable');
  var userID = table.attr('id');
  console.log("Logged in as user:", userID);     //TODO: ARRGGGH SO HACKY!!

  // Fetch user
  $.ajax({
    url: '/api/user/'+userID,
    type: 'GET',
    success: function(user) {
      loadAlbumsForUser(user);
      loadCollaboratorsForUser(user);
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

    var a = $('<a>');
    a.attr('href', '/albums/'+albumID);

    var div = $('<div>');
    div.attr('class', 'col-md-4 albumCell');
    div.attr('id', albumID);

    a.append(div);
    table.append(a);

    // Fetch album cover
    $.ajax({
      url: '/api/album/'+albumID+'/cover',
      type: 'GET',
      success: function(data) {
        var img = $('<img>');
        var coverURL = data.coverURL;
        if (coverURL == null) coverURL = 'img/phAlbumCover.png';
        img.attr('src', coverURL);

        $('#'+data.albumID).append(img);
      },
      failure: function(err) {
        throw err;
      }
    });
  }
}

function loadCollaboratorsForUser(user) {
  var fixedDivID = 'selectCollabs';
  var fixedDiv = $('#'+fixedDivID);

  function makeInputID(friendID) {
    return fixedDivID+'-'+friendID;
  }

  for (var i = 0; i < user.friends.length; i++) {
    var friendID = user.friends[i];

    var div = $('<div>');
    div.attr('class', 'checkbox');

    var label = $('<label>');
    label.attr('for', makeInputID(friendID));

    div.append(label);
    fixedDiv.append(div);

    // Fetch friend user
    $.ajax({
      url: '/api/user/'+friendID,
      type: 'GET',
      success: function(friend) {
        var friendName = friend.firstName + ' ' + friend.lastName;
        console.log("Friend:", friendName, friend);

        // <div class="checkbox">
        //   <label for="selectCollabs-0">
        //     <input type="checkbox" name="selectCollabs" id="selectCollabs-0" value="bobsmith">
        //     Bob Smith
        //   </label>
        // </div>

        var inputID = makeInputID(friend._id);
        var label = $("label[for='"+inputID+"']");
        label.text(friendName);

        var input = $('<input>');
        input.attr({
          'type': 'checkbox',
          'id': inputID,
          'value': friend._id
        });

        label.append(input);
      },
      failure: function(err) {
        throw err;
      }
    });
  }
}

function createNewAlbum() {
  var albumTitle = $('#albumTitle').val();

  var collabs = [];
  $(':checkbox:checked').each(function(i){
    collabs.push($(this).val());
  });
  console.log(collabs);

  // $.ajax({
  //   url: '/api/album/new',
  //   type: 'POST',
  //   data: {
  //     title: albumTitle,
  //     collabs: collabs
  //   },
  //   success: function(data) {
  //     location.reload();
  //   },
  //   failure: function(err) {
  //     throw err;
  //   }
  // });
}