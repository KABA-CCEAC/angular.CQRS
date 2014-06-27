describe('query and update on event', function () {

  var CQRS, StoreService, DenormalizationService;

  beforeEach(function () {

    IntegrationTestHelper.setup(function (CQRSProvider) {
      CQRSProvider.setUrlFactory(function () {
        return 'http://localhost:3000/data/profile/id/53ad27e10831bf3012cd8dcd';
      });
    });

    DenormalizationService = IntegrationTestHelper.getCollaborator('DenormalizationService');
    StoreService = IntegrationTestHelper.getCollaborator('StoreService');
    CQRS = IntegrationTestHelper.getCollaborator('CQRS');
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
      aggregateType: 'profile',
      eventName: 'profileChanged'
    }, function (oldData, payload) {
      return payload;
    });

    var store = StoreService.createForService();
    var callbackInvokeCounter = 0;

    store.for('profile').do(function (result) {
      expect(result).not.to.be(undefined);
      callbackInvokeCounter++;
      if (callbackInvokeCounter > 1) {
        done();
      }
    });

    // TODO: is a pause needed here?

    CQRS.sendCommand('profile', 'changeProfile', {
      // TODO:  add some changed attributes to this command payload
    });

  });

});
