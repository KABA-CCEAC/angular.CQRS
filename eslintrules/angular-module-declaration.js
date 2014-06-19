/**
 * Checks CallExpression AST-Node for angular module definition.
 * Does not allow declaration of angular modules "angular.module('NAME',[])"
 * Will allow module reference "angular.module('Name')"
 */
module.exports = function (context) {

   function isAngularModuleExpression(callee) {
      return (callee.type === 'MemberExpression' && callee.object.name === 'angular' && callee.property.name === 'module');
   }

   return {
      "CallExpression": function (node) {
         if (isAngularModuleExpression(node.callee)) {
            var source = context.getSource(node, 0, 2);
            if (source.match(/[\[|\]]/)) {
               context.report(node, 'Found angular module declaration: "{{source}}"', {source: source});
            }
         }
      }
   };
};