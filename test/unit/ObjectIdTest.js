describe('ObjectId', function () {


  var ObjectId;

  beforeEach(function () {
    angular.mock.module('ngCQRS');
  });

  beforeEach(inject(function (_ObjectId_) {
    ObjectId = _ObjectId_;
  }));

  describe('service instantiation', function () {

    it('should work without localStorage', function () {

      window.localStorage.setItem = function () {
        throw 'no localStorage';
      };
      var objectId = ObjectId();
      var objectIdString = objectId.toString();
      expect(objectIdString).not.to.be(null);
      expect(objectIdString).not.to.be(undefined);
    });
  });

  describe('constructor', function () {

    it('can be invoked with no arguments ', function () {
      var objectId = ObjectId();
      var objectIdString = objectId.toString();
      expect(objectIdString).not.to.be(null);
      expect(objectIdString).not.to.be(undefined);
    });

    it('can be invoked with 4 arguments ', function () {
      var objectId = ObjectId(0, 0, 0, 0x00ffffff);
      var objectIdString = objectId.toString();
      expect(objectIdString).not.to.be(null);
      expect(objectIdString).not.to.be(undefined);
      expect(objectIdString).to.be('000000000000000000ffffff');
    });

  });

  describe('#getDate()', function () {
    it('should serialize and deserialize the timestamp', function () {
      var now = new Date();
      var timeStamp = Math.floor(now.valueOf() / 1000) * 1000;
      var aboutNow = new Date(timeStamp);
      var objectId = ObjectId();
      expect(objectId.getDate().valueOf()).to.be(aboutNow.valueOf());
    });
  });

  describe('#toArray()', function () {
    it('should serialize to a byte array', function () {
      var oArray = [0x50, 0x7f, 0x1f, 0x77, 0xbc, 0xf8, 0x6c, 0xd7, 0x99, 0x43, 0x90, 0x11];
      var oString = '507f1f77bcf86cd799439011';
      var objectId = ObjectId(oString);
      expect(objectId.toString()).to.be(oString);
      expect(objectId.toArray()).to.eql(oArray);
    });
  });

});
