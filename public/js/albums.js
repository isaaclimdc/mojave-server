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

  user.albums.forEach(function (albumID) {
    var a = $('<a>');
    a.attr('href', '/albums/'+albumID);

    var div = $('<div>');
    div.attr('class', 'col-md-4 albumCell');
    div.attr('id', albumID);

    a.append(div);
    table.prepend(a);

    // Fetch album cover
    $.ajax({
      url: '/api/album/'+albumID+'/cover',
      type: 'GET',
      success: function(coverURL) {
        var img = $('<img>');
        if (!coverURL) coverURL = 'img/phAlbumCover.png';
        img.attr('src', coverURL);

        $('#'+albumID).append(img);
      },
      failure: function(err) {
        throw err;
      }
    });
  });
}

function loadCollaboratorsForUser(user) {
  var fixedDivID = 'selectCollabs';
  var fixedDiv = $('#'+fixedDivID);

  function makeInputID(friendID) {
    return fixedDivID+'-'+friendID;
  }

  user.friends.forEach(function (friendID) {
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

        // <div class="checkbox">
        //   <label for="selectCollabs-0">
        //     <input type="checkbox" name="selectCollabs" id="selectCollabs-0" value="bobsmith">
        //     Bob Smith
        //   </label>
        // </div>

        var inputID = makeInputID(friendID);
        var label = $("label[for='"+inputID+"']");
        label.text(friendName);

        var input = $('<input>');
        input.attr({
          'type': 'checkbox',
          'id': inputID,
          'value': friendID
        });

        label.append(input);
      },
      failure: function(err) {
        throw err;
      }
    });
  });
}

function createNewAlbum() {
  var albumTitle = $('#albumTitle').val();

  var collabs = [];
  $(':checkbox:checked').each(function(i){
    collabs.push($(this).val());
  });
  console.log(collabs);

  $.ajax({
    url: '/api/album/new',
    type: 'POST',
    data: {
      title: albumTitle,
      collabs: collabs
    },
    success: function(data) {
      location.reload();
    },
    failure: function(err) {
      throw err;
    }
  });
}