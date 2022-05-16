#!/usr/bin/env node
"use strict";

import fs from "fs-extra";

function analyzeFileDeps(deps) {
	if (!deps)
		return {};

	let res={};
	for (let k in deps) {
		if (deps[k].startsWith("file:"))
			res[k]=deps[k].replace("file:","");
	}

	return res;
}

let pkg=JSON.parse(fs.readFileSync("package.json"));

let fileDeps={
	...analyzeFileDeps(pkg.dependencies),
	...analyzeFileDeps(pkg.devDependencies)
}

if (pkg._moduleCopies)
	for (let k in pkg._moduleCopies)
		fileDeps[k]=pkg._moduleCopies[k];

//console.log(fileDeps);
//process.exit();

for (let packageName in fileDeps) {
	let packagePath=fileDeps[packageName];

	console.log(`Updating file dependency ${packageName} from ${packagePath}`);

	if (fs.existsSync(`${packagePath}/node_modules`))
		throw new Error("There is a node_modules in the package dir, it will be wierd...");

	if (fs.existsSync(`node_modules/${packageName}`)) {
		let stat=fs.lstatSync(`node_modules/${packageName}`);
		if (stat.isSymbolicLink())
			throw new Error("It is a symlink");

		fs.rmSync(`node_modules/${packageName}`,{recursive: true, force: true});
	}

	fs.copySync(packagePath,`node_modules/${packageName}`);
}
