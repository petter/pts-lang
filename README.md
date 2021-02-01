# pts

- [x] Instantiating closed templates
- [ ] Renaming classes
  - [x] Rename class declarations
  - [x] Rename class heritage
  - [x] Rename class instantiations
  - [x] Rename member_expressions on static class fields (i.e. `A.k`)
  - [ ] Rename other class references, i.e. as a type (Maybe enough to have another pass on `type_identifiers`)
- [x] Renaming fields
  - [x] Rename field declaration (public_field_definition)
  - [x] Rename `this.x` from same class (local member_expressions)
  - [x] Rename `this.x` from super class (member_expressions)
  - [x] Rename other references to fields, i.e. member_expressions of variables, `a.i`
- [ ] Merging classes
  - [x] Merge bodies of two classes
  - [ ] Checking if it is valid to merge classes (Do they have different heritage?)
- [ ] Validating templates
