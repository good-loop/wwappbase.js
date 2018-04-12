
# easy-enums, by Winterwell/SoDash/Orla

`Enum` is a simple yet useful utility for safer code.

It makes a set of string constants, kind of like a Java enum. 
It has a nice concise constructor which takes a space-separated string. E.g. 

`let MyFruit = new Enum('APPLE BANANA');`   

gives you `MyFruit.APPLE == 'APPLE', MyFruit.BANANA == 'BANANA'`
 
Also, each of the constants has an isCONSTANT() function added, so you can write:
`MyFruit.isAPPLE(myvar)` -- which has the advantage that it will create a noisy error if
if myvar is invalid (e.g. it helps catch typos). isCONSTANT() allows falsy values, but an unrecognised
non-false value indicates an error.
 
`MyFruit.values` holds the full list (and is frozen to keep it safe from edits).
 
`MyFruit.has(thing)` provides a boolean test, true if thing is a valid value.

`MyFruit.assert(thing)` is a convenience test: It will throw an error if `thing` is invalid. Returns `thing` if fine.

There is also a fail-fast way to access a constant:
`MyKind.$VALUE()` is identical to `MyKind.VALUE` except that it will trigger
an error if `MyKind.VALUE` does not exist.

Use-case: It's safer than just using strings for constants, especially around refactoring.
It does use strings, because you want to work with json.
