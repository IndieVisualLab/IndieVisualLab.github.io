
import "../lib/threejs/loaders/OBJLoader";
import GPUComputationRenderer from "../lib/threejs/GPUComputationRenderer";

export default class Human extends THREE.Mesh {

    constructor(renderer, folder, instances = 100, sections = 12) {

        super(
            new THREE.Geometry()
        );

        this.setup(renderer, instances, sections);

        this.boneMatrices = [
            new THREE.Matrix4(),
            new THREE.Matrix4(),
            new THREE.Matrix4(),
            new THREE.Matrix4()
        ];

        let objLoader = new THREE.OBJLoader();
        objLoader.load(
            folder + "Human.obj",
            (model) => {
                let mesh = model.children[0];
                let bgeo = mesh.geometry;
                bgeo.computeBoundingBox();

                let box = bgeo.boundingBox;
                let cx = (box.max.x - box.min.x) * 0.5 + box.min.x;
                let cz = (box.max.z - box.min.z) * 0.5 + box.min.z;
                let height = box.max.y - box.min.y;
                let unit = height / (sections - 1);

                let igeo = new THREE.InstancedBufferGeometry();
                igeo.maxInstancedCount = instances;

                // buffer attributes
                igeo.addAttribute("position", bgeo.attributes.position.clone());
                igeo.addAttribute("normal", bgeo.attributes.normal.clone());
                igeo.addAttribute("uv", bgeo.attributes.uv.clone());

                let vertices = bgeo.attributes.position;
                let vertexCount = vertices.count;
                let vertexArray = vertices.array;

                let skinIndex = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3, 1);
                let skinWeight = new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3, 1);
                for(let i = 0; i < vertexCount; i++) {
                    let vid = i * 3;
                    let vy = vertexArray[vid + 1] + box.min.y;
                    let sid = (sections - 1) - vy / unit;

                    let id0 = Math.floor(sid);
                    let id1 = Math.ceil(sid);
                    // console.log(id0, id1);
                    let w = sid - id0;

                    skinIndex.setXYZ(i, id0, id1, 0);
                    skinWeight.setXYZ(i, 1.0 - w, w, 0);
                }

                igeo.addAttribute("skinIndex", skinIndex);
                igeo.addAttribute("skinWeight", skinWeight);
                
                // instanced buffer attributes
                
                // for sampling
                let uv2 = new THREE.InstancedBufferAttribute(new Float32Array(instances * 2), 2, 1);
                let invCount = 1.0 / instances;
                let uvOffset = 0.5 * invCount;
                for(let i = 0, n = uv2.count; i < n; i++) {
                    uv2.setXY(
                        i,
                        0,
                        i * invCount
                    );
                }

                igeo.addAttribute("uv2", uv2);

                this.geometry = igeo;
                this.material = new THREE.RawShaderMaterial({
                    vertexShader: require("../../shaders/crowd/render/human.vert"),
                    fragmentShader: require("../../shaders/crowd/render/human.frag"),
                    uniforms: {
                        bindMatrix: { type: "m4", value: new THREE.Matrix4() },
                        bindMatrixInverse: { type: "m4", value: new THREE.Matrix4() },
                        boneMatrices: { type: "m4f", value: this.boneMatrices },
                        texturePosition: { type: "t", value: null },
                        textureRotation: { type: "r", value: null },
                        sections: { type: "v2", value: new THREE.Vector2(sections, 1.0 / sections) }
                    },
                    // side: THREE.DoubleSide
                    defines: {
                        MAX_BONES: sections
                    }
                })

            }
        );

        this.frustumCulled = false;
    }

    setup(renderer, count, sections, options) {

        options = options || {};

        // setup vel
        this.gpuComputeVel = new GPUComputationRenderer(1, count, renderer);
        let vel = this.gpuComputeVel.createTexture();
        const velocity = options.velocity || require("../../shaders/crowd/update/velocity.frag");
        this.velVar = this.gpuComputeVel.addVariable("textureVelocity", velocity, vel, options);
        this.gpuComputeVel.setVariableDependencies(this.velVar, [this.velVar]);
        this.gpuComputeVel.init();

        // setup pos, rot
        this.gpuCompute = new GPUComputationRenderer(sections, count, renderer);

        let pos = this.gpuCompute.createTexture();
        let rot = this.gpuCompute.createTexture();

        const position = options.position || require("../../shaders/crowd/update/position.frag");
        const rotation = options.position || require("../../shaders/crowd/update/rotation.frag");

        this.posVar = this.gpuCompute.addVariable("texturePosition", position, rot, options);
        this.rotVar = this.gpuCompute.addVariable("textureRotation", rotation, pos, options);

        this.gpuCompute.setVariableDependencies(this.posVar, [this.posVar, this.rotVar]);
        this.gpuCompute.setVariableDependencies(this.rotVar, [this.posVar, this.rotVar]);
        this.gpuCompute.init();

        this.gpuComputeUniforms = {};

        this.addUniform(this.gpuComputeUniforms, [this.posVar, this.rotVar, this.velVar], "mode", { type: "i", value: 0 });
        this.addUniform(this.gpuComputeUniforms, [this.posVar, this.rotVar, this.velVar], "dt", { type: "f", value: 0.0 });
        this.addUniform(this.gpuComputeUniforms, [this.posVar, this.rotVar, this.velVar], "time", { type: "f", value: 0.0 });
        this.addUniform(this.gpuComputeUniforms, [this.posVar], "speed", { type: "f", value: 0.5 });
        this.addUniform(this.gpuComputeUniforms, [this.posVar, this.rotVar], "sections", { type: "v2", value: new THREE.Vector2(sections, 1.0 / sections) });
        this.addUniform(this.gpuComputeUniforms, [this.posVar, this.rotVar], "textureVelocity", { type: "t", value: null });
        this.addUniform(this.gpuComputeUniforms, [this.velVar], "strength", { type: "f", value: 1.5 });
        this.update(0, 0, 0);
        this.gpuComputeUniforms.mode.value = 1;

    }

    addUniform(uniforms, variables, key, uniform) {
        variables.forEach((variable) => {
            variable.material.uniforms[key] = uniform;
        });
        uniforms[key] = uniform;
        return uniform;
    }

    update(dt, time, frames) {
        if(!this.material.uniforms) return;

        this.gpuComputeUniforms.dt.value = dt;
        this.gpuComputeUniforms.time.value = time;

        this.gpuComputeVel.compute();

        this.gpuComputeUniforms.textureVelocity.value = this.textureVelocity;
        this.gpuCompute.compute();

        this.material.uniforms.bindMatrix.value = this.matrixWorld;
        this.material.uniforms.bindMatrixInverse.value.getInverse(this.matrixWorld);

        const r = 0.25;
        const s = (Math.sin(time) + 1.0) * 0.5 - 0.5;
        this.boneMatrices[2].makeRotationY(s * Math.PI);
        this.boneMatrices[2].setPosition(new THREE.Vector3(Math.sin(time) * r, 0, Math.cos(time) * r));

        this.material.uniforms.texturePosition.value = this.texturePosition;
        this.material.uniforms.textureRotation.value = this.textureRotation;
    }

    get texturePosition() {
        return this.gpuCompute.getCurrentRenderTarget(this.posVar).texture;
    }

    get textureRotation() {
        return this.gpuCompute.getCurrentRenderTarget(this.rotVar).texture;
    }

    get textureVelocity() {
        return this.gpuCompute.getCurrentRenderTarget(this.velVar).texture;
    }

}

