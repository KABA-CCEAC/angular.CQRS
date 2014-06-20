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
      CQRSProvider.setUrlFactory(function (dataId) {
         return 'http://www.example.com/api/' + dataId;
      });
   });

   describe('#get()', function () {

      it('should not be undefined', function () {
         expect(Store.get).not.to.be(undefined);
      });

      it('should return a promise wich resolves eventually', function () {
         var dummyDataId = '1234';

         $httpBackend.expect('GET', 'http://www.example.com/api/1234').respond({
            id: '1234',
            attributeOne: 'attributeOneValue'
         });

         Store.get(dummyDataId).then(function (result) {
            expect(result.id).to.equal(dummyDataId);
         });

         // apply in order to trigger promise ro resolve
         $rootScope.$apply();
      });

   });

});