/**
 * Checks CallExpression AST-Node for angular component definition.
 * Checks if given function is named, in order to simplify debugging.
 */
module.exports = function (context) {

  var COMPONENT_NAMES = [ 'service', 'controller', 'directive', 'filter', 'config', 'provider' ];

  function isDefined(value) {
    return typeof value !== 'undefined';
  }

  function isAngularComponentName(nameValue) {
    var found = false;
    COMPONENT_NAMES.every(function (componentName) {
      if (componentName === nameValue) {
        found = true;
        return false;
      }
      return true;
    });
    return found;
  }

  function isAngularComponentDefinition(callee) {
    return (callee.type === 'MemberExpression' && callee.object.type === 'CallExpression' && isAngularComponentName(callee.property.name));
  }

  function functionArgumentExists(node) {
    return (node.arguments.length > 0 && isDefined(node.arguments[1]));
  }

  function functionArgumentIsNamed(node) {
    var idObject = node.arguments[1].id;
    if (isDefined(idObject) && idObject !== null && isDefined(idObject.name)) {
      return true;
    }
    return false;
  }

  function functionArgumentIsCorrectlyNamed(node) {
    return node.arguments[0].value === node.arguments[1].id.name;
  }

  return {
    "CallExpression": function (node) {
      if (isAngularComponentDefinition(node.callee)) {
        if (functionArgumentExists(node)) {
          var source = context.getSource(node, 0, 0);
          if (!functionArgumentIsNamed(node)) {
            context.report(node, 'Found angular {{type}} declaration with unnamed function: "{{componentName}}"', {type: node.callee.property.name, componentName: node.arguments[0].value});
          } else if (!functionArgumentIsCorrectlyNamed(node)) {
            context.report(node, 'Found angular {{type}} declaration with wrongly named function: "{{componentName}}" <--> "{{functionName}}"', {
                type: node.callee.property.name,
                componentName: node.arguments[0].value,
                functionName: node.arguments[1].id.name}
            );
          }

        }
      }
    }
  };
};
