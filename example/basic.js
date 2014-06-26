var module = angular.module('basicExample', ['ngCQRS']);

module.config(function (CQRSProvider) {

  // tell angular.CQRS how to build urls for HTTP GET queries
  CQRSProvider.setUrlFactory(function (viewModelName, parameters) {
    return 'http://www.my-backend.com/api/' + viewModelName + CQRSProvider.toUrlGETParameterString(parameters);
  });

});

module.run(function (CQRS, DenormalizationService) {

  // connect angular.CQRS to your socket / long polling solution, etc.

  var mySocket = io();

  // pass in events from your socket
  mySocket.on('events', function (data) {
    CQRS.eventReceived(data);
  });

  // pass commands to socket
  CQRS.onCommand(function (data) {
    mySocket.emit('commands', data);
  });

  // tell angular.CQRS how to denormalize (or merge) profileChanged events on the modelView personDetailView
  DenormalizationService.registerDenormalizerFunction('profile', 'person', 'moved', function (oldProfile, payload) {
    if (payload.id === oldProfile.person.id) {
      oldProfile.person.address = payload.address;
    }

    return oldProfile;
  });

});

module.controller('MainController', function ($scope, StoreService, CQRS) {

  var store = StoreService.createForController($scope);

  // send a query to the server, requesting data with the id 'name'
  // angular.CQRS will invoke your callback on every update event from the server
  store.for('profile').do(function (personDetails) {
    $scope.personDetails = personDetails;
  });

  $scope.onChangeProfile = function () {
    CQRS.sendCommand('person', 'move', {
      id: $scope.personDetails.id,
      address: 'my entered new address'
    });
  };

});