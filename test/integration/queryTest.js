describe('query', function () {

  var StoreService, DenormalizationService;

  beforeEach(function () {

    IntegrationTestHelper.setup(function (CQRSProvider) {
      CQRSProvider.setUrlFactory(function () {
        return 'http://localhost:3000/data/profile/id/53ad27e10831bf3012cd8dcd';
      });
    });

    DenormalizationService = IntegrationTestHelper.getCollaborator('DenormalizationService');
    StoreService = IntegrationTestHelper.getCollaborator('StoreService');
  });


  it('should fetch profile', function (done) {
    DenormalizationService.registerDenormalizerFunction('profile', 'profile', 'profileChanged', function (oldData, payload) {
      return payload;
    });

    var store = StoreService.createForService();

    store.for('profile').do(function (result) {
      expect(result).to.be(true);
      done();
    });

  });

});
