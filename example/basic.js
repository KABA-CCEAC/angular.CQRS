var module = angular.module('basicExample', []);

module.config(function (CQRSProvider) {

   // tell angular.CQRS
   CQRSProvider.setUrlFactory(function (dataId) {
      return 'http://www.my-backend.com/api/' + dataId;
   });

});


module.run(function (CQRS) {

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

});


module.controller('MainController', function ($scope, Store) {

   // send a query to the server, requesting data with the id 'name'
   // CQRS will update your scope variable on every update event from the server
   Store.get('name').then(function (data) {
      $scope.name = data;
   });


});