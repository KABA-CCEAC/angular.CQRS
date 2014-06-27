describe('DenormalizationService', function () {

  var DenormalizationService;

  beforeEach(function () {
    angular.mock.module('ngCQRS');
  });

  beforeEach(inject(function (_DenormalizationService_) {
    DenormalizationService = _DenormalizationService_;
  }));


  describe('#registerDenormalizerFunction()', function () {
    it('should register denormalizer function successfully', function () {
      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'profile',
        aggregateType: 'person',
        eventName: 'move'
      }, function (originalData, delta) {
        originalData[delta.id] = delta;
        return originalData;
      });
    });

    it('should register denormalizer function without aggregateType successfully', function () {
      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'profile',
        eventName: 'move'
      }, function (originalData, delta) {
        originalData[delta.id] = delta;
        return originalData;
      });
    });


    it('should not allow to register multiple functions for the same resource/event combination', function () {
      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'profile',
        aggregateType: 'person',
        eventName: 'move'
      }, function () {
        //foo
      });

      expect(function () {
        DenormalizationService.registerDenormalizerFunction({
          viewModelName: 'profile',
          aggregateType: 'person',
          eventName: 'move'
        }, function () {
          //foo
        });
      }).to.throwException();
    });
  });

  describe('#getDenormalizerFunctions()', function () {

    it('should return empty object if eventName is not known', function () {
      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'profile',
        aggregateType: 'person',
        eventName: 'move'
      }, function () {
        //foo
      });

      expect(DenormalizationService.getDenormalizerFunctions('unknownEventName', 'person')).to.eql({});
    });

    it('should return empty object if aggregateType is not known', function () {
      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'profile',
        aggregateType: 'person',
        eventName: 'move'
      }, function () {
        //foo
      });
      expect(DenormalizationService.getDenormalizerFunctions('move', 'someUnknownAggregateType')).to.eql({});
    });

    it('should return correct denomalizer for viewModel/event name pair without specific aggregateType', function () {

      var denormalizerFunction = function () {
        //foo
      };
      DenormalizationService.registerDenormalizerFunction({
        viewModelName: 'profile',
        eventName: 'move'
      }, denormalizerFunction);
      expect(DenormalizationService.getDenormalizerFunctions('move').profile).to.be(denormalizerFunction);
    });

  });

});
