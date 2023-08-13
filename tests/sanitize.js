import sanitizer from "sanitizer";
const { sanitize } = sanitizer;
import { equal } from "assert";
import {
  lowerCase,
  upperCase,
  titleCase,
  clean,
  deburr,
  sentenceCase,
} from "../namespace/sanitize.js";

const { sanitizeWithPolicy, makeSaxParser } = sanitizer;

var logMessages = [];

function nmTokenPolicy(nmTokens) {
  if ("specialtoken" === nmTokens) {
    return nmTokens;
  }
  if (/[^a-z\t\n\r ]/i.test(nmTokens)) {
    return null;
  } else {
    return nmTokens.replace(
      /([^\t\n\r ]+)([\t\n\r ]+|$)/g,
      function (_, id, spaces) {
        return "p-" + id + (spaces ? " " : "");
      }
    );
  }
}

function uriPolicy(value, effects, ltype, hints) {
  if (value && "specialurl" === value.toString()) {
    return value;
  }
  return "u:" + value.toString();
}

function logPolicy(msg, detail) {
  logMessages.push(msg);
}

describe("Glad.sanitizer", function () {
  it("should sanitize and convert to lowercase", () => {
    let encoded = lowerCase("Milo & Otis");
    equal("milo &amp; otis", encoded);
  });

  it("should sanitize and convert to uppercase", () => {
    let encoded = upperCase("Milo & Otis");
    equal("MILO &AMP; OTIS", encoded);
  });

  it("should sanitize and convert to titleCase", () => {
    let encoded = titleCase("milo & otis");
    equal("Milo &amp; Otis", encoded);
  });

  it("should sanitize, clean and trim the string", () => {
    let encoded = clean(" milo &   otis  ");
    equal("milo &amp; otis", encoded);
  });

  it("should sanitize and deburr the string", () => {
    let encoded = deburr("мilo<script></script>");
    equal("milo", encoded);
  });

  it("should sanitize and sentenceCase the string", () => {
    let encoded = sentenceCase("the quick. fox jumped. over & out");
    equal("The quick. Fox jumped. Over &amp; out", encoded);
  });
});

describe("Sanitizer.sanitize (npm sanitizer tests should pass)", function () {
  it("should sanitize empty", function () {
    equal("", sanitize(""));
  });

  it("should sanitize simple text", function () {
    equal("hello world", sanitize("hello world"));
  });

  it("should sanitize entities", function () {
    equal("&lt;hello world&gt;", sanitize("&lt;hello world&gt;"));
  });

  it("should sanitize more entities", function () {
    equal("&amp;amp&amp;&amp;&amp;amp", sanitize("&amp&amp;&&amp"));
  });

  it("should remove unknown tags", function () {
    equal(
      "<b>hello <i>world</i></b>",
      sanitize("<u:y><b>hello <bogus><i>world</i></bogus></b>")
    );
  });

  it("should remove unsafe tags", function () {
    equal(
      "<b>hello <i>world</i></b>",
      sanitize("<b>hello <i>world</i><script src=foo.js></script></b>")
    );
  });

  it("should remove unsafe attributes", function () {
    equal(
      "<b>hello <i>world</i></b>",
      sanitize('<b>hello <i onclick="takeOverWorld(this)">world</i></b>')
    );
  });

  it("should escape cruft", function () {
    equal(
      "<b>hello <i>world&lt;</i></b> &amp; tomorrow the universe",
      sanitize("<b>hello <i>world<</i></b> & tomorrow the universe")
    );
  });

  it("should remove tag cruft", function () {
    equal(
      '<b id="p-foo">hello <i>world&lt;</i></b>',
      sanitize(
        '<b id="foo" / -->hello <i>world<</i></b>',
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should prefix ids and classes", function () {
    equal(
      '<b id="p-foo" class="p-boo p-bar p-baz">hello <i>world&lt;</i></b>',
      sanitize(
        '<b id="foo" class="boo bar baz">hello <i>world<</i></b>',
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should remove invalid ids and classes", function () {
    equal(
      "<b>hello <i>world&lt;</i></b>",
      sanitize(
        '<b id="a," class="b c/d e">hello <i class="i*j">world<</i></b>',
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should prefix usemap", function () {
    equal(
      '<img usemap="#p-foo" src="u:http://bar">',
      sanitize('<img usemap="#foo" src="http://bar">', uriPolicy, nmTokenPolicy)
    );
  });

  it("should remove invalid usemaps", function () {
    equal(
      "<b>hello <i>world&lt;</i></b>",
      sanitize(
        '<b id="a," class="b c/d e">hello <i class="i*j">world<</i></b>',
        uriPolicy,
        nmTokenPolicy
      )
    );
    equal(
      '<img src="u:http://bar">',
      sanitize('<img src="http://bar">', uriPolicy, nmTokenPolicy)
    );
    equal(
      '<img src="u:http://bar">',
      sanitize('<img usemap="" src="http://bar">', uriPolicy, nmTokenPolicy)
    );
    equal(
      '<img src="u:http://bar">',
      sanitize('<img usemap="foo" src="http://bar">', uriPolicy, nmTokenPolicy)
    );
  });

  it("should sanitize non-string input", function () {
    var bad = "<b whacky=foo><script src=badness.js></script>bar</b id=foo>";
    equal(
      "<b>bar</b>",
      sanitize(
        {
          toString: function () {
            return bad;
          },
        },
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize special chars in attributes", function () {
    equal(
      '<b title="a&lt;b &amp;&amp; c&gt;b">bar</b>',
      sanitize('<b title="a<b && c>b">bar</b>', uriPolicy, nmTokenPolicy)
    );
  });

  it("should sanitize unclosed tags", function () {
    equal(
      '<div id="p-foo">Bar<br>Baz</div>',
      sanitize('<div id="foo">Bar<br>Baz', uriPolicy, nmTokenPolicy)
    );
  });

  it("should sanitize unopened tags", function () {
    equal(
      "Foo<b>Bar</b>Baz",
      sanitize(
        "Foo<b></select>Bar</b></b>Baz</select>",
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize unsafe end tags", function () {
    equal(
      "",
      sanitize(
        '</meta http-equiv="refresh" content="1;URL=http://evilgadget.com">',
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize empty end tags", function () {
    equal("<input>", sanitize("<input></input>", uriPolicy, nmTokenPolicy));
  });

  it("should strip onload", function () {
    equal(
      '<img src="u:http://foo.com/bar">',
      sanitize(
        "<img src=http://foo.com/bar ONLOAD=alert(1)>",
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize closing tag parameters", function () {
    equal(
      "<p>1<p>2</p><p>3</p>5</p>",
      sanitize(
        '<p>1</b style="x"><p>2</p /bar><p>3</p title=">4">5',
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize auto-closing tags", function () {
    equal(
      '<p><a name="p-foo"></a> This is the foo section.</p><p><a name="p-bar"></a> This is the bar section.</p>',
      sanitize(
        '<p><a name="foo"/> This is the foo section.</p><p><a name="bar"/> This is the bar section.</p>',
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize optional end tags", function () {
    equal(
      "<ol> <li>A</li> <li>B<li>C </ol>",
      sanitize("<ol> <li>A</li> <li>B<li>C </ol>", uriPolicy, nmTokenPolicy)
    );
  });

  it("should sanitize folding of html and body tags", function () {
    equal(
      "<p>P 1</p>",
      sanitize(
        "<html><head><title>Foo</title></head>" +
          "<body><p>P 1</p></body></html>",
        uriPolicy,
        nmTokenPolicy
      )
    );
    equal(
      "Hello",
      sanitize('<body bgcolor="blue">Hello</body>', uriPolicy, nmTokenPolicy)
    );
    equal(
      "<p>Foo</p><p>One</p><p>Two</p>Three<p>Four</p>",
      sanitize(
        "<html>" +
          "<head>" +
          "<title>Blah</title>" +
          "<p>Foo</p>" +
          "</head>" +
          "<body>" +
          "<p>One</p>" +
          "<p>Two</p>" +
          "Three" +
          "<p>Four</p>" +
          "</body>" +
          "</html>",
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize empty and valueless attributes", function () {
    equal(
      '<input checked="" type="checkbox" id="" class="">',
      sanitize(
        '<input checked type=checkbox id="" class=>',
        uriPolicy,
        nmTokenPolicy
      )
    );
    equal(
      '<input checked="" type="checkbox" id="" class="">',
      sanitize(
        '<input checked type=checkbox id= class="">',
        uriPolicy,
        nmTokenPolicy
      )
    );
    equal(
      '<input checked="" type="checkbox" id="" class="">',
      sanitize(
        '<input checked type=checkbox id= class = "">',
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize SGML short tags", function () {
    equal("", sanitize("<p/b/", uriPolicy, nmTokenPolicy));
    equal(
      "<p>first part of the text&lt;/&gt; second part</p>",
      sanitize(
        '<p<a href="/">first part of the text</> second part',
        uriPolicy,
        nmTokenPolicy
      )
    );
    equal("<p></p>", sanitize("<p<b>", uriPolicy, nmTokenPolicy));
  });

  it("should sanitize Nul", function () {
    equal(
      '<a title="x  SCRIPT=javascript:alert(1) ignored=ignored"></a>',
      sanitize(
        '<A TITLE="x\0  SCRIPT=javascript:alert(1) ignored=ignored">',
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize digits in attr names", function () {
    equal(
      "<div>Hello</div>",
      sanitize(
        "<div style1=\"expression('alert(1)')\">Hello</div>",
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize digits in attr names", function () {
    equal(
      "<div>Hello</div>",
      sanitize(
        "<div style1=\"expression('alert(1)')\">Hello</div>",
        uriPolicy,
        nmTokenPolicy
      )
    );
  });

  it("should sanitize incomplete tag open", function () {
    equal("x", sanitize("x<a", uriPolicy, nmTokenPolicy));
    equal("x", sanitize("x<a ", uriPolicy, nmTokenPolicy));
    equal("x", sanitize("x<a\n", uriPolicy, nmTokenPolicy));
    equal("x", sanitize("x<a bc", uriPolicy, nmTokenPolicy));
    equal("x", sanitize("x<a\nbc", uriPolicy, nmTokenPolicy));
  });

  it("should sanitize with uri policy", function () {
    equal(
      '<a href="http://www.example.com/">hi</a>',
      sanitize('<a href="http://www.example.com/">hi</a>', function (uri) {
        return uri;
      })
    );

    equal(
      "<a>hi</a>",
      sanitize('<a href="http://www.example.com/">hi</a>', function (uri) {
        return null;
      })
    );

    equal(
      "<a>hi</a>",
      sanitize('<a href="javascript:alert(1)">hi</a>', function (uri) {
        return uri;
      })
    );

    equal(
      "<a>hi</a>",
      sanitize('<a href="javascript:alert(1)">hi</a>', function (uri) {
        return null;
      })
    );

    equal(
      "<a>hi</a>",
      sanitize('<a href=" javascript:alert(1)">hi</a>', function (uri) {
        return uri;
      })
    );

    equal(
      "<a>hi</a>",
      sanitize('<a href=" javascript:alert(1)">hi</a>', function (uri) {
        return null;
      })
    );

    equal(
      '<a href="//www.example.com/">hi</a>',
      sanitize('<a href="//www.example.com/">hi</a>', function (uri) {
        return uri;
      })
    );

    equal(
      '<a href="foo.html">hi</a>',
      sanitize('<a href="foo.html">hi</a>', function (uri) {
        return uri;
      })
    );

    equal(
      '<a href="bar/baz.html">hi</a>',
      sanitize('<a href="foo.html">hi</a>', function (uri) {
        return "bar/baz.html";
      })
    );

    equal(
      '<a href="mailto:jas@example.com">mail me</a>',
      sanitize('<a href="mailto:jas@example.com">mail me</a>', function (uri) {
        return uri;
      })
    );

    equal(
      "<a>mail me</a>",
      sanitize('<a href="mailto:jas@example.com">mail me</a>', function (uri) {
        return null;
      })
    );

    equal(
      '<a href="foo.html">test</a>',
      sanitize(
        '<a href="foo.html">test</a>',
        function (uri, effect, ltype, hints) {
          equal("MARKUP", hints.TYPE);
          equal("href", hints.XML_ATTR);
          equal("a", hints.XML_TAG);
          return uri;
        }
      )
    );
  });

  it("should sanitize with tag policy", function () {
    equal(
      '<a href="http://www.example.com/">hi</a> there',
      sanitizeWithPolicy(
        '<a href="http://www.example.com/">hi</a> there',
        function (name, attribs) {
          return {
            attribs: attribs,
          };
        }
      )
    );

    equal(
      " there",
      sanitizeWithPolicy(
        '<a href="http://www.example.com/">hi</a> there',
        function (name, attribs) {
          return null;
        }
      )
    );

    equal(
      '<a x="y">hi</a> there',
      sanitizeWithPolicy(
        '<a href="http://www.example.com/">hi</a> there',
        function (name, attribs) {
          return {
            attribs: ["x", "y"],
          };
        }
      )
    );

    equal(
      '<xax href="http://www.example.com/">hi</xax> there',
      sanitizeWithPolicy(
        '<a href="http://www.example.com/">hi</a> there',
        function (name, attribs) {
          return {
            attribs: attribs,
            tagName: "x" + name + "x",
          };
        }
      )
    );

    equal(
      '<span>a<xspanx r="1">b</xspanx>c</span>',
      sanitizeWithPolicy(
        "<span>a<span r=1>b</span>c</span>",
        function (name, attribs) {
          return {
            attribs: attribs,
            tagName: attribs.length ? "x" + name + "x" : name,
          };
        }
      )
    );

    equal(
      '<ul><li>a</li><xlix r="1">b</xlix></ul>',
      sanitizeWithPolicy(
        "<ul><li>a<li r=1>b</li></ul>",
        function (name, attribs) {
          return {
            attribs: attribs,
            tagName: attribs.length ? "x" + name + "x" : name,
          };
        }
      )
    );

    equal(
      '<ul><li>a<ul><xlix r="1">b</xlix></ul></li></ul>',
      sanitizeWithPolicy(
        "<ul><li>a<ul><li r=1>b</li></ul></li></ul>",
        function (name, attribs) {
          return {
            attribs: attribs,
            tagName: attribs.length ? "x" + name + "x" : name,
          };
        }
      )
    );
  });

  it("should log", function () {
    logMessages = [];
    var messages = ["a.href changed"];
    equal(
      '<a href="u:http://www.example.com/">hi</a>',
      sanitize(
        '<a href="http://www.example.com/">hi</a>',
        uriPolicy,
        nmTokenPolicy,
        logPolicy
      )
    );
    equal(messages.length, logMessages.length);

    logMessages.forEach(function (val, i) {
      equal(messages[i], val);
    });

    logMessages = [];
    messages = [];
    equal(
      '<a href="specialurl">hi</a>',
      sanitize(
        '<a href="specialurl">hi</a>',
        uriPolicy,
        nmTokenPolicy,
        logPolicy
      )
    );
    equal(messages.length, logMessages.length);

    logMessages.forEach(function (val, i) {
      equal(messages[i], val);
    });

    logMessages = [];
    messages = ["div.onclick removed"];
    equal(
      "<div></div>",
      sanitize(
        '<div onclick="foo()"></div>',
        uriPolicy,
        nmTokenPolicy,
        logPolicy
      )
    );
    equal(messages.length, logMessages.length);

    logMessages.forEach(function (val, i) {
      equal(messages[i], val);
    });

    logMessages = [];
    messages = ["div.onclick removed", "div.id changed"];
    equal(
      '<div class="specialtoken" id="p-baz"></div>',
      sanitize(
        '<div onclick="foo()" class="specialtoken" id=baz></div>',
        uriPolicy,
        nmTokenPolicy,
        logPolicy
      )
    );
    equal(messages.length, logMessages.length);

    logMessages.forEach(function (val, i) {
      equal(messages[i], val);
    });

    logMessages = [];
    messages = ["script removed"];
    equal(
      "",
      sanitize(
        "<script>alert(1);</script>",
        uriPolicy,
        nmTokenPolicy,
        logPolicy
      )
    );
    equal(messages.length, logMessages.length);

    logMessages.forEach(function (val, i) {
      equal(messages[i], val);
    });
  });

  it("should SAX parse", function () {
    var events = [];

    var addTextEvent = function (type, text, param) {
      var n = events.length;

      if (events[n - 3] === type && events[n - 1] === param) {
        events[n - 2] += text;
      } else {
        events.push(type, text, param);
      }
    };

    var saxParser = makeSaxParser({
      startTag: function (name, attribs, param) {
        events.push("startTag", name + "[" + attribs.join(";") + "]", param);
      },

      endTag: function (name, param) {
        events.push("endTag", name, param);
      },

      pcdata: function (text, param) {
        addTextEvent("pcdata", text, param);
      },

      cdata: function (text, param) {
        addTextEvent("cdata", text, param);
      },

      rcdata: function (text, param) {
        addTextEvent("rcdata", text, param);
      },

      comment: function (text, param) {
        events.push("comment", text, param);
      },

      startDoc: function (param) {
        events.push("startDoc", "", param);
      },

      endDoc: function (param) {
        events.push("endDoc", "", param);
      },
    });

    saxParser(
      "<p id=foo>Foo&amp;Bar</p><script>alert('<b>&amp;</b>')</script>",
      "<param>"
    );
    equal(
      [
        "startDoc",
        "",
        "<param>",
        "startTag",
        "p[id;foo]",
        "<param>",
        "pcdata",
        "Foo&amp;Bar",
        "<param>",
        "endTag",
        "p",
        "<param>",
        "startTag",
        "script[]",
        "<param>",
        "cdata",
        "alert('<b>&amp;</b>')",
        "<param>",
        "endTag",
        "script",
        "<param>",
        "endDoc",
        "",
        "<param>",
      ].join("|"),
      events.join("|")
    );
    events = [];
    saxParser("<some_tag some_attr=x><!--  com>--ment --></some_tag>", "$P");
    equal(
      [
        "startDoc",
        "",
        "$P",
        "startTag",
        "some_tag[some_attr;x]",
        "$P",
        "comment",
        "  com>--ment ",
        "$P",
        "endTag",
        "some_tag",
        "$P",
        "endDoc",
        "",
        "$P",
      ].join("|"),
      events.join("|")
    );
    events = [];
    saxParser("<div><unknown1><unknown2 bar></unknown1>", "$P");
    equal(
      [
        "startDoc",
        "",
        "$P",
        "startTag",
        "div[]",
        "$P",
        "startTag",
        "unknown1[]",
        "$P",
        "startTag",
        "unknown2[bar;]",
        "$P",
        "endTag",
        "unknown1",
        "$P",
        "endDoc",
        "",
        "$P",
      ].join("|"),
      events.join("|")
    );
    events = [];
    saxParser("<x:y 3:.=4></x:y>", "$P");
    equal(
      [
        "startDoc",
        "",
        "$P",
        "startTag",
        "x:y[3:.;4]",
        "$P",
        "endTag",
        "x:y",
        "$P",
        "endDoc",
        "",
        "$P",
      ].join("|"),
      events.join("|")
    );
    events = [];
    saxParser(
      '<div class="testcontainer" id="test"><script>document.write("<b><script>");</script><script>document.write("document.write(");</script><script>document.write("\'Hello,</b> \'");</script><script>document.write(",\'World!\');<\\/script>");</script>!</div>',
      "PARAM"
    );
    equal(
      [
        "startDoc",
        "",
        "PARAM",
        "startTag",
        "div[class;testcontainer;id;test]",
        "PARAM",
        "startTag",
        "script[]",
        "PARAM",
        "cdata",
        'document.write("<b><script>");',
        "PARAM",
        "endTag",
        "script",
        "PARAM",
        "startTag",
        "script[]",
        "PARAM",
        "cdata",
        'document.write("document.write(");',
        "PARAM",
        "endTag",
        "script",
        "PARAM",
        "startTag",
        "script[]",
        "PARAM",
        "cdata",
        "document.write(\"'Hello,</b> '\");",
        "PARAM",
        "endTag",
        "script",
        "PARAM",
        "startTag",
        "script[]",
        "PARAM",
        "cdata",
        "document.write(\",'World!');<\\/script>\");",
        "PARAM",
        "endTag",
        "script",
        "PARAM",
        "pcdata",
        "!",
        "PARAM",
        "endTag",
        "div",
        "PARAM",
        "endDoc",
        "",
        "PARAM",
      ].join("|"),
      events.join("|")
    );
  });
});
