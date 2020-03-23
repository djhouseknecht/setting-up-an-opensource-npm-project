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

### TODO: finish travis config (.yml)

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

> TypeScript v3.7.x is not backward compatible with v3.6.x and lower, so we want to install 3.6.x ([see here](https://github.com/microsoft/TypeScript/issues/33939)).

``` sh
npm i --save-dev typescript@~3.6.5
```
**NOTE:**
> A new stable version of Node was released last Wednesday, and with it came the newest version of npm. This update included a lot of big fixes, but the most visible change is that ‘install –save’ now prepends a caret (^) instead of a tilde (~).
> 
> &mdash; <cite>[From Fred K. Schott's Article]</cite>

So, we have to go into out `package.json` and manually edit the typescript dependency to the patch version &mdash; ie. _tilde_ (`~`). 

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

#### TODO: look into [typedoc]

## Dependency Management
I tried [dependabot] for this. It is crazy easy to setup for javascript libraries so just check it out. 
* signup
* grant access to all or desired repos
* enable desired repos (it may ask you to install github app - say yes)
* sit back and watch it work

Since we are using typescript, we are going to have to tell dependabot not to try to bump typescript to v3.7.x. Create this: 

**.dependabot/config.yml**
``` yml
version: 1
update_configs:
  - package_manager: "javascript"
    directory: "/"
    update_schedule: "live"
    ignored_updates:
		- match:
			# ignore typescript minor version
			dependency_name: "typescript"
			version_requirement: "~3.6.5"
```

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
[typedoc]: https://typedoc.org/guides/options/#options


[First Things First]: first-things-first
[Travis CI]: travis-ci
[Automating Releases]: automating-releases
[Standardize commit messages]: standardize-commit-messages
[Setting up TypeScript]: setting-up-typescript
[Testing and Code Coverage]: testing-and-code-coverage
[Linting and Editorconfig]: linting-and-editorconfig
[Git Hooks]: git-hooks
[Documentation]: documentation
[Dependency Management]: dependency-management
[Badges]: badges

[travis-activate-repo]: assets/travis-activate-repo.png "Travis Active Repo"
[jest-results]: assets/jest-results.png "Jest Results"
[build-output]: assets/build-output.png "Build Output"
[travis-badge]: assets/travis-badge.png "Travis Badge"
