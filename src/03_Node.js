var SVGSpriter	= require('svg-sprite'),
path			= require('path'),
mkdirp			= require('mkdirp'),
fs				= require('fs'),
spriter			= new SVGSpriter($$config$$);

// Register some SVG files with the spriter
var file		= 'path/to/example.svg'; // <-- Replace with your local file path
spriter.add(path.resolve(file), file, fs.readFileSync(path.resolve(file), {encoding: 'utf-8'}));
// ...

// Compile the sprite
spriter.compile(function(error, result, cssData) {
	
	// Run through all configured output modes
	for (var mode in result) {
		
		// Run through all created resources and write them to disk
		for (var type in result[mode]) {
			mkdirp.sync(path.dirname(result[mode][type].path));
			fs.writeFileSync(result[mode][type].path, result[mode][type].contents);
		}
	}
})