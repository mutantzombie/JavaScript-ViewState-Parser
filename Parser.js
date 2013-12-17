// Copyright 2011-2013, Mike Shema <mike@deadliestwebattacks.com>

function capabilityChecks() {
  return 'undefined' !== typeof(ArrayBuffer);
}

function Component(id, d, s) {
  this.m_depth = d;
  this.m_id = id;
  this.m_string = s;

  this.depth = function() {
    return this.m_depth;
  }

  this.str = function() {
    var s = new String("");
    s += this.m_string;
    return s;
  }
}

function ViewState(inBase64) {
  this.m_base64 = inBase64;
  this.m_raw = atob(inBase64);
  this.m_bytes = new Uint8Array(new ArrayBuffer(this.m_raw.length));
  this.m_depth = 0;
  this.m_position = 0;
  this.m_components = new Array();

  for(var i = 0; i < this.m_raw.length; ++i) {
    this.m_bytes[i] = this.m_raw.charCodeAt(i);
  }

  this.isValid = function() {
    return 0xff == this.m_bytes[0] && 0x01 == this.m_bytes[1];
  }

  this.components = function() {
    return this.m_components;
  }

  this.consume = function() {
    this.m_position = 2;
    this.parse()
    var n = this.m_bytes.length - this.m_position;
    if(20 == n)
      this.pushComponent("SHA1", "SHA1");
    else if(16 == n)
      this.pushComponent("MD5", "MD5");
  }

  this.parse = function() {
    ++this.m_depth;
    var f = this.foo[this.m_bytes[this.m_position]];
    if('function' === typeof(f)) {
      f(this);
    }
    else if(0x14 == this.m_bytes[this.m_position] &&
            0x2b == this.m_bytes[this.m_position + 1]) {
      this.m_position += 2;
      if(0x00 == this.m_bytes[this.m_position] &&
         0x04 == this.m_bytes[this.m_position + 1]) {
        this.m_position += 2;
        while(0x02 != this.m_bytes[this.m_position]) {    // ???
          ++this.m_position;
        }
        this.parseUInteger32(this);
        this.parse();
        this.parse();
      }
      else if(0x00 == this.m_bytes[this.m_position]) {
        ++this.m_position;
        var n = this.parseUInteger32(this);
        while(n > 0) {
          this.parse();
          --n;
        }
      }
      else {
        this.parse();
      }
    }
    else {
      this.pushComponent("byte", "byte " + this.m_bytes[this.m_position]);
      ++this.m_position;
    }
    --this.m_depth;
  }

  this.parseContainer = function(o, s) {
    ++o.m_position;
    var n = o.parseUInteger32(o);
    o.pushComponent("array", "array (" + n + ")");
    ++o.m_depth;
    while(n > 0) {
      o.parse();
      --n;
    }
    --o.m_depth;
  }

  this.parseString = function(o) {
    var n = o.parseUInteger32(o) + o.m_position;
    var s = new String("");

    while(o.m_position < n) {
      s += String.fromCharCode(parseInt(o.m_bytes[o.m_position]));
      ++o.m_position;
    }

    return s;
  }

  this.parseUInteger32 = function(o) {
    var n = parseInt(o.m_bytes[o.m_position]) & 0x7f;

    if(parseInt(o.m_bytes[o.m_position]) > 0x7f) {
      ++o.m_position;
      n += (parseInt(o.m_bytes[o.m_position]) & 0x7f) << 7;

      if(parseInt(o.m_bytes[o.m_position]) > 0x7f) {
        ++o.m_position;
        n += (parseInt(o.m_bytes[o.m_postion]) & 0x7f) << 14;
      }
    }

    ++o.m_position;

    return n;
  }

  this.pushComponent = function(id, s) {
    var c = new Component(id, this.m_depth, s);
    this.m_components.push(c);
  }
}

ViewState.prototype.foo = new Object();
ViewState.prototype.foo[0x02] = function(o) {
  ++o.m_position;
  var n = o.parseUInteger32(o);
  o.pushComponent("", n);
}
ViewState.prototype.foo[0x03] = function(o) {
  o.parseContainer(o, "Booleans");
}
ViewState.prototype.foo[0x05] = function(o) {
  ++o.m_position;
  var s = o.parseString(o);
  o.pushComponent("string", s);
}
ViewState.prototype.foo[0x09] = function(o) {
  ++o.m_position;
  o.pushComponent("RGBA", "RGBA");
  o.m_position += 4;
}
ViewState.prototype.foo[0x0b] = function(o) {
  ++o.m_position;
  var s = String("");
  if(0x29 == o.m_bytes[o.m_position]) {
    ++o.m_position; // 0x01
    var n = o.parseUInteger32(o);
    while(n > 0) {
      s += String.fromCharCode(parseInt(o.m_bytes[o.m_position]));
      ++o.m_position;
      --n;
    }
    ++o.m_position; // 0x02
    o.parse();
    o.parse();
  }
  else {
    while(0x00 != o.m_bytes[o.m_position]) {
      s += String.fromCharCode(parseInt(o.m_bytes[o.m_position]));
      ++o.m_position;
    }
    ++o.m_position;
  }
  o.pushComponent("string", s);
}
ViewState.prototype.foo[0x0f] = function(o) {
  o.update(o, "pair ");
  o.parse(); o.parse();
}
ViewState.prototype.foo[0x10] = function(o) {
  o.update(o, "triplet");
  o.parse(); o.parse(); o.parse();
}
ViewState.prototype.foo[0x15] = function(o) {
  ++o.m_position;
  var n = o.parseUInteger32(o);
  o.pushComponent("array", "string array (" + n + ")");
  ++o.m_depth;
  var sa = new Array();
  while(n > 0) {
    if(0x00 == o.m_bytes[o.m_position]) {
      ++o.m_position;
      o.pushComponent("empty", "NULL");
    }
    else
      o.pushComponent("string", o.parseString(o));
    --n;
  }
  --o.m_depth;
}
ViewState.prototype.foo[0x16] = function(o) {
  o.parseContainer(o, "objects");
}
ViewState.prototype.foo[0x18] = function(o) {
    ++o.m_position;
    var n = o.parseUInteger32(o);
    o.pushComponent("cs", "control state (" + n + ")");
    ++o.m_depth;
    while(n > 0) {
      o.parse();
      o.parse();
      --n;
    }
    --o.m_depth;
}
ViewState.prototype.foo[0x1b] = function(o) {
  o.update(o, "unit");
  o.m_position += 12;
}
ViewState.prototype.foo[0x1e] = ViewState.prototype.foo[0x05];
ViewState.prototype.foo[0x1f] = function(o) {
  ++o.m_position;
  var n = o.parseUInteger32(o);
  o.pushComponent("stringref", "stringref (" + n + ")");
}
ViewState.prototype.foo[0x24] = function(o) {
  ++o.m_position;
  o.pushComponent("UUID", "UUID");
  o.m_position += 36;
}
ViewState.prototype.foo[0x64] = function(o) { o.update(o, "{empty}"); }
ViewState.prototype.foo[0x65] = function(o) { o.update(o, "{empty string}"); }
ViewState.prototype.foo[0x66] = function(o) { o.update(o, "number: 0"); }
ViewState.prototype.foo[0x67] = function(o) { o.update(o, "true"); }
ViewState.prototype.foo[0x68] = function(o) { o.update(o, "false"); }
ViewState.prototype.update = function(o, s) { ++o.m_position; o.pushComponent(s, s); }

