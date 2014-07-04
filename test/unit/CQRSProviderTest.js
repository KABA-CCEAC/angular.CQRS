describe('CQRSProvider', function () {

  var CQRSProvider;

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


  describe('#setUrlFactory()', function () {
    it('should set url factory function successfully', function () {
      CQRSProvider.setUrlFactory(function (dataId) {
        return dataId;
      });
    });

    it('should throw on invalid function', function () {
      expect(function () {
        CQRSProvider.setUrlFactory('notAFunction');
      }).to.throwError();
    });

  });

  describe('#toUrlGETParameterString()', function () {
    it('should build valid url GET parameter string', function () {
      var buildString = CQRSProvider.toUrlGETParameterString({one: '1', 2: 'two'});

      expect(buildString.charAt(0)).to.be('?');
      expect(buildString).to.contain('one=1');
      expect(buildString).to.contain('2=two');
      expect(buildString).to.contain('&');
    });
  });

  describe('#setQueryParser()', function () {
    it('should set parser function', function () {
      CQRSProvider.setQueryParser(function (responseData) {
        return responseData.response;
      });
    });

    it('should throw on invalid function', function () {
      expect(function () {
        CQRSProvider.setQueryParser('notAFunction');
      }).to.throwError();
    });
  });

  describe('#setEventParser()', function () {
    it('should set parser function', function () {
      CQRSProvider.setEventParser(function (responseData) {
        return responseData.response;
      });
    });

    it('should throw on invalid function', function () {
      expect(function () {
        CQRSProvider.setEventParser('notAFunction');
      }).to.throwError();
    });
  });

  describe('#setCommandIdExtractionFunction()', function () {
    it('should set commandId extraction function', function () {
      CQRSProvider.setCommandIdExtractionFunction(function (event) {
        return event.mySpecialCommandIdAttributeName;
      });
    });

    it('should throw on invalid function', function () {
      expect(function () {
        CQRSProvider.setCommandIdExtractionFunction('notAFunction');
      }).to.throwError();
    });
  });

});
