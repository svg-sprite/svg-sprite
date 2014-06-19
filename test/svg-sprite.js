var should			= require('should'),
path				= require('path'),
rimraf				= require('rimraf'),
svgsprite			= require('../lib/svg-sprite'),
svg2png				= require('svg2png'),
imageDiff			= require('image-diff'),
mu					= require('mu2'),
fs					= require('fs'),
clean				= require('clean-css'),
sass				= require('node-sass'),
less				= require('less'),
stylus				= require('stylus'),
phantom_sync		= require('phantom-sync'),
phantom      		= phantom_sync.phantom,
sync         		= phantom_sync.sync,
data				= null,
css					= null;

/**
 * Capture a screenshot of a URL using PhantomJS (synchronous)
 * 
 * @param {String} src				Source file
 * @param {String} target			Screenshot file
 * @param {Function} callback		Function
 */
function capture(src, target, callback) {
	var that				= this;
	fs.readFile(src, function(err, data) {
		if (err) {
			callback(err);
			return;
		}
		sync(function() {
			var ph				= phantom.create(),
			page				= ph.createPage();
			page.viewportSize	= {
				width			: 1280,
				height			: 1024
			}
			page.setContent(data.toString(), 'file://' + src);
			page.render(target);
			ph.exit();
			callback(null);
		})
	});
}

describe('svg-sprite', function() {
	
    describe('with no arguments', function() {
        it('returns an error', function() {
            var result = svgsprite.createSprite();
            result.should.be.an.Error;
			result.should.have.property('errno', 1391852448);
        });
    });
    
    describe('with an empty input directory', function() {
        it('returns an error', function() {
            var result = svgsprite.createSprite('', '', null, function(){});
            result.should.be.an.Error;
			result.should.have.property('errno', 1391852763);
        });
    });
    
    describe('with an invalid input directory', function() {
        it('returns an error', function() {
            var result = svgsprite.createSprite('/abcde/fghij/klmno', '', null, function(){});
            result.should.be.an.Error;
			result.should.have.property('errno', 1391853079);
        });
    });
    
    describe('with an invalid main / default output directory', function() {
        it('returns an error', function(done) {
        	svgsprite.createSprite(path.join(__dirname, 'files'), path.normalize(path.join(__dirname, '..', 'tmp\0null')), null, function(err, result){
            	err.should.be.an.Error;
				err.should.have.property('errno', 1391854708);
				done();
            });
        });
    });
    
    describe('with an invalid Sass output directory', function() {
        it('returns an error', function(done) {
        	this.timeout(10000);
        	svgsprite.createSprite(path.join(__dirname, 'files'), path.normalize(path.join(__dirname, '..', 'tmp', 'css')), {render: {scss: path.normalize(path.join(__dirname, '..', 'tmp', 'sass\0null/'))}}, function(err, result){
            	err.should.be.an.Error;
				err.should.have.property('errno', 1391854708);
				done();
            });
        });
    });
    
    describe('with valid arguments', function() {
        it('returns a visually correct sprite', function(done) {
        	this.timeout(10000);
        	var config						= {
        		dims						: true,
				render						: {
					scss					: path.normalize(path.join(__dirname, '..', 'tmp', 'sass', '_sprite')),
					less					: path.normalize(path.join(__dirname, '..', 'tmp', 'less', '_sprite')),
					styl					: path.normalize(path.join(__dirname, '..', 'tmp', 'styl', '_sprite'))
				},
				cleanconfig	: {
//					plugins	: [
//						{removeDoctype		: false},	// Don't remove the DOCTYPE declaration
//						{removeXMLProcInst	: false}	// Don't remove the XML declaration
//					]
				}
			};
        	svgsprite.createSprite(path.join(__dirname, 'files'), path.normalize(path.join(__dirname, '..', 'tmp', 'css')), config, function(err, result){
        		should(err).not.ok;
        		data					= result.data;
        		var spriteSVG			= path.join(__dirname, '..', 'tmp', 'css', 'svg', 'sprite.svg'),
        		spritePNG				= path.join(__dirname, '..', 'tmp', 'css', 'svg', 'sprite.png');
        		svg2png(spriteSVG, spritePNG, function(err) {
        			should(err).not.ok;
					imageDiff({
						actualImage: spritePNG,
						expectedImage: path.join(__dirname, 'expected', 'sprite.png'),
						diffImage: path.join(__dirname, '..', 'tmp', 'css', 'svg', 'sprite.diff.png')
					}, function (err, imagesAreSame) {
				    	should(err).not.ok;
				    	should.ok(imagesAreSame, 'The generated sprite doesn\'t match the expected one!');
				    	done();
				    });
				});
            });
        });
        
        it('creates visually correct CSS code', function(done) {
        	this.timeout(10000);
        	var preview					= path.join(__dirname, '..', 'tmp', 'preview.css.html');
        	try { fs.truncateSync(preview); } catch(e) {}
        	data.css					= 'css/sprite.css';
        	mu.root						= path.join(__dirname, 'tmpl');
			mu.compileAndRender('preview.html', data)
				.on('data', function (data) {
					try { fs.appendFileSync(preview, data.toString()); } catch(e) {}
				})
				.on('error', function(err) {
					should(err).not.ok;
				})
				.on('end', function(err) {
					should(err).not.ok;
					var previewPNG		= path.join(__dirname, '..', 'tmp', 'preview.css.png');
					
					// Create a screenshot of the preview page
					capture(path.join(__dirname, '..', 'tmp', 'preview.css.html'), previewPNG, function(_err) {
						should(_err).not.ok;
						
						// Compare it to the expected screenshot
						imageDiff({
							actualImage: previewPNG,
							expectedImage: path.join(__dirname, 'expected', 'preview.png'),
							diffImage: path.join(__dirname, '..', 'tmp', 'preview.css.diff.png')
						}, function (__err, imagesAreSame) {
					    	should(__err).not.ok;
					    	should.ok(imagesAreSame, 'The generated CSS preview doesn\'t match the expected one!');
					    	done();
					    });
					})
				});
        });
        
		it('creates visually correct Sass code', function(done) {
        	this.timeout(10000);
        	sass.render({
			    file					: path.join(__dirname, '..', 'tmp', 'sass', '_sprite.scss'),
			    success					: function(scssText) {
			    	var scssCss			= path.join(__dirname, '..', 'tmp', 'css', 'sprite.scss.css');
			    	try { fs.truncateSync(scssCss); } catch(e) {}
			    	fs.writeFile(scssCss, scssText, function(err) {
			    		should(err).not.ok;
			    		
			    		var preview					= path.join(__dirname, '..', 'tmp', 'preview.scss.html');
			        	try { fs.truncateSync(preview); } catch(e) {}
			        	data.css					= 'css/sprite.scss.css';
			        	mu.root						= path.join(__dirname, 'tmpl');
						mu.compileAndRender('preview.html', data)
							.on('data', function (data) {
								try { fs.appendFileSync(preview, data.toString()); } catch(e) {}
							})
							.on('error', function(_err) {
								should(_err).not.ok;
							})
							.on('end', function(_err) {
								should(_err).not.ok;
								var previewPNG		= path.join(__dirname, '..', 'tmp', 'preview.scss.png');
								
								// Create a screenshot of the preview page
								capture(path.join(__dirname, '..', 'tmp', 'preview.scss.html'), previewPNG, function(__err) {
									should(__err).not.ok;
									
									// Compare it to the expected screenshot
									imageDiff({
										actualImage: previewPNG,
										expectedImage: path.join(__dirname, 'expected', 'preview.png'),
										diffImage: path.join(__dirname, '..', 'tmp', 'preview.scss.diff.png')
									}, function (___err, imagesAreSame) {
								    	should(___err).not.ok;
								    	should.ok(imagesAreSame, 'The generated Sass preview doesn\'t match the expected one!');
								    	done();
								    });
								})
							});
			    	});
			    },
			    error					: function(err) {
			    	should(err).not.ok;
			    	done();
			    }
		    });
        });
        
        it('creates visually correct LESS code', function(done) {
        	this.timeout(10000);
        	var lessLESS				= path.join(__dirname, '..', 'tmp', 'less', '_sprite.less');
        	fs.readFile(lessLESS, function(err, lessText) {
        		should(err).not.ok;
        		var parser				= new(less.Parser)({filename: lessLESS});
	    		parser.parse(lessText.toString(), function (_err, tree) {
	    			should(_err).not.ok;
	    			
	    			var lessCss						= path.join(__dirname, '..', 'tmp', 'css', 'sprite.less.css');
					try { fs.truncateSync(lessCss); } catch(e) {}
			    	fs.writeFile(lessCss, tree.toCSS(), function(__err) {
			    		should(__err).not.ok;
			    		
			    		var preview					= path.join(__dirname, '..', 'tmp', 'preview.less.html');
			        	try { fs.truncateSync(preview); } catch(e) {}
			        	data.css					= 'css/sprite.less.css';
			        	mu.root						= path.join(__dirname, 'tmpl');
						mu.compileAndRender('preview.html', data)
							.on('data', function (data) {
								try { fs.appendFileSync(preview, data.toString()); } catch(e) {}
							})
							.on('error', function(___err) {
								should(___err).not.ok;
							})
							.on('end', function(___err) {
								should(___err).not.ok;
								var previewPNG		= path.join(__dirname, '..', 'tmp', 'preview.less.png');
								
								// Create a screenshot of the preview page
								capture(path.join(__dirname, '..', 'tmp', 'preview.less.html'), previewPNG, function(____err) {
									should(____err).not.ok;
									
									// Compare it to the expected screenshot
									imageDiff({
										actualImage: previewPNG,
										expectedImage: path.join(__dirname, 'expected', 'preview.png'),
										diffImage: path.join(__dirname, '..', 'tmp', 'preview.less.diff.png')
									}, function (_____err, imagesAreSame) {
								    	should(_____err).not.ok;
								    	should.ok(imagesAreSame, 'The generated LESS preview doesn\'t match the expected one!');
								    	done();
								    });
								})
							});
			    	});
	    		});
        	});
        });
        
        it('creates visually correct Stylus code', function(done) {
        	this.timeout(10000);
        	var stylusStyl				= path.join(__dirname, '..', 'tmp', 'styl', '_sprite.styl');
        	fs.readFile(stylusStyl, function(err, stylText) {
        		should(err).not.ok;
	    		stylus.render(stylText.toString(), function (_err, stylText) {
	    			should(_err).not.ok;
	    			
	    			var stylCss						= path.join(__dirname, '..', 'tmp', 'css', 'sprite.styl.css');
					try { fs.truncateSync(stylCss); } catch(e) {}
			    	fs.writeFile(stylCss, stylText, function(__err) {
			    		should(__err).not.ok;
			    		
			    		var preview					= path.join(__dirname, '..', 'tmp', 'preview.styl.html');
			        	try { fs.truncateSync(preview); } catch(e) {}
			        	data.css					= 'css/sprite.styl.css';
			        	mu.root						= path.join(__dirname, 'tmpl');
						mu.compileAndRender('preview.html', data)
							.on('data', function (data) {
								try { fs.appendFileSync(preview, data.toString()); } catch(e) {}
							})
							.on('error', function(___err) {
								should(___err).not.ok;
							})
							.on('end', function(___err) {
								should(___err).not.ok;
								var previewPNG		= path.join(__dirname, '..', 'tmp', 'preview.styl.png');
								
								// Create a screenshot of the preview page
								capture(path.join(__dirname, '..', 'tmp', 'preview.styl.html'), previewPNG, function(____err) {
									should(____err).not.ok;
									
									// Compare it to the expected screenshot
									imageDiff({
										actualImage: previewPNG,
										expectedImage: path.join(__dirname, 'expected', 'preview.png'),
										diffImage: path.join(__dirname, '..', 'tmp', 'preview.styl.diff.png')
									}, function (_____err, imagesAreSame) {
								    	should(_____err).not.ok;
								    	should.ok(imagesAreSame, 'The generated Stylus preview doesn\'t match the expected one!');
								    	done();
								    });
								})
							});
			    	});
	    		});
        	});
        });
    });
});

after(function(done) {
	rimraf(path.normalize(path.join(__dirname, '..', 'tmp')), function(error){
		done();
	});
});