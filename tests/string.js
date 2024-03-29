//♥
import { equal, deepEqual } from "assert";
import GladString from "../namespace/string.js";
let string = new GladString();

let LATIN_CHAR_MAP = {
  À: "A",
  Á: "A",
  Â: "A",
  Ã: "A",
  Ä: "A",
  Å: "A",
  Æ: "Ae",
  Ç: "C",
  È: "E",
  É: "E",
  Ê: "E",
  Ë: "E",
  Ì: "I",
  Í: "I",
  Î: "I",
  Ï: "I",
  Ð: "D",
  Ñ: "N",
  Ò: "O",
  Ó: "O",
  Ô: "O",
  Õ: "O",
  Ö: "O",
  Ő: "O",
  Ø: "O",
  Ù: "U",
  Ú: "U",
  Û: "U",
  Ü: "U",
  Ű: "U",
  Ý: "Y",
  Þ: "Th",
  ß: "ss",
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  æ: "ae",
  ç: "c",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ð: "d",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ő: "o",
  ø: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ű: "u",
  ý: "y",
  þ: "th",
  ÿ: "y",
};

let GREEK_CHAR_MAP = {
  α: "a",
  β: "b",
  γ: "g",
  δ: "d",
  ε: "e",
  ζ: "z",
  η: "h",
  θ: "8",
  ι: "i",
  κ: "k",
  λ: "l",
  μ: "m",
  ν: "n",
  ξ: "3",
  ο: "o",
  π: "p",
  ρ: "r",
  σ: "s",
  τ: "t",
  υ: "y",
  φ: "f",
  χ: "x",
  ψ: "ps",
  ω: "w",
  ά: "a",
  έ: "e",
  ί: "i",
  ό: "o",
  ύ: "y",
  ή: "h",
  ώ: "w",
  ς: "s",
  ϊ: "i",
  ΰ: "y",
  ϋ: "y",
  ΐ: "i",
  Α: "A",
  Β: "B",
  Γ: "G",
  Δ: "D",
  Ε: "E",
  Ζ: "Z",
  Η: "H",
  Θ: "8",
  Ι: "I",
  Κ: "K",
  Λ: "L",
  Μ: "M",
  Ν: "N",
  Ξ: "3",
  Ο: "O",
  Π: "P",
  Ρ: "R",
  Σ: "S",
  Τ: "T",
  Υ: "Y",
  Φ: "F",
  Χ: "X",
  Ψ: "PS",
  Ω: "W",
  Ά: "A",
  Έ: "E",
  Ί: "I",
  Ό: "O",
  Ύ: "Y",
  Ή: "H",
  Ώ: "W",
  Ϊ: "I",
  Ϋ: "Y",
};

let TURKISH_CHAR_MAP = { ş: "s", Ş: "S", ı: "i", İ: "I", ğ: "g", Ğ: "G" };

let RUSSIAN_CHAR_MAP = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "j",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "u",
  ы: "y",
  э: "e",
  ю: "yu",
  я: "ya",
  А: "A",
  Б: "B",
  В: "V",
  Г: "G",
  Д: "D",
  Е: "E",
  Ё: "Yo",
  Ж: "Zh",
  З: "Z",
  И: "I",
  Й: "J",
  К: "K",
  Л: "L",
  М: "M",
  Н: "N",
  О: "O",
  П: "P",
  Р: "R",
  С: "S",
  Т: "T",
  У: "U",
  Ф: "F",
  Х: "H",
  Ц: "C",
  Ч: "Ch",
  Ш: "Sh",
  Щ: "Sh",
  Ъ: "U",
  Ы: "Y",
  Ь: "Ь",
  Э: "E",
  Ю: "Yu",
  Я: "Ya",
};

describe("String Tests", function () {
  it("deburr:: should convert unicode", function () {
    equal(string.deburr("♥"), "love");
  });

  it("deburr:: should convert multi char symbols", function () {
    equal(string.deburr("<3"), "love");
    equal(string.deburr("<3 w/ stuff"), "love with stuff");
    equal(string.deburr("cr@zy&&loud"), "cr@zyandloud");
  });

  it("deburr:: should convert latin chars", function () {
    equal(
      string.deburr(Object.keys(LATIN_CHAR_MAP).join("")),
      Object.keys(LATIN_CHAR_MAP)
        .map((char) => LATIN_CHAR_MAP[char])
        .join("")
    );
  });

  it("deburr:: should convert greek chars", function () {
    equal(
      string.deburr(Object.keys(GREEK_CHAR_MAP).join("")),
      Object.keys(GREEK_CHAR_MAP)
        .map((char) => GREEK_CHAR_MAP[char])
        .join("")
    );
  });

  it("deburr:: should convert turkish chars", function () {
    equal(
      string.deburr(Object.keys(TURKISH_CHAR_MAP).join("")),
      Object.keys(TURKISH_CHAR_MAP)
        .map((char) => TURKISH_CHAR_MAP[char])
        .join("")
    );
  });

  it("deburr:: should convert russian chars", function () {
    equal(
      string.deburr(Object.keys(RUSSIAN_CHAR_MAP).join("")),
      Object.keys(RUSSIAN_CHAR_MAP)
        .map((char) => RUSSIAN_CHAR_MAP[char])
        .join("")
    );
  });

  it("slug:: should slugify a normal string", function () {
    equal(string.slugify("Charlie on Glad JS"), "charlie-on-glad-js");
  });

  it("slug:: should slugify a weird string", function () {
    equal(
      string.slugify("Charlie on Glad JS w/ βeta"),
      "charlie-on-glad-js-with-beta"
    );
  });

  it("slug:: should slugify string with multichar", function () {
    equal(string.slugify("Charlie on Glad JS :)"), "charlie-on-glad-js-smile");
  });

  it("slug:: should slugify multiple arguments", function () {
    equal(string.slugify("San Francisco", "CA"), "san-francisco-ca");
  });

  it("slug:: should slugify multiple arguments (2)", function () {
    equal(
      string.slugify("San Francisco", "CA", ", foo"),
      "san-francisco-ca-foo"
    );
  });

  it("camelize:: should Camelize string", function () {
    equal(string.camelize("fooze-barz"), "foozeBarz");
  });

  it("titleize:: should titleize string", function () {
    equal(string.titelize("fooze barz"), "Fooze Barz");
  });

  it("slasherize:: should slasherize string", function () {
    equal(string.slasherize("fooze barz"), "fooze/barz");
  });

  it("reverseSlasherize:: should reverseSlasherize string", function () {
    equal(string.reverseSlasherize("fooze barz"), "barz/fooze");
  });

  it("underscore:: should underscore string", function () {
    equal(string.underscore("fooze barz"), "fooze_barz");
  });

  it("cleanSpaces:: should cleanSpaces string", function () {
    equal(string.cleanSpaces("fooze  barz"), "fooze barz");
  });

  it("endsWith:: should return true if a string ends with fooze", function () {
    equal(string.endsWith("fooze  barz fooze", "fooze"), true);
  });

  it("endsWith:: should return false if a string does not end with fooze", function () {
    equal(string.endsWith("fooze  barz", "fooze"), false);
  });

  it("escape:: should escape a string", function () {
    equal(
      string.escape("fred, barney, & pebbles"),
      "fred, barney, &amp; pebbles"
    );
  });

  it("unescape:: should unescape a string", function () {
    equal(
      string.unescape("fred, barney, &amp; pebbles"),
      "fred, barney, & pebbles"
    );
  });

  it("escapeRegExp:: should escape a string for use in regexp", function () {
    equal(
      string.escapeRegExp("[lodash](https://lodash.com/)"),
      "\\[lodash\\]\\(https://lodash\\.com/\\)"
    );
  });

  it("repeat:: should repeat a string 2 times", function () {
    equal(string.repeat("glad", 2), "gladglad");
  });

  it("repeat:: should repeat a string 2 times with spacing", function () {
    equal(string.repeat("glad ", 2), "glad glad ");
  });

  it("startsWith:: should return true if a string starts with fooze", function () {
    equal(string.startsWith("fooze  barz", "fooze"), true);
  });

  it("startsWith:: should return false if a string does not start with fooze", function () {
    equal(string.startsWith("x fooze  barz", "fooze"), false);
  });

  it("words:: should split a string based on words", function () {
    deepEqual(string.words("fred, barney, & pebbles"), [
      "fred",
      "barney",
      "pebbles",
    ]);
  });

  it("words:: should split a string based on words and keep elements by regexp", function () {
    deepEqual(string.words("fred, barney, & pebbles", /[^, ]+/g), [
      "fred",
      "barney",
      "&",
      "pebbles",
    ]);
  });

  it("sentenceCase:: should capitalize Beginnings of sentences", function () {
    equal(
      string.sentenceCase("the quick. brown fox. jumped over stuff."),
      "The quick. Brown fox. Jumped over stuff."
    );
  });
});
