var should			= require('should'),
path				= require('path'),
rimraf				= require('rimraf'),
svgsprite			= require('../lib/svg-sprite'),
svg2png				= require('svg2png'),
imageDiff			= require('image-diff');

describe('svg-sprite', function() {
	
    describe('with no arguments', function() {
        it('returns an error', function() {
            var result = svgsprite.createSprite();
            result.should.be.an.Error;
			result.should.have.property('errno', 1391852448);
        });
    });
    
    describe('with empty input directory', function() {
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
    
    describe('with an invalid CSS output directory', function() {
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
        	svgsprite.createSprite(path.join(__dirname, 'files'), path.normalize(path.join(__dirname, '..', 'tmp', 'css')), {sassout: path.normalize(path.join(__dirname, '..', 'tmp', 'sass\0null'))}, function(err, result){
            	err.should.be.an.Error;
				err.should.have.property('errno', 1391854708);
				done();
            });
        });
    });
    
    describe('with valid arguments', function() {
        it('returns a valid sprite', function(done) {
        	this.timeout(10000);
        	svgsprite.createSprite(path.join(__dirname, 'files'), path.normalize(path.join(__dirname, '..', 'tmp', 'css')), {sassout: path.normalize(path.join(__dirname, '..', 'tmp', 'sass'))}, function(err, result){
        		should(err).not.ok;
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
    });
});

after(function(done) {
	rimraf(path.normalize(path.join(__dirname, '..', 'tmp')), function(error){
		done();
	});
});