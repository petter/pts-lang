# PTS (Package Template Script) / An implementation of Package Templates in TypeScript

## Using PTS in a project

Initialize the project

```
mkdir <name of project>
cd <name of project>
npm init -Y
npm install https://github.com/petter/pts
```

Add a start and/or build script to `package.json`:

```json
{
  "scripts": {
    "start": "pts -i src/index.pts --run",
    "build": "pts -i src/index.pts -o build/index"
  }
}
```

The start script only runs the program, and doesn't emit any files, while the build script transpiles the `src/index.pts` file to JavaScript.
If you'd rather have TypeScript as output you can use `-t`:

```bash
pts -i src/index.pts -o build/index -t ts
```

## TODOs

- [x] Instantiating closed templates
- [x] Renaming classes
  - [x] Rename class declarations
  - [x] Rename class heritage
  - [x] Rename class instantiations
  - [x] Rename member_expressions on static class fields (i.e. `A.k`)
  - [x] Rename other class references, i.e. as a type (Maybe enough to have another pass on `type_identifiers`)
- [x] Renaming fields
  - [x] Rename field declaration (public_field_definition)
  - [x] Rename `this.x` from same class (local member_expressions)
  - [x] Rename `this.x` from super class (member_expressions)
  - [x] Rename other references to fields, i.e. member_expressions of variables, `a.i`
- [ ] Merging classes
  - [x] Merge bodies of two classes
  - [ ] Checking if it is valid to merge classes (Do they have different heritage?)
  - [ ] Merge heritage
- [ ] Addto statements
  - [x] Check if the class to be added to exists
  - [x] Merge bodies of the class and addto-statement
  - [ ] Add implementing interfaces and extended classes to the class
- [ ] Validating templates
