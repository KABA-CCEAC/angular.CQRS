describe('CQRS', function () {

  var CQRSProvider, CQRS, $httpBackend;

  beforeEach(function () {
    // Initialize the service provider by injecting it to a fake module's config block
    var fakeModule = angular.module('testApp', function () {
    });

    fakeModule.config(function (_CQRSProvider_) {
      CQRSProvider = _CQRSProvider_;
    });

    // Initialize ngCQRS module injector
    angular.mock.module('ngCQRS', 'testApp');

    // Kickstart the injectors previously registered with calls to angular.mock.module
    inject(function () {
    });
  });

  beforeEach(inject(function (_CQRS_, _$httpBackend_) {
    CQRS = _CQRS_;
    $httpBackend = _$httpBackend_;
  }));


  beforeEach(function () {
    CQRSProvider.setUrlFactory(function (dataId) {
      return 'http://www.example.com/api/' + dataId;
    });
  });

  describe('#query()', function () {

    it('should not be undefined', function () {
      expect(CQRS).not.to.be(undefined);
      expect(CQRS.query).not.to.be(undefined);
    });

    it('should call defined url', function () {
      var data = {id: 123, name: 'marvin'};
      $httpBackend.expectGET('http://www.example.com/api/myResource').respond(data);
      var response = CQRS.query('myResource');
      $httpBackend.flush();
      expect(response).to.equal(data);
    });

  });

  beforeEach(function () {
    CQRSProvider.registerDenormalizerFunctions('myResource', 'myEventName', function (originalData, delta) {
      if (angular.isDefined(originalData) && angular.isDefined(delta)) {
        return 'success';
      }
    });
  });

  describe('#denormalize()', function () {

    it('should denormalize with registered function', function () {
      var origData = {id: 22, name: 'sergio'};
      var testEvent = {resource: 'myResource', eventName: 'myEventName', payload: {id: 22, name: 'marvin'}};
      expect(CQRS.denormalize(testEvent, origData, testEvent.payload)).to.be('success');
    });

    it('should return delta if no denormalizer function found', function () {
      var origData = {id: 22, name: 'sergio'};
      var testEvent = {resource: 'myResource', eventName: 'myOtherEvent', payload: {id: 22, name: 'marvin'}};
      expect(CQRS.denormalize(testEvent, origData, testEvent.payload)).to.be(testEvent.payload);
    });

  });

});