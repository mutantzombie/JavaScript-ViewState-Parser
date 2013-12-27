// Copyright 2011-2013, Mike Shema <mike@deadliestwebattacks.com>

function Container() {
  this.content = [];
  this.serializeElements = false;

  this.insert = function(e) {
    this.content.push(e);
  }

  this.size = function() {
    return this.m_content.length;
  }

  this.serialize = function() {
    var n = new UInteger32(this.m_content.length);
    var a = n.serialize();

    if(this.serializeElements) {
      for(var i = 0; i < this.m_content.length; ++i) {
        a.push(this.m_content[i].serialize());
      }
    }
    else {
      a.push(this.m_content);
    }

    return a;
  }
}

function createViewState(a) {
  var n = a.length;
  var s = "";

  for(var i = 0; i < n; ++i) {
    s += parseInt(a[i], 16);  // to hex
  }

  return btoa(s);
}

function UInteger32(n) {
  this.m_value = n;

  this.serialize = function() {
    var a = [];

    var n = this.m_value;
    var b = 0;
    while(n > 127) {
      b = n & 0x7f;
      b |= 0x80;
      a.push(b);
      n = n >> 7;
    }
    
    a.push(n);

    return a;
  }

  this.value = function() {
    return this.m_value;
  }
}

function VSString(s) {
  this.m_string = "" + s;

  this.serialize = function() {
    var n = new UInteger32(this.m_string.length);
    var a = n.serialize();

    for(var i = 0; i < this.m_string.length; ++i) {
      a.push(this.m_string.charAt(i));
    }

    return a;
  }
}

