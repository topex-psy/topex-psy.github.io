// from: https://codepen.io/Yakudoo/pen/prYmKj
// need: https://cdnjs.cloudflare.com/ajax/libs/three.js/86/three.min.js

class Cloud {
  constructor(width, height) {

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.container = document.getElementById("about");
    this.scene = new THREE.Scene();
    this.width = width;
    this.height = height;
    this.aspectRatio = width / height;
    this.fieldOfView = 50;
    var nearPlane = .1;
    var farPlane = 20000;
		this.targetRotX1 = Math.PI/3;
		this.targetRotX2 = -Math.PI/3;
		this.targetRotY1 = 0;
		this.targetRotY2 = 0;
		
    this.camera = new THREE.PerspectiveCamera(this.fieldOfView, this.aspectRatio, nearPlane, farPlane);
		this.camera.position.z = 250;
		this.container.appendChild(this.renderer.domElement);
    this.timer = 0;
    this.createPlanes();
		this.render();
  }

  createPlanes(){
    this.material = new THREE.RawShaderMaterial({
      vertexShader: `
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      uniform mat3 normalMatrix;
      uniform float time;
      uniform vec2 mousePosition;
      varying vec2 vUv;
      varying float vElevation;
      
      varying float vDisplacement;
      
      float PI = 3.141592;
      
      float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
    
      float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }
    
      float noise(vec3 p){
          vec3 a = floor(p);
          vec3 d = p - a;
          d = d * d * (3.0 - 2.0 * d);
    
          vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
          vec4 k1 = perm(b.xyxy);
          vec4 k2 = perm(k1.xyxy + b.zzww);
    
          vec4 c = k2 + a.zzzz;
          vec4 k3 = perm(c);
          vec4 k4 = perm(c + 1.0);
    
          vec4 o1 = fract(k3 * (1.0 / 41.0));
          vec4 o2 = fract(k4 * (1.0 / 41.0));
    
          vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
          vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
    
          return o4.y * d.y + o4.x * (1.0 - d.y);
      }
      
      float fbm(vec2 pos, float t){
        float r;
              r 	= 	noise( vec3( pos, t ) * 01.0 ) * 01.0000;
              r 	+= 	noise( vec3( pos, t ) * 02.0 ) * 00.5000;
              r 	+= 	noise( vec3( pos, t ) * 04.0 ) * 00.2500;
              r 	+= 	noise( vec3( pos, t ) * 08.0 ) * 00.1250;
              r 	+= 	noise( vec3( pos, t ) * 16.0 ) * 00.0625;
        return r / 1.9375;
      }
      
      void main() {
        vUv = uv;
        float t = time*.5;// + sin(time) * .2;
        float t2 = time*.1 + cos(time * .2) * .05;
        vec2 pos = vUv * (2.0 + vUv.y);
        
        vec2 displacement = vec2(t2, t) + (2.0 + mousePosition * .5);
        
        float p = fbm( displacement * 2.0 + pos * 2.0, t * 1.1);
        vec2 pos2 = pos + vec2(p);
        
        float q = fbm( displacement * 3.0 + pos2 * 2.0, t * 1.23); 
        vec2 pos3 = pos + vec2(q);
        
        float r = fbm( displacement * 4.0 + pos3 * 2.0, t * 1.23); 
        vec2 pos4 = pos + vec2(r);
        
        float s = fbm( displacement * 5.0 + pos4 * 2.0, t * 1.32);
        
        float d = length( vUv - (.5 + mousePosition));
        
        float ratioElevation = pow( (1.0 - d), 5.0);
        
        vElevation = s + .1 + ratioElevation * .2;
        
        vElevation *= 1.0 - smoothstep(0.0, 1.0, length(uv - .5));
        
        vec3 finalPos = position;
        finalPos.z = -30.0 + pow( s + ratioElevation, .5) * 40.0;
      
        gl_Position = projectionMatrix * modelViewMatrix * vec4 ( finalPos, 1.0);
      }`,
      fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      varying float vElevation;
      uniform float uHue;
      
      float hue2rgb(float f1, float f2, float hue) {
          if (hue < 0.0)
              hue += 1.0;
          else if (hue > 1.0)
              hue -= 1.0;
          float res;
          if ((6.0 * hue) < 1.0)
              res = f1 + (f2 - f1) * 6.0 * hue;
          else if ((2.0 * hue) < 1.0)
              res = f2;
          else if ((3.0 * hue) < 2.0)
              res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
          else
              res = f1;
          return res;
      }
    
      vec3 hsl2rgb(vec3 hsl) {
          vec3 rgb;
    
          if (hsl.y == 0.0) {
              rgb = vec3(hsl.z); // Luminance
          } else {
              float f2;
    
              if (hsl.z < 0.5)
                  f2 = hsl.z * (1.0 + hsl.y);
              else
                  f2 = hsl.z + hsl.y - hsl.y * hsl.z;
    
              float f1 = 2.0 * hsl.z - f2;
    
              rgb.r = hue2rgb(f1, f2, hsl.x + (1.0/3.0));
              rgb.g = hue2rgb(f1, f2, hsl.x);
              rgb.b = hue2rgb(f1, f2, hsl.x - (1.0/3.0));
          }
          return rgb;
      }
    
      vec3 hsl2rgb(float h, float s, float l) {
          return hsl2rgb(vec3(h, s, l));
      }
    
      void main () {
        float hue = uHue + vElevation * .05 + sin(vUv.y)*.5;
        hue += smoothstep(.6, 1.0, vElevation) * .2;
        
        float highlight = sin ( smoothstep(.6, .91, vElevation) * 3.14 );
        
        hue += highlight * .1;
        
        float saturation = vElevation * 1.1;
        float darkborders = sin(vUv.x * 3.14) * sin(vUv.y * 3.14);
        float brightness = pow( darkborders * .3 + vElevation, 3.5);
        brightness *= .5 + smoothstep(.6, 1.0, vElevation) * .1;
        
        //brightness += highlight * .2;
        vec3 col = hsl2rgb(hue, saturation, brightness);
        
        gl_FragColor = vec4(col, 1.0);
      }`,
			uniforms: { 
				time: { type: 'f', value: 5 },
				uHue: { type: 'f', value: .95 },
				mousePosition: {type: 'v2', value: new THREE.Vector2( 0.5, 0.5 ) }
    	}
    });
		
		this.material2 = this.material.clone();
		this.material2.uniforms.time.value = 5;
		this.material2.uniforms.uHue.value = .6;
		
    this.shapeGeometry = new  THREE.PlaneGeometry(200, 200, 256, 256);
		
    this.shape = new THREE.Mesh(this.shapeGeometry, this.material);
		this.shape.position.y = 50;
		this.shape.rotation.x = Math.PI/3;
		this.shape.rotation.z = Math.PI;
		
		this.shape2 = new THREE.Mesh(this.shapeGeometry, this.material2);
		this.shape2.position.y = -50;
		this.shape2.rotation.x = -Math.PI/3;
		
		
		this.scene.add(this.shape);
		this.scene.add(this.shape2);
  }
	
  render() {
    this.timer+=.01;
		
		this.shape2.rotation.y += (this.targetRotY2 - this.shape2.rotation.y) * .05;
		this.shape2.rotation.x += (this.targetRotX2 - this.shape2.rotation.x) * .05;
		
		this.shape.rotation.y += (this.targetRotY1 - this.shape.rotation.y) * .05;
		this.shape.rotation.x += (this.targetRotX1 - this.shape.rotation.x) * .05;
		
		
		this.shape.material.uniforms.time.value = this.timer;
		this.shape2.material.uniforms.time.value = this.timer;
    this.renderer.render(this.scene, this.camera);
  }

  loop() {
    this.render();
		//this.shape.rotation.z += .005;
		requestAnimationFrame(this.loop.bind(this));
  }

  updateSize(w, h) {
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  mouseMove(mousePos2) {
		if (this.shape){
			this.shape.material.uniforms.mousePosition.value = new THREE.Vector2(-mousePos2.px, -mousePos2.py);
			this.targetRotY1 = mousePos2.px * .5;
			this.targetRotX1 = Math.PI/3 - mousePos2.py * .3;
			
			this.shape2.material.uniforms.mousePosition.value = new THREE.Vector2(mousePos2.px, mousePos2.py);
			this.targetRotY2 = mousePos2.px * .5;
			this.targetRotX2 = -Math.PI/3 - mousePos2.py * .3;
		}
  }
};

document.addEventListener("DOMContentLoaded", domIsReady);
let mousePos2 = {x:0, y:0, px:0, py:0};
let cloud;

function domIsReady() {
    cloud = new Cloud(this.container, this.renderer, window.innerWidth, window.innerHeight);
    window.addEventListener('resize', handleWindowResize, false);
    document.addEventListener("mousemove", handleMouseMove, false);
		document.addEventListener("touchmove", handleMouseMove, false);
    handleWindowResize();
    cloud.loop();
}

function handleWindowResize() {
    cloud.updateSize(window.innerWidth, window.innerHeight);
}

function handleMouseMove(e) {
   if ((e.clientX)&&(e.clientY)) {  
		mousePos2.x = e.clientX;
    mousePos2.y = e.clientY;
		mousePos2.px = mousePos2.x / window.innerWidth * 2 - 1;
  	mousePos2.py = mousePos2.y / window.innerHeight * 2 - 1;
	}else if (e.targetTouches) {
		mousePos2.x = e.targetTouches[0].clientX;
		mousePos2.y = e.targetTouches[0].clientY;
		mousePos2.px = mousePos2.x / window.innerWidth * 2 - 1;
  	mousePos2.py = mousePos2.y / window.innerHeight * 2 - 1;
		mousePos2.px *= 1.5;
  	mousePos2.py *= 1.5;
		e.preventDefault();
	}
  cloud.mouseMove(mousePos2);
}