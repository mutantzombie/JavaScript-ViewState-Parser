// Copyright 2011-2012, Mike Shema <mike@deadliestwebattacks.com>

function c() {
  document.getElementById("results").innerHTML = "";
}

function deserialize(o) {
  var e = document.getElementById("results");
  var s = "invalid";

  if(!capabilityChecks()) {
    s = "browser does not support Typed Array Specification (http://www.khronos.org/registry/typedarray/specs/latest/)";
  }
  else if(undefined != o && "" !== o) {
    var vs = new ViewState(o);
    if(vs.isValid()) {
      vs.consume();
      var c = vs.components();
      populateTree(c);
      s = "";
    }
  }
  e.innerHTML = s;
}

function populateTree(c) {
  var tree = new YAHOO.widget.TreeView("resultTree");
  var rootNode = tree.getRoot();

  var node = rootNode;
  var parentNode = rootNode;
  var nodes = new Array();
  nodes[0] = rootNode;
  nodes[1] = rootNode;

  var e = c[0];
  var prevDepth = 0;
  var i = 0;
  while(i < c.length) {
    e = c[i];

    if(e.depth() > prevDepth) {
      parentNode = nodes[prevDepth];
    }
    else if(e.depth() < prevDepth) {
      if(undefined == nodes[e.depth()])
        nodes[e.depth()] = rootNode;

      parentNode = nodes[e.depth()].parent;
    }

    if(undefined == parentNode)
      parentNode = rootNode;
  
    node = new YAHOO.widget.TextNode(e.str(), parentNode, false);

    nodes[e.depth()] = node;
    prevDepth = e.depth();
    ++i;
  }

  YAHOO.util.Event.on("expand", "click", function(e) {
      YAHOO.log("Expanding all TreeView  nodes.", "info", "example");
      tree.expandAll();
      YAHOO.util.Event.preventDefault(e);
    });
    
    YAHOO.util.Event.on("collapse", "click", function(e) {
      YAHOO.log("Collapsing all TreeView  nodes.", "info", "example");
      tree.collapseAll();
      YAHOO.util.Event.preventDefault(e);
    });

  tree.draw();
}
