/**
 * Extends 'expect.js' with promise functionality.
 *
 * Use like 'normal' expect calls. Pass in promise.
 *
 *  expect(PROMISE_OBJECT)....
 *
 * additionally, you can assert that a promise is rejected:
 *
 *  expect(PROMISE_OBJECT).toBeRejected();
 *
 */

function extendWithPromiseLogic(functionName) {
   var originalFunctionName = functionName + 'original';
   expect.Assertion.prototype[originalFunctionName] = expect.Assertion.prototype[functionName];
   expect.Assertion.prototype[functionName] = function () {
      // this.obj is the 'actual' result to test

      if (!this.obj.then) {
         return this[originalFunctionName].apply(this, arguments);
      }

      var assertionInstance = this,
         assertionFunctionArguments = arguments;
      this.obj.then(function (result) {
         assertionInstance.obj = result;
         assertionInstance[originalFunctionName].apply(assertionInstance, assertionFunctionArguments);
      });
      return this;
   };
}

function extendWithRejectAssertion() {
   expect.Assertion.prototype.toBeRejected = function () {
      if (!this.obj.then) {
         throw new Error('Actual object to test is not a promise! (' + this.obj + ')');
      }

      this.obj.then(function (result) {
         throw new Error('expected promise to be rejected. Instead resolved to ' + result);
      }, function () {
         // this is ok -> success
      });

   };
}

Object.getOwnPropertyNames(expect.Assertion.prototype).forEach(function (propertyName) {
   if (typeof expect.Assertion.prototype[propertyName] === 'function') {
      extendWithPromiseLogic(propertyName);
   }
});

extendWithRejectAssertion();
