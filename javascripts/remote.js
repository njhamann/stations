var stApp = stApp || {};
stApp.remote = {};
stApp.remote = angular.module('stRemote', []);
stApp.remote.run([
    '$rootScope', 
    'mediaQuery', 
    'webCasting', 
    function($rootScope, mobileQuery, webCasting){
        $rootScope.isMobile = mobileQuery.isMobile();
        mobileQuery.watchMobile($rootScope, 'isMobile');
        $rootScope.showPlaylists = 1;
        
        $rootScope.control = webCasting($rootScope);
        $rootScope.control.setEvents();
    }
]);

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
       
        $scope.castMedia = function(receiver){
            $scope.$root.control.castMedia(receiver); 
        };
       
        
        $scope.$on('receiverList', function(e, list){
            $scope.receivers = list;
        });
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
        
        $scope.startPlaylist = function(){
            var control = $scope.$root.control;
            if(control && control.isCasting){
                control.startPlaylist($scope.playlist);
            }
            $scope.$root.showPlaylists = 0;
            $scope.$root.$broadcast('playlistChanged', $scope.playlist.items);
        };
        
    }
]);

stApp.remote.controller('LeftPanel', [
    '$scope', 
    function($scope){
    }
]);

stApp.remote.controller('RightPanel', [
    '$scope', 
    function($scope){
        $scope.showPlaylist = 0;
        $scope.showDetails = 1;
        $scope.changePlaylistContent = function(type) {
            if(type == 'details'){
                $scope.showPlaylist = 0;
                $scope.showDetails = 1;
            }else{
                $scope.showPlaylist = 1;
                $scope.showDetails = 0;
            }
        };
        
        $scope.$on('playlistChanged', function(e, playlist){
            $scope.playlistSelected = true;
        });
    }
]);

stApp.remote.controller('Player', [
    '$scope', 
    function($scope){
        $scope.playlist = [];
        $scope.currentMediaIndex;
        
        $scope.onPlayerStateChange = function(e){
            $scope.currentStatus = e.data;
            if (e.data == YT.PlayerState.PLAYING) {
                $scope.getCurrentMedia();
            } else if (e.data == YT.PlayerState.PAUSED) {
            } else if (e.data == YT.PlayerState.BUFFERING) {
            } else if (e.data == YT.PlayerState.CUED) {
            } else if (e.data == YT.PlayerState.ENDED) {
                //scope.currentMediaIndex++;
                //scope.loadMedia(scope.currentMediaIndex);
            }

            $scope.$root.$broadcast('playerStateChanged', e.data);
        };
         
        $scope.getCurrentMedia = function(){
            $scope.currentMediaIndex = $scope.player.getPlaylistIndex(); 
            $scope.currentMedia = $scope.playlist[$scope.currentMediaIndex];
            
            $scope.$root.$broadcast('currentMediaIndexChanged', $scope.currentMediaIndex);
        };

        
        $scope.$on('performPlayerAction', function(e, state){
            if (state == 'previous') {
                //$scope.player.playVideoAt(index:Number)
                $scope.player.previousVideo();
            } else if (state == 'next') {
                //$scope.player.playVideoAt(index:Number)
                $scope.player.nextVideo();
            } else if (state == 'play') {
                $scope.player.playVideo();
            } else if (state == 'pause') {
                $scope.player.pauseVideo();
            }
        });
        
        $scope.$on('playlistChanged', function(e, playlist){
            $scope.playlist = playlist;
            //$scope.startPlaylist();
        });
        
        $scope.$on('stopPlayer', function(e){
            $scope.player.stopVideo();
        });
        
        
    }
]);

stApp.remote.controller('Playlist', [
    '$scope', 
    function($scope){
        $scope.$on('playlistChanged', function(e, playlist){
            $scope.playlist = playlist;
        });
    }
]);

stApp.remote.controller('MediaDetail', [
    '$scope', 
    function($scope){
        
        $scope.$on('playlistChanged', function(e, playlist){
            $scope.playlist = playlist;
        });

        $scope.$on('currentMediaIndexChanged', function(e, index){
            $scope.currentMediaIndex = index;
            $scope.media = $scope.playlist[index];
        });
    }
]);

stApp.remote.controller('PlayerControls', [
    '$scope', 
    function($scope){
        $scope.isPlaying;
        $scope.isStarted;
        $scope.performPlayerAction = function(action){
            if($scope.$root.control 
                && $scope.$root.control.isCasting){
                
                $scope.$root.control.sendMessage(action); 
                
                //pausing player
                $scope.$root.$broadcast('performPlayerAction', 'pause');
            }else{
                $scope.$root.$broadcast('performPlayerAction', action);
            }
        };
        
        $scope.$on('playlistChanged', function(e, playlist){
            $scope.isStarted = true;
        });
        
        $scope.$on('playerStateChanged', function(e, state){
            $scope.currentStatus = state;
            $scope.$apply(function(){
                if (state == YT.PlayerState.PLAYING) {
                    $scope.isPlaying = 1;
                } else if (state == YT.PlayerState.PAUSED) {
                    $scope.isPlaying = 0;
                } else if (state == YT.PlayerState.BUFFERING) {
                    //need to disable
                } else if (state == YT.PlayerState.CUED) {
                } else if (state == YT.PlayerState.ENDED) {
                    //need to disable
                }
            });
        });
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

    return function(scope, elm, attrs){

        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = function() {
            scope.playerReady = 1;
        };
    
        var onPlayerReady = function(){}; 

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
                        loop: 1,
                        playlist: idsStr,
                        controls: 0
                    },
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': scope.onPlayerStateChange
                    }
                });
                
            }else{
                scope.player.cuePlaylist(ids);
            }
        }, true);
        
        scope.$watch('$root.showPlaylists', function(v){
            if(!v){
                var $cont = $('.right'),
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

stApp.remote.factory('webCasting', function(){
    return function(scope){
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

        control.startPlaylist = function(playlist) {
            castApi.sendMessage(this.currentActivityId, 'channelcast', {
                type: 'start_playlist',
                data: {
                    playlist: playlist
                }
            });
        };
        
        control.sendMessage = function(type) {
            castApi.sendMessage(currentActivityId, 'channelcast', {type: type});
        };
        /*
        control.playMedia = function() {
            castApi.sendMessage(currentActivityId, 'channelcast', {type: 'play'});
        };

        control.pauseMedia = function() {
            castApi.sendMessage(currentActivityId, 'channelcast', {type: 'pause'});
        };
        */

        control.onMessage = function(event) {
            console.log(event);
        };

        control.initializeCastApi = function(){
            castApi = new cast.Api();
            castApi.addReceiverListener(applicationID, control.onReceiverList);
        };
         
        control.onReceiverList = function(list) {
            if( list.length > 0 ) {
                /*
                console.log("receiver list" + list);
                var receiverDiv = document.getElementById('receivers');
                var temp = ''; 

                for( var i=0; i < list.length; i++ ) {
                    receivers.push(list[i]);
                    temp += '<li><a href="#" id="cast' + list[i].id + '" onclick="control.castMedia(' + i + ')">' + list[i].name + '</a></li>';
                }
                console.log(temp);
                receiverDiv.innerHTML = temp;
                */
                scope.canCast = true;
                scope.$root.$broadcast('receiverList', list); 
            }
        };
        
        control.castMedia = function(receiver) {
            console.log(receiver);
            var _this = this;
            currentReceiver = receiver;

            var launchRequest = new cast.LaunchRequest(applicationID, receiver);
            launchRequest.parameters = '';

            //var loadRequest = new cast.MediaLoadRequest(currentMedia);
            //loadRequest.autoplay = true;

            castApi.launch(launchRequest, function(status) {
                if (status.status == 'running') {
                    currentActivityId = status.activityId;
                    _this.currentActivityId = status.activityId;
                    _this.isCasting = true;
                    castApi.sendMessage(_this.currentActivityId, 'channelcast', {type: 'launched'});
                    castApi.addMessageListener(_this.currentActivityId, 'channelcast', control.onMessage.bind(_this));
                } else {

                    console.log('Launch failed: ' + status.errorString);
                }
            });
        };

        
        if (window.cast && window.cast.isAvailable) {
            // Already initialized
            control.initializeCastApi();
        } else {
            // Wait for API to post a message to us
            window.addEventListener("message", function(event) {
                if (event.source == window 
                    && event.data 
                    && event.data.source == "CastApi" 
                    && event.data.event == "Hello"){
                    control.initializeCastApi();
                }
            });
        };
        return control;
    };
});

/**
 * filters
 */

stApp.remote.filter('somefilt', function(){
    return function(input){
    };
});

/*
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
*/
