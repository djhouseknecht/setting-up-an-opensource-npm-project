# Setting Up An Opensource NPM Project
A quick reference guide to setting up a npm opensource package to easily manage with as little manual maintenance as possible. 

## Purpose
I like opensource alot and I constantly have new ideas. 
BUT... sometimes those ideas are stifled just thinking about the time it takes to 
set one up and then maintain it. 
This document is hoping to make that process easy and efficient. 

## Credits and References
I got most of my information and inspiration from [Patrick Lee Scott's article](https://hackernoon.com/these-6-essential-tools-will-maintain-your-npm-modules-for-you-4cbbee88e0cb) on hackernoon. The article is a little outdated so I wanted to write some more notes for my own sake. 

## Glossary
* [First Things First]
* [Travis CI]
* [Automating Releases]
* [Standardize commit messages]
* [Setting up TypeScript]
* [Testing and Code Coverage]
* [Linting and Editorconfig]
* [Git Hooks]
* [Documentation]
* [Adding a CHANGELOG]
* [Dependency Management]
* [Badges]

## First Things First
Kind of obvious: 
* pick a package name that isn't already taken on [npmjs.org]
* create a github repo with the same name (preferably)

Clone the new repo from github and make sure to initialize npm to generate the `package.json`.
``` sh 
git clone <repo-name>
cd ./<repo-name>
npm init
```

## Travis CI
* create an account at [travis-ci.org] (use "Sign Up With Github Account")
* click on user avatar (top right) and select "Settings"
* Active travis for your repository

![Travis Activate Repo][travis-activate-repo]

Now, create a **`.travis.yml`** file in your root directory with the following contents: 

``` yml
# tell travis what language you want to use
language: node_js

# these are the versions of node to run the tests on
node_js:
  - node
  - 12
  - 10

# use `npm` cache to speed up the builds
cache: npm

# skip version branches (ie. v1.1.1)
branches:
  except:
    - '/^v\d+\.\d+\.\d+$/'

# install deps
install:
  - npm install

# declare two jobs, "Test" & "Release"
jobs:
  include:
    # Test, Lint, and Report Coverage
    - stage: "Test"
      script:
        - npm run test
        - npm run lint
        - npm run codecov
        - npm run build
    # build and release only on non-forked, master branch
    - stage: "Release"
      if: branch == master && !fork
      node_js: 12
      script:
        - npm run build
        - npx semantic-release
```

Most of that is explained by the comments. A couple things to note: 

* All node jobs will run a `"Test"` job. We have to override it with ours
* The scripts run in order, so we need to list them in the order we want to run them
* The `"Release"` stage will build the app (this can be any type of build script), and then call `semantic-release` to potentially release a new version (or on that in the next section)

Example output for those jobs would look like this: 

![Travis Build Results][travis-build-results]

You will notice that there are three `"Test"` jobs because we told travis to test using node versions `node` (which equals the default), `12`, & `8`. There is only one `"Release"` job which ran because this was on the `master` branch. 

## Automating Releases
[semantic-release] determines when and what to deploy. My favorite part is it keeps your npm and github release versions in line with each other. 
``` sh
# install package globally
npm i -g semantic-release-cli

# from your repo's root run
semantic-release-cli setup
# this will ask you some questions
? What is your npm registry? https://registry.npmjs.org/
? What is your npm username? djhouseknecht
? What is your npm password? [hidden]
? What is your GitHub username? djhouseknecht
? What is your GitHub password? [hidden]
? What is your GitHub two-factor authentication code? [hidden]
? What CI are you using? Travis CI
? Do you want a `.travis.yml` file with semantic-release setup? Yes
```

This takes care of authentication between npm, github, and travis, and should make a couple modifications to your `package.json` and create a `.travis.yml` file (we will come back to both of these files). For now, just make sure this was added to the `"scripts"` object. 

``` json
"scripts": {
	"semantic-release": "semantic-release",
	//... 
},
```

`semantic-release` needs there to be standard commit messages so it needs helps. Which is our next step.

> Optional: You may want to publish a placeholder version (ie. `0.0.1`) to npm before you start using `semantic-release`. I did not do this once and my first placeholder version was `1.0.0` which isn't ideal. 

## Standardize commit messages
[commitizen] is a tool to standardize your commit messages. It is configurable so we are going to be using the package [cz-conventional-changelog] to help. 

``` sh
# install packages
npm i --save-dev commitizen cz-conventional-changelog
```

Add these lines to your `package.json`
``` json
{
  //...
  scripts: { 
    "commit": "git-cz", 
    // ... 
  },
  //... 
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  }
}
```

> Remember to use `npm run commit` instead of `git commit -m ""` to leverage `commitizen`

Here is some helpful info on commit message from angular.js' [DEVELOPER.md](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)

> PRO TIP: You’ll still get Pull Requests that don’t follow these rules – in those cases, select _“Squash and Merge”_ instead of the default _“Create Merge Commit”_. You’ll be able to enter a new commit message that will trigger a new release.

## Setting up TypeScript
I also use typescript where possible. So, here is a good setup. 

> TypeScript v3.7.x is not backward compatible with v3.6.x and lower, so if you need backward compatibility (like for an Angular <= 8 app) then install ts `~3.6.5` ([see here](https://github.com/microsoft/TypeScript/issues/33939)). 

Installing v3.6.x is optional. There are some serious breaking changes between version 3.6.x and 3.7.x. If you are targeting Angular apps version 8 and below, you will want to use this version. 

``` sh
npm i --save-dev typescript
```
**NOTE:**
> A new stable version of Node was released last Wednesday, and with it came the newest version of npm. This update included a lot of big fixes, but the most visible change is that ‘install –save’ now prepends a caret (^) instead of a tilde (~).
> 
> &mdash; <cite>[From Fred K. Schott's Article]</cite>

If you went with typescript v3.x, then you have to go into out `package.json` and manually edit the typescript dependency to the patch version &mdash; ie. _tilde_ (`~`). Otherwise, you are good to go (later you will need to tell Dependabot not to try to bump ts).

``` json 
"devDependencies": {
	"typescript": "~3.6.5",
	// ...
},
```

Create **./tsconfig.json** with some good starting options:
``` json
{
	"include": [
		"src/**/*"
	],
	"exclude": [],
	"compilerOptions": {
		/* Basic Options */
		"target": "es5",
		"module": "commonjs",
		"baseUrl": "./",
		"outDir": "./build",
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "node",
		"esModuleInterop": true,
		"lib": [
			"es2015"
		],
		"declaration": true,
	}
}
```

In `package.json`, add this to `"scripts"`:
``` json
{
	"scripts": {
		"build": "tsc --project .",
		// ...
	}
	// ...
}
```

Let's also add `build` to our `.gitignore` so we aren't pushing built files to github. Our travis build pipeline will take care of getting built source code to the npm registry. 

**.gitignore** should look like

``` txt
node_modules
build
```

You can use [webpack] or [rollup.js] to build if you want. There are _tons_ of resources out there for setup. I am just compiling the typescript for now. 

We will test it out to make sure you get compiled js in the `./build` directory after we add some source code and tests in the next section. 

## Testing and Code Coverage

I like [jest] for testing my JS/TS libraries. It has some convient [code coverage tools](https://jestjs.io/docs/en/cli#--coverageboolean). I'm not going to go into depth, but here is some basic jest setup. 

``` sh 
npm i --save-dev jest @types/jest ts-jest @babel/core @babel/preset-env babel-jest 
```

We need [babel] to transpile our ES6 JavaScript (if we have any) and [ts-jest] to compile out TypeScript files. 

**src/index.ts**
``` ts
export function helloWorld () {
	return 'Hello World';
}
```

**test/index.spec.ts**
``` ts
import { helloWorld } from '../src';

describe('Index', () => {
	test('should say Hello World', () => {
		expect(helloWorld()).toBe('Hello World');
	});
});
```

**jest.config.js**

``` js
module.exports = {
	testEnvironment: 'node',
	// tells jest where are files are located
	roots: [
		'<rootDir>/src',
		'<rootDir>/test'
	],
	// tells jest what file path to match for tests
	testMatch: [
		'<rootDir>/test/**/*.spec.(ts|js)'
	],
	modulePaths: [
		'src',
		'/node_modules/'
	],
	// this will load js and ts files
	transform: {
		'^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest'
	},
	// we want to collect coverage for later
	collectCoverage: true,
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!**/node_modules/**',
		'!**/types/**'
	],
	coverageReporters: [
		'lcov', 'text'
	],
	coverageThreshold: {
		global: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100
		}
	},
	coverageDirectory: './coverage'
};
```

**babel.config.js**
``` js
module.exports = {
	// tells babel to use this preset
	presets: [
		'@babel/preset-env'
	]
};
```

In **package.json** add this script:
``` json 
"scripts": {
	"test": "jest"
	// other scripts
}
```

I like to add `coverage` to my `.gitignore`. Travis and Codecov will take care of showing our coverage results.


**.gitignore** should look like this now:

``` txt
node_modules
build
coverage
```

See if it works. 

``` sh
npm test
```

You should get this output:
![Jest Results][jest-results]

Now that we have files, let's make sure our build works (from [Setting up TypeScript])

``` sh 
npm run build
```

Check to see if there is output in the `./build` directory. Should look like:
![Build Output][build-output]

#### Codecov 
Install `codecov`

``` sh
npm i --save-dev codecov
```

In **package.json** add this script:

``` json 
"scripts": {
  "codecov": "codecov",
	// other scripts
}
```


## Linting and Editorconfig

I like to use [tslint] for linting. Install needed devDependencies and create a `tslint.json` file

``` sh
npm i --save-dev tslint
touch tslint.json
```

Checkout [tslint.json](/tslint.json) for some good rules. Copy and paste that into your `tslint.json` file. 

In **package.json** add this script:

``` json 
"scripts": {
	"lint": "tslint --project . --config tslint.json"
	// other scripts
}
```

Also, creating an **.editorconfig** helps standardize things. Checkout the [.editorconfig](/.editorconfig) for some basic config. 


## Git Hooks
I use [husky], but there is [pre-commit] which is pretty good too. This will ensure that your code passes tests and linting before you push and/or commit. Otherwise travis may be the one to find 

Install the dependency: 

``` sh
npm i --save-dev husky
```

In **package.json** add this config: 

``` json 
"husky": {
	"hooks": {
		"pre-commit": "npm run lint && npm run test",
		"pre-push": "npm run lint && npm run test"
	}
},
```

_You don't need both `pre-commit` and `pre-push`. Both can get annoying if you have a slow test process._

## Documentation

> Note: I was not able to get [typedoc] to work with typescript v3.6.x

Let's use [typedoc] to set up some nice documentation of our APIs. First, we will install it:

``` sh
npm install --save-dev typedoc
```

We will create a `typedoc.config.js` file to specify a few config options. We are only going to set some basic configuration, but checkout [typedoc's configuration options](https://typedoc.org/guides/options/#options) for lots more options. 

``` js
// typedoc.config.js
module.exports = {
  inputFiles: [
    './src'
  ],
  mode: 'modules',
  out: 'docs',
  excludePrivate: true
}
```

We are going to build `html` files into a `docs/` directory. We will then deploy them to [GitHub Pages](https://pages.github.com/)! You can also compile typedoc to Markdown using the [`typedoc-plugin-markdown`](https://www.npmjs.com/package/typedoc-plugin-markdown). 

Then we will add a `doc` script to our `package.json` to execute the generation of the files: 

``` json
"scripts": {
  "doc": "typedoc --options typedoc.config.js && touch ./docs/.nojekyll"
	// other scripts
}
```

Now, run `npm run doc` and go check the `docs/` folder. There should be an output like this: 

![Typedoc Output][typedoc-output]

We set the `mode: 'module'` so there is not a `docs/modules` directory with all the modules. The `index.html` file has our `README.md` generated to html (and some other nice typedoc styling/navigation). 

To deploy to Git Pages, we needed to add the `docs/.nojekyll` file. Github using [Jekyll] to compile our site files, and it will not publish files that start with an underscore `_` ([see here](https://help.github.com/en/github/working-with-github-pages/about-github-pages-and-jekyll)). 

Once you have that pushed up to your repo, you can go to: **your github repo > Settings _(the tab to the far right)_ > _scroll down to_ GitHub Pages** and set the **Source** to **master branch /docs folder**:

![Git Pages Config][git-pages-config]

Then navigate to the URL it gives you, in our case: https://djhouseknecht.github.io/setting-up-an-opensource-npm-project/index.html

> You may need to wait a few minutes for the docs to actually be published

The final product, is the `README` with links to our source code documentation: 

![Git Pages][git-pages]

Click on the `"index"` link:

![Git Pages x2][git-pages-2]

You could even update your `husky` hooks to build docs before every commit to ensure your docs stay up to date (another options is to use your travis build to push build docs and push to master. Maybe I will add that). In `package.json`: 

``` json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run test && npm run doc && git add ./docs", // <- update this
      "pre-push": "npm run lint && npm run test"
    }
  },
}
```

## Adding a CHANGELOG

A changelog helps you and your users quickly see what changed between versions of your package. This is a little bit of a manual process (I haven' taken the time to write scripts to do this for me). `semantic-release` and `commitizen` document each version in github releases really well (based on commit message). 

I like to use [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) formatting because it links to github version differences. This is great for comparing the difference in the code. There is a great example on that website so I won't re-write it all. 

We will look at the example for my [rxjs-util-classes] repo. The main points are: 

* having versions and the github links
* listing all changes, especially breaking changes (which should always be major version bumps)
  * Example headers: `Added, Changed, Deprecated, Removed, Fixed, Security, Breaking Changes` 
* keeping it up to date

Create a `CHANGELOG.md` file at the root, paste the following as a starting point, and adjust based on your repo: 

``` markdown
# Changelog
_this is just an example changelog. make sure to change it based on your repo_

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


# [Unreleased]

# [v1.1.1]

### Added 
* CHANGELOG

### Changed
* Documentation
* Patch release on doc change ([from this comment](https://github.com/semantic-release/semantic-release/issues/192#issuecomment-333328071))

# [v1.1.0]

### Added
* Observable, Behavior, and Subject maps
* Documentation

# [v1.0.0]

### Added
* Initial release 
* README

[Unreleased]: https://github.com/djhouseknecht/rxjs-util-classes/compare/v1.1.1...HEAD
[v1.1.1]: https://github.com/djhouseknecht/rxjs-util-classes/compare/v1.1.0...v1.1.1
[v1.1.0]: https://github.com/djhouseknecht/rxjs-util-classes/compare/v1.0.0...v1.1.0
[v1.0.0]: https://github.com/djhouseknecht/rxjs-util-classes/releases/tag/v1.0.0
```

Check out my [rxjs-util-classes CHANGELOG](https://github.com/djhouseknecht/rxjs-util-classes/blob/master/CHANGELOG.md) for a full sample.

## Dependency Management
I tried [dependabot] for this. It is crazy easy to setup for javascript libraries so just check it out. 
* signup
* grant access to all or desired repos
* enable desired repos (it may ask you to install github app - say yes)
* sit back and watch it work

If you are using typescript v3.6.x, you need to tell dependabot not to try to bump typescript to v3.7.x. Create this: 

**.dependabot/config.yml**
``` yml
version: 1
update_configs:
  - package_manager: "javascript"
    directory: "/"
    update_schedule: "live"
    ignored_updates:
    # this will tell Dependabot not to try bumping these versions
		- match:
      # ignore typescript minor version
      #  this is for compatibility with Angular apps 4 >= and <= 9
      # only add these if you went with ts v3.x 
      #  (you can also add more dependencies you don't want to bump)
      dependency_name: "typescript"
			version_requirement: "~3.6.5"
```

> Note this file is only really needed if you need extra configuration over dependabot 

## Badges

Now let's add some fancy badges! 

#### Travis Build Status Badge
* Login to [travis-ci.org] 
* Select your repo
* Click on the `build: passing` icon
* Select "Format" -> "Markdown"
* Copy "Result" and paste it into your README

![Travis Badge][travis-badge]

#### Codecov
Put this in your README and alter it with your username and repo name

```
[![codecov](https://codecov.io/gh/username/repo-name/branch/master/graph/badge.svg)](https://codecov.io/gh/username/repo-name)  
```

#### NPM Version
Put this in your README and alter it with your repo name

```
[![npm version](https://badge.fury.io/js/repo-name.svg)](https://badge.fury.io/js/repo-name) 
```

#### Dependabot
Put this in your README and alter it with your username and repo name

```
[![dependabot-status](https://flat.badgen.net/dependabot/username/repo-name/?icon=dependabot)][dependabot]  
```

#### Semantic-release
Put this in your README
```
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)  
```

#### Commitizen
Put this in your README
```
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) 
```

## Example Reposioty
My project [rxjs-util-classes] uses this setup. Go check out the repo and its travis build to see some examples of this in action. 


##### TODO (stuff I have to do add to this repo)
* Add config to have travis build the docs and push to master

[npmjs.org]: https://www.npmjs.com/
[semantic-release]: https://www.npmjs.com/package/semantic-release
[travis-ci.org]: https://travis-ci.org/
[commitizen]: https://www.npmjs.com/package/commitizen 
[cz-conventional-changelog]: https://www.npmjs.com/package/cz-conventional-changelog
[jest]: https://jestjs.io/
[babel]:https://babeljs.io/
[dependabot]: https://dependabot.com/
[webpack]: https://webpack.js.org/
[rollup.js]: https://rollupjs.org/guide/en/
[ts-jest]: https://kulshekhar.github.io/ts-jest/
[From Fred K. Schott's Article]: http://fredkschott.com/post/2014/02/npm-no-longer-defaults-to-tildes/
[rxjs-util-classes]: https://github.com/djhouseknecht/rxjs-util-classes
[tslint]: https://palantir.github.io/tslint/
[husky]: https://github.com/typicode/husky
[pre-commit]: https://www.npmjs.com/package/pre-commit
[typedoc]: https://typedoc.org/
[Jekyll]: https://jekyllrb.com/


[First Things First]: #first-things-first
[Travis CI]: #travis-ci
[Automating Releases]: #automating-releases
[Standardize commit messages]: #standardize-commit-messages
[Setting up TypeScript]: #setting-up-typescript
[Testing and Code Coverage]: #testing-and-code-coverage
[Linting and Editorconfig]: #linting-and-editorconfig
[Git Hooks]: #git-hooks
[Documentation]: #documentation
[Adding a CHANGELOG]: #adding-a-changelog
[Dependency Management]: #dependency-management
[Badges]: #badges

[travis-activate-repo]: assets/travis-activate-repo.png "Travis Active Repo"
[travis-build-results]: assets/travis-build-results.png "Travis Build Results"
[jest-results]: assets/jest-results.png "Jest Results"
[build-output]: assets/build-output.png "Build Output"
[travis-badge]: assets/travis-badge.png "Travis Badge"
[typedoc-output]: assets/typedoc-output.png "Typedoc Output"
[git-pages-config]: assets/git-pages-config.png "Git Pages Config"
[git-pages]: assets/git-pages.png "Git Pages"
[git-pages-2]: assets/git-pages-2.png "Git Pages x2"
