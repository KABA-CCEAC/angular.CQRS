angular.module('ngCQRS')

/**
 * @ngdoc service
 * @name ngCQRS.service:ObjectId
 *
 * @description
 *    Used to obtain a objectId that mimics how WCF serializes a object of type MongoDB.Bson.ObjectId
 *    and converts between that format and the standard 24 character representation.
 *    Inspired by https://github.com/justaprogrammer/ObjectId.js
 *
 * ### Usage
 *
 *  ```javascript
 * mymodule.service('MyService', function(ObjectId){
 *
 * var objectIdOne = ObjectId();
 * var objectIdTwo = ObjectId(0, 0, 0, 0x00ffffff);
 * var objectIdThree = ObjectId('507f1f77bcf86cd799439011');
 * console.log(objectIdOne.toArray());
 * console.log(objectIdThree.toArray());
 *
 * });
 *  ```
 *
 */
  .service('ObjectId', function ObjectId() {

    /**
     * taken from modernizr, see https://github.com/Modernizr/Modernizr/
     */
    function localStorageSupported() {
      var testString = 'tenac';
      try {
        window.localStorage.setItem(testString, testString);
        window.localStorage.removeItem(testString);
        return true;
      } catch (e) {
        return false;
      }
    }

    /*
     *
     * Copyright (c) 2011 Justin Dearing (zippy1981@gmail.com)
     * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
     * and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
     * This software is not distributed under version 3 or later of the GPL.
     *
     * Version 1.0.1-dev
     *
     */

    var increment = 0;
    var pid = Math.floor(Math.random() * (32767));
    var machine = Math.floor(Math.random() * (16777216));

    if (localStorageSupported()) {
      var mongoMachineId = parseInt(window.localStorage.mongoMachineId);
      if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
        machine = Math.floor(window.localStorage.mongoMachineId);
      }
      // Just always stick the value in.
      window.localStorage.mongoMachineId = machine;
      window.document.cookie = 'mongoMachineId=' + machine + ';expires=Tue, 19 Jan 2038 05:00:00 GMT';
    } else {
      var cookieList = window.document.cookie.split('; ');
      for (var i in cookieList) {
        var cookie = cookieList[i].split('=');
        if (cookie[0] === 'mongoMachineId' && cookie[1] >= 0 && cookie[1] <= 16777215) {
          machine = cookie[1];
          break;
        }
      }
      window.document.cookie = 'mongoMachineId=' + machine + ';expires=Tue, 19 Jan 2038 05:00:00 GMT';
    }


    /**
     * @ngdoc object
     * @name ngCQRS.service:ObjectId#ObjectId
     * @methodOf ngCQRS.service:ObjectId
     * @kind function
     *
     * @param {number} timestamp Optional Unix timestamp
     * @param {number} machine Optional machine identifier
     * @param {number} pid Optional process id
     * @param {number} increment Optional increment
     */
    function ObjectId() {
      if (!(this instanceof ObjectId)) {
        return new ObjectId(arguments[0], arguments[1], arguments[2], arguments[3]);
      }
      if (typeof arguments[0] === 'string' && arguments[0].length === 24) {
        this.timestamp = Number('0x' + arguments[0].substr(0, 8));
        this.machine = Number('0x' + arguments[0].substr(8, 6));
        this.pid = Number('0x' + arguments[0].substr(14, 4));
        this.increment = Number('0x' + arguments[0].substr(18, 6));
      } else if (arguments.length === 4 && angular.isDefined(arguments[0]) && angular.isDefined(arguments[1]) && angular.isDefined(arguments[2]) && angular.isDefined(arguments[3])) {
        this.timestamp = arguments[0];
        this.machine = arguments[1];
        this.pid = arguments[2];
        this.increment = arguments[3];
      } else {
        this.timestamp = Math.floor(new Date().valueOf() / 1000);
        this.machine = machine;
        this.pid = pid;
        this.increment = increment++;
        if (increment > 0xffffff) {
          increment = 0;
        }
      }
    }

    ObjectId.prototype.getDate = function () {
      return new Date(this.timestamp * 1000);
    };

    /**
     * @ngdoc object
     * @name ngCQRS.service:ObjectId#toArray
     * @methodOf ngCQRS.service:ObjectId
     * @kind function
     *
     * @description Returns the ObjectId instance as byte array
     */
    ObjectId.prototype.toArray = function () {
      var strOid = this.toString();
      var array = [];
      var i;
      for (i = 0; i < 12; i++) {
        array[i] = parseInt(strOid.slice(i * 2, i * 2 + 2), 16);
      }
      return array;
    };

    /**
     * @ngdoc object
     * @name ngCQRS.service:ObjectId#toString
     * @methodOf ngCQRS.service:ObjectId
     * @kind function
     *
     * @description Returns the 24 character string representation
     */
    ObjectId.prototype.toString = function () {
      var timestamp = this.timestamp.toString(16);
      var machine = this.machine.toString(16);
      var pid = this.pid.toString(16);
      var increment = this.increment.toString(16);
      return '00000000'.substr(0, 8 - timestamp.length) + timestamp +
        '000000'.substr(0, 6 - machine.length) + machine +
        '0000'.substr(0, 4 - pid.length) + pid +
        '000000'.substr(0, 6 - increment.length) + increment;
    };

    return ObjectId;
  });
