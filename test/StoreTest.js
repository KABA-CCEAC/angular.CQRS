describe('Store', function () {

  var CQRSProvider, Store, $rootScope, $httpBackend;

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

  beforeEach(inject(function (_$rootScope_, _Store_, _$httpBackend_) {
    Store = _Store_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  beforeEach(function () {
    CQRSProvider.setUrlFactory(function (modelView) {
      return 'http://www.example.com/api/' + modelView;
    });
  });

  describe('#get()', function () {

    it('should throw error on invalid modelName', function () {
      expect(function () {
        Store.get(function () {
        }, {}, function () {
        });
      }).to.throwException();
    });

    it('should throw error on missing modelName', function () {
      expect(function () {
        Store.get(undefined, {}, function () {
        });
      }).to.throwException();
    });

    it('should throw error on missing callback', function () {
      expect(function () {
        Store.get('myResource', {});
      }).to.throwException();
    });

    it('should throw error on invalid callback', function () {
      expect(function () {
        Store.get('myResource', {}, 'asdf');
      }).to.throwException();
    });

    it('should throw error on invalid parameters object', function () {
      expect(function () {
        Store.get('myResource', function () {
        }, function () {
        });
      }).to.throwException();
    });

    it('should throw error on udefined parameters object', function () {
      expect(function () {
        Store.get('myResource', undefined, function () {
        });
      }).to.throwException();
    });

    it('should invoke callback', function () {
      var dummyDataId = '1234';

      $httpBackend.expect('GET', 'http://www.example.com/api/1234').respond({
        id: '1234',
        attributeOne: 'attributeOneValue'
      });

      var response;
      Store.get(dummyDataId, {}, function (result) {
        response = result;
      });

      $httpBackend.flush();

      expect(response.id).to.equal(dummyDataId);
    });
  });

  describe('#clear()', function () {
    it('should clear the store', function () {
      Store.clear();
    });
  });

  describe('#onEvent()', function () {
    it('should notify all subscribed callbacks on new event', function () {
      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond({foo: 'bar'});

      var callback1, callback2;
      Store.get('myProfile', {}, function (persons) {
        callback1 = persons;
      });
      Store.get('myProfile', {}, function (persons) {
        callback2 = persons;
      });

      $httpBackend.flush();

      var newAddress = {id: 123, street: 'Hauptweg'};
      var event = {viewModel: 'myProfile', eventName: 'move', payload: newAddress};
      $rootScope.$emit('CQRS:events', event);

      expect(callback1).to.be(newAddress);
      expect(callback2).to.be(newAddress);
    });

    it('should NOT notify callbacks on invalid event (missing resource identifier)', function () {
      var initialQueryData = {foo: 'bar'};
      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond(initialQueryData);

      var callback1, callback2;
      Store.get('myProfile', {}, function (persons) {
        callback1 = persons;
      });
      Store.get('myProfile', {}, function (persons) {
        callback2 = persons;
      });

      $httpBackend.flush();

      var newAddress = {id: 123, street: 'Hauptweg'};
      var event = {eventName: 'move', payload: newAddress};
      $rootScope.$emit('CQRS:events', event);

      expect(callback1.foo).to.be(initialQueryData.foo);
      expect(callback2.foo).to.be(initialQueryData.foo);
    });

    it('should NOT notify callbacks on invalid event (missing eventName)', function () {
      var initialQueryData = {foo: 'bar'};
      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond(initialQueryData);

      var callback1, callback2;
      Store.get('myProfile', {}, function (persons) {
        callback1 = persons;
      });
      Store.get('myProfile', {}, function (persons) {
        callback2 = persons;
      });

      $httpBackend.flush();

      var newAddress = {id: 123, street: 'Hauptweg'};
      var event = {viewModel: 'myProfile', payload: newAddress};
      $rootScope.$emit('CQRS:events', event);

      expect(callback1.foo).to.be(initialQueryData.foo);
      expect(callback2.foo).to.be(initialQueryData.foo);
    });

    it('should NOT notify callbacks on invalid event (missing payload)', function () {
      var initialQueryData = {foo: 'bar'};
      $httpBackend.when('GET', 'http://www.example.com/api/myProfile').respond(initialQueryData);

      var callback1 , callback2;
      Store.get('myProfile', {}, function (persons) {
        callback1 = persons;
      });
      Store.get('myProfile', {}, function (persons) {
        callback2 = persons;
      });

      $httpBackend.flush();

      var event = {viewModel: 'myProfile', eventName: 'move'};
      $rootScope.$emit('CQRS:events', event);

      expect(callback1.foo).to.be(initialQueryData.foo);
      expect(callback2.foo).to.be(initialQueryData.foo);
    });

    it('should not invoke denormalizer and callback on event with unknown modelView', function () {

      CQRSProvider.registerDenormalizerFunctions('myProfile', 'move', function () {
        throw 'should not be invoked...';
      });

      var newAddress = {id: 123, street: 'Hauptweg'};
      var event = {viewModel: 'myProfile', eventName: 'move', payload: newAddress};
      $rootScope.$emit('CQRS:events', event);

    });


  });


});