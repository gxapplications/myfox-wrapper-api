# How to contribute
We welcome contributions from the community and are pleased to have them.
Please follow this guide when logging issues or making code changes.

## Logging Issues
All issues should be created using the [new issue form](https://github.com/gxapplications/myfox-wrapper-api/issues/new).
Clearly describe the issue including steps to reproduce if there are any.
Also, make sure to indicate the earliest version that has the issue being reported.

## Patching Code
Code changes are welcome and should follow the guidelines below.

* Fork the repository on GitHub.
* Fix the issue ensuring that your code follows the [standard style guide](http://standardjs.com/).
* Add tests for your new code ensuring that you have 100% code coverage (we can help you reach 100% but will not merge without it).
    * Run `npm test` to generate a report of test and its coverage [TODO]
* [Pull requests](http://help.github.com/articles/using-pull-requests/) should be made to the [master branch](https://github.com/gxapplications/myfox-wrapper-api/tree/master).

[Current code coverage can be found here](http://gxapplications.github.io/myfox-wrapper-api/coverage/lcov-report/)


## How to write a commit message

### Why?

To have a clean and clear changelog on each release, you must follow these rules writing a commit message.
Commit messages must be in English, and have to be formatted like this to be listed in the changelog:

```
[category] : description
```

If you don't want to see the commit in the changelog, please use the comment mark "// " before your message:

```
// [category] : description
```

or this if you cannot classify your commit in a category:

```
// description
```

### category

-   **[-]** : A bug fix. It's not a feature removal (we don't remove feature, but we can depreciate them instead)
-   **[*]** : An improvement. On an existing feature.
-   **[+]** : A new feature. This type is quite important for visibility.
-   **[~]** : A feature deprecation. When a feature has to be removed in several version. Most often in the next major version.
-   **[#]** : A technical change that does not impact the software features, but that impact developers' way to work (scripts to deploy npm/docker/...). Reserved to the owners of the repository, thanks :)

If you think your commit _could_ match more than one type, then you _should_ split your commit in two commit to keep each one atomistic.

### description

Your description must contains a reference to the issue you are working on. Keep simple, clear and short.
**Tip:**
If your commit solves an issue, then you must indicate **"Closes #XXX"** with the right issue number,
to auto close and referentiate the issue at the same time the commit is merged through the pull request.
