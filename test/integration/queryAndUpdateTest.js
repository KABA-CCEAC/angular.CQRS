describe('query and update on event', function () {

  var CQRS, StoreService, DenormalizationService, $http, USER_ID = '';

  beforeEach(function (done) {

    IntegrationTestHelper.setup(function (CQRSProvider) {
      CQRSProvider.setUrlFactory(function () {
        return 'http://localhost:3000/data/profile/id/' + USER_ID;
      });

      CQRSProvider.setQueryParser(function (data) {
        return data.response;
      });

      CQRSProvider.setEventParser(function (data) {
        return {
          payload: data.payload,
          name: data.event
        };
      });

    });

    DenormalizationService = IntegrationTestHelper.getCollaborator('DenormalizationService');
    StoreService = IntegrationTestHelper.getCollaborator('StoreService');
    CQRS = IntegrationTestHelper.getCollaborator('CQRS');
    $http = IntegrationTestHelper.getCollaborator('$http');
    $http.get('http://localhost:3000/auth/providerdummy').success(function (data) {
      USER_ID = data.id;
      done();
    });
  });


  beforeEach(function () {

    var mySocket = io('http://localhost:3000');

    // pass in events from your socket
    mySocket.on('events', function (data) {
      CQRS.eventReceived(data);
    });

    // pass commands to your socket
    CQRS.onCommand(function (data) {
      mySocket.emit('commands', data);
    });

  });

  it('should fetch profile and update on event', function (done) {

    DenormalizationService.registerDenormalizerFunction({
      viewModelName: 'profile',
      eventName: 'profileChanged'
    }, function (oldData, payload) {
      return angular.extend(oldData, payload);
    });

    var store = StoreService.createForService();
    var callbackInvokeCounter = 0;

    console.log(Date.now());
    store.for('profile').do(function (result) {
      expect(result).not.to.be(undefined);
      callbackInvokeCounter++;

      if (callbackInvokeCounter === 1) {
        CQRS.sendCommand({
          command: 'changeProfile',
          aggregateType: 'profile',
          payload: {
            description: 'new Description',
            id: result.profile.id
          }
        });
      } else if (callbackInvokeCounter > 1) {
        console.log(Date.now());
        done();
      }
    });

  });

});
