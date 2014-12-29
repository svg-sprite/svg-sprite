var SVGSpriter				= require('./lib/svg-sprite'),
path						= require('path'),
mkdirp						= require('mkdirp'),
fs							= require('fs'),
glob						= require('glob'),
cwd							= path.join(__dirname, 'test', 'fixture', 'svg', 'single'),
dest						= path.normalize(path.join(__dirname, 'tmp')),
files						= glob.glob.sync('**/weather*.svg', {cwd: cwd});
spriter						= new SVGSpriter({
	dest					: dest,
	log						: 'debug'
});


/**
 * Add a bunch of SVG files
 * 
 * @param {SVGSpriter} spriter		Spriter instance
 * @param {Array} files				SVG files
 * @return {SVGSpriter}				Spriter instance
 */
function addFixtureFiles(spriter, files) {
	files.forEach(function(file){
		spriter.add(
			path.resolve(path.join(cwd, file)),
			file,
			fs.readFileSync(path.join(cwd, file), {encoding: 'utf-8'})
		);
	})
	return spriter;
}

addFixtureFiles(spriter, files).compile({
	css						: {
		sprite				: 'svg/sprite.vertical.svg',
		layout				: 'vertical',
		dimensions			: true,
		render				: {
			css				: true,
			scss			: true
		}
	}
}, function(error, result, cssData) {
	for (var type in result.css) {
		mkdirp.sync(path.dirname(result.css[type].path));
		fs.writeFileSync(result.css[type].path, result.css[type].contents);
	}
})