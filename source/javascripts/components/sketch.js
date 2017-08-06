
import "../lib/threejs/postprocessing/EffectComposer";
import "../lib/threejs/shaders/CopyShader";
import "../lib/threejs/postprocessing/RenderPass";
import "../lib/threejs/postprocessing/ShaderPass";
import "../lib/threejs/postprocessing/MaskPass";
import "../lib/threejs/controls/TrackballControls";

import CompositePass from "./composite";
import ParticleSystem from "./particle";

export default class Sketch extends THREE.EventDispatcher {

    constructor(dom) {
        super();

        this.clock = new THREE.Clock()
        this.frame = 0;

        this.updaters = [];
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: dom
        });

        this.setupScene();
        this.setupComposer();

        window.addEventListener("resize", (e) => {
            this.resize();
        });

        window.addEventListener("mousemove", (e) => {
            let mx = e.clientX, my = e.clientY;
            this.interact(mx, my);
        });

        let loop = (time) => {
            this.loop(time);
            requestAnimationFrame(loop);
        };
        this.resize();
        requestAnimationFrame(loop);
    }

    interact(mx, my) {
        var vector = new THREE.Vector3(
            (mx / window.innerWidth ) * 2 - 1,
            - (my / window.innerHeight ) * 2 + 1,
            0.5
        );
        vector.unproject(this.camera);

        let dir = vector.sub(this.camera.position).normalize();
        let distance = - this.camera.position.z / dir.z;
        let p = this.camera.position.clone().add(dir.multiplyScalar(distance));
        this.system.interact(p);
    }

    setupScene() {
        this.scene = new THREE.Scene();

        let w = window.innerWidth, h = window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
        this.camera.position.set(0, 0, 1.75);

        // let helper = new THREE.CameraHelper(this.camera);
        // this.scene.add(helper);

        /*
        let cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshNormalMaterial({})
        );
        cube.scale.set(1, 1, 1);
        this.scene.add(cube);
        */

        this.system = new ParticleSystem(this.renderer);
        this.scene.add(this.system);
        this.updaters.push(this.system);

        // this.debugTexture(this.system.texturePosition);
    }

    debugTexture(texture, width = 10, height = 10) {
        let plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1, 1, 1),
            new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide
            })
        );
        plane.scale.set(width, height, 1);
        this.scene.add(plane);

        return plane;
    }

    setupComposer() {
        let w = window.innerWidth, h = window.innerHeight;

        this.composer = new THREE.EffectComposer(this.renderer);

        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const composite = new CompositePass();
        this.composer.addPass(composite);
        this.updaters.push(composite);

        const passes = this.composer.passes;
        passes[passes.length - 1].renderToScreen = true;

        this.composer.setSize(w, h);
    }

    loop(time) {
        let dt = this.clock.getDelta();
        this.update(Math.min(dt, 0.1), this.clock.elapsedTime);
        this.render();
    }

    update(dt, time) {
        this.updaters.forEach((updater) => {
            updater.update(dt, time, this.frame);
        });

        this.frame++;
    }

    render() {
        // this.renderer.render(this.scene, this.camera);
        this.composer.render();
    }

    resize () {
        let w = window.innerWidth, h = window.innerHeight;
        this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
        this.renderer.setSize(w, h);

        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(w, h);
    }

}
