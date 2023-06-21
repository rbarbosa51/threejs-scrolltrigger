import javascriptLogo from './javascript.svg'
import * as THREE from  'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- CONSTS

const COLORS = {
	background: 'white',
	light: '#ffffff',
	sky: '#aaaaff',
	ground: '#88ff88',
	blue: "steelblue"
}

const PI = Math.PI;
const wireframeMaterial = new THREE.MeshBasicMaterial({color: 'white', wireframe: true})
// --- SCENE

const scenes = {
	real: new THREE.Scene(),
	wire: new THREE.Scene() 
}
scenes.wire.overrideMaterial = wireframeMaterial;
let size = { width: 0, height: 0 }

scenes.real.background = new THREE.Color(COLORS.background);
scenes.real.fog = new THREE.Fog(COLORS.background, 15, 20);
scenes.wire.background = new THREE.Color(COLORS.blue);

const views = [
	 {height: 1, bottom: 0, scene: scenes.real, camera: null},
	 {height: 0, bottom: 0, scene: scenes.wire, camera: null}, 
];
// --- RENDERER

const renderer = new THREE.WebGLRenderer({
  antialias: true
})

renderer.physicallyCorrectLights = true;
//renderer.useLegacyLights = true;
//renderer.outputEncoding = THREE.sRGBEncoding;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const container = document.querySelector('.canvas-container');
container.appendChild( renderer.domElement );

// --- CAMERA
let cameraTarget = new THREE.Vector3(0, 1, 0);
views.forEach(view => {
	view.camera = new THREE.PerspectiveCamera(40, size.width / size.height, 0.1, 100);
	view.camera.position.set(0,1,5);
	
	view.scene.add(view.camera);
})

// const camera = new THREE.PerspectiveCamera(40, size.width / size.height, 0.1, 100);
// camera.position.set(0, 1, 5);
//let cameraTarget = new THREE.Vector3(0, 1, 0);

//scene.add(camera);

// --- LIGHTS

const directionalLight = new THREE.DirectionalLight(COLORS.light, 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 10;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(2, 5, 3);

scenes.real.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight( COLORS.sky, COLORS.ground, 0.5 );
scenes.real.add(hemisphereLight)

// --- FLOOR

const plane = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.ground })
const floor = new THREE.Mesh(plane, floorMaterial);
floor.receiveShadow = true;
floor.rotateX(-Math.PI * 0.5)

scenes.real.add(floor);

// --- ON RESIZE

const onResize = () => {
	size.width = container.clientWidth;
	size.height = container.clientHeight;
	views.forEach(view => {
		view.camera.aspect = size.width / size.height
		view.camera.updateProjectionMatrix()
	})
	

	renderer.setSize(size.width, size.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))	
}

window.addEventListener('resize', onResize)
onResize();

// --- TICK

const tick = () => {
	views.forEach(view => {
		view.camera.lookAt(cameraTarget);
		let bottom = size.height * view.bottom;
		let height = size.height * view.height;
		renderer.setViewport(0,0, size.width, size.height);
		renderer.setScissor(0, bottom, size.width, height);
		renderer.setScissorTest(true);
		renderer.render(view.scene, view.camera);
	})
    
    
    window.requestAnimationFrame(() => tick())
}

tick();

const toLoad = [
	{name: 'bear', group: new THREE.Group(), file: '/bear.gltf'}, 
	{name: 'witch', group: new THREE.Group(), file: '/witch.gltf'}
];
const models = {};
const clones = {};
let cameras = null;
let witches = null;
let bears = null;

const setupAnimation = () => {
	cameras = {position: [views[0].camera.position, views[1].camera.position]};
	witches = {position: [models.witch.position, clones.witch.position],
			   rotation: [models.witch.rotation, clones.witch.rotation]};
	bears = {position: [models.bear.position, clones.bear.position],
			  rotation: [models.bear.rotation, clones.bear.rotation]};
	gsap.set(witches.position, {x: 5});
	gsap.set(bears.position, {x: -5});
	ScrollTrigger.matchMedia({"(prefers-reduced-motion: no-preference)": desktopAnimation})
}
const desktopAnimation = () => {
	let section = 0;
	const tl = gsap.timeline({
		defaults: {duration: 1, ease: 'power2.inOut'},
		scrollTrigger: {trigger: '.page', start: 'top top', end: 'bottom bottom', scrub: .1, markers: true}
	}, );
	tl.to(witches.position, {x: 1}, section);
	tl.to(bears.position, {x: -1}, section);
	section++;
	tl.to(witches.position, {x: 5, ease: 'power4.in'}, section);
	tl.to(bears.position, {z: 2}, section);
	tl.to(views[1], {height: 1, ease: 'none'}, section);
	section++;
	tl.to(witches.position, {x: 1, z: 2, ease: 'power4.out'}, section);
	tl.to(bears.position, {x: -5, z: 0, ease: 'power4.in'}, section);
	section++;
	tl.to(witches.position, {x: 1, z: 0}, section);
	tl.to(bears.position, {x: -1, z: 0}, section);

}
const LoadingManager = new THREE.LoadingManager(() => {
	setupAnimation();
});
const gltfLoader = new GLTFLoader(LoadingManager);
toLoad.forEach(item => {
	gltfLoader.load(item.file, (model) => {
		model.scene.traverse(child => {
			if (child instanceof THREE.Mesh) {
				child.receiveShadow = true;
				child.castShadow = true;
			}
		})
		item.group.add(model.scene);
		scenes.real.add(item.group);
		models[item.name] = item.group;
		const clone = item.group.clone()
		clones[item.name] = clone;
		scenes.wire.add(clone);
	})
})