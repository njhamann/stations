var stApp = stApp || {};
stApp.remote = {};
stApp.remote = angular.module('stRemote', []);
stApp.remote.run(['$rootScope', 'mediaQuery', function($rootScope, mobileQuery){
    $rootScope.isMobile = mobileQuery.isMobile();
    mobileQuery.watchMobile($rootScope, 'isMobile');
    $rootScope.showPlaylists = 1;
    
}]);

/**
 * controllers
 */

stApp.remote.controller('Header', [
    '$scope', 
    function($scope){
        $scope.back = function(){
            $scope.$root.showPlaylists = 1;
            $scope.$root.$broadcast('stopPlayer');
        };
    }
]);

stApp.remote.controller('Playlists', [
    '$scope', 
    '$http',
    function($scope, $http){
        $scope.requestPlaylists = function(){
            var url = 'playlists.json';
            $http.get(url, {
            }).success(function(d){
               $scope.playlists = d.playlists;
            }).error(function(e){
            });
        };

        $scope.requestPlaylists();
    }
]);

stApp.remote.controller('PlaylistsItem', [
    '$scope', 
    'mediaQuery',
    function($scope, mediaQuery){
        
        $scope.startPlaylist = function(index){
            $scope.$root.showPlaylists = 0;
            $scope.$root.$broadcast('playlistChanged', $scope.playlists[index].items);
        };
        
    }
]);

stApp.remote.controller('Player', [
    '$scope', 
    function($scope){
        $scope.playlist = [];

        $scope.currentMediaIndex = 0;
        
        $scope.startPlaylist = function(){
            //$scope.loadMedia(0);
        };
        
        var playerReadyInterval;
        var disablePlayerReadyInterval;

        function forcePlay() {
            playerReadyInterval = window.setInterval(function(){
                $scope.player.playVideo();
            }, 1000);
            
            disablePlayerReadyInterval = window.setInterval(function(){
                if ($scope.player.getCurrentTime() < 1.0) {
                    return;
                }
                // Video started...
                window.clearInterval(playerReadyInterval);
                window.clearInterval(disablePlayerReadyInterval);
            }, 1000);
        } 
        
        $scope.loadMedia = function(index){
            if(!$scope.playlist.length) return;
            if($scope.playlist[index]){
                var video = $scope.playlist[index];
                $scope.player.loadVideoById(video.source_id);
            }else{
                $scope.currentMediaIndex = 0;
                var video = $scope.playlist[0];
                $scope.player.loadVideoById(video.source_id);
            }
    
            //$scope.player.playVideo();
            forcePlay(); 
        };

        $scope.$on('playlistChanged', function(e, playlist){
            $scope.playlist = playlist;
            $scope.startPlaylist();
        });
        
        $scope.$on('stopPlayer', function(e){
            $scope.player.stopVideo();
        });
        
        
    }
]);

stApp.remote.controller('Playlist', [
    '$scope', 
    function($scope){
    }
]);

stApp.remote.controller('MediaDetail', [
    '$scope', 
    function($scope){
    }
]);

stApp.remote.controller('PlayerControls', [
    '$scope', 
    function($scope){
    }
]);

/**
 * directives
 */

stApp.remote.directive('playlistItem', function(){
    return function(scope, elm, attrs){
        elm.click(function(e){
            elm.siblings().removeClass('selected');
            elm.addClass('selected');
        });
    };
});

stApp.remote.directive('windowResize', function(){

    return function(scope, elm, attrs){
        elm.click(function(e){
            elm.siblings().removeClass('selected');
            elm.addClass('selected');
        });
    };
});

stApp.remote.directive('ytPlayer', function(){
    var onPlayerReady = function(){}; 
    var onPlayerStateChange = function(scope){
        if (event.data == YT.PlayerState.PLAYING) {
        } else if (event.data == YT.PlayerState.PAUSED) {
        } else if (event.data == YT.PlayerState.BUFFERING) {
        } else if (event.data == YT.PlayerState.CUED) {
        } else if (event.data == YT.PlayerState.ENDED) {
            scope.currentMediaIndex++;
            //scope.loadMedia(scope.currentMediaIndex);
        }
    };

    return function(scope, elm, attrs){

        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = function() {
            scope.playerReady = 1;
        };

        scope.$watch('playlist', function(playlist){  
            if(!scope.playerReady) return;
            var ids = _.pluck(playlist, 'source_id'); 
            var idsStr = ids.join(); 
            if(!scope.player){
                scope.player = new YT.Player(elm.attr('id'), {
                    width: elm.width(),
                    height: '400',
                    //videoId: playlist[0].source_id,
                    playerVars: {
                        playlist: ids
                        //controls: 0
                    },
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange
                    }
                });
            }else{
                scope.player.cuePlaylist(ids);
            }
        }, true);
        
        scope.$watch('$root.showPlaylists', function(v){
            if(!v){
                var $cont = $('#yt_player_container'),
                    w = $cont.width(),
                    $ifra = $cont.find('iframe');
        
                $ifra.width(w);
                if(scope.$root.isMobile){
                    $ifra.height(250);
                }
        
            }
        });
    };
});

/**
 * services
 */

stApp.remote.factory('mediaQuery', function(){
    return {
        isMobile: function(){
            var mq = window.matchMedia( '(max-width: 768px)' );
            return mq.matches;
        },
        watchMobile: function(scope, key){
            if(!scope) return;
            var key = key || 'isMobile';

            var mq = window.matchMedia('(max-width: 768px)');
            mq.addListener(function(mq){
                console.log(mq);
                scope.$apply(function(){
                    scope[key] = mq.matches;
                });
            });
        }
    };
});

/**
 * filters
 */

stApp.remote.filter('somefilt', function(){
    return function(input){
    };
});

var applicationID = 'fbecad4f-6140-4245-8a21-7f9e3894ffa4';
var playlists;
var castApi;
var currentActivityId = null;
var currentReceiver;
var receivers = [];

//control
var control = {};
control.playlists;
control.setEvents = function(){
    var _this = this,
        $doc = $(document);

    $doc.on('click', 'a#stop_casting', function() {
        castApi.stopActivity(currentActivityId, function(){
            if(currentActivityId){
                currentActivityId = null;
            }
        });
    });

};

control.getPlaylists = function(){

    return;
    $.ajax({
        type: 'GET',
        url: 'playlists.json',
        dataType: 'json',
        success: function(data){
            control.playlists = data.playlists;
            var $list = $('ul#playlists');
            data.playlists.forEach(function(playlist, i){
                $list.append('<li data-id="' + i + '">' + 
                    '<h4>' + playlist.name + '</h4>' +
                    '<p>' + playlist.description + '</p>' +
                    '</li>');
            });
        },
        error: function(XMLHttpRequest, text, err){
            console.log(text);
            console.log(err);
        }
    });
};

control.startPlaylist = function(playlist) {
    castApi.sendMessage(currentActivityId, 'channelcast', {
        type: 'start_playlist',
        data: {
            playlist: playlist
        }
    });
};

control.playMedia = function() {
    castApi.sendMessage(currentActivityId, 'channelcast', {type: 'play'});
};

control.pauseMedia = function() {
    castApi.sendMessage(currentActivityId, 'channelcast', {type: 'pause'});
};

control.onMessage = function(event) {
    console.log(event);
};

control.setEvents();
control.getPlaylists();

if (window.cast && window.cast.isAvailable) {
    // Already initialized
    initializeCastApi();
} else {
    // Wait for API to post a message to us
    window.addEventListener("message", function(event) {
        if (event.source == window 
            && event.data 
            && event.data.source == "CastApi" 
            && event.data.event == "Hello"){
            initializeCastApi();
        }
    });
};

initializeCastApi = function() {
    castApi = new cast.Api();
    castApi.addReceiverListener(applicationID, onReceiverList);
};

function onReceiverList(list) {
    if( list.length > 0 ) {
        console.log("receiver list" + list);
        var receiverDiv = document.getElementById('receivers');
        var temp = ''; 

        for( var i=0; i < list.length; i++ ) {
            receivers.push(list[i]);
            temp += '<li><a href="#" id="cast' + list[i].id + '" onclick="castMedia(' + i + ')">' + list[i].name + '</a></li>';
        }
        console.log(temp);
        receiverDiv.innerHTML = temp;
    } else {
        console.log("receiver list empty");
        document.getElementById("receiver_msg").innerHTML = "No Chromecast devices found";
    }
}



function castMedia(i) {
    console.log("casting media to" + receivers[i]);
    var _this = this;
    currentReceiver = receivers[i];

    var launchRequest = new cast.LaunchRequest(applicationID, receivers[i]);
    launchRequest.parameters = '';

    //var loadRequest = new cast.MediaLoadRequest(currentMedia);
    //loadRequest.autoplay = true;

    castApi.launch(launchRequest, function(status) {
        if (status.status == 'running') {
            currentActivityId = status.activityId;
            castApi.sendMessage(currentActivityId, 'channelcast', {type: 'launched'});
            castApi.addMessageListener(currentActivityId, 'channelcast', control.onMessage.bind(_this));
        } else {
            console.log('Launch failed: ' + status.errorString);
        }
    });
}

function launchCallback(status) {
  if( status.success == true ) {
    var icon_id = currentReceiver.id;
    var cast_icon = document.getElementById('cast' + icon_id);
    cast_icon.src = 'icons/drawable-mdpi/ic_media_route_on_holo_light.png';
  }
}

function muteMedia() {
  castApi.setMediaVolume(
      currentActivityId,
      new cast.MediaVolumeRequest(0, true),
      function() {});
}

function unmuteMedia() {
  castApi.setMediaVolume(
      currentActivityId,
      new cast.MediaVolumeRequest(currentVolume, false),
      function() {});
}

function setVolume(v) {
  castApi.setMediaVolume(
      currentActivityId,
      new cast.MediaVolumeRequest(v, false),
      function() {});
}
