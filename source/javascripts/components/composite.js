
export default class CompositePass extends THREE.ShaderPass {

    constructor(options) {
        options = options || {};

        super({
            uniforms: {
                time: { type: "f", value: 0.0 },
                resolution: { type: "v2", value: new THREE.Vector2(512, 512) },
                tDiffuse: { type: "t", value: null },
                tBlur: { type: "t", value: null },
                tEnv: { type: "t", value: null },
                noiseOffset: { type: "v2", value: new THREE.Vector2(0, 0) }
            },
            vertexShader: require("../../shaders/posteffects/kernel.vert"),
            fragmentShader: require("../../shaders/posteffects/composite.frag")
        });

        const loader = new THREE.CubeTextureLoader();
        loader.setPath("/textures/skybox/");
        loader.load([
            "px.jpg", "nx.jpg",
            "py.jpg", "ny.jpg",
            "pz.jpg", "nz.jpg"
        ], (env) => {
            this.material.uniforms.tEnv.value = env;
        });

        this.setupBlur(options);
    }

    render(renderer, writeBuffer, readBuffer, delta, maskActive) {
        this.throughMaterial.uniforms.tDiffuse.value = readBuffer.texture;

        this.quad.material = this.throughMaterial;
        renderer.render(this.scene, this.camera, this.renderTargetDownSample, false);

        this.quad.material = this.blurMaterial;

        for(let iteration = 0; iteration < this.blurIterations; iteration++) {
            // horizontal blur
            this.blurMaterial.uniforms.tDiffuse.value = (iteration == 0) ? this.renderTargetDownSample : this.renderTargetY.texture;
            this.blurMaterial.uniforms.increment.value.set(this.blurAmount / readBuffer.width, 0.0);
            renderer.render(this.scene, this.camera, this.renderTargetX, false);

            // vertical blur
            this.blurMaterial.uniforms.tDiffuse.value = this.renderTargetX.texture;
            this.blurMaterial.uniforms.increment.value.set(0.0, this.blurAmount / this.renderTargetX.height);
            renderer.render(this.scene, this.camera, this.renderTargetY, false);
        }

        this.material.uniforms.tBlur.value = this.renderTargetY.texture;

        super.render(renderer, writeBuffer, readBuffer, delta, maskActive);
    }

    setupBlur(options) {
        this.blurDownSample = Math.max(1, options.downSample || 1);
        this.blurAmount = options.blurAmount || 1;
        this.blurIterations = options.blurIterations || 4;

        const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
        const width = this.material.uniforms.resolution.x >> this.blurDownSample;
        const height = this.material.uniforms.resolution.y >> this.blurDownSample;

        this.renderTargetDownSample = new THREE.WebGLRenderTarget(width, height);
        this.renderTargetX = new THREE.WebGLRenderTarget(width, height, pars);
        this.renderTargetY = new THREE.WebGLRenderTarget(width, height, pars);
        
        this.throughMaterial = new THREE.ShaderMaterial({
            uniforms: {
                "tDiffuse" : { type: "t", value : null },
            },
            vertexShader: require("../../shaders/posteffects/kernel.vert"),
            fragmentShader: require("../../shaders/posteffects/through.frag")
        });
        console.log(this.throughMaterial);

        this.blurMaterial = new THREE.ShaderMaterial({
            uniforms: {
                "tDiffuse" : { type: "t", value : null },
                "increment" : { type: "v2", value : new THREE.Vector2() }
            },
            vertexShader: require("../../shaders/posteffects/kernel.vert"),
            fragmentShader: require("../../shaders/posteffects/blur.frag")
        });

    }

	setSize(width, height) {
        super.setSize(width, height);

        const w = width >> this.blurDownSample;
        const h = height >> this.blurDownSample;
        this.renderTargetDownSample.setSize(w, h);
        this.renderTargetX.setSize(w, h);
        this.renderTargetY.setSize(w, h);

        this.material.uniforms.resolution.value = new THREE.Vector2(width, height);
    }

    update(dt, t, frame) {
        this.material.uniforms.time.value = t;
        if(frame % 2 == 0) {
            this.material.uniforms.noiseOffset.value.set(Math.random(), Math.random());
        }
    }

}
