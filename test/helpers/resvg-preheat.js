// resvg preheat
const resvg = require('@resvg/resvg-js');

resvg.render('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"></svg>', {
    fitTo: { mode: 'original' },
    logLevel: 'error'
});
