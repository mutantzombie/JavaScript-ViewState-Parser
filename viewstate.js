// Copyright 2011-2013, Mike Shema <mike@deadliestwebattacks.com>

YUI().use('event', 'node', 'tree', function (Y) {

  var viewStateText = Y.one('#vs');

  var buildTree = function(data) {
    var div = Y.one('#resultTree'),
        item = null,
        tree = new Y.Tree(),
        node = tree.rootNode,
        spaces = '....................';

    data.forEach(function(d) {
      node.append({id: d.str()});
      item = Y.Node.create(spaces.substring(0, d.depth()) + ' ' + d.str() + '<br>');
      div.append(item);
    });
//    console.log(tree);

    return tree;
  }

  var decode = function(e) {
    var text = viewStateText.get('value');
    if(text.length) {
      var vs = new ViewState(text);
      if(vs.isValid) {
        vs.consume();
        var c = vs.components(),
            tree = buildTree(c);
      }
    }
  }

  Y.one('#decode').on('click', decode);

});
