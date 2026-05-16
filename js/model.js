let oldEmergencyModel = null;
let isModelLoading = false;

const MODEL_CONFIG = {
    inputSize: [300, 300],
    emergencyClassIndex: 0,
    nonEmergencyClassIndex: 1,
    emergencyDecisionThreshold: 0.8,
    decisionMargin: 0.05
};

function normalizeBinaryOutputs(values, emergencyIndex, nonEmergencyIndex) {
    const emergencyRaw = Number(values[emergencyIndex] ?? 0);
    const nonEmergencyRaw = Number(values[nonEmergencyIndex] ?? 0);

    const looksLikeProbabilities =
        emergencyRaw >= 0 && emergencyRaw <= 1 &&
        nonEmergencyRaw >= 0 && nonEmergencyRaw <= 1 &&
        Math.abs(emergencyRaw + nonEmergencyRaw - 1) <= 0.15;

    if (looksLikeProbabilities) {
        return {
            emergencyProbability: emergencyRaw,
            nonEmergencyProbability: nonEmergencyRaw
        };
    }

    // Fallback for logit-like outputs.
    const maxVal = Math.max(emergencyRaw, nonEmergencyRaw);
    const eExp = Math.exp(emergencyRaw - maxVal);
    const nExp = Math.exp(nonEmergencyRaw - maxVal);
    const denom = eExp + nExp || 1;

    return {
        emergencyProbability: eExp / denom,
        nonEmergencyProbability: nExp / denom
    };
}

function getModelPathCandidates() {
    const href = window.location.href;
    const cacheBust = `v=${Date.now()}`;
    const raw = [
        new URL("./tfjs_graph_model/model.json", href).toString(),
        new URL("tfjs_graph_model/model.json", href).toString(),
        new URL("../tfjs_graph_model/model.json", href).toString(),
        new URL("./tfjs_model/model.json", href).toString(),
        new URL("tfjs_model/model.json", href).toString()
    ];
    return Array.from(new Set(raw)).map((u) => `${u}${u.includes("?") ? "&" : "?"}${cacheBust}`);
}

async function loadOldEmergencyModel() {
    if (oldEmergencyModel) return oldEmergencyModel;
    if (isModelLoading) throw new Error("Model is currently loading. Retry in a moment.");

    let firstError = null;
    const modelPaths = getModelPathCandidates();

    try {
        isModelLoading = true;
        for (const candidatePath of modelPaths) {
            try {
                oldEmergencyModel = await tf.loadGraphModel(candidatePath);
                console.log("Loaded old graph model from:", candidatePath);
                break;
            } catch (err) {
                if (!firstError) {
                    firstError = err;
                }
            }
        }

        if (!oldEmergencyModel) {
            throw new Error(
                "Could not load old EfficientNet model from local tfjs_graph_model/tfjs_model. Tried: " +
                    modelPaths.join(", ") +
                    ". Underlying error: " +
                    String(firstError?.message || "model file not found")
            );
        }

        const warmup = tf.zeros([1, MODEL_CONFIG.inputSize[0], MODEL_CONFIG.inputSize[1], 3]);
        const out = await oldEmergencyModel.executeAsync(warmup);
        if (Array.isArray(out)) {
            out.forEach((t) => t.dispose && t.dispose());
        } else if (out && out.dispose) {
            out.dispose();
        } else if (out && typeof out === "object") {
            Object.values(out).forEach((t) => t && t.dispose && t.dispose());
        }
        warmup.dispose();

        return oldEmergencyModel;
    } finally {
        isModelLoading = false;
    }
}

function preprocessInput(imageEl) {
    return tf.tidy(() => {
        let x = tf.browser.fromPixels(imageEl, 3);
        x = tf.image.resizeBilinear(x, MODEL_CONFIG.inputSize);
        // Keep 0..255 pixels; model graph already contains rescaling + normalization.
        return x.expandDims(0);
    });
}

async function predictEmergency(imageEl) {
    const model = await loadOldEmergencyModel();
    const input = preprocessInput(imageEl);
    const output = await model.executeAsync(input);

    let outputTensor = null;
    if (Array.isArray(output)) {
        outputTensor = output[0];
    } else if (output && output.data) {
        outputTensor = output;
    } else if (output && typeof output === "object") {
        outputTensor = Object.values(output)[0];
    }

    if (!outputTensor) {
        input.dispose();
        throw new Error("Model output tensor missing.");
    }

    const values = await outputTensor.data();

    input.dispose();
    if (Array.isArray(output)) {
        output.forEach((t) => t.dispose && t.dispose());
    } else if (output && output.dispose) {
        output.dispose();
    } else if (output && typeof output === "object") {
        Object.values(output).forEach((t) => t && t.dispose && t.dispose());
    }

    let emergencyProbability = 0;
    let nonEmergencyProbability = 0;
    const eIdx = MODEL_CONFIG.emergencyClassIndex;
    const nIdx = MODEL_CONFIG.nonEmergencyClassIndex;

    if (values.length >= 2) {
        const normalized = normalizeBinaryOutputs(values, eIdx, nIdx);
        emergencyProbability = normalized.emergencyProbability;
        nonEmergencyProbability = normalized.nonEmergencyProbability;
    } else {
        nonEmergencyProbability = Math.max(0, Math.min(1, values[0] ?? 0));
        emergencyProbability = 1 - nonEmergencyProbability;
    }

    // Use a conservative gate to reduce false positives on high-energy non-emergency scenes.
    const isEmergency =
        emergencyProbability >= MODEL_CONFIG.emergencyDecisionThreshold &&
        emergencyProbability >= nonEmergencyProbability + MODEL_CONFIG.decisionMargin;

    return {
        isEmergency,
        emergencyProbability,
        nonEmergencyProbability,
        raw: values[0] ?? 0
    };
}
