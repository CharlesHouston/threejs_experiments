var renderer, scene, camera, controls;

var particles, pGeom, pMat;

var HSCALE = 5;
var VSCALE = 2;

var pointSize = 0.05;

init();
render();

function init() {
    
    container = document.getElementById( 'container' );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 20000 );
    camera.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, 35 ) );
    camera.applyMatrix( new THREE.Matrix4().makeRotationX( -0.3 ) );

    controls = new THREE.OrbitControls( camera );
    controls.damping = 0.2;
    controls.addEventListener( 'change', render );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    var gpxpoints = getGPXPoints( "welsh_ultra_series_r2.gpx" );

    pGeom = new THREE.Geometry();

    var processed_pts = processPoints( gpxpoints );

    processed_pts.forEach( function( p ) {

        pGeom.vertices.push( p );

        var color = new THREE.Color();
        color.setRGB( 1.0, ( 1 - p.y ) / 2, ( 1 - p.y ) / 2 );
        pGeom.colors.push( color );

    } );

    pMat = new THREE.PointCloudMaterial( { vertexColors: THREE.VertexColors, size: pointSize } );

    particles = new THREE.PointCloud( pGeom, pMat );
    scene.add( particles );

    animate();

}

function onWindowResize() {

    renderer.setSize( window.innerWidth, window.innerHeight );

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    render();

}

function animate() {

    requestAnimationFrame( animate );
    controls.update();

}

function render() {

    renderer.render( scene, camera );

}

function loadXMLDoc( XMLname ) {

    var xmlDoc;

    if( window.XMLHttpRequest ) {

        xmlDoc = new window.XMLHttpRequest();
        xmlDoc.open( 'GET', XMLname, false );
        xmlDoc.overrideMimeType( 'text/xml' );
        xmlDoc.send( '' );
        return xmlDoc.responseXML;

    } else if ( ActiveXObject( 'Microsoft.XMLDOM' ) ) {

        xmlDoc = new ActiveXObject( 'Microsoft.XMLDOM' );
        xmlDoc.async = false;
        xmlDoc.load( XMLname );
        return xmlDoc;
    
    } else {

        xmlhttp = new XMLHttpRequest();
        xmlhttp.open( 'GET', XMLname, false );
        xmlhttp.overrideMimeType( 'text/xml' );
        xmlhttp.send( null );
        return xmlDoc.responseXML;

    }

    alert( 'Error loading document!' );
    return null;

}

function getGPXPoints( filename ) {

    var xmlDoc = loadXMLDoc( filename );

    var trkpts = xmlDoc.getElementsByTagName( 'trkpt' );
    var elevations = xmlDoc.getElementsByTagName( 'ele' );
    var points = []

    for( var i = 0; i < trkpts.length; i++ ) {

        var pt = new THREE.Vector3();
        pt.x = parseFloat( trkpts[ i ].getAttribute( 'lat' ) );
        pt.z = parseFloat( trkpts[ i ].getAttribute( 'lon' ) );
        pt.y = parseFloat( elevations[ i ].childNodes[ 0 ].nodeValue );
        points.push( pt );

    }

    return points;

}

function processPoints( gpxpoints ) {

    // Finding the min and max values
    var xvals = [];
    var yvals = [];
    var zvals = [];

    for( var i = 0; i < gpxpoints.length; i++ ) {

        xvals.push( gpxpoints[ i ].x );
        yvals.push( gpxpoints[ i ].y );
        zvals.push( gpxpoints[ i ].z );

    }

    var XMIN = Math.min.apply( null, xvals );
    var XMAX = Math.max.apply( null, xvals );
    var YMIN = Math.min.apply( null, yvals );
    var YMAX = Math.max.apply( null, yvals );
    var ZMIN = Math.min.apply( null, zvals );
    var ZMAX = Math.max.apply( null, zvals );

    var XRANGE = XMAX - XMIN;
    var YRANGE = YMAX - YMIN;
    var ZRANGE = ZMAX - ZMIN;

    // Normalising between -1 and 1 and scaling
    var normalised = []

    gpxpoints.forEach( function( p ) {

        var xnorm = 2 * ( p.x - XMIN ) / XRANGE - 1;
        var u = HSCALE * xnorm;

        var ynorm = 2 * ( p.y - YMIN ) / YRANGE - 1;
        var v = VSCALE * ynorm;

        var znorm = 2 * ( p.z - ZMIN ) / ZRANGE - 1;
        var w = HSCALE * ZRANGE / XRANGE * znorm;

        normalised.push( new THREE.Vector3( u, v, w ) );

    } );

    var processed = [];

    // Putting first data point at origin
    for( var i = 0; i < normalised.length; i++ ) {

        var vector = new THREE.Vector3( normalised[ i ].x - normalised[ 0 ].x, normalised[ i ].y, normalised[ i ].z - normalised[ 0 ].z );
        processed.push( vector );

    }
    
    return processed;

}
